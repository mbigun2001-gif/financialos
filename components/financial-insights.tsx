"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingDown, AlertTriangle, Target, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Transaction } from "@/lib/data";

interface FinancialInsightsProps {
  transactions: Transaction[];
  monthlyGoal: number;
  currentRevenue: number;
}

export function FinancialInsights({
  transactions,
  monthlyGoal,
  currentRevenue,
}: FinancialInsightsProps) {
  // Аналіз розходів за категоріями
  const expenses = transactions.filter(t => t.type === "expense");
  const expensesByCategory = expenses.reduce((acc, t) => {
    const category = t.category || "Інше";
    acc[category] = (acc[category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Аналіз доходів за джерелами
  const income = transactions.filter(t => t.type === "income");
  const incomeBySource = income.reduce((acc, t) => {
    const source = t.source || "Інше";
    acc[source] = (acc[source] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Розрахунок середніх розходів на день
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const currentDay = new Date().getDate();
  const averageDailyExpense = currentDay > 0 ? totalExpenses / currentDay : 0;
  const projectedMonthlyExpense = averageDailyExpense * daysInMonth;

  // Виявлення перевитрат
  const insights: Array<{
    type: "warning" | "success" | "info";
    title: string;
    message: string;
    action?: string;
  }> = [];

  // 1. Перевірка перевитрат за категоріями
  const topExpenseCategory = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)[0];
  
  if (topExpenseCategory && topExpenseCategory[1] > totalExpenses * 0.4) {
    insights.push({
      type: "warning",
      title: "Висока концентрація розходів",
      message: `Категорія "${topExpenseCategory[0]}" займає ${((topExpenseCategory[1] / totalExpenses) * 100).toFixed(0)}% від усіх розходів`,
      action: "Розгляньте можливість оптимізації цієї категорії",
    });
  }

  // 2. Перевірка співвідношення доходів та розходів
  if (totalExpenses > 0 && totalIncome > 0) {
    const expenseRatio = (totalExpenses / totalIncome) * 100;
    if (expenseRatio > 80) {
      insights.push({
        type: "warning",
        title: "Високе співвідношення розходів",
        message: `Розходи становлять ${expenseRatio.toFixed(0)}% від доходів`,
        action: "Рекомендується зменшити розходи до 60-70% від доходів",
      });
    } else if (expenseRatio < 50) {
      insights.push({
        type: "success",
        title: "Відмінне співвідношення",
        message: `Розходи становлять лише ${expenseRatio.toFixed(0)}% від доходів`,
        action: "Можна розглянути можливість інвестування залишку",
      });
    }
  }

  // 3. Прогнозовані перевитрати
  if (projectedMonthlyExpense > monthlyGoal * 0.8 && monthlyGoal > 0) {
    insights.push({
      type: "warning",
      title: "Ризик перевитрат",
      message: `За поточним темпом розходи досягнуть ₴${projectedMonthlyExpense.toFixed(0)} на місяць`,
      action: "Зменшіть щоденні розходи на ₴" + ((projectedMonthlyExpense - monthlyGoal * 0.7) / daysInMonth).toFixed(0),
    });
  }

  // 4. Низька диверсифікація доходів
  const incomeSourcesCount = Object.keys(incomeBySource).length;
  if (incomeSourcesCount === 1 && totalIncome > 0) {
    insights.push({
      type: "info",
      title: "Один джерело доходу",
      message: "Всі доходи надходять з одного джерела",
      action: "Розгляньте можливість диверсифікації доходів",
    });
  }

  // 5. Перевірка досягнення цілі
  if (monthlyGoal > 0) {
    const progressToGoal = (currentRevenue / monthlyGoal) * 100;
    if (progressToGoal < 50 && currentDay > daysInMonth * 0.5) {
      insights.push({
        type: "warning",
        title: "Відставання від цілі",
        message: `Досягнуто лише ${progressToGoal.toFixed(0)}% від місячної цілі`,
        action: "Потрібно збільшити дохід на ₴" + ((monthlyGoal - currentRevenue) / (daysInMonth - currentDay)).toFixed(0) + " на день",
      });
    }
  }

  // 6. Рекомендація щодо найбільших категорій розходів
  const topCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  
  if (topCategories.length > 0) {
    insights.push({
      type: "info",
      title: "Топ-3 категорії розходів",
      message: topCategories.map(([cat, amount]) => `${cat}: ₴${amount.toFixed(0)}`).join(", "),
      action: "Проаналізуйте можливість оптимізації цих категорій",
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      title: "Все виглядає добре!",
      message: "Ваші фінанси в порядку. Продовжуйте в тому ж дусі!",
    });
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return AlertTriangle;
      case "success":
        return Target;
      default:
        return Lightbulb;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "warning":
        return "text-orange-400 border-orange-500/30 bg-orange-500/10";
      case "success":
        return "text-green-400 border-green-500/30 bg-green-500/10";
      default:
        return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Розумні рекомендації
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = getIcon(insight.type);
              const colorClass = getColor(insight.type);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${colorClass}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colorClass.split(" ")[0]}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-100 mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-slate-300 mb-2">
                        {insight.message}
                      </p>
                      {insight.action && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <ArrowRight className="h-3 w-3" />
                          <span>{insight.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
