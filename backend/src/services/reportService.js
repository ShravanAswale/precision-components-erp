import Production from "../models/Production.js";
import PDIR from "../models/PDIR.js";

// =========================================================
// HELPERS
// =========================================================

const toNum = (v) => Number(v || 0);

const normalize = (s) => (s || "").toString().trim().toLowerCase();

const safeRate = (numerator, denominator) =>
  denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(2))
    : 0;

const getProductionRejections = (item) => {
  if (Array.isArray(item.rejections) && item.rejections.length > 0) {
    return item.rejections
      .map((rejection) => ({
        reason: rejection.reason?.trim() || "Unspecified",
        qty: toNum(rejection.qty ?? rejection.quantity),
      }))
      .filter((rejection) => rejection.qty > 0);
  }

  // Backward compatibility for old production records
  const oldQty = toNum(item.rejectedQty);

  if (oldQty > 0) {
    return [
      {
        reason: item.rejectionReason?.trim() || "Unspecified",
        qty: oldQty,
      },
    ];
  }

  return [];
};

const buildReasonBreakdown = (reasonTotals, totalRejected) =>
  Object.entries(reasonTotals)
    .map(([reason, qty]) => ({
      reason,
      qty,
      percentage: safeRate(qty, totalRejected),
    }))
    .sort((a, b) => b.qty - a.qty);

/**
 * Resolves the "true" part identity for a PDIR record.
 *
 * PDIR stores its own required `component` ObjectId ref directly
 * on the document (decoupled from `production`, which is optional).
 * That direct ref is the most reliable source of truth.
 */
const resolvePdirPart = (item) => {
  const directComponent = item.component;
  const prodComponent = item.production?.component;

  const comp =
    directComponent && directComponent._id
      ? directComponent
      : prodComponent && prodComponent._id
      ? prodComponent
      : null;

  if (comp) {
    return {
      componentId: comp._id.toString(),
      partName: comp.componentName || item.partName || "Unknown",
      partNumber: comp.partNumber || item.partNumber || "-",
      key: `id:${comp._id.toString()}`,
    };
  }

  if (item.partNumber && item.partNumber.trim()) {
    return {
      componentId: null,
      partName: item.partName || "Unknown",
      partNumber: item.partNumber.trim(),
      key: `pn:${normalize(item.partNumber)}`,
    };
  }

  if (item.partName && item.partName.trim()) {
    return {
      componentId: null,
      partName: item.partName.trim(),
      partNumber: "-",
      key: `name:${normalize(item.partName)}`,
    };
  }

  return {
    componentId: null,
    partName: "Unknown",
    partNumber: "-",
    key: "unknown",
  };
};

