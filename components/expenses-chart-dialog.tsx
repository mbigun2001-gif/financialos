"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

interface ExpensesChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expensesByCategory: Array<{ name: string; value: number; percentage: number }>;
  totalExpenses: number;
  currency: "UAH" | "USD";
  exchangeRate: number;
}

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];

export function ExpensesChartDialog({
  open,
  onOpenChange,
  expensesByCategory,
  totalExpenses,
  currency,
  exchangeRate,
}: ExpensesChartDialogProps) {
  const symbol = currency === "USD" ? "$" : "₴";
  
  const chartData = expensesByCategory.map((item) => ({
    ...item,
    value: currency === "USD" ? item.value / exchangeRate : item.value,
  }));

  const barChartData = chartData.map((item) => ({
    name: item.name,
    Сума: item.value,
    Відсоток: item.percentage,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100">
            Аналіз витрат за категоріями
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Загальна сума витрат: {symbol}{totalExpenses > 0 ? (currency === "USD" ? (totalExpenses / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : "0.00"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Кругова діаграма */}
          {chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                  Розподіл витрат по категоріях (%)
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={120}
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
                        color: "#f1f5f9",
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${props.payload.percentage.toFixed(1)}%)`,
                        "Сума",
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ color: "#cbd5e1" }}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Немає даних про витрати
            </div>
          )}

          {/* Стовпчаста діаграма */}
          {barChartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                  Витрати по категоріях (суми)
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8"
                      tick={{ fill: "#cbd5e1" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      tick={{ fill: "#cbd5e1" }}
                      tickFormatter={(value) => `${symbol}${value.toLocaleString()}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                      formatter={(value: number) => [
                        `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        "Сума",
                      ]}
                    />
                    <Bar dataKey="Сума" fill="#ef4444" radius={[8, 8, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Таблиця з деталями */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                  Детальна інформація
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                          Категорія
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                          Сума
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                          Відсоток
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData
                        .sort((a, b) => b.value - a.value)
                        .map((item, index) => (
                          <tr
                            key={item.name}
                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: COLORS[index % COLORS.length],
                                  }}
                                />
                                <span className="text-slate-200">{item.name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 text-slate-200 font-medium">
                              {symbol}
                              {item.value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right py-3 px-4 text-slate-400">
                              {item.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
