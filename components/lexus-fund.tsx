"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Car } from "lucide-react";
import { motion } from "framer-motion";

interface LexusFundProps {
  currentAmount: number;
  targetAmount: number;
  exchangeRate: number;
  currency: "UAH" | "USD";
}

export function LexusFund({
  currentAmount,
  targetAmount,
  exchangeRate,
  currency,
}: LexusFundProps) {
  const progress = (currentAmount / targetAmount) * 100;
  const remaining = targetAmount - currentAmount;
  
  const displayCurrent = currency === "USD" 
    ? currentAmount / exchangeRate
    : currentAmount;
  const displayTarget = currency === "USD"
    ? targetAmount / exchangeRate
    : targetAmount;
  const displayRemaining = currency === "USD"
    ? remaining / exchangeRate
    : remaining;
  
  const symbol = currency === "USD" ? "$" : "₴";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-2 border-gradient-to-r from-amber-500/30 to-orange-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5" />
        <CardHeader className="relative">
          <CardTitle className="text-slate-100 flex items-center gap-2 text-xl">
            <Car className="h-6 w-6 text-amber-400" />
            Lexus RX Fund
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Прогрес</span>
              <span className="text-slate-300 font-medium">
                {progress.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Поточні накопичення</p>
              <p className="text-2xl font-bold text-amber-400">
                {symbol}{displayCurrent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">Ціль</p>
              <p className="text-2xl font-bold text-orange-400">
                {symbol}{displayTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Залишилось</p>
            <p className="text-xl font-bold text-slate-100">
              {symbol}{displayRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="mt-4 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
            <Car className="h-16 w-16 text-slate-700" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