export const getReports = async (query) => {
  const search = (query.search || "").trim();
  const searchRegex = search ? new RegExp(search, "i") : null;

  // =========================================================
  // 1. FETCH ALL PRODUCTION DATA WITH POPULATED REFERENCES
  // =========================================================

  let productions = await Production.find()
    .populate("operator", "name operatorId")
    .populate("machine", "machineName machineId")
    .populate("component", "componentName partNumber componentId")
    .populate("createdBy", "fullName")
    .sort({
      date: -1,
      createdAt: -1,
    });

  // =========================================================
  // 2. FETCH ALL PDIR DATA WITH ITS OWN COMPONENT REF
  // =========================================================

  let pdir = await PDIR.find()
    .populate("component", "componentName partNumber componentId")
    .populate({
      path: "production",
      populate: [
        {
          path: "operator",
          select: "name operatorId",
        },
        {
          path: "machine",
          select: "machineName machineId",
        },
        {
          path: "component",
          select: "componentName partNumber componentId",
        },
      ],
    })
    .populate("checkingOperator", "name operatorId")
    .populate("packingOperator", "name operatorId")
    .populate("createdBy", "fullName")
    .sort({
      createdAt: -1,
    });

  // =========================================================
  // 3. GLOBAL SEARCH
  // =========================================================

  if (searchRegex) {
    productions = productions.filter((item) => {
      const searchableValues = [
        item.operationNo,
        item.remarks,
        item.grade,
        item.shift,
        ...(getProductionRejections(item).map((rejection) => rejection.reason)),

        item.operator?.name,
        item.operator?.operatorId,

        item.machine?.machineName,
        item.machine?.machineId,

        item.component?.componentName,
        item.component?.partNumber,
        item.component?.componentId,

        item.createdBy?.fullName,

        item.date ? new Date(item.date).toLocaleDateString("en-IN") : "",
      ];

      return searchableValues.some((value) =>
        searchRegex.test(String(value || ""))
      );
    });

    pdir = pdir.filter((item) => {
      const searchableValues = [
        item.partName,
        item.partNumber,
        item.rejectionReason,
        item.remarks,

        item.component?.componentName,
        item.component?.partNumber,

        item.checkingOperator?.name,
        item.checkingOperator?.operatorId,

        item.packingOperator?.name,
        item.packingOperator?.operatorId,

        item.createdBy?.fullName,

        item.production?.operationNo,
        item.production?.shift,

        item.production?.operator?.name,
        item.production?.operator?.operatorId,

        item.production?.machine?.machineName,
        item.production?.machine?.machineId,

        item.production?.component?.componentName,
        item.production?.component?.partNumber,

        item.createdAt
          ? new Date(item.createdAt).toLocaleDateString("en-IN")
          : "",
      ];

      return searchableValues.some((value) =>
        searchRegex.test(String(value || ""))
      );
    });
  }

  // =========================================================
  // 4. PRODUCTION SUMMARY
  // =========================================================

  const totalEntries = productions.length;

  const totalTarget = productions.reduce(
    (sum, item) => sum + toNum(item.targetProduction),
    0
  );

  const totalProduction = productions.reduce(
    (sum, item) => sum + toNum(item.actualProduction),
    0
  );

  // STEP 2 FIX: Accurate calculation when one production entry has multiple rejections
  const productionRejected = productions.reduce((sum, item) => {
    const rejections = getProductionRejections(item);

    if (rejections.length > 0) {
      return sum + rejections.reduce((total, rejection) => total + rejection.qty, 0);
    }

    return sum + toNum(item.rejectedQty);
  }, 0);

  const efficiency = safeRate(totalProduction, totalTarget);

  // Production-side scrap rate = rejected / actual produced.
  const productionRejectionRate = safeRate(productionRejected, totalProduction);

  // =========================================================
  // 5. PDIR SUMMARY
  // =========================================================

  const pdirRejected = pdir.reduce(
    (sum, item) => sum + toNum(item.qtyRejected),
    0
  );

  const totalQtyChecked = pdir.reduce(
    (sum, item) => sum + toNum(item.qtyChecked),
    0
  );

  const totalRejected = productionRejected + pdirRejected;

  // PDIR rejection rate = rejected / checked.
  const rejectionRate = safeRate(pdirRejected, totalQtyChecked);

  // =========================================================
  // 6. PRODUCTION GROUPING BY COMPONENT
  // =========================================================

  const productionGroups = {};

  productions.forEach((item) => {
    const componentId = item.component?._id?.toString() || "unknown";

    if (!productionGroups[componentId]) {
      productionGroups[componentId] = {
        componentId: item.component?._id || null,
        partName: item.component?.componentName || "Unknown",
        partNumber: item.component?.partNumber || "-",

        totalEntries: 0,
        totalTarget: 0,
        totalProduction: 0,
        totalRejected: 0,
        reasonTotals: {},
      };
    }

    const bucket = productionGroups[componentId];

    bucket.totalEntries += 1;
    bucket.totalTarget += toNum(item.targetProduction);
    bucket.totalProduction += toNum(item.actualProduction);

    // STEP 4 FIX: Correctly sum rejections during component grouping
    const productionRejections = getProductionRejections(item);
    const rejectionTotal = productionRejections.reduce(
      (sum, rejection) => sum + rejection.qty,
      0
    );

    bucket.totalRejected +=
      rejectionTotal > 0 ? rejectionTotal : toNum(item.rejectedQty);

    productionRejections.forEach(({ reason, qty }) => {
      bucket.reasonTotals[reason] =
        (bucket.reasonTotals[reason] || 0) + qty;
    });
  });

  const productionGroupList = Object.values(productionGroups);

  // Part-wise production report
  const partWiseReport = productionGroupList
    .map((item) => ({
      componentId: item.componentId,
      partName: item.partName,
      componentName: item.partName,
      partNumber: item.partNumber,

      totalEntries: item.totalEntries,
      totalTarget: item.totalTarget,
      totalProduction: item.totalProduction,
      totalRejected: item.totalRejected,
      efficiency: safeRate(item.totalProduction, item.totalTarget),
    }))
    .sort((a, b) => b.totalProduction - a.totalProduction);

  // STEP 3 FIX: Return detailed reason breakdown per component for frontend matching
  const componentWiseProductionDefect = productionGroupList
    .map((g) => {
      const reasons = buildReasonBreakdown(
        g.reasonTotals,
        g.totalRejected
      );

      return {
        _id: g.componentId || g.partNumber || g.partName,
        componentId: g.componentId,
        partName: g.partName,
        partNumber: g.partNumber,

        totalProduced: g.totalProduction,
        totalRejected: g.totalRejected,
        entries: g.totalEntries,

        rejectionRate: safeRate(
          g.totalRejected,
          g.totalProduction
        ),

        // Multiple rejection reasons for the same component
        reasons,
      };
    })
    .sort((a, b) => b.totalRejected - a.totalRejected);

  // Production rejection reason-wise report (overall)
  const productionRejectionReasonMap = {};

  productions.forEach((item) => {
    const productionRejections = getProductionRejections(item);

    productionRejections.forEach(({ reason, qty }) => {
      if (!productionRejectionReasonMap[reason]) {
        productionRejectionReasonMap[reason] = {
          _id: reason,
          rejectionReason: reason,
          totalRejected: 0,
          occurrences: 0,
        };
      }

      productionRejectionReasonMap[reason].totalRejected += qty;
      productionRejectionReasonMap[reason].occurrences += 1;
    });
  });

  const productionRejectionReasonWise = Object.values(
    productionRejectionReasonMap
  ).sort((a, b) => b.totalRejected - a.totalRejected);

  // Highest production defect reason per component
  const highestProductionDefectReason = productionGroupList
    .map((g) => {
      const reasons = Object.entries(g.reasonTotals);
      if (!reasons.length) return null;

      const [reason, quantity] = reasons.sort((a, b) => b[1] - a[1])[0];

      return {
        _id: {
          partName: g.partName,
          partNumber: g.partNumber,
          rejectionReason: reason,
        },
        totalRejected: quantity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalRejected - a.totalRejected);

  // =========================================================
  // 7. OPERATOR-WISE PRODUCTION REPORT
  // =========================================================

  const operatorWiseMap = {};

  productions.forEach((item) => {
    const operatorId = item.operator?._id?.toString() || "unknown";

    if (!operatorWiseMap[operatorId]) {
      operatorWiseMap[operatorId] = {
        operatorId: item.operator?._id || null,
        operatorName: item.operator?.name || "Unknown",
        operatorCode: item.operator?.operatorId || "-",

        totalEntries: 0,
        totalTarget: 0,
        totalProduction: 0,
        totalRejected: 0,
      };
    }

    const bucket = operatorWiseMap[operatorId];

    bucket.totalEntries += 1;
    bucket.totalTarget += toNum(item.targetProduction);
    bucket.totalProduction += toNum(item.actualProduction);
    bucket.totalRejected += toNum(item.rejectedQty);
  });

  const operatorWiseReport = Object.values(operatorWiseMap)
    .map((item) => ({
      ...item,
      efficiency: safeRate(item.totalProduction, item.totalTarget),
    }))
    .sort((a, b) => b.totalProduction - a.totalProduction);

  // =========================================================
  // 8. PDIR GROUPING BY RESOLVED PART IDENTITY
  // =========================================================

  const pdirGroups = {};

  pdir.forEach((item) => {
    const resolved = resolvePdirPart(item);
    const key = resolved.key;

    if (!pdirGroups[key]) {
      pdirGroups[key] = {
        key,
        componentId: resolved.componentId,
        partName: resolved.partName,
        partNumber: resolved.partNumber,

        totalChecked: 0,
        totalRejected: 0,
        pdirEntries: 0,
        reasonTotals: {},
      };
    }

    const bucket = pdirGroups[key];

    if (bucket.partName === "Unknown" && resolved.partName !== "Unknown") {
      bucket.partName = resolved.partName;
    }
    if (bucket.partNumber === "-" && resolved.partNumber !== "-") {
      bucket.partNumber = resolved.partNumber;
    }
    if (!bucket.componentId && resolved.componentId) {
      bucket.componentId = resolved.componentId;
    }

    bucket.totalChecked += toNum(item.qtyChecked);
    bucket.totalRejected += toNum(item.qtyRejected);
    bucket.pdirEntries += 1;

    const rejectedQty = toNum(item.qtyRejected);
    if (rejectedQty > 0) {
      const reason = item.rejectionReason?.trim() || "Unspecified";
      bucket.reasonTotals[reason] =
        (bucket.reasonTotals[reason] || 0) + rejectedQty;
    }
  });

  const pdirGroupList = Object.values(pdirGroups);

  // =========================================================
  // 9. COMPONENT-WISE PDIR DEFECT REPORT
  // =========================================================

  const componentWiseDefect = pdirGroupList
    .map((g) => ({
      _id: g.componentId || g.key,
      componentId: g.componentId,
      partName: g.partName,
      partNumber: g.partNumber,
      totalChecked: g.totalChecked,
      totalRejected: g.totalRejected,
      pdirEntries: g.pdirEntries,
      rejectionRate: safeRate(g.totalRejected, g.totalChecked),
    }))
    .sort((a, b) => b.totalRejected - a.totalRejected);

  // =========================================================
  // 10. PDIR REJECTION REASON-WISE REPORT
  // =========================================================

  const rejectionReasonMap = {};

  pdir.forEach((item) => {
    const rejectedQty = toNum(item.qtyRejected);
    if (rejectedQty <= 0) return;

    const reason = item.rejectionReason?.trim() || "Unspecified";

    if (!rejectionReasonMap[reason]) {
      rejectionReasonMap[reason] = {
        _id: reason,
        rejectionReason: reason,
        totalRejected: 0,
        occurrences: 0,
      };
    }

    rejectionReasonMap[reason].totalRejected += rejectedQty;
    rejectionReasonMap[reason].occurrences += 1;
  });

  const rejectionReasonWise = Object.values(rejectionReasonMap).sort(
    (a, b) => b.totalRejected - a.totalRejected
  );

  // =========================================================
  // 11. HIGHEST PDIR DEFECT REASON PER COMPONENT
  // =========================================================

  const highestDefectReason = pdirGroupList
    .map((g) => {
      const reasons = Object.entries(g.reasonTotals);
      if (!reasons.length) return null;

      const [reason, quantity] = reasons.sort((a, b) => b[1] - a[1])[0];

      return {
        _id: {
          partName: g.partName,
          partNumber: g.partNumber,
          rejectionReason: reason,
        },
        totalRejected: quantity,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalRejected - a.totalRejected);

  // =========================================================
  // 12. PART ANALYSIS (Production & PDIR Kept Distinct)
  // =========================================================

  const pdirByComponentId = new Map();
  const pdirByPartNumber = new Map();
  const pdirByPartName = new Map();

  pdirGroupList.forEach((g) => {
    if (g.componentId) {
      pdirByComponentId.set(g.componentId, g);
    } else if (g.key.startsWith("pn:")) {
      pdirByPartNumber.set(g.key.slice(3), g);
    } else if (g.key.startsWith("name:")) {
      pdirByPartName.set(g.key.slice(5), g);
    }
  });

  const matchedPdirKeys = new Set();

  const partAnalysis = productionGroupList.map((part) => {
    const compId = part.componentId ? part.componentId.toString() : null;

    let pdirGroup = null;

    if (compId && pdirByComponentId.has(compId)) {
      pdirGroup = pdirByComponentId.get(compId);
    } else if (
      part.partNumber &&
      part.partNumber !== "-" &&
      pdirByPartNumber.has(normalize(part.partNumber))
    ) {
      pdirGroup = pdirByPartNumber.get(normalize(part.partNumber));
    } else if (
      part.partName &&
      pdirByPartName.has(normalize(part.partName))
    ) {
      pdirGroup = pdirByPartName.get(normalize(part.partName));
    }

    if (pdirGroup) matchedPdirKeys.add(pdirGroup.key);

    const productionReasons = buildReasonBreakdown(
      part.reasonTotals,
      part.totalRejected
    );
    const pdirReasons = pdirGroup
      ? buildReasonBreakdown(pdirGroup.reasonTotals, pdirGroup.totalRejected)
      : [];

    return {
      componentId: part.componentId,
      partName: part.partName,
      partNumber: part.partNumber,

      production: {
        totalEntries: part.totalEntries,
        totalTarget: part.totalTarget,
        totalProduction: part.totalProduction,
        efficiency: safeRate(part.totalProduction, part.totalTarget),
        totalRejected: part.totalRejected,
        rejectionRate: safeRate(part.totalRejected, part.totalProduction),
        mainReason: productionReasons[0]?.reason || null,
        reasons: productionReasons,
      },

      pdir: {
        totalChecked: pdirGroup ? pdirGroup.totalChecked : 0,
        totalRejected: pdirGroup ? pdirGroup.totalRejected : 0,
        pdirEntries: pdirGroup ? pdirGroup.pdirEntries : 0,
        rejectionRate: pdirGroup
          ? safeRate(pdirGroup.totalRejected, pdirGroup.totalChecked)
          : 0,
        mainReason: pdirReasons[0]?.reason || null,
        reasons: pdirReasons,
      },

      combinedRejected: part.totalRejected + (pdirGroup ? pdirGroup.totalRejected : 0),
    };
  });

  // Append PDIR-only parts
  pdirGroupList.forEach((g) => {
    if (matchedPdirKeys.has(g.key)) return;

    const pdirReasons = buildReasonBreakdown(g.reasonTotals, g.totalRejected);

    partAnalysis.push({
      componentId: g.componentId,
      partName: g.partName,
      partNumber: g.partNumber,

      production: {
        totalEntries: 0,
        totalTarget: 0,
        totalProduction: 0,
        efficiency: 0,
        totalRejected: 0,
        rejectionRate: 0,
        mainReason: null,
        reasons: [],
      },

      pdir: {
        totalChecked: g.totalChecked,
        totalRejected: g.totalRejected,
        pdirEntries: g.pdirEntries,
        rejectionRate: safeRate(g.totalRejected, g.totalChecked),
        mainReason: pdirReasons[0]?.reason || null,
        reasons: pdirReasons,
      },

      combinedRejected: g.totalRejected,
    });
  });

  partAnalysis.sort(
    (a, b) =>
      b.production.totalProduction - a.production.totalProduction ||
      b.combinedRejected - a.combinedRejected
  );

  // =========================================================
  // 13. DETAILED PDIR REPORT
  // =========================================================

  const pdirDetailedReport = pdir.map((item) => ({
    _id: item._id,
    createdAt: item.createdAt,

    partName: item.component?.componentName || item.partName,
    partNumber: item.component?.partNumber || item.partNumber,

    qtyChecked: item.qtyChecked,
    qtyRejected: item.qtyRejected,

    rejectionReason: item.rejectionReason || "Unspecified",
    remarks: item.remarks || "",

    checkingOperator: item.checkingOperator,
    packingOperator: item.packingOperator,
    createdBy: item.createdBy,

    production: item.production,

    productionBatch: item.production
      ? {
          _id: item.production._id,
          date: item.production.date,
          operationNo: item.production.operationNo,
          shift: item.production.shift,
          operator: item.production.operator,
          machine: item.production.machine,
          component: item.production.component,
          targetProduction: item.production.targetProduction,
          actualProduction: item.production.actualProduction,
          rejectedQty: item.production.rejectedQty,
          rejections: item.production.rejections || [],
          grade: item.production.grade,
        }
      : null,
  }));

  // =========================================================
  // 14. MONTHLY PRODUCTION CHART
  // =========================================================

  const monthlyMap = {};

  productions.forEach((item) => {
    if (!item.date) return;

    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        _id: { year, month },
        targetProduction: 0,
        actualProduction: 0,
        rejectedQty: 0,
      };
    }

    monthlyMap[key].targetProduction += toNum(item.targetProduction);
    monthlyMap[key].actualProduction += toNum(item.actualProduction);
    monthlyMap[key].rejectedQty += toNum(item.rejectedQty);
  });

  const monthlyChart = Object.values(monthlyMap).sort((a, b) => {
    if (a._id.year !== b._id.year) return a._id.year - b._id.year;
    return a._id.month - b._id.month;
  });

  // =========================================================
  // 15. RETURN COMPLETE REPORT
  // =========================================================

  return {
    summary: {
      totalEntries,
      totalTarget,
      totalProduction,
      totalRejected,

      // Production-floor scrap
      productionRejected,
      productionRejectionRate,

      // PDIR / quality inspection rejection
      pdirRejected,
      totalQtyChecked,
      rejectionRate,

      efficiency,
    },

    // Raw datasets
    productions,
    pdir,
    pdirDetailedReport,

    // Production-side reports
    partWiseReport,
    componentWiseProductionDefect,
    productionRejectionReasonWise,
    highestProductionDefectReason,

    // Operator-wise report
    operatorWiseReport,

    // PDIR-side reports
    componentWiseDefect,
    rejectionReasonWise,
    highestDefectReason,

    // Combined per-part view
    partAnalysis,

    // Monthly chart
    monthlyChart,
  };
};