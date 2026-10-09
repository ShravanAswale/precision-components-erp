import React, { useEffect, useState } from "react";
import api from "../../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldAlert,
  Wrench,
  Ruler,
  Printer,
} from "lucide-react";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/dashboard");
      setDashboard(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const summary = dashboard?.summary || {};

  const chartData =
    dashboard?.monthlyChart?.map((item) => ({
      name: item._id,
      Production: item.Production || 0,
      Rejection: item.Rejection || 0,
    })) || [];

  const cards = [
    {
      title: "Total Production",
      value: summary.totalProduction || 0,
      icon: <CheckCircle className="w-7 h-7" />,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      title: "Production Rejections",
      value: summary.totalRejections || 0,
      icon: <AlertCircle className="w-7 h-7" />,
      bg: "bg-red-50",
      color: "text-red-600",
    },
    {
      title: "PDIR Rejections",
      value: summary.pdirRejections || 0,
      icon: <ShieldAlert className="w-7 h-7" />,
      bg: "bg-orange-50",
      color: "text-orange-600",
    },
    {
      title: "Efficiency",
      value: `${summary.avgEfficiency || 0}%`,
      icon: <TrendingUp className="w-7 h-7" />,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Active Machines",
      value: `${summary.activeMachines || 0} / ${summary.totalMachines || 0}`,
      icon: <Clock className="w-7 h-7" />,
      bg: "bg-violet-50",
      color: "text-violet-600",
    },
    {
      title: "Calibration Due",
      value: summary.gageDue || 0,
      icon: <Ruler className="w-7 h-7" />,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      title: "Under Repair",
      value: summary.gageRepair || 0,
      icon: <Wrench className="w-7 h-7" />,
      bg: "bg-cyan-50",
      color: "text-cyan-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-lg text-gray-500">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-slate-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Precision Components ERP Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            Updated: {new Date().toLocaleString()}
          </span>
          {/* Print button — hidden when printing */}
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-6 flex items-center gap-5"
          >
            <div className={`${card.bg} ${card.color} p-4 rounded-xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500">{card.title}</p>
              <h2 className="text-3xl font-bold text-slate-800 mt-1">
                {card.value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Production vs Rejection
          </h2>
          <p className="text-sm text-slate-500">Month by Month</p>
        </div>

        <div className="h-[380px]">
          {chartData.every((d) => d.Production === 0 && d.Rejection === 0) ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              No production data for this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                barGap={4}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                  }}
                />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Production"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Rejection"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
