"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { dataStore, NicheROI } from "@/lib/data";

interface NicheROIProps {
  niche: NicheROI;
  currency: "UAH" | "USD";
  exchangeRate: number;
  onUpdate: () => void;
}

export function NicheROICard({
  niche,
  currency,
  exchangeRate,
  onUpdate,
}: NicheROIProps) {
  const [adSpend, setAdSpend] = useState(niche.adSpend.toString());
  const [income, setIncome] = useState(niche.income.toString());
  const [isEditing, setIsEditing] = useState(false);

  const roi = dataStore.niches.getROI(niche.id);
  const displayAdSpend = currency === "USD"
    ? parseFloat(adSpend || "0") / exchangeRate
    : parseFloat(adSpend || "0");
  const displayIncome = currency === "USD"
    ? parseFloat(income || "0") / exchangeRate
    : parseFloat(income || "0");
  const symbol = currency === "USD" ? "$" : "₴";

  const handleSave = () => {
    dataStore.niches.add({
      ...niche,
      adSpend: parseFloat(adSpend || "0"),
      income: parseFloat(income || "0"),
    });
    setIsEditing(false);
    onUpdate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
        <CardHeader>
          <CardTitle className="text-slate-100 text-lg">{niche.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <Label htmlFor={`ad-spend-${niche.id}`}>Витрати на рекламу ({symbol})</Label>
                <Input
                  id={`ad-spend-${niche.id}`}
                  type="number"
                  step="0.01"
                  value={adSpend}
                  onChange={(e) => setAdSpend(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`income-${niche.id}`}>Дохід ({symbol})</Label>
                <Input
                  id={`income-${niche.id}`}
                  type="number"
                  step="0.01"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="flex-1">
                  Зберегти
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Скасувати
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Витрати на рекламу</span>
                  <span className="text-sm font-medium text-slate-300">
                    {symbol}{displayAdSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Дохід</span>
                  <span className="text-sm font-medium text-slate-300">
                    {symbol}{displayIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">ROI</span>
                  <div className="flex items-center gap-2">
                    {roi >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span
                      className={`text-xl font-bold ${
                        roi >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                Редагувати
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
