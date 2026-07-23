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
  // RAW DATA (from existing /reports response - unchanged shape)
  // ============================================================

  const summary = reportData?.summary || {};
  const productionData = reportData?.productions || [];
  const pdirData = reportData?.pdirDetailedReport || reportData?.pdir || [];
  const componentWiseDefect = reportData?.componentWiseDefect || [];
  const rejectionReasonWise = reportData?.rejectionReasonWise || [];
  const highestDefectReason = reportData?.highestDefectReason || [];
  const partWiseReport = reportData?.partWiseReport || [];
  const operatorWiseReport = reportData?.operatorWiseReport || [];
  const monthlyChart = reportData?.monthlyChart || [];
  // Pre-merged, correctly-keyed Production + PDIR data per part,
  // returned by the backend (see reportService.js -> partAnalysis).
  const partAnalysis = reportData?.partAnalysis || [];

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
  // DERIVED: OVERVIEW KPIs
  // ============================================================

  const overviewKpis = useMemo(() => {
    const totalEntries = toNum(summary.totalEntries);
    const totalTarget = toNum(summary.totalTarget);
    const totalProduction = toNum(summary.totalProduction);
    const productionRejected = toNum(summary.productionRejected);
    const totalQtyChecked = toNum(summary.totalQtyChecked);
    const pdirRejected = toNum(summary.pdirRejected);

    const productionEfficiency = pct(totalProduction, totalTarget);
    const pdirRejectionRate =
      summary.rejectionRate !== undefined
        ? toNum(summary.rejectionRate)
        : pct(pdirRejected, totalQtyChecked);

    return {
      totalEntries,
      totalTarget,
      totalProduction,
      productionRejected,
      totalQtyChecked,
      pdirRejected,
      productionEfficiency,
      pdirRejectionRate,
    };
  }, [summary]);

  const qualityDonutData = useMemo(() => {
    const good = Math.max(
      overviewKpis.totalQtyChecked - overviewKpis.pdirRejected,
      0
    );
    if (!overviewKpis.totalQtyChecked) return [];
    return [
      { name: "Accepted", value: good },
      { name: "Rejected", value: overviewKpis.pdirRejected },
    ];
  }, [overviewKpis]);

  // ============================================================
  // DERIVED: PART-WISE ANALYSIS
  // Built entirely from the backend's `partAnalysis` field, which
  // already joins Production + PDIR by Component ObjectId (falling
  // back to part number / part name only when no ObjectId link
  // exists). No re-matching happens on the frontend, so there is
  // no risk of the wrong PDIR bucket getting matched to the wrong
  // part and producing an inflated rejection rate.
  // ============================================================

  const enrichedParts = useMemo(
    () =>
      partAnalysis.map((p) => ({
        partName: p.partName || "Unknown",
        partNumber: p.partNumber || "-",
        totalEntries: toNum(p.totalEntries),
        totalTarget: toNum(p.totalTarget),
        totalProduction: toNum(p.totalProduction),
        efficiency: toNum(p.efficiency),

        totalChecked: toNum(p.totalChecked),
        totalRejected: toNum(p.totalRejected),
        // Rejection Rate = Rejected / Checked, exactly as returned by
        // the backend. 0 checked -> 0%, never divided by production.
        rejectionRate: toNum(p.rejectionRate),
        pdirEntries: toNum(p.pdirEntries),

        mainDefectReason: p.mainRejectionReason || null,
        mainDefectQty: toNum(p.mainRejectionQty),
        mainDefectPercentage: toNum(p.mainRejectionPercentage),

        reasons: Array.isArray(p.reasons) ? p.reasons : [],
      })),
    [partAnalysis]
  );

  const partHighlights = useMemo(() => {
    if (enrichedParts.length === 0) return null;

    const mostProduced = [...enrichedParts].sort(
      (a, b) => b.totalProduction - a.totalProduction
    )[0];

    const mostDefective = [...enrichedParts]
      .filter((p) => p.totalRejected > 0)
      .sort((a, b) => b.totalRejected - a.totalRejected)[0];

    // Only parts with a valid checked quantity are eligible, so a
    // part with 0 inspections can never appear as "highest rate".
    const highestRejectionRate = [...enrichedParts]
      .filter((p) => p.totalChecked > 0)
      .sort((a, b) => b.rejectionRate - a.rejectionRate)[0];

    // Best performing = high efficiency + low rejection rate,
    // simple transparent composite score.
    const best = [...enrichedParts]
      .filter((p) => p.totalProduction > 0)
      .sort((a, b) => {
        const scoreA = a.efficiency - a.rejectionRate;
        const scoreB = b.efficiency - b.rejectionRate;
        return scoreB - scoreA;
      })[0];

    return { mostProduced, mostDefective, highestRejectionRate, best };
  }, [enrichedParts]);

  // Ranked "Most Defective Parts" — primarily by Rejection Rate %,
  // restricted to parts with a valid (non-zero) checked quantity so
  // the ranking is never skewed by a part with no inspections.
  const rankedDefectiveParts = useMemo(
    () =>
      [...enrichedParts]
        .filter((p) => p.totalChecked > 0)
        .sort((a, b) => b.rejectionRate - a.rejectionRate),
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
          Rejected: p.totalRejected,
        })),
    [enrichedParts]
  );

  const partRejectionRateChart = useMemo(
    () =>
      [...enrichedParts]
        .filter((p) => p.totalChecked > 0)
        .sort((a, b) => b.rejectionRate - a.rejectionRate)
        .slice(0, 10)
        .map((p) => ({
          fullName: `${p.partName} (${p.partNumber})`,
          name: p.partNumber !== "-" ? p.partNumber : p.partName,
          partNumber: p.partNumber,
          checked: p.totalChecked,
          rejected: p.totalRejected,
          "Rejection Rate": p.rejectionRate,
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

        // Transparent composite ranking score:
        // rewards efficiency, penalizes rejection rate.
        // Production volume is shown but intentionally NOT part of the
        // score, so a high-volume operator isn't automatically "best".
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
  // Aggregated client-side from pdirDetailedReport / pdir — no new
  // endpoint needed, as long as checkingOperator / packingOperator
  // are populated on each PDIR record (see data-notes below).
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
      hasCheckingData: pdirData.some((e) => e.checkingOperator),
      hasPackingData: pdirData.some((e) => e.packingOperator),
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
  // DERIVED: REJECTION / DEFECT ANALYSIS
  // ============================================================

  const topDefectiveChart = useMemo(
    () =>
      [...componentWiseDefect]
        .sort((a, b) => toNum(b.totalRejected) - toNum(a.totalRejected))
        .slice(0, 10)
        .map((c) => ({
          name: c.partNumber || c.partName || c._id || "-",
          "Rejected Qty": toNum(c.totalRejected),
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

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <Printer size={17} />
          Print Report
        </button>
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
          Rejection Analysis
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
            <KpiCard icon={AlertTriangle} title="Total Production Rejections" value={overviewKpis.productionRejected} danger />
            <KpiCard icon={ClipboardCheck} title="Total PDIR Qty Checked" value={overviewKpis.totalQtyChecked} />
            <KpiCard icon={ShieldAlert} title="Total PDIR Rejections" value={overviewKpis.pdirRejected} danger />
            <KpiCard icon={TrendingUp} title="Production Efficiency" value={`${overviewKpis.productionEfficiency}%`} good={overviewKpis.productionEfficiency >= 85} />
            <KpiCard icon={TrendingDown} title="PDIR Rejection Rate" value={`${overviewKpis.pdirRejectionRate}%`} danger={overviewKpis.pdirRejectionRate > 5} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MONTHLY CHART */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Monthly Production Performance
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Target vs actual production vs rejection, by month
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
                      <Bar dataKey="rejectedQty" name="Rejection" fill="#ef4444" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No monthly production data found." />
              )}
            </div>

            {/* QUALITY DONUT */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Overall Quality Performance
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                PDIR accepted vs rejected quantity
              </p>

              {qualityDonutData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityDonutData}
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
          headers={["Date", "Operator", "Component", "Part No", "Machine", "Shift", "Operation", "Target", "Actual", "Rejected", "Grade"]}
          isEmpty={productionData.length === 0}
        >
          {productionData.map((entry) => (
            <tr key={entry._id} className="border-t hover:bg-gray-50">
              <TD>{entry.date ? new Date(entry.date).toLocaleDateString("en-IN") : "-"}</TD>
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
                icon={AlertTriangle}
                label="Most Defective Part"
                name={partHighlights.mostDefective?.partName}
                sub={partHighlights.mostDefective?.partNumber}
                value={`${partHighlights.mostDefective?.totalRejected ?? 0} rejected`}
                tone="red"
                onClick={() => partHighlights.mostDefective && setSelectedPart(partHighlights.mostDefective)}
              />
              <HighlightCard
                icon={ShieldAlert}
                label="Highest Rejection Rate"
                name={partHighlights.highestRejectionRate?.partName}
                sub={partHighlights.highestRejectionRate?.partNumber}
                value={`${partHighlights.highestRejectionRate?.rejectionRate ?? 0}%`}
                tone="red"
                onClick={() => partHighlights.highestRejectionRate && setSelectedPart(partHighlights.highestRejectionRate)}
              />
            </div>
          ) : (
            <EmptyState message="No part-wise data found." />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Production Quantity by Part" subtitle="Top 10 parts by actual production">
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
                        formatter={(value, key) => [value, key]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Production" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={26} />
                      <Bar dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No part production data found." />
              )}
            </ChartCard>

            <ChartCard title="Part-wise Rejection Rate Comparison" subtitle="Top 10 parts by rejection rate (Rejected ÷ Checked)">
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
                        formatter={(value, key, entry) => {
                          if (key === "Rejection Rate") return [`${value}%`, "Rejection Rate"];
                          return [value, key];
                        }}
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload;
                          return row ? `${row.fullName} — Checked ${row.checked} / Rejected ${row.rejected}` : "";
                        }}
                      />
                      <Bar dataKey="Rejection Rate" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No rejection rate data found." />
              )}
            </ChartCard>
          </div>

          <ReportTable
            title="Most Defective Parts — Ranked by Rejection Rate"
            headers={["Rank", "Part Name", "Part Number", "Qty Checked", "Qty Rejected", "Rejection Rate", "Main Rejection Type", ""]}
            isEmpty={rankedDefectiveParts.length === 0}
          >
            {rankedDefectiveParts.map((p, index) => (
              <tr
                key={`${p.partNumber}-${index}`}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedPart(p)}
              >
                <TD>#{index + 1}</TD>
                <TD>{p.partName}</TD>
                <TD>{p.partNumber}</TD>
                <TD>{p.totalChecked}</TD>
                <TD danger>{p.totalRejected}</TD>
                <TD danger>{p.rejectionRate}%</TD>
                <TD>{p.mainDefectReason || "-"}</TD>
                <TD>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPart(p);
                    }}
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </TD>
              </tr>
            ))}
          </ReportTable>

          <ReportTable
            title="Part Analysis — Full Detail"
            headers={["Part Name", "Part No", "Produced", "Checked", "Rejected", "Rejection Rate", "Main Defect", "Action"]}
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
                <TD>{p.totalChecked}</TD>
                <TD danger>{p.totalRejected}</TD>
                <TD danger>{p.rejectionRate}%</TD>
                <TD>{p.mainDefectReason || "-"}</TD>
                <TD>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPart(p);
                    }}
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </TD>
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
              />
              <HighlightCard
                icon={Trophy}
                label="Highest Production Operator"
                name={operatorHighlights.highestProduction?.operatorName}
                sub="by actual production"
                value={`${operatorHighlights.highestProduction?.totalProduction} pcs`}
                tone="teal"
              />
              <HighlightCard
                icon={CheckCircle2}
                label="Lowest Rejection Operator"
                name={operatorHighlights.lowestRejection?.operatorName}
                sub="by rejection rate"
                value={`${operatorHighlights.lowestRejection?.rejectionRate ?? 0}%`}
                tone="green"
              />
              <HighlightCard
                icon={AlertTriangle}
                label="Highest Rejection Operator"
                name={operatorHighlights.highestRejection?.operatorName}
                sub="by rejected quantity"
                value={`${operatorHighlights.highestRejection?.totalRejected} rejected`}
                tone="red"
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
                      <Bar dataKey="Rejected" fill="#ef4444" radius={[5, 5, 0, 0]} />
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
                Ranking score = Production Efficiency % − Rejection Rate %.
                Production volume is shown for reference but is not part of
                the score, so an operator is never ranked "best" for
                production quantity alone.
              </p>
            </div>
          </div>

          <ReportTable
            title="Operator Performance Ranking"
            headers={["Rank", "Operator", "Operator ID", "Entries", "Target", "Production", "Rejected", "Efficiency", "Rejection Rate", "Score"]}
            isEmpty={operatorRanking.length === 0}
          >
            {operatorRanking.map((op, index) => (
              <tr key={`${op.operatorCode}-${index}`} className="border-t hover:bg-gray-50">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard icon={ClipboardCheck} title="Total PDIR Entries" value={pdirTotals.totalEntries} />
            <KpiCard icon={Package} title="Total Quantity Checked" value={pdirTotals.totalQtyChecked} />
            <KpiCard icon={AlertTriangle} title="Total Quantity Rejected" value={pdirTotals.totalQtyRejected} danger />
            <KpiCard icon={TrendingDown} title="Overall Rejection Rate" value={`${pdirTotals.rejectionRate}%`} danger={pdirTotals.rejectionRate > 5} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <HighlightCard
              icon={Package}
              label="Most Inspected Part"
              name={pdirHighlights.mostInspected?.partName || pdirHighlights.mostInspected?._id}
              sub={pdirHighlights.mostInspected?.partNumber}
              value={`${pdirHighlights.mostInspected?.totalChecked ?? 0} checked`}
              tone="teal"
            />
            <HighlightCard
              icon={AlertTriangle}
              label="Most Defective Part"
              name={pdirHighlights.mostDefectivePart?.partName || pdirHighlights.mostDefectivePart?._id}
              sub={pdirHighlights.mostDefectivePart?.partNumber}
              value={`${pdirHighlights.mostDefectivePart?.totalRejected ?? 0} rejected`}
              tone="red"
            />
            <HighlightCard
              icon={ShieldAlert}
              label="Most Common Rejection Reason"
              name={pdirHighlights.mostCommonReason?.rejectionReason || pdirHighlights.mostCommonReason?._id}
              sub="by occurrences"
              value={`${pdirHighlights.mostCommonReason?.occurrences ?? 0}x`}
              tone="red"
            />
            <HighlightCard
              icon={TrendingDown}
              label="Highest Rejection Qty Reason"
              name={pdirHighlights.highestRejectionQtyReason?.rejectionReason || pdirHighlights.highestRejectionQtyReason?._id}
              sub="by total rejected qty"
              value={`${pdirHighlights.highestRejectionQtyReason?.totalRejected ?? 0}`}
              tone="red"
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

            <ChartCard title="Rejection Reason Distribution" subtitle="Share of rejected quantity by reason">
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
            headers={["Date", "Part", "Part Number", "Production Reference", "Checking Operator", "Packing Operator", "Qty Checked", "Qty Rejected", "Rejection Reason", "Remarks"]}
            isEmpty={pdirData.length === 0}
          >
            {pdirData.map((pdir) => {
              const production = pdir.productionBatch || pdir.production;
              return (
                <tr key={pdir._id} className="border-t hover:bg-gray-50">
                  <TD>{pdir.createdAt ? new Date(pdir.createdAt).toLocaleDateString("en-IN") : "-"}</TD>
                  <TD>{pdir.partName || "-"}</TD>
                  <TD>{pdir.partNumber || "-"}</TD>
                  <TD>{production?.operationNo || production?._id || "-"}</TD>
                  <TD>{pdir.checkingOperator?.name || "-"}</TD>
                  <TD>{pdir.packingOperator?.name || "-"}</TD>
                  <TD>{pdir.qtyChecked || 0}</TD>
                  <TD danger>{pdir.qtyRejected || 0}</TD>
                  <TD>{pdir.rejectionReason || "Unspecified"}</TD>
                  <TD>{pdir.remarks || "-"}</TD>
                </tr>
              );
            })}
          </ReportTable>
        </div>
      )}

      {/* ==================== REJECTION ANALYSIS TAB ==================== */}
      {!loading && !error && activeTab === "rejection" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard icon={AlertTriangle} title="Total Rejections" value={pdirTotals.totalQtyRejected} danger />
            <KpiCard icon={TrendingDown} title="Overall Rejection Rate" value={`${pdirTotals.rejectionRate}%`} danger={pdirTotals.rejectionRate > 5} />
            <KpiCard icon={Package} title="Most Defective Part" value={pdirHighlights.mostDefectivePart?.partName || pdirHighlights.mostDefectivePart?._id || "-"} />
            <KpiCard icon={ShieldAlert} title="Most Common Defect Reason" value={pdirHighlights.mostCommonReason?.rejectionReason || pdirHighlights.mostCommonReason?._id || "-"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Rejection Reason-wise Report" subtitle="Distribution of rejected quantity by rejection reason">
              {rejectionReasonWise.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rejectionReasonWise} dataKey="totalRejected" nameKey="rejectionReason" outerRadius={90}>
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

            <ChartCard title="Top Defective Parts" subtitle="Ranked by total rejected quantity">
              {topDefectiveChart.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDefectiveChart} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="Rejected Qty" fill="#ef4444" radius={[0, 5, 5, 0]}>
                        <LabelList dataKey="Rejected Qty" position="right" style={{ fontSize: 11 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No defective part data found." />
              )}
            </ChartCard>
          </div>

          <ReportTable
            title="Component-wise Defect Report"
            headers={["Component", "Part No", "Qty Checked", "Rejected", "Rejection Rate", "Main Defect Reason"]}
            isEmpty={componentWiseDefect.length === 0}
          >
            {componentWiseDefect
              .slice()
              .sort((a, b) => toNum(b.totalRejected) - toNum(a.totalRejected))
              .map((item, index) => {
                const matchKey = (item.partNumber || item.partName || item._id || "")
                  .toString()
                  .trim()
                  .toLowerCase();
                const reasonMatch = highestDefectReason.find((r) => {
                  const rKey = (r._id?.partNumber || r._id?.partName || "")
                    .toString()
                    .trim()
                    .toLowerCase();
                  return rKey && rKey === matchKey;
                });

                return (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <TD>{item.partName || item._id || "Unknown"}</TD>
                    <TD>{item.partNumber || "-"}</TD>
                    <TD>{item.totalChecked || 0}</TD>
                    <TD danger>{item.totalRejected || 0}</TD>
                    <TD danger>{item.rejectionRate !== undefined ? `${item.rejectionRate}%` : "-"}</TD>
                    <TD>{reasonMatch?._id?.rejectionReason || "-"}</TD>
                  </tr>
                );
              })}
          </ReportTable>

          <ReportTable
            title="Rejection Reason Details"
            headers={["Rejection Reason", "Occurrences", "Rejected Quantity"]}
            isEmpty={rejectionReasonWise.length === 0}
          >
            {rejectionReasonWise.map((item, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <TD>{item.rejectionReason || item._id || "Unspecified"}</TD>
                <TD>{item.occurrences || 0}</TD>
                <TD danger>{item.totalRejected || 0}</TD>
              </tr>
            ))}
          </ReportTable>

          <ReportTable
            title="Highest Defect Reason per Component"
            headers={["Component", "Part Number", "Highest Defect Reason", "Rejected Quantity"]}
            isEmpty={highestDefectReason.length === 0}
          >
            {highestDefectReason.map((item, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <TD>{item._id?.partName || "-"}</TD>
                <TD>{item._id?.partNumber || "-"}</TD>
                <TD>{item._id?.rejectionReason || "-"}</TD>
                <TD danger>{item.totalRejected || 0}</TD>
              </tr>
            ))}
          </ReportTable>
        </div>
      )}
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================

function KpiCard({ icon: Icon, title, value, danger = false, good = false }) {
  const accent = danger ? "text-red-600" : good ? "text-green-600" : "text-gray-800";
  const iconBg = danger ? "bg-red-50 text-red-500" : good ? "bg-green-50 text-green-600" : "bg-teal-50 text-teal-600";

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
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
      <p className={`text-2xl font-bold mt-2 ${accent}`}>{value}</p>
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
// PART DETAIL MODAL
// Shows full part info + rejection-type breakdown with percentages,
// exactly matching the format requested: each reason's rejected
// quantity and its percentage of that part's total rejections.
// ============================================================

function PartDetailModal({ part, onClose }) {
  if (!part) return null;

  const reasons = Array.isArray(part.reasons) ? part.reasons : [];
  const mainReason = reasons[0] || null;

  const chartData = reasons.slice(0, 8).map((r) => ({
    name: truncateLabel(r.reason, 14),
    fullName: r.reason,
    qty: r.qty,
  }));

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
          {/* PART INFORMATION */}
          <div>
            <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
              Part Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ModalStat label="Total Produced" value={part.totalProduction ?? 0} />
              <ModalStat label="Total Checked" value={part.totalChecked ?? 0} />
              <ModalStat label="Total Rejected" value={part.totalRejected ?? 0} danger />
              <ModalStat label="Rejection Rate" value={`${part.rejectionRate ?? 0}%`} danger />
              <ModalStat label="PDIR Inspections" value={part.pdirEntries ?? 0} />
              <ModalStat
                label="Efficiency"
                value={part.efficiency !== undefined ? `${part.efficiency}%` : "-"}
              />
            </div>
          </div>

          {/* MAIN REJECTION TYPE CALLOUT */}
          {mainReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-600" />
                <p className="text-xs uppercase tracking-wide font-semibold text-red-700">
                  Main Rejection Type
                </p>
              </div>
              <p className="text-base font-bold text-red-800 mt-1">{mainReason.reason}</p>
              <p className="text-sm text-red-700 mt-0.5">
                {mainReason.qty} rejected pieces &middot; {mainReason.percentage}% of total
                rejections for this part
              </p>
            </div>
          )}

          {/* REJECTION BREAKDOWN LIST */}
          <div>
            <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
              Rejection Breakdown
            </h4>

            {reasons.length > 0 ? (
              <div className="space-y-2">
                {reasons.map((r, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                      index === 0
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 w-5">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium text-gray-800">{r.reason}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{r.qty} rejected</p>
                      <p className="text-xs text-gray-500">{r.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No PDIR rejection records found for this part.
              </p>
            )}
          </div>

          {/* SMALL REJECTION CHART */}
          {chartData.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-3">
                Rejection Types vs Quantity
              </h4>
              <div style={{ height: Math.max(chartData.length * 32, 120) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
                    />
                    <Bar dataKey="qty" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={16} name="Rejected Qty" />
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
              {headers.map((header) => (
                <th
                  key={header}
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