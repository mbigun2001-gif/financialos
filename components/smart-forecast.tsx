"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface SmartForecastProps {
  currentAmount: number;
  targetAmount: number;
  daysRemaining: number;
  averageDaily: number;
  forecastedAmount: number;
}

export function SmartForecast({
  currentAmount,
  targetAmount,
  daysRemaining,
  averageDaily,
  forecastedAmount,
}: SmartForecastProps) {
  const isOnTrack = forecastedAmount >= targetAmount;
  const gap = targetAmount - forecastedAmount;
  const statusColor = isOnTrack ? "text-green-400" : "text-red-400";
  const statusBg = isOnTrack ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30";
  const StatusIcon = isOnTrack ? TrendingUp : TrendingDown;
  
  // Розрахунок заробітку за годину (10 год робочий день)
  const workingHoursPerDay = 10;
  const hourlyRate = averageDaily / workingHoursPerDay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-slate-800/50 ${statusBg}`}>
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusColor}`} />
            Smart Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Дохід за день</p>
                <p className="text-2xl font-bold text-slate-100">
                  ₴{averageDaily.toFixed(0)}
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Clock className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Заробіток за годину</p>
                  <p className="text-lg font-bold text-blue-400">
                    ₴{hourlyRate.toFixed(0)}/год
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    (при {workingHoursPerDay} год робочий день)
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Прогнозована сума на кінець місяця</p>
              <p className="text-2xl font-bold text-blue-400">
                ₴{forecastedAmount.toFixed(0)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${statusBg} border ${statusColor.replace("text-", "border-")}`}>
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                <p className={`font-semibold ${statusColor}`}>
                  {isOnTrack ? "Встигаємо до цілі! 🎯" : "Потрібно прискоритися ⚡"}
                </p>
              </div>
              {!isOnTrack && (
                <p className="text-sm text-slate-300 mt-1">
                  Потрібно додатково: ₴{gap.toFixed(0)} ({((gap / daysRemaining) || 0).toFixed(0)}/день)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
