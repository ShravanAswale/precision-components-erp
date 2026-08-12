import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Search,
  Printer,
  Download,
  Factory,
  Users,
  Package,
  ClipboardCheck,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Award,
  ShieldAlert,
  Target,
  CheckCircle2,
  Trophy,
  Info,
  X,
  Eye,
  Wrench,
} from "lucide-react";
import api from "../../services/api";

// ============================================================
// STATIC CONFIG
// ============================================================

const gradeColors = {
  A: { bg: "#dcfce7", text: "#166534" },
  B: { bg: "#dbeafe", text: "#1e40af" },
  C: { bg: "#fef3c7", text: "#92400e" },
  D: { bg: "#fee2e2", text: "#991b1b" },
};

const CHART_COLORS = [
  "#0d9488",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
];

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const pct = (num, den) => {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10;
};

const truncateLabel = (label, max = 12) => {
  if (!label) return "-";
  const str = String(label);
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

// Reads either { reason, quantity } (current backend model) or
// { reason, qty } (older/future aggregate shape) — kept defensive
// since componentWiseProductionDefect[].reasons doesn't exist on
// the backend yet and its exact key isn't finalized.
const reasonQty = (r) => toNum(r?.quantity ?? r?.qty ?? 0);

// ============================================================
// CSV EXPORT HELPER
// ============================================================

const downloadCSV = (filename, rows, headers) => {
  const escapeCell = (val) => {
    const str = String(val ?? "");
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedPart, setSelectedPart] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null); // { title, sections } for generic modal

  // Client-side-only filter scoped to the Component Rejection tab.
  // TEMPORARY: replace with backend-driven filters (date/shift/part/
  // operator/machine/reason + pagination) once report.service.js
  // supports them — this only filters what's already been fetched.
  const [componentRejectionSearch, setComponentRejectionSearch] = useState("");

  // ============================================================
  // FETCH REPORT WHEN SEARCH CHANGES (debounced)
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.get("/reports", { params });

      setReportData(res.data?.data || null);
    } catch (err) {
      console.error("Error loading reports:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load report data. Please try again."
      );
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => setSearch("");

  // ============================================================
  // RAW DATA (from /reports response)
  // ============================================================

  const summary = reportData?.summary || {};
  const productionData = reportData?.productions || [];
  const pdirData = reportData?.pdirDetailedReport || reportData?.pdir || [];

  // Production-side (independent of PDIR)
  const partWiseReport = reportData?.partWiseReport || [];
  const componentWiseProductionDefect =
    reportData?.componentWiseProductionDefect || [];
  const productionRejectionReasonWise =
    reportData?.productionRejectionReasonWise || [];
  const highestProductionDefectReason =
    reportData?.highestProductionDefectReason || [];

  // PDIR-side (independent of Production)
  const componentWiseDefect = reportData?.componentWiseDefect || [];
  const rejectionReasonWise = reportData?.rejectionReasonWise || [];
  const highestDefectReason = reportData?.highestDefectReason || [];

  const operatorWiseReport = reportData?.operatorWiseReport || [];
  const monthlyChart = reportData?.monthlyChart || [];

  // Pre-merged, correctly-keyed Production + PDIR data per part —
  // production and pdir kept as two separate nested objects.
  const partAnalysis = reportData?.partAnalysis || [];

  // ============================================================
  // COMPONENT REJECTION TAB — SCOPED CLIENT-SIDE FILTER
  // Filters only the tables in this tab; KPI cards and charts keep
  // showing overall totals so the top-line numbers don't jump
  // around while someone is mid-search.
  // ============================================================

  const filteredComponentWiseProductionDefect = useMemo(() => {
    const q = componentRejectionSearch.trim().toLowerCase();
    if (!q) return componentWiseProductionDefect;

    return componentWiseProductionDefect.filter((item) => {
      const reasonText = Array.isArray(item.reasons)
        ? item.reasons.map((r) => r.reason).join(" ")
        : "";
      const haystack = [item.partName, item.partNumber, reasonText]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [componentWiseProductionDefect, componentRejectionSearch]);

  const filteredProductionRejectionReasonWise = useMemo(() => {
    const q = componentRejectionSearch.trim().toLowerCase();
    if (!q) return productionRejectionReasonWise;

    return productionRejectionReasonWise.filter((item) =>
      String(item.rejectionReason || item._id || "")
        .toLowerCase()
        .includes(q)
    );
  }, [productionRejectionReasonWise, componentRejectionSearch]);

  const filteredHighestProductionDefectReason = useMemo(() => {
    const q = componentRejectionSearch.trim().toLowerCase();
    if (!q) return highestProductionDefectReason;

    return highestProductionDefectReason.filter((item) => {
      const haystack = [
        item._id?.partName,
        item._id?.partNumber,
        item._id?.rejectionReason,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [highestProductionDefectReason, componentRejectionSearch]);

  // ============================================================
  // CSV EXPORT HANDLERS
  // ============================================================

  const handleDownloadProductionCSV = () => {
    const headers = [
      "Date",
      "Operator",
      "Component",
      "Part No",
      "Machine",
      "Shift",
      "Operation",
      "Target",
      "Actual",
      "Rejected",
      "Rejection Reasons",
      "Grade",
    ];

    const rows = productionData.map((entry) => [
      fmtDate(entry.date),
      entry.operator?.name || "-",
      entry.component?.componentName || "-",
      entry.component?.partNumber || "-",
      entry.machine?.machineName || "-",
      entry.shift || "-",
      entry.operationNo || "-",
      entry.targetProduction || 0,
      entry.actualProduction || 0,
      entry.rejectedQty || 0,
      Array.isArray(entry.rejections) && entry.rejections.length > 0
        ? entry.rejections
            .map((r) => `${r.reason} (${reasonQty(r)})`)
            .join("; ")
        : entry.rejectionReason || "-",
      entry.grade || "-",
    ]);

    downloadCSV("production-report.csv", rows, headers);
  };

  const handleDownloadPdirCSV = () => {
    const headers = [
      "Date",
      "Part",
      "Part Number",
      "Checking Operator",
      "Packing Operator",
      "Qty Checked",
      "Qty Rejected",
      "Rejection Reason",
      "Remarks",
    ];

    const rows = pdirData.map((entry) => [
      fmtDate(entry.createdAt),
      entry.partName || "-",
      entry.partNumber || "-",
      entry.checkingOperator?.name || "-",
      entry.packingOperator?.name || "-",
      entry.qtyChecked || 0,
      entry.qtyRejected || 0,
      entry.rejectionReason || "Unspecified",
      entry.remarks || "-",
    ]);

    downloadCSV("pdir-report.csv", rows, headers);
  };

  const handleDownloadComponentRejectionCSV = () => {
    const headers = [
      "Component",
      "Part No",
      "Produced",
      "Rejected",
      "Rejection Rate",
      "Reasons Breakdown",
    ];

    const rows = filteredComponentWiseProductionDefect.map((item) => [
      item.partName || "Unknown",
      item.partNumber || "-",
      item.totalProduced || 0,
      item.totalRejected || 0,
      item.rejectionRate !== undefined ? `${item.rejectionRate}%` : "-",
      Array.isArray(item.reasons) && item.reasons.length > 0
        ? item.reasons.map((r) => `${r.reason} (${reasonQty(r)})`).join("; ")
        : "-",
    ]);

    downloadCSV("component-rejection-report.csv", rows, headers);
  };

  // ============================================================
  // GENERIC ROW -> DETAIL MODAL HELPER
  // ============================================================

  const openDetail = (title, sections) => setDetailRecord({ title, sections });
  const closeDetail = () => setDetailRecord(null);

  const openProductionDetail = (entry) => {
    openDetail(`Production Entry — ${entry.component?.componentName || "-"}`, [
      {
        heading: "Batch Info",
        rows: [
          ["Date", fmtDate(entry.date)],
          ["Shift", entry.shift || "-"],
          ["Operation No", entry.operationNo || "-"],
          ["Machine", entry.machine?.machineName || "-"],
          ["Operator", entry.operator?.name || "-"],
          ["Grade", entry.grade || "-"],
        ],
      },
      {
        heading: "Part",
        rows: [
          ["Component", entry.component?.componentName || "-"],
          ["Part No", entry.component?.partNumber || "-"],
        ],
      },
      {
        heading: "Production Output",
        rows: [
          ["Cycle Time (s)", entry.cycleTime ?? "-"],
          ["Machine Run Time", entry.machineRunTime ?? "-"],
          ["Target Production", entry.targetProduction ?? 0],
          ["Actual Production", entry.actualProduction ?? 0],
        ],
      },
      {
        heading: "Production Rejection",
        danger: toNum(entry.rejectedQty) > 0,
        rows: [
          ["Qty Rejected", entry.rejectedQty || 0],
          [
            "Rejection Reasons",
            Array.isArray(entry.rejections) && entry.rejections.length > 0
              ? entry.rejections
                  .map((r) => `${r.reason} (${reasonQty(r)})`)
                  .join(", ")
              : entry.rejectionReason || "-",
          ],
        ],
      },
      {
        heading: "Other",
        rows: [
          ["Remarks", entry.remarks || "-"],
          ["Created By", entry.createdBy?.fullName || "-"],
        ],
      },
    ]);
  };

  // PDIR detail stays untouched — deliberately kept separate from
  // production/component rejection, never merged.
  const openPdirDetail = (entry) => {
    const production = entry.productionBatch || entry.production;
    openDetail(`PDIR Entry — ${entry.partName || "-"}`, [
      {
        heading: "Part",
        rows: [
          ["Part Name", entry.partName || "-"],
          ["Part Number", entry.partNumber || "-"],
          ["Inspected On", fmtDate(entry.createdAt)],
        ],
      },
      {
        heading: "PDIR Rejection (Quality Inspection)",
        danger: toNum(entry.qtyRejected) > 0,
        rows: [
          ["Qty Checked", entry.qtyChecked || 0],
          ["Qty Rejected", entry.qtyRejected || 0],
          ["Rejection Reason", entry.rejectionReason || "Unspecified"],
        ],
      },
      {
        heading: "Operators",
        rows: [
          ["Checking Operator", entry.checkingOperator?.name || "-"],
          ["Packing Operator", entry.packingOperator?.name || "-"],
        ],
      },
      production
        ? {
            heading: "Linked Production Batch",
            rows: [
              ["Date", fmtDate(production.date)],
              ["Operation No", production.operationNo || "-"],
              ["Shift", production.shift || "-"],
              ["Actual Production", production.actualProduction ?? "-"],
              [
                "Production Rejection (separate from PDIR)",
                `${production.rejectedQty ?? 0} — ${
                  production.rejectionReason || "-"
                }`,
              ],
            ],
          }
        : {
            heading: "Linked Production Batch",
            rows: [["Status", "No production batch linked to this PDIR record"]],
          },
      {
        heading: "Other",
        rows: [
          ["Remarks", entry.remarks || "-"],
          ["Created By", entry.createdBy?.fullName || "-"],
        ],
      },
    ]);
  };

  const openOperatorDetail = (op) => {
    openDetail(`Operator — ${op.operatorName}`, [
      {
        heading: "Identity",
        rows: [["Operator Code", op.operatorCode || "-"]],
      },
      {
        heading: "Production Performance",
        rows: [
          ["Entries", op.totalEntries],
          ["Target", op.totalTarget],
          ["Actual Production", op.totalProduction],
          ["Efficiency", `${op.efficiency}%`],
        ],
      },
      {
        heading: "Production Rejection",
        danger: toNum(op.totalRejected) > 0,
        rows: [
          ["Qty Rejected (during production)", op.totalRejected],
          ["Rejection Rate", `${op.rejectionRate}%`],
        ],
      },
      {
        heading: "Ranking",
        rows: [["Score (Efficiency − Rejection Rate)", op.rankScore]],
      },
    ]);
  };

  const openComponentProductionDetail = (c) => {
    openDetail(`Production Defect — ${c.partName}`, [
      {
        heading: "Part",
        rows: [
          ["Part Name", c.partName || "-"],
          ["Part Number", c.partNumber || "-"],
        ],
      },
      {
        heading: "Production Scrap (machining stage)",
        danger: true,
        rows: [
          ["Total Produced", c.totalProduced || 0],
          ["Total Rejected", c.totalRejected || 0],
          ["Rejection Rate", `${c.rejectionRate ?? 0}%`],
          ["Production Entries", c.entries || 0],
          [
            "Reasons Breakdown",
            Array.isArray(c.reasons) && c.reasons.length > 0
              ? c.reasons.map((r) => `${r.reason} (${reasonQty(r)})`).join(", ")
              : "Backend does not yet return a per-component reasons breakdown",
          ],
        ],
      },
    ]);
  };

  const openComponentPdirDetail = (c) => {
    openDetail(`PDIR Defect — ${c.partName || c._id}`, [
      {
        heading: "Part",
        rows: [
          ["Part Name", c.partName || c._id || "-"],
          ["Part Number", c.partNumber || "-"],
        ],
      },
      {
        heading: "PDIR Rejection (quality inspection stage)",
        danger: true,
        rows: [
          ["Total Checked", c.totalChecked || 0],
          ["Total Rejected", c.totalRejected || 0],
          ["Rejection Rate", `${c.rejectionRate ?? 0}%`],
          ["PDIR Entries", c.pdirEntries || 0],
        ],
      },
    ]);
  };

  const openReasonDetail = (source, item) => {
    openDetail(`${source} Rejection Reason — ${item.rejectionReason || item._id}`, [
      {
        heading: source,
        danger: true,
        rows: [
          ["Reason", item.rejectionReason || item._id || "Unspecified"],
          ["Occurrences", item.occurrences || 0],
          ["Total Rejected Qty", item.totalRejected || 0],
        ],
      },
    ]);
  };

  // ============================================================
  // DERIVED: MONTHLY CHART
  // ============================================================

  const monthlyChartData = useMemo(
    () =>
      monthlyChart.map((item) => {
        const year = item?._id?.year;
        const month = item?._id?.month;
        let label = "-";

        if (year && month) {
          label = new Date(year, month - 1).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          });
        }

        return {
          label,
          targetProduction: toNum(item.targetProduction),
          actualProduction: toNum(item.actualProduction),
          rejectedQty: toNum(item.rejectedQty),
        };
      }),
    [monthlyChart]
  );

  // ============================================================
  // DERIVED: OVERVIEW KPIs — production & PDIR kept fully separate
  // ============================================================

  const overviewKpis = useMemo(() => {
    const totalEntries = toNum(summary.totalEntries);
    const totalTarget = toNum(summary.totalTarget);
    const totalProduction = toNum(summary.totalProduction);

    const productionRejected = toNum(summary.productionRejected);
    const productionRejectionRate =
      summary.productionRejectionRate !== undefined
        ? toNum(summary.productionRejectionRate)
        : pct(productionRejected, totalProduction);

    const totalQtyChecked = toNum(summary.totalQtyChecked);
    const pdirRejected = toNum(summary.pdirRejected);
    const pdirRejectionRate =
      summary.rejectionRate !== undefined
        ? toNum(summary.rejectionRate)
        : pct(pdirRejected, totalQtyChecked);

    const productionEfficiency = pct(totalProduction, totalTarget);

    return {
      totalEntries,
      totalTarget,
      totalProduction,
      productionRejected,
      productionRejectionRate,
      totalQtyChecked,
      pdirRejected,
      pdirRejectionRate,
      productionEfficiency,
    };
  }, [summary]);

  const productionQualityDonutData = useMemo(() => {
    if (!overviewKpis.totalProduction) return [];
    const good = Math.max(
      overviewKpis.totalProduction - overviewKpis.productionRejected,
      0
    );
    return [
      { name: "Good", value: good },
      { name: "Rejected (Production)", value: overviewKpis.productionRejected },
    ];
  }, [overviewKpis]);

  const pdirQualityDonutData = useMemo(() => {
    if (!overviewKpis.totalQtyChecked) return [];
    const good = Math.max(
      overviewKpis.totalQtyChecked - overviewKpis.pdirRejected,
      0
    );
    return [
      { name: "Accepted", value: good },
      { name: "Rejected (PDIR)", value: overviewKpis.pdirRejected },
    ];
  }, [overviewKpis]);

  // ============================================================
  // DERIVED: PART-WISE ANALYSIS
  // Built from backend's `partAnalysis`, which keeps production
  // and pdir rejection as two separate nested objects — no blending
  // on the frontend either.
  // ============================================================

  const enrichedParts = useMemo(
    () =>
      partAnalysis.map((p) => ({
        partName: p.partName || "Unknown",
        partNumber: p.partNumber || "-",

        totalEntries: toNum(p.production?.totalEntries),
        totalTarget: toNum(p.production?.totalTarget),
        totalProduction: toNum(p.production?.totalProduction),
        efficiency: toNum(p.production?.efficiency),
        productionRejected: toNum(p.production?.totalRejected),
        productionRejectionRate: toNum(p.production?.rejectionRate),
        productionMainReason: p.production?.mainReason || null,
        productionReasons: Array.isArray(p.production?.reasons)
          ? p.production.reasons
          : [],

        totalChecked: toNum(p.pdir?.totalChecked),
        pdirRejected: toNum(p.pdir?.totalRejected),
        pdirRejectionRate: toNum(p.pdir?.rejectionRate),
        pdirEntries: toNum(p.pdir?.pdirEntries),
        pdirMainReason: p.pdir?.mainReason || null,
        pdirReasons: Array.isArray(p.pdir?.reasons) ? p.pdir.reasons : [],

        combinedRejected: toNum(p.combinedRejected),
      })),
    [partAnalysis]
  );

  const partHighlights = useMemo(() => {
    if (enrichedParts.length === 0) return null;

    const mostProduced = [...enrichedParts].sort(
      (a, b) => b.totalProduction - a.totalProduction
    )[0];

    const mostDefectiveProduction = [...enrichedParts]
      .filter((p) => p.productionRejected > 0)
      .sort((a, b) => b.productionRejected - a.productionRejected)[0];

    const mostDefectivePdir = [...enrichedParts]
      .filter((p) => p.pdirRejected > 0)
      .sort((a, b) => b.pdirRejected - a.pdirRejected)[0];

    const best = [...enrichedParts]
      .filter((p) => p.totalProduction > 0)
      .sort((a, b) => {
        const scoreA = a.efficiency - a.productionRejectionRate - a.pdirRejectionRate;
        const scoreB = b.efficiency - b.productionRejectionRate - b.pdirRejectionRate;
        return scoreB - scoreA;
      })[0];

    return { mostProduced, mostDefectiveProduction, mostDefectivePdir, best };
  }, [enrichedParts]);

  const rankedProductionDefectiveParts = useMemo(
    () =>
      [...enrichedParts]
        .filter((p) => p.totalProduction > 0)
        .sort((a, b) => b.productionRejectionRate - a.productionRejectionRate),
    [enrichedParts]
  );

  const rankedPdirDefectiveParts = useMemo(
    () =>
      [...enrichedParts]
        .filter((p) => p.totalChecked > 0)
        .sort((a, b) => b.pdirRejectionRate - a.pdirRejectionRate),
    [enrichedParts]
  );

  const partProductionChart = useMemo(
    () =>
      [...enrichedParts]
        .sort((a, b) => b.totalProduction - a.totalProduction)
        .slice(0, 10)
        .map((p) => ({
          fullName: `${p.partName} (${p.partNumber})`,
          name: p.partNumber !== "-" ? p.partNumber : p.partName,
          Production: p.totalProduction,
          "Production Rejected": p.productionRejected,
        })),
    [enrichedParts]
  );

  const partRejectionRateChart = useMemo(
    () =>
      [...enrichedParts]
        .filter((p) => p.totalChecked > 0)
        .sort((a, b) => b.pdirRejectionRate - a.pdirRejectionRate)
        .slice(0, 10)
        .map((p) => ({
          fullName: `${p.partName} (${p.partNumber})`,
          name: p.partNumber !== "-" ? p.partNumber : p.partName,
          checked: p.totalChecked,
          rejected: p.pdirRejected,
          "PDIR Rejection Rate": p.pdirRejectionRate,
        })),
    [enrichedParts]
  );

  // ============================================================
  // DERIVED: OPERATOR-WISE ANALYSIS
  // ============================================================

  const enrichedOperators = useMemo(
    () =>
      operatorWiseReport.map((op) => {
        const totalProduction = toNum(op.totalProduction);
        const totalTarget = toNum(op.totalTarget);
        const totalRejected = toNum(op.totalRejected);

        const efficiency =
          op.efficiency !== undefined
            ? toNum(op.efficiency)
            : pct(totalProduction, totalTarget);

        const rejectionRate = pct(totalRejected, totalProduction);

        const rankScore =
          Math.round((efficiency - rejectionRate) * 10) / 10;

        return {
          operatorName: op.operatorName || "Unknown",
          operatorCode: op.operatorCode || "-",
          totalEntries: toNum(op.totalEntries),
          totalTarget,
          totalProduction,
          totalRejected,
          efficiency,
          rejectionRate,
          rankScore,
        };
      }),
    [operatorWiseReport]
  );

  const operatorRanking = useMemo(
    () => [...enrichedOperators].sort((a, b) => b.rankScore - a.rankScore),
    [enrichedOperators]
  );

  const operatorHighlights = useMemo(() => {
    if (enrichedOperators.length === 0) return null;

    const best = operatorRanking[0];

    const highestProduction = [...enrichedOperators].sort(
      (a, b) => b.totalProduction - a.totalProduction
    )[0];

    const lowestRejection = [...enrichedOperators]
      .filter((o) => o.totalProduction > 0)
      .sort((a, b) => a.rejectionRate - b.rejectionRate)[0];

    const highestRejection = [...enrichedOperators].sort(
      (a, b) => b.totalRejected - a.totalRejected
    )[0];

    return { best, highestProduction, lowestRejection, highestRejection };
  }, [enrichedOperators, operatorRanking]);

  const operatorProductionChart = useMemo(
    () =>
      [...enrichedOperators]
        .sort((a, b) => b.totalProduction - a.totalProduction)
        .slice(0, 10)
        .map((o) => ({
          name: o.operatorName,
          Production: o.totalProduction,
          Rejected: o.totalRejected,
        })),
    [enrichedOperators]
  );

  const operatorEfficiencyChart = useMemo(
    () =>
      [...enrichedOperators]
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 10)
        .map((o) => ({
          name: o.operatorName,
          Efficiency: o.efficiency,
        })),
    [enrichedOperators]
  );

  // ============================================================
  // DERIVED: PDIR CHECKING / PACKING OPERATOR ACTIVITY
  // ============================================================

  const pdirOperatorActivity = useMemo(() => {
    const build = (getOperator) => {
      const map = new Map();

      pdirData.forEach((entry) => {
        const opObj = getOperator(entry);
        if (!opObj) return;

        const id = opObj._id || opObj.name || "unknown";
        const name = opObj.name || "Unknown";

        if (!map.has(id)) {
          map.set(id, {
            name,
            entries: 0,
            qtyChecked: 0,
            qtyRejected: 0,
          });
        }

        const row = map.get(id);
        row.entries += 1;
        row.qtyChecked += toNum(entry.qtyChecked);
        row.qtyRejected += toNum(entry.qtyRejected);
      });

      return [...map.values()].sort((a, b) => b.qtyChecked - a.qtyChecked);
    };

    return {
      checking: build((e) => e.checkingOperator),
      packing: build((e) => e.packingOperator),
    };
  }, [pdirData]);

  // ============================================================
  // DERIVED: PDIR / QUALITY ANALYSIS
  // ============================================================

  const pdirTotals = useMemo(() => {
    const totalEntries = pdirData.length;
    const totalQtyChecked =
      summary.totalQtyChecked !== undefined
        ? toNum(summary.totalQtyChecked)
        : pdirData.reduce((sum, e) => sum + toNum(e.qtyChecked), 0);
    const totalQtyRejected =
      summary.pdirRejected !== undefined
        ? toNum(summary.pdirRejected)
        : pdirData.reduce((sum, e) => sum + toNum(e.qtyRejected), 0);
    const rejectionRate = pct(totalQtyRejected, totalQtyChecked);

    return { totalEntries, totalQtyChecked, totalQtyRejected, rejectionRate };
  }, [pdirData, summary]);

  const productionRejectionTotals = useMemo(() => {
    const totalEntries = productionData.filter(
      (e) => toNum(e.rejectedQty) > 0
    ).length;
    const totalProduced = toNum(summary.totalProduction);
    const totalRejected = toNum(summary.productionRejected);
    const rejectionRate = pct(totalRejected, totalProduced);
    return { totalEntries, totalProduced, totalRejected, rejectionRate };
  }, [productionData, summary]);

  const pdirHighlights = useMemo(() => {
    const mostInspected = [...componentWiseDefect].sort(
      (a, b) => toNum(b.totalChecked) - toNum(a.totalChecked)
    )[0];

    const mostDefectivePart = [...componentWiseDefect].sort(
      (a, b) => toNum(b.totalRejected) - toNum(a.totalRejected)
    )[0];

    const mostCommonReason = [...rejectionReasonWise].sort(
      (a, b) => toNum(b.occurrences) - toNum(a.occurrences)
    )[0];

    const highestRejectionQtyReason = [...rejectionReasonWise].sort(
      (a, b) => toNum(b.totalRejected) - toNum(a.totalRejected)
    )[0];

    return {
      mostInspected,
      mostDefectivePart,
      mostCommonReason,
      highestRejectionQtyReason,
    };
  }, [componentWiseDefect, rejectionReasonWise]);

  const productionRejectionHighlights = useMemo(() => {
    const mostDefectivePart = [...componentWiseProductionDefect].sort(
      (a, b) => toNum(b.totalRejected) - toNum(a.totalRejected)
    )[0];

    const mostCommonReason = [...productionRejectionReasonWise].sort(
      (a, b) => toNum(b.occurrences) - toNum(a.occurrences)
    )[0];

    const highestRejectionQtyReason = [...productionRejectionReasonWise].sort(
      (a, b) => toNum(b.totalRejected) - toNum(a.totalRejected)
    )[0];

    return { mostDefectivePart, mostCommonReason, highestRejectionQtyReason };
  }, [componentWiseProductionDefect, productionRejectionReasonWise]);

  const productionDefectByPartChart = useMemo(
    () =>
      [...componentWiseProductionDefect]
        .sort((a, b) => toNum(b.totalRejected) - toNum(a.totalRejected))
        .slice(0, 10)
        .map((c) => ({
          name: c.partNumber || c.partName || c._id || "-",
          Produced: toNum(c.totalProduced),
          Rejected: toNum(c.totalRejected),
        })),
    [componentWiseProductionDefect]
  );

  const pdirByPartChart = useMemo(
    () =>
      [...componentWiseDefect]
        .sort((a, b) => toNum(b.totalRejected) - toNum(a.totalRejected))
        .slice(0, 10)
        .map((c) => ({
          name: c.partNumber || c.partName || c._id || "-",
          Checked: toNum(c.totalChecked),
          Rejected: toNum(c.totalRejected),
        })),
    [componentWiseDefect]
  );

  // ============================================================
  // TAB STYLE
  // ============================================================

  const tabClass = (tab) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
      activeTab === tab
        ? "bg-teal-600 text-white shadow-sm"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Reports &amp; Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Detailed production, operator, component, PDIR and rejection
            analysis
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadProductionCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Download size={17} />
            Download Production CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Printer size={17} />
            Print Report
          </button>
        </div>
      </div>

      {/* GLOBAL SEARCH */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              Global Report Search
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Search across operators, parts, part numbers, machines,
              shifts, operations, grades and rejection reasons
            </p>
          </div>

          {search && (
            <button
              onClick={resetSearch}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600"
            >
              <RotateCcw size={15} />
              Clear Search
            </button>
          )}
        </div>

        <div className="relative mt-5">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search operator, component, part number, machine, shift, operation, grade, rejection reason..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        <button className={tabClass("summary")} onClick={() => setActiveTab("summary")}>
          <BarChart3 size={16} />
          Overview
        </button>
        <button className={tabClass("production")} onClick={() => setActiveTab("production")}>
          <Factory size={16} />
          Production
        </button>
        <button className={tabClass("parts")} onClick={() => setActiveTab("parts")}>
          <Package size={16} />
          Part Wise
        </button>
        <button className={tabClass("operators")} onClick={() => setActiveTab("operators")}>
          <Users size={16} />
          Operator Wise
        </button>
        <button className={tabClass("pdir")} onClick={() => setActiveTab("pdir")}>
          <ClipboardCheck size={16} />
          PDIR / Quality
        </button>
        <button className={tabClass("rejection")} onClick={() => setActiveTab("rejection")}>
          <AlertTriangle size={16} />
          Component Rejection
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          Loading report data...
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-700">
              Unable to load report data
            </p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ==================== OVERVIEW TAB ==================== */}
      {!loading && !error && activeTab === "summary" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard icon={Factory} title="Total Production Entries" value={overviewKpis.totalEntries} />
            <KpiCard icon={Target} title="Total Target Production" value={overviewKpis.totalTarget} />
            <KpiCard icon={CheckCircle2} title="Total Actual Production" value={overviewKpis.totalProduction} good />
            <KpiCard icon={TrendingUp} title="Production Efficiency" value={`${overviewKpis.productionEfficiency}%`} good={overviewKpis.productionEfficiency >= 85} />
          </div>

          {/* PRODUCTION REJECTION vs PDIR REJECTION — always shown as two visually distinct groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-orange-100 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wrench size={16} className="text-orange-500" />
                <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wide">
                  Production Rejection (machining stage)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard icon={AlertTriangle} title="Qty Rejected" value={overviewKpis.productionRejected} danger compact />
                <KpiCard icon={TrendingDown} title="Rejection Rate" value={`${overviewKpis.productionRejectionRate}%`} danger={overviewKpis.productionRejectionRate > 5} compact />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Rejected ÷ Actual Production — pieces scrapped on the machine before inspection.
              </p>
            </div>

            <div className="bg-white border-2 border-red-100 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert size={16} className="text-red-500" />
                <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide">
                  PDIR Rejection (quality inspection stage)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard icon={ClipboardCheck} title="Qty Checked" value={overviewKpis.totalQtyChecked} compact />
                <KpiCard icon={AlertTriangle} title="Qty Rejected" value={overviewKpis.pdirRejected} danger compact />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Rejected ÷ Qty Checked — pieces rejected during post-production dispatch inspection. Rate: {overviewKpis.pdirRejectionRate}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MONTHLY CHART */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Monthly Production Performance
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Target vs actual production vs production rejection, by month
              </p>

              {monthlyChartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="targetProduction" name="Target" fill="#94a3b8" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="actualProduction" name="Production" fill="#0d9488" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="rejectedQty" name="Production Rejection" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No monthly production data found." />
              )}
            </div>

            {/* QUALITY DONUT (PDIR) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800">
                PDIR Quality Performance
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Accepted vs rejected quantity at inspection
              </p>

              {pdirQualityDonutData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pdirQualityDonutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        <Cell fill="#0d9488" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No PDIR quality data found." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRODUCTION TAB ==================== */}
      {!loading && !error && activeTab === "production" && (
        <ReportTable
          title="Detailed Production Report"
          headers={["Date", "Operator", "Component", "Part No", "Machine", "Shift", "Operation", "Target", "Actual", "Rejected", "Rejection Reasons", "Grade", ""]}
          isEmpty={productionData.length === 0}
        >
          {productionData.map((entry) => (
            <tr
              key={entry._id}
              className="border-t hover:bg-gray-50 cursor-pointer"
              onClick={() => openProductionDetail(entry)}
            >
              <TD>{fmtDate(entry.date)}</TD>
              <TD>{entry.operator?.name || "-"}</TD>
              <TD>{entry.component?.componentName || "-"}</TD>
              <TD>{entry.component?.partNumber || "-"}</TD>
              <TD>{entry.machine?.machineName || "-"}</TD>
              <TD>{entry.shift || "-"}</TD>
              <TD>{entry.operationNo || "-"}</TD>
              <TD>{entry.targetProduction || 0}</TD>
              <TD>{entry.actualProduction || 0}</TD>
              <TD danger>{entry.rejectedQty || 0}</TD>
              <TD>
                {Array.isArray(entry.rejections) && entry.rejections.length > 0 ? (
                  <div className="space-y-1">
                    {entry.rejections.map((r, index) => (
                      <div key={index} className="text-xs">
                        <span className="font-medium">{r.reason}</span>
                        <span className="text-red-600 ml-1">
                          ({reasonQty(r)})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  entry.rejectionReason || "-"
                )}
              </TD>
              <TD>
                <span
                  style={{
                    backgroundColor: gradeColors[entry.grade]?.bg || "#f3f4f6",
                    color: gradeColors[entry.grade]?.text || "#374151",
                  }}
                  className="px-2 py-1 rounded-full text-xs font-semibold"
                >
                  Grade {entry.grade || "D"}
                </span>
              </TD>
              <TD>
                <RowViewButton onClick={() => openProductionDetail(entry)} />
              </TD>
            </tr>
          ))}
        </ReportTable>
      )}

      {/* ==================== PART WISE TAB ==================== */}
      {!loading && !error && activeTab === "parts" && (
        <div className="space-y-6">
          {partHighlights ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <HighlightCard
                icon={Trophy}
                label="Most Produced Part"
                name={partHighlights.mostProduced.partName}
                sub={partHighlights.mostProduced.partNumber}
                value={`${partHighlights.mostProduced.totalProduction} pcs`}
                tone="teal"
                onClick={() => setSelectedPart(partHighlights.mostProduced)}
              />
              <HighlightCard
                icon={Award}
                label="Best Performing Part"
                name={partHighlights.best?.partName}
                sub={partHighlights.best?.partNumber}
                value={`${partHighlights.best?.efficiency ?? 0}% eff.`}
                tone="green"
                onClick={() => partHighlights.best && setSelectedPart(partHighlights.best)}
              />
              <HighlightCard
                icon={Wrench}
                label="Most Production Rejects"
                name={partHighlights.mostDefectiveProduction?.partName}
                sub={partHighlights.mostDefectiveProduction?.partNumber}
                value={`${partHighlights.mostDefectiveProduction?.productionRejected ?? 0} rejected`}
                tone="orange"
                onClick={() => partHighlights.mostDefectiveProduction && setSelectedPart(partHighlights.mostDefectiveProduction)}
              />
              <HighlightCard
                icon={ShieldAlert}
                label="Most PDIR Rejects"
                name={partHighlights.mostDefectivePdir?.partName}
                sub={partHighlights.mostDefectivePdir?.partNumber}
                value={`${partHighlights.mostDefectivePdir?.pdirRejected ?? 0} rejected`}
                tone="red"
                onClick={() => partHighlights.mostDefectivePdir && setSelectedPart(partHighlights.mostDefectivePdir)}
              />
            </div>
          ) : (
            <EmptyState message="No part-wise data found." />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Production Quantity by Part" subtitle="Top 10 parts — production output vs production-stage rejects">
              {partProductionChart.length > 0 ? (
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={partProductionChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="28%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => truncateLabel(v, 9)}
                        height={34}
                      />
                      <YAxis tick={{ fontSize: 11 }} width={36} />
                      <Tooltip
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Production" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={26} />
                      <Bar dataKey="Production Rejected" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No part production data found." />
              )}
            </ChartCard>

            <ChartCard title="Part-wise PDIR Rejection Rate" subtitle="Top 10 parts by PDIR rejection rate (Rejected ÷ Checked)">
              {partRejectionRateChart.length > 0 ? (
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={partRejectionRateChart}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
                      barCategoryGap="26%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, "dataMax"]} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={78}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => truncateLabel(v, 10)}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(value, key) => {
                          if (key === "PDIR Rejection Rate") return [`${value}%`, "PDIR Rejection Rate"];
                          return [value, key];
                        }}
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload;
                          return row ? `${row.fullName} — Checked ${row.checked} / Rejected ${row.rejected}` : "";
                        }}
                      />
                      <Bar dataKey="PDIR Rejection Rate" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No PDIR rejection rate data found." />
              )}
            </ChartCard>
          </div>

          <ReportTable
            title="Most Defective Parts — Production Rejection (Ranked by Rate)"
            headers={["Rank", "Part Name", "Part Number", "Produced", "Rejected", "Rejection Rate", "Main Reason", ""]}
            isEmpty={rankedProductionDefectiveParts.length === 0}
          >
            {rankedProductionDefectiveParts.map((p, index) => (
              <tr
                key={`prod-${p.partNumber}-${index}`}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedPart(p)}
              >
                <TD>#{index + 1}</TD>
                <TD>{p.partName}</TD>
                <TD>{p.partNumber}</TD>
                <TD>{p.totalProduction}</TD>
                <TD danger>{p.productionRejected}</TD>
                <TD danger>{p.productionRejectionRate}%</TD>
                <TD>{p.productionMainReason || "-"}</TD>
                <TD><RowViewButton onClick={() => setSelectedPart(p)} /></TD>
              </tr>
            ))}
          </ReportTable>

          <ReportTable
            title="Most Defective Parts — PDIR Rejection (Ranked by Rate)"
            headers={["Rank", "Part Name", "Part Number", "Checked", "Rejected", "Rejection Rate", "Main Reason", ""]}
            isEmpty={rankedPdirDefectiveParts.length === 0}
          >
            {rankedPdirDefectiveParts.map((p, index) => (
              <tr
                key={`pdir-${p.partNumber}-${index}`}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedPart(p)}
              >
                <TD>#{index + 1}</TD>
                <TD>{p.partName}</TD>
                <TD>{p.partNumber}</TD>
                <TD>{p.totalChecked}</TD>
                <TD danger>{p.pdirRejected}</TD>
                <TD danger>{p.pdirRejectionRate}%</TD>
                <TD>{p.pdirMainReason || "-"}</TD>
                <TD><RowViewButton onClick={() => setSelectedPart(p)} /></TD>
              </tr>
            ))}
          </ReportTable>

          <ReportTable
            title="Part Analysis — Full Detail"
            headers={["Part Name", "Part No", "Produced", "Prod. Rejected", "Checked", "PDIR Rejected", "Action"]}
            isEmpty={enrichedParts.length === 0}
          >
            {enrichedParts.map((p, index) => (
              <tr
                key={`${p.partNumber}-${index}`}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedPart(p)}
              >
                <TD>{p.partName}</TD>
                <TD>{p.partNumber}</TD>
                <TD>{p.totalProduction}</TD>
                <TD danger>{p.productionRejected}</TD>
                <TD>{p.totalChecked}</TD>
                <TD danger>{p.pdirRejected}</TD>
                <TD><RowViewButton onClick={() => setSelectedPart(p)} label="View Details" /></TD>
              </tr>
            ))}
          </ReportTable>
        </div>
      )}

      {/* PART DETAIL MODAL */}
      {selectedPart && (
        <PartDetailModal part={selectedPart} onClose={() => setSelectedPart(null)} />
      )}

      {/* ==================== OPERATOR WISE TAB ==================== */}
      {!loading && !error && activeTab === "operators" && (
        <div className="space-y-6">
          {operatorHighlights ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <HighlightCard
                icon={Award}
                label="Best Performing Operator"
                name={operatorHighlights.best?.operatorName}
                sub={`Score ${operatorHighlights.best?.rankScore}`}
                value={`${operatorHighlights.best?.efficiency}% eff.`}
                tone="green"
                onClick={() => operatorHighlights.best && openOperatorDetail(operatorHighlights.best)}
              />
              <HighlightCard
                icon={Trophy}
                label="Highest Production Operator"
                name={operatorHighlights.highestProduction?.operatorName}
                sub="by actual production"
                value={`${operatorHighlights.highestProduction?.totalProduction} pcs`}
                tone="teal"
                onClick={() => operatorHighlights.highestProduction && openOperatorDetail(operatorHighlights.highestProduction)}
              />
              <HighlightCard
                icon={CheckCircle2}
                label="Lowest Rejection Operator"
                name={operatorHighlights.lowestRejection?.operatorName}
                sub="by rejection rate"
                value={`${operatorHighlights.lowestRejection?.rejectionRate ?? 0}%`}
                tone="green"
                onClick={() => operatorHighlights.lowestRejection && openOperatorDetail(operatorHighlights.lowestRejection)}
              />
              <HighlightCard
                icon={AlertTriangle}
                label="Highest Rejection Operator"
                name={operatorHighlights.highestRejection?.operatorName}
                sub="by rejected quantity"
                value={`${operatorHighlights.highestRejection?.totalRejected} rejected`}
                tone="red"
                onClick={() => operatorHighlights.highestRejection && openOperatorDetail(operatorHighlights.highestRejection)}
              />
            </div>
          ) : (
            <EmptyState message="No operator-wise data found." />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Operator-wise Production &amp; Rejection" subtitle="Top 10 operators by production">
              {operatorProductionChart.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operatorProductionChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Production" fill="#0d9488" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="Rejected" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No operator production data found." />
              )}
            </ChartCard>

            <ChartCard title="Operator Efficiency Comparison" subtitle="Top 10 operators by efficiency %">
              {operatorEfficiencyChart.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operatorEfficiencyChart} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" unit="%" />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="Efficiency" fill="#0d9488" radius={[0, 5, 5, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No operator efficiency data found." />
              )}
            </ChartCard>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Info size={15} className="shrink-0 mt-0.5" />
              <p>
                Ranking score = Production Efficiency % − Production Rejection Rate %.
                Production volume is shown for reference but is not part of
                the score, so an operator is never ranked "best" for
                production quantity alone. This does not include PDIR
                rejections, since those are not attributable to a single
                production operator.
              </p>
            </div>
          </div>

          <ReportTable
            title="Operator Performance Ranking"
            headers={["Rank", "Operator", "Operator ID", "Entries", "Target", "Production", "Prod. Rejected", "Efficiency", "Rejection Rate", "Score", ""]}
            isEmpty={operatorRanking.length === 0}
          >
            {operatorRanking.map((op, index) => (
              <tr
                key={`${op.operatorCode}-${index}`}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => openOperatorDetail(op)}
              >
                <TD>#{index + 1}</TD>
                <TD>{op.operatorName}</TD>
                <TD>{op.operatorCode}</TD>
                <TD>{op.totalEntries}</TD>
                <TD>{op.totalTarget}</TD>
                <TD>{op.totalProduction}</TD>
                <TD danger>{op.totalRejected}</TD>
                <TD>{op.efficiency}%</TD>
                <TD danger>{op.rejectionRate}%</TD>
                <TD>{op.rankScore}</TD>
                <TD><RowViewButton onClick={() => openOperatorDetail(op)} /></TD>
              </tr>
            ))}
          </ReportTable>

          {/* PDIR CHECKING / PACKING OPERATOR ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportTable
              title="PDIR Checking Operator Activity"
              headers={["Checking Operator", "Inspections Handled", "Qty Checked", "Qty Rejected (during inspection)"]}
              isEmpty={pdirOperatorActivity.checking.length === 0}
            >
              {pdirOperatorActivity.checking.map((o, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <TD>{o.name}</TD>
                  <TD>{o.entries}</TD>
                  <TD>{o.qtyChecked}</TD>
                  <TD danger>{o.qtyRejected}</TD>
                </tr>
              ))}
            </ReportTable>

            <ReportTable
              title="PDIR Packing Operator Activity"
              headers={["Packing Operator", "Batches Handled", "Qty Handled"]}
              isEmpty={pdirOperatorActivity.packing.length === 0}
            >
              {pdirOperatorActivity.packing.map((o, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <TD>{o.name}</TD>
                  <TD>{o.entries}</TD>
                  <TD>{o.qtyChecked}</TD>
                </tr>
              ))}
            </ReportTable>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-amber-800">
              Checking and packing operator activity reflects the quantity
              each operator handled during PDIR, not fault or responsibility
              for a rejection. Rejected quantity is only attributed to an
              operator here as an activity total, not a blame assignment.
            </p>
          </div>
        </div>
      )}

      {/* ==================== PDIR / QUALITY TAB ==================== */}
      {!loading && !error && activeTab === "pdir" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleDownloadPdirCSV}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Download size={14} />
              Download PDIR CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard icon={ClipboardCheck} title="Total PDIR Entries" value={pdirTotals.totalEntries} />
            <KpiCard icon={Package} title="Total Quantity Checked" value={pdirTotals.totalQtyChecked} />
            <KpiCard icon={AlertTriangle} title="Total Quantity Rejected" value={pdirTotals.totalQtyRejected} danger />
            <KpiCard icon={TrendingDown} title="Overall PDIR Rejection Rate" value={`${pdirTotals.rejectionRate}%`} danger={pdirTotals.rejectionRate > 5} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <HighlightCard
              icon={Package}
              label="Most Inspected Part"
              name={pdirHighlights.mostInspected?.partName || pdirHighlights.mostInspected?._id}
              sub={pdirHighlights.mostInspected?.partNumber}
              value={`${pdirHighlights.mostInspected?.totalChecked ?? 0} checked`}
              tone="teal"
              onClick={() => pdirHighlights.mostInspected && openComponentPdirDetail(pdirHighlights.mostInspected)}
            />
            <HighlightCard
              icon={AlertTriangle}
              label="Most Defective Part"
              name={pdirHighlights.mostDefectivePart?.partName || pdirHighlights.mostDefectivePart?._id}
              sub={pdirHighlights.mostDefectivePart?.partNumber}
              value={`${pdirHighlights.mostDefectivePart?.totalRejected ?? 0} rejected`}
              tone="red"
              onClick={() => pdirHighlights.mostDefectivePart && openComponentPdirDetail(pdirHighlights.mostDefectivePart)}
            />
            <HighlightCard
              icon={ShieldAlert}
              label="Most Common Rejection Reason"
              name={pdirHighlights.mostCommonReason?.rejectionReason || pdirHighlights.mostCommonReason?._id}
              sub="by occurrences"
              value={`${pdirHighlights.mostCommonReason?.occurrences ?? 0}x`}
              tone="red"
              onClick={() => pdirHighlights.mostCommonReason && openReasonDetail("PDIR", pdirHighlights.mostCommonReason)}
            />
            <HighlightCard
              icon={TrendingDown}
              label="Highest Rejection Qty Reason"
              name={pdirHighlights.highestRejectionQtyReason?.rejectionReason || pdirHighlights.highestRejectionQtyReason?._id}
              sub="by total rejected qty"
              value={`${pdirHighlights.highestRejectionQtyReason?.totalRejected ?? 0}`}
              tone="red"
              onClick={() => pdirHighlights.highestRejectionQtyReason && openReasonDetail("PDIR", pdirHighlights.highestRejectionQtyReason)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="PDIR: Quantity Checked vs Rejected by Part" subtitle="Top 10 parts by rejected quantity">
              {pdirByPartChart.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pdirByPartChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Checked" fill="#0d9488" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="Rejected" fill="#ef4444" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No PDIR part data found." />
              )}
            </ChartCard>

            <ChartCard title="PDIR Rejection Reason Distribution" subtitle="Share of rejected quantity by reason">
              {rejectionReasonWise.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rejectionReasonWise} dataKey="totalRejected" nameKey="rejectionReason" outerRadius={100}>
                        {rejectionReasonWise.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No rejection reason data found." />
              )}
            </ChartCard>
          </div>

          <ReportTable
            title="Detailed PDIR Report"
            headers={["Date", "Part", "Part Number", "Production Reference", "Checking Operator", "Packing Operator", "Qty Checked", "Qty Rejected", "Rejection Reason", "Remarks", ""]}
            isEmpty={pdirData.length === 0}
          >
            {pdirData.map((entry) => {
              const production = entry.productionBatch || entry.production;
              return (
                <tr
                  key={entry._id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => openPdirDetail(entry)}
                >
                  <TD>{fmtDate(entry.createdAt)}</TD>
                  <TD>{entry.partName || "-"}</TD>
                  <TD>{entry.partNumber || "-"}</TD>
                  <TD>{production?.operationNo || production?._id || "-"}</TD>
                  <TD>{entry.checkingOperator?.name || "-"}</TD>
                  <TD>{entry.packingOperator?.name || "-"}</TD>
                  <TD>{entry.qtyChecked || 0}</TD>
                  <TD danger>{entry.qtyRejected || 0}</TD>
                  <TD>{entry.rejectionReason || "Unspecified"}</TD>
                  <TD>{entry.remarks || "-"}</TD>
                  <TD><RowViewButton onClick={() => openPdirDetail(entry)} /></TD>
                </tr>
              );
            })}
          </ReportTable>
        </div>
      )}

      {/* ==================== COMPONENT REJECTION TAB ==================== */}
      {!loading && !error && activeTab === "rejection" && (
        <div className="space-y-8">
          {/* ---------- COMPONENT REJECTION SEARCH (client-side, this tab only) ---------- */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm">
                  Filter Component Rejection Data
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Filters the tables below by component name, part number, or
                  rejection reason. This is a local filter on already-loaded
                  data — full date/shift/operator/machine filtering is
                  planned server-side for high-volume days.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadComponentRejectionCSV}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm whitespace-nowrap"
                >
                  <Download size={14} />
                  Download CSV
                </button>
                {componentRejectionSearch && (
                  <button
                    onClick={() => setComponentRejectionSearch("")}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-teal-600 whitespace-nowrap"
                  >
                    <RotateCcw size={13} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="relative mt-4">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={componentRejectionSearch}
                onChange={(e) => setComponentRejectionSearch(e.target.value)}
                placeholder="Search component, part number, or rejection reason..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* ---------- COMPONENT / PRODUCTION REJECTION SECTION ---------- */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b-2 border-orange-200 pb-3">
              <Wrench size={18} className="text-orange-500" />
              <h2 className="text-lg font-bold text-orange-700">
                Component Rejection Analysis
              </h2>
              <span className="text-xs text-gray-400 font-normal">
                (scrapped during machining — logged directly on each production entry)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <KpiCard icon={AlertTriangle} title="Total Component Rejected" value={productionRejectionTotals.totalRejected} danger />
              <KpiCard icon={TrendingDown} title="Component Rejection Rate" value={`${productionRejectionTotals.rejectionRate}%`} danger={productionRejectionTotals.rejectionRate > 5} />
              <KpiCard icon={Package} title="Most Rejected Part" value={productionRejectionHighlights.mostDefectivePart?.partName || "-"} />
              <KpiCard icon={ShieldAlert} title="Most Common Reason" value={productionRejectionHighlights.mostCommonReason?.rejectionReason || "-"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Component Rejection Reason Distribution" subtitle="Share of rejected quantity by reason (machining stage) — overall, not affected by search above">
                {productionRejectionReasonWise.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={productionRejectionReasonWise} dataKey="totalRejected" nameKey="rejectionReason" outerRadius={90}>
                          {productionRejectionReasonWise.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No production rejection reason data found." />
                )}
              </ChartCard>

              <ChartCard title="Top Rejected Parts — Component Stage" subtitle="Ranked by total rejected quantity — overall, not affected by search above">
                {productionDefectByPartChart.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionDefectByPartChart} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="Rejected" fill="#f59e0b" radius={[0, 5, 5, 0]}>
                          <LabelList dataKey="Rejected" position="right" style={{ fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="No production defect data found." />
                )}
              </ChartCard>
            </div>

            <ReportTable
              title="Component-wise Rejection Report (Multi-Reason)"
              headers={["Component", "Part No", "Produced", "Rejected", "Rejection Rate", "Reasons Breakdown", ""]}
              isEmpty={filteredComponentWiseProductionDefect.length === 0}
            >
              {filteredComponentWiseProductionDefect
                .slice()
                .sort((a, b) => toNum(b.totalRejected) - toNum(a.totalRejected))
                .map((item, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => openComponentProductionDetail(item)}
                  >
                    <TD>{item.partName || "Unknown"}</TD>
                    <TD>{item.partNumber || "-"}</TD>
                    <TD>{item.totalProduced || 0}</TD>
                    <TD danger>{item.totalRejected || 0}</TD>
                    <TD danger>{item.rejectionRate !== undefined ? `${item.rejectionRate}%` : "-"}</TD>
                    <TD>
                      {Array.isArray(item.reasons) && item.reasons.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.reasons.map((r, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-orange-200"
                            >
                              {r.reason}
                              <span className="text-orange-500">({reasonQty(r)})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Single-reason record (backend breakdown pending)
                        </span>
                      )}
                    </TD>
                    <TD><RowViewButton onClick={() => openComponentProductionDetail(item)} /></TD>
                  </tr>
                ))}
            </ReportTable>

            <ReportTable
              title="Rejection Reason Details (Component)"
              headers={["Rejection Reason", "Occurrences", "Rejected Quantity", ""]}
              isEmpty={filteredProductionRejectionReasonWise.length === 0}
            >
              {filteredProductionRejectionReasonWise.map((item, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => openReasonDetail("Production", item)}
                >
                  <TD>{item.rejectionReason || item._id || "Unspecified"}</TD>
                  <TD>{item.occurrences || 0}</TD>
                  <TD danger>{item.totalRejected || 0}</TD>
                  <TD><RowViewButton onClick={() => openReasonDetail("Production", item)} /></TD>
                </tr>
              ))}
            </ReportTable>

            <ReportTable
              title="Highest Defect Reason per Component"
              headers={["Component", "Part Number", "Highest Reason", "Rejected Quantity"]}
              isEmpty={filteredHighestProductionDefectReason.length === 0}
            >
              {filteredHighestProductionDefectReason.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <TD>{item._id?.partName || "-"}</TD>
                  <TD>{item._id?.partNumber || "-"}</TD>
                  <TD>{item._id?.rejectionReason || "-"}</TD>
                  <TD danger>{item.totalRejected || 0}</TD>
                </tr>
              ))}
            </ReportTable>
          </div>

          {/*
            PDIR rejection is intentionally NOT rendered in this tab.
            It stays exclusively in the "PDIR / Quality" tab above —
            componentWiseDefect, rejectionReasonWise, and
            highestDefectReason are still fetched and available in
            state, just not displayed here, per the split between
            "Component Rejection" (machining stage) and
            "PDIR / Quality" (inspection stage).
          */}
        </div>
      )}

      {/* GENERIC ROW DETAIL MODAL */}
      {detailRecord && (
        <RowDetailModal record={detailRecord} onClose={closeDetail} />
      )}
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================

function KpiCard({ icon: Icon, title, value, danger = false, good = false, compact = false }) {
  const accent = danger ? "text-red-600" : good ? "text-green-600" : "text-gray-800";
  const iconBg = danger ? "bg-red-50 text-red-500" : good ? "bg-green-50 text-green-600" : "bg-teal-50 text-teal-600";

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
          {title}
        </p>
        {Icon && (
          <span className={`p-1.5 rounded-lg ${iconBg}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className={`${compact ? "text-xl" : "text-2xl"} font-bold mt-2 ${accent}`}>{value}</p>
    </div>
  );
}

// ============================================================
// HIGHLIGHT CARD (best/worst callouts)
// ============================================================

function HighlightCard({ icon: Icon, label, name, sub, value, tone = "teal", onClick }) {
  const toneMap = {
    teal: { bg: "bg-teal-50", text: "text-teal-700", icon: "text-teal-600" },
    green: { bg: "bg-green-50", text: "text-green-700", icon: "text-green-600" },
    red: { bg: "bg-red-50", text: "text-red-700", icon: "text-red-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-600" },
  };
  const t = toneMap[tone] || toneMap.teal;
  const clickable = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-gray-200 shadow-sm p-5 ${t.bg} ${
        clickable ? "cursor-pointer hover:shadow-md hover:border-gray-300 transition" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className={t.icon} />}
        <p className="text-xs uppercase tracking-wide font-semibold text-gray-600">
          {label}
        </p>
      </div>
      <p className={`text-base font-bold mt-2 ${t.text}`}>{name || "-"}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      <p className="text-sm font-semibold text-gray-800 mt-2">{value}</p>
    </div>
  );
}

// ============================================================
// ROW VIEW BUTTON (small "eye" affordance inside table rows)
// ============================================================

function RowViewButton({ onClick, label = "View" }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium text-sm"
    >
      <Eye size={14} />
      {label}
    </button>
  );
}

// ============================================================
// GENERIC ROW DETAIL MODAL
// Used for Production entries, PDIR entries, Operators, Components,
// and Rejection Reasons. Takes { title, sections: [{ heading, danger, rows: [[label, value], ...] }] }
// ============================================================

function RowDetailModal({ record, onClose }) {
  if (!record) return null;
  const { title, sections = [] } = record;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${
                section.danger ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
                {section.heading}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {section.rows.map(([label, value], j) => (
                  <div key={j} className="flex justify-between sm:block">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-sm font-semibold ${section.danger ? "text-red-700" : "text-gray-800"}`}>
                      {value === undefined || value === null || value === "" ? "-" : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PART DETAIL MODAL
// Shows production rejection and PDIR rejection as two clearly
// separated panels — never merged into one number or one list.
// ============================================================

function PartDetailModal({ part, onClose }) {
  if (!part) return null;

  const productionReasons = Array.isArray(part.productionReasons) ? part.productionReasons : [];
  const pdirReasons = Array.isArray(part.pdirReasons) ? part.pdirReasons : [];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{part.partName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{part.partNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* PART OVERVIEW */}
          <div>
            <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
              Overview
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ModalStat label="Total Produced" value={part.totalProduction ?? 0} />
              <ModalStat label="Efficiency" value={`${part.efficiency ?? 0}%`} />
              <ModalStat label="Total Checked (PDIR)" value={part.totalChecked ?? 0} />
              <ModalStat label="Combined Rejected" value={part.combinedRejected ?? 0} danger />
            </div>
          </div>

          {/* TWO SEPARATE PANELS: PRODUCTION vs PDIR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PRODUCTION REJECTION PANEL */}
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={15} className="text-orange-600" />
                <p className="text-xs uppercase tracking-wide font-semibold text-orange-700">
                  Production Rejection
                </p>
              </div>
              <p className="text-2xl font-bold text-orange-800">{part.productionRejected ?? 0}</p>
              <p className="text-xs text-orange-700 mt-0.5">
                {part.productionRejectionRate ?? 0}% of {part.totalProduction ?? 0} produced
              </p>

              {productionReasons.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {productionReasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white/70 rounded px-2 py-1.5">
                      <span className="text-gray-700 font-medium">{r.reason}</span>
                      <span className="text-orange-700 font-semibold">{r.qty} ({r.percentage}%)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-orange-700 mt-3">No production rejection records for this part.</p>
              )}
            </div>

            {/* PDIR REJECTION PANEL */}
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={15} className="text-red-600" />
                <p className="text-xs uppercase tracking-wide font-semibold text-red-700">
                  PDIR Rejection
                </p>
              </div>
              <p className="text-2xl font-bold text-red-800">{part.pdirRejected ?? 0}</p>
              <p className="text-xs text-red-700 mt-0.5">
                {part.pdirRejectionRate ?? 0}% of {part.totalChecked ?? 0} checked
              </p>

              {pdirReasons.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {pdirReasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white/70 rounded px-2 py-1.5">
                      <span className="text-gray-700 font-medium">{r.reason}</span>
                      <span className="text-red-700 font-semibold">{r.qty} ({r.percentage}%)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-700 mt-3">No PDIR rejection records for this part.</p>
              )}
            </div>
          </div>

          {/* COMPARISON CHART */}
          {(productionReasons.length > 0 || pdirReasons.length > 0) && (
            <div>
              <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
                Rejection Reasons — Production vs PDIR
              </h4>
              <div style={{ height: Math.max((productionReasons.length + pdirReasons.length) * 26, 140) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      ...productionReasons.map((r) => ({ name: truncateLabel(`[Prod] ${r.reason}`, 20), qty: r.qty, fill: "#f59e0b" })),
                      ...pdirReasons.map((r) => ({ name: truncateLabel(`[PDIR] ${r.reason}`, 20), qty: r.qty, fill: "#ef4444" })),
                    ]}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="qty" radius={[0, 4, 4, 0]} maxBarSize={16}>
                      {[...productionReasons, ...pdirReasons].map((_, i) => (
                        <Cell key={i} fill={i < productionReasons.length ? "#f59e0b" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalStat({ label, value, danger = false }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${danger ? "text-red-600" : "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}

// ============================================================
// CHART CARD WRAPPER
// ============================================================

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ============================================================
// REPORT TABLE
// ============================================================

function ReportTable({ title, headers, children, isEmpty = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={`${header}-${i}`}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!isEmpty && children}
            {isEmpty && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-gray-500">
                  No report data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// TABLE CELL
// ============================================================

function TD({ children, danger = false }) {
  return (
    <td className={`px-4 py-3 text-sm whitespace-nowrap ${danger ? "text-red-600 font-semibold" : "text-gray-700"}`}>
      {children}
    </td>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ message }) {
  return <div className="py-16 text-center text-sm text-gray-500">{message}</div>;
}