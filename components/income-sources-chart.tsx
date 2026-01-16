"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { motion } from "framer-motion";
import { useState } from "react";

interface IncomeSourcesChartProps {
  data: Array<{ name: string; value: number }>;
  currency: "UAH" | "USD";
  exchangeRate: number;
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];

export function IncomeSourcesChart({
  data,
  currency,
  exchangeRate,
}: IncomeSourcesChartProps) {
  const [chartType, setChartType] = useState<"pie" | "area">("area");
  const symbol = currency === "USD" ? "$" : "₴";
  const chartData = data.map((item) => ({
    ...item,
    value: currency === "USD" ? item.value / exchangeRate : item.value,
  }));

  // Дані для AreaChart - сортуємо за значенням
  const sortedData = [...chartData].sort((a, b) => b.value - a.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-100">Розподіл доходів за джерелами</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                chartType === "area"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Графік
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                chartType === "pie"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Кругова
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [
                    `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    "Дохід",
                  ]}
                />
                <Legend />
              </PieChart>
            ) : (
              <AreaChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncomeSources" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  style={{ fontSize: "12px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value) => `${symbol}${value.toFixed(0)}`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [
                    `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    "Дохід",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorIncomeSources)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
