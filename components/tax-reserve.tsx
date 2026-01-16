"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { motion } from "framer-motion";

interface TaxReserveProps {
  income: number;
  taxRate: number;
  currency: "UAH" | "USD";
  exchangeRate: number;
}

export function TaxReserve({
  income,
  taxRate,
  currency,
  exchangeRate,
}: TaxReserveProps) {
  const taxAmount = income * (taxRate / 100);
  const displayAmount = currency === "USD"
    ? taxAmount / exchangeRate
    : taxAmount;
  const symbol = currency === "USD" ? "$" : "₴";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-400" />
            Податковий резерв (ФОП {taxRate}%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-slate-400">Сума для відкладення</p>
              <p className="text-3xl font-bold text-amber-400">
                {symbol}{displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Рекомендується відкладати {taxRate}% з кожного доходу
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
