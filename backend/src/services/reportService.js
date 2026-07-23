import Production from "../models/Production.js";
import Pdir from "../models/Pdir.js";

// =========================================================
// HELPERS
// =========================================================

const toNum = (v) => Number(v || 0);

const normalize = (s) => (s || "").toString().trim().toLowerCase();

const safeRate = (numerator, denominator) =>
  denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(2))
    : 0;

/**
 * Resolves the "true" part identity for a PDIR record.
 *
 * Priority order (per user requirement):
 *   1. production.component (populated ObjectId) -- most reliable,
 *      since it comes from the Component collection via
 *      Production.component -> Component.
 *   2. PDIR's own partNumber field (denormalized fallback).
 *   3. PDIR's own partName field (denormalized fallback).
 *   4. "Unknown" -- only when none of the above exist.
 *
 * Returns a stable `key` used to group PDIR records so that records
 * for the exact same part always end up in the exact same bucket,
 * regardless of which of the above sources they came from.
 */
const resolvePdirPart = (item) => {
  const prodComponent = item.production?.component;

  if (prodComponent && prodComponent._id) {
    return {
      componentId: prodComponent._id.toString(),
      partName: prodComponent.componentName || item.partName || "Unknown",
      partNumber: prodComponent.partNumber || item.partNumber || "-",
      key: `id:${prodComponent._id.toString()}`,
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
  // 2. FETCH ALL PDIR DATA WITH PRODUCTION RELATION
  // =========================================================

  let pdir = await Pdir.find()
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
  // 3. GLOBAL SEARCH (unchanged)
  // =========================================================

  if (searchRegex) {
    productions = productions.filter((item) => {
      const searchableValues = [
        item.operationNo,
        item.remarks,
        item.grade,
        item.shift,

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

  const productionRejected = productions.reduce(
    (sum, item) => sum + toNum(item.rejectedQty),
    0
  );

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

  // Production rejection kept separate from PDIR rejection to avoid
  // double counting the same rejected pieces.
  const totalRejected = productionRejected;

  const efficiency = safeRate(totalProduction, totalTarget);

  // Overall PDIR rejection rate = rejected / checked. Never derived
  // from production quantity.
  const rejectionRate = safeRate(pdirRejected, totalQtyChecked);

  // =========================================================
  // 6. PART-WISE PRODUCTION REPORT (source of truth: Production)
  // =========================================================

  const partWiseMap = {};

  productions.forEach((item) => {
    const componentId = item.component?._id?.toString() || "unknown";

    if (!partWiseMap[componentId]) {
      partWiseMap[componentId] = {
        componentId: item.component?._id || null,
        partName: item.component?.componentName || "Unknown",
        componentName: item.component?.componentName || "Unknown",
        partNumber: item.component?.partNumber || "-",

        totalEntries: 0,
        totalTarget: 0,
        totalProduction: 0,
        totalRejected: 0,
      };
    }

    const bucket = partWiseMap[componentId];

    bucket.totalEntries += 1;
    bucket.totalTarget += toNum(item.targetProduction);
    bucket.totalProduction += toNum(item.actualProduction);
    bucket.totalRejected += toNum(item.rejectedQty);
  });

  const partWiseReport = Object.values(partWiseMap)
    .map((item) => ({
      ...item,
      efficiency: safeRate(item.totalProduction, item.totalTarget),
    }))
    .sort((a, b) => b.totalProduction - a.totalProduction);

  // =========================================================
  // 7. OPERATOR-WISE PRODUCTION REPORT (unchanged)
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
  //    (single source of truth used by every PDIR-based report
  //    below, so "Unknown" and mismatched keys can't happen in
  //    one place but not another)
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

    // If an earlier record in this bucket didn't have a resolvable
    // name/number but a later one does, backfill it rather than
    // leaving the bucket stuck on "Unknown".
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
  //    (same field names/shape as before — now correctly keyed)
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
  // 10. REJECTION REASON-WISE REPORT (unchanged shape)
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
  // 11. HIGHEST DEFECT REASON PER COMPONENT
  //     (same output shape as before, now derived from the
  //     correctly-keyed pdirGroups)
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
  // 12. PART ANALYSIS (NEW)
  //     Production + PDIR merged correctly by Component ObjectId
  //     first, falling back to normalized part number / part name.
  //     This is the dataset the Part-Wise Analysis UI should use.
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

  const buildReasonBreakdown = (g) => {
    if (!g) return [];
    return Object.entries(g.reasonTotals)
      .map(([reason, qty]) => ({
        reason,
        qty,
        percentage: safeRate(qty, g.totalRejected),
      }))
      .sort((a, b) => b.qty - a.qty);
  };

  const matchedPdirKeys = new Set();

  const partAnalysis = partWiseReport.map((part) => {
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

    const totalChecked = pdirGroup ? pdirGroup.totalChecked : 0;
    const totalRejectedPdir = pdirGroup ? pdirGroup.totalRejected : 0;
    const pdirEntries = pdirGroup ? pdirGroup.pdirEntries : 0;

    // Rejection Rate = Rejected / Checked. Never divided by production
    // quantity. 0 checked -> 0%, never NaN/Infinity/nonsense values.
    const rejectionRate = safeRate(totalRejectedPdir, totalChecked);

    const reasons = buildReasonBreakdown(pdirGroup);
    const mainReason = reasons[0] || null;

    return {
      componentId: part.componentId,
      partName: part.partName,
      partNumber: part.partNumber,

      totalProduction: part.totalProduction,
      totalTarget: part.totalTarget,
      totalEntries: part.totalEntries,
      efficiency: part.efficiency,

      totalChecked,
      totalRejected: totalRejectedPdir,
      rejectionRate,
      pdirEntries,

      mainRejectionReason: mainReason?.reason || null,
      mainRejectionQty: mainReason?.qty || 0,
      mainRejectionPercentage: mainReason?.percentage || 0,

      reasons,
    };
  });

  // Append PDIR-only parts that never matched a production part-wise
  // row (e.g. inspection recorded for a part with no linked
  // production entry) so their quality data isn't silently dropped.
  pdirGroupList.forEach((g) => {
    if (matchedPdirKeys.has(g.key)) return;

    const reasons = buildReasonBreakdown(g);
    const mainReason = reasons[0] || null;

    partAnalysis.push({
      componentId: g.componentId,
      partName: g.partName,
      partNumber: g.partNumber,

      totalProduction: 0,
      totalTarget: 0,
      totalEntries: 0,
      efficiency: 0,

      totalChecked: g.totalChecked,
      totalRejected: g.totalRejected,
      rejectionRate: safeRate(g.totalRejected, g.totalChecked),
      pdirEntries: g.pdirEntries,

      mainRejectionReason: mainReason?.reason || null,
      mainRejectionQty: mainReason?.qty || 0,
      mainRejectionPercentage: mainReason?.percentage || 0,

      reasons,
    });
  });

  partAnalysis.sort(
    (a, b) =>
      b.totalProduction - a.totalProduction ||
      b.totalRejected - a.totalRejected
  );

  // =========================================================
  // 13. DETAILED PDIR REPORT (unchanged)
  // =========================================================

  const pdirDetailedReport = pdir.map((item) => ({
    _id: item._id,
    createdAt: item.createdAt,

    partName: item.partName,
    partNumber: item.partNumber,

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
          grade: item.production.grade,
        }
      : null,
  }));

  // =========================================================
  // 14. MONTHLY PRODUCTION CHART (unchanged)
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
      productionRejected,
      pdirRejected,
      totalQtyChecked,
      efficiency,
      rejectionRate,
    },

    // Production Report
    productions,

    // Original PDIR response
    pdir,

    // Detailed PDIR report
    pdirDetailedReport,

    // Part-wise report (production-side, unchanged shape)
    partWiseReport,

    // Operator-wise report
    operatorWiseReport,

    // Component defect analysis (now correctly keyed/resolved)
    componentWiseDefect,

    // Rejection reason analysis
    rejectionReasonWise,

    // Highest defect reason for each component (now correctly resolved)
    highestDefectReason,

    // NEW: Production + PDIR merged per part, with full rejection-type
    // breakdown & percentages. Use this for the Part-Wise Analysis UI.
    partAnalysis,

    // Monthly chart
    monthlyChart,
  };
};