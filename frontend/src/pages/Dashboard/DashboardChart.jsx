import React from "react";
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

export default function DashboardChart({ data = [] }) {
  const chartData = data.map((item) => ({
    name:
      item.name ||
      (item._id
        ? new Date(item._id).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })
        : "-"),
    Production: item.Production || 0,
    Rejection: item.Rejection || 0,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Production Analytics
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Production vs Rejection (Last 7 Days)
        </p>
      </div>

      <div className="h-[340px]">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No production data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 40,
                left: 20,
                bottom: 10,
              }}
              barGap={8}
              barCategoryGap={chartData.length === 1 ? "85%" : "40%"}
            >
              <CartesianGrid
                stroke="#f1f5f9"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 12,
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 12,
                }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 20px rgba(0,0,0,.08)",
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{
                  fontSize: 13,
                  paddingBottom: 10,
                }}
              />

              <Bar
                dataKey="Production"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                maxBarSize={35}
              />

              <Bar
                dataKey="Rejection"
                fill="#ef4444"
                radius={[8, 8, 0, 0]}
                maxBarSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}