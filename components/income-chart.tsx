"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface IncomeChartProps {
  data: Array<{ date: string; amount: number }>;
  currency: "UAH" | "USD";
  exchangeRate: number;
}

export function IncomeChart({ data, currency, exchangeRate }: IncomeChartProps) {
  const symbol = currency === "USD" ? "$" : "₴";
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("uk-UA", { day: "numeric", month: "short" }),
    amount: currency === "USD" ? item.amount / exchangeRate : item.amount,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
        <CardHeader>
          <CardTitle className="text-slate-100">Щоденний дохід</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
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
                dataKey="amount"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
