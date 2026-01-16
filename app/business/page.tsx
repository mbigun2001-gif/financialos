"use client";

import { MetricCard } from "@/components/metric-card";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Plus,
  Briefcase,
  BarChart3,
  PieChart,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dataStore, Transaction } from "@/lib/data";
import { useEffect, useState } from "react";
import { currencyAPI } from "@/lib/currency-api";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { IncomeChart } from "@/components/income-chart";
import { IncomeSourcesChart } from "@/components/income-sources-chart";
import { ExpensesChartDialog } from "@/components/expenses-chart-dialog";
import { IncomeChartDialog } from "@/components/income-chart-dialog";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from "recharts";

// Бізнес-категорії доходів
const businessIncomeCategories = [
  "Продажі",
  "Послуги",
  "Консультації",
  "Партнерські програми",
  "Інші доходи",
];

// Бізнес-категорії витрат
const businessExpenseCategories = [
  "Оренда офісу",
  "Зарплата",
  "Реклама",
  "Обладнання",
  "Програмне забезпечення",
  "Комунікації",
  "Транспорт",
  "Податки",
  "Банківські послуги",
  "Інші витрати",
];

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6"];

export default function BusinessPage() {
  const [businessIncome, setBusinessIncome] = useState(0);
  const [businessExpenses, setBusinessExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [currency, setCurrency] = useState<"UAH" | "USD">("UAH");
  const [exchangeRate, setExchangeRate] = useState(37.5);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showExpensesChartDialog, setShowExpensesChartDialog] = useState(false);
  const [showIncomeChartDialog, setShowIncomeChartDialog] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    source: businessIncomeCategories[0],
    description: "",
    status: "received" as "received" | "pending",
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: businessExpenseCategories[0],
    description: "",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    dataStore.init();
    updateData();
    loadExchangeRate();
    const interval = setInterval(() => {
      updateData();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadExchangeRate = async () => {
    const rate = await currencyAPI.getExchangeRate();
    setExchangeRate(rate);
  };

  const updateData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    const allTransactions = dataStore.transactions.getAll();
    const monthTransactions = allTransactions.filter((t) => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    // Фільтруємо тільки бізнес-транзакції
    const businessTransactions = monthTransactions.filter((t) => {
      if (t.type === "income") {
        return businessIncomeCategories.includes(t.source || "");
      } else {
        return businessExpenseCategories.includes(t.category);
      }
    });

    setTransactions(businessTransactions);

    const income = businessTransactions
      .filter((t) => t.type === "income" && t.status === "received")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = businessTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    setBusinessIncome(income);
    setBusinessExpenses(expenses);
    setNetProfit(income - expenses);
  };

  const formatAmount = (amount: number) => {
    const converted = currency === "USD" ? amount / exchangeRate : amount;
    const symbol = currency === "USD" ? "$" : "₴";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "income",
      amount: parseFloat(incomeForm.amount),
      category: "income",
      description: incomeForm.description,
      date: new Date().toISOString(),
      source: incomeForm.source,
      status: incomeForm.status,
    };
    dataStore.transactions.add(transaction);
    setIncomeForm({ amount: "", source: businessIncomeCategories[0], description: "", status: "received" });
    setShowIncomeDialog(false);
    updateData();
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "expense",
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      description: expenseForm.description,
      date: new Date().toISOString(),
    };
    dataStore.transactions.add(transaction);
    setExpenseForm({ amount: "", category: businessExpenseCategories[0], description: "" });
    setShowExpenseDialog(false);
    updateData();
  };

  // Дані для графіків
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  // Дані для графіка доходів по джерелам
  const totalIncome = monthTransactions
    .filter((t) => t.type === "income" && t.status === "received")
    .reduce((sum, t) => sum + t.amount, 0);
  const incomeBySource = businessIncomeCategories.map((source) => {
    const sourceIncome = monthTransactions
      .filter((t) => t.type === "income" && t.source === source && t.status === "received")
      .reduce((sum, t) => sum + t.amount, 0);
    return { 
      name: source, 
      value: sourceIncome,
      percentage: totalIncome > 0 ? (sourceIncome / totalIncome) * 100 : 0,
    };
  }).filter((item) => item.value > 0);

  // Дані для графіка витрат по категоріях
  const expenses = monthTransactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const allCategories = Array.from(new Set(expenses.map(t => t.category || "Інше")));
  const expensesByCategory = allCategories.map((category) => {
    const categoryExpenses = expenses
      .filter((t) => (t.category || "Інше") === category)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      name: category,
      value: categoryExpenses,
      percentage: totalExpenses > 0 ? (categoryExpenses / totalExpenses) * 100 : 0,
    };
  }).filter(item => item.value > 0);

  // Дані для щоденного графіка
  const dailyData = Array.from({ length: monthEnd.getDate() }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    const dayTransactions = monthTransactions.filter(
      (t) => new Date(t.date).toDateString() === date.toDateString()
    );
    const dayIncome = dayTransactions
      .filter((t) => t.type === "income" && t.status === "received")
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExpenses = dayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date: date.toISOString(),
      day: i + 1,
      Доходи: currency === "USD" ? dayIncome / exchangeRate : dayIncome,
      Витрати: currency === "USD" ? dayExpenses / exchangeRate : dayExpenses,
    };
  });

  const profitMargin = businessIncome > 0 ? (netProfit / businessIncome) * 100 : 0;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-blue-400" />
            Бізнес-облік
          </h1>
          <p className="text-slate-400 mt-2">
            Прогресивний облік фінансів вашого бізнесу
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CurrencySwitcher
            currency={currency}
            onCurrencyChange={setCurrency}
            exchangeRate={exchangeRate}
            onRateUpdate={setExchangeRate}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => setShowIncomeDialog(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Дохід
            </Button>
            <Button
              onClick={() => setShowExpenseDialog(true)}
              variant="destructive"
              className="shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Витрата
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div 
          onClick={() => setShowIncomeChartDialog(true)}
          className="cursor-pointer"
        >
          <MetricCard
            title="Бізнес-доходи"
            value={formatAmount(businessIncome)}
            description="Натисніть для аналізу"
            icon={TrendingUp}
            trend={{
              value: "Бізнес-операції",
              isPositive: true,
            }}
          />
        </div>
        <div 
          onClick={() => setShowExpensesChartDialog(true)}
          className="cursor-pointer"
        >
          <MetricCard
            title="Бізнес-витрати"
            value={formatAmount(businessExpenses)}
            description="Натисніть для аналізу"
            icon={TrendingDown}
            trend={{
              value: "Операційні витрати",
              isPositive: false,
            }}
          />
        </div>
        <MetricCard
          title="Чистий прибуток"
          value={formatAmount(netProfit)}
          description={`Маржа: ${profitMargin.toFixed(1)}%`}
          icon={DollarSign}
          trend={{
            value: netProfit >= 0 ? "Прибутковість" : "Збитковість",
            isPositive: netProfit >= 0,
          }}
        />
        <div 
          onClick={() => setShowExpensesChartDialog(true)}
          className="cursor-pointer"
        >
          <MetricCard
            title="Аналіз витрат"
            value={formatAmount(totalExpenses)}
            description="Натисніть для деталей"
            icon={BarChart3}
            trend={{
              value: `${expensesByCategory.length} категорій`,
              isPositive: true,
            }}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Щоденний графік */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
            <CardHeader>
              <CardTitle className="text-slate-100">Щоденна динаміка</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1" }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1" }}
                    tickFormatter={(value) => `${currency === "USD" ? "$" : "₴"}${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    formatter={(value: number) => [
                      `${currency === "USD" ? "$" : "₴"}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "",
                    ]}
                  />
                  <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                  <Bar dataKey="Доходи" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Витрати" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Доходи по джерелам */}
        {incomeBySource.length > 0 && (
          <IncomeSourcesChart
            data={incomeBySource}
            currency={currency}
            exchangeRate={exchangeRate}
          />
        )}
      </div>

      {/* Business Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-400" />
              Фінансовий звіт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-2">Доходи</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatAmount(businessIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Витрати</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatAmount(businessExpenses)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Прибуток</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatAmount(netProfit)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Маржа: {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Income Dialog */}
      <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати бізнес-дохід</DialogTitle>
            <DialogDescription>
              Введіть інформацію про дохід бізнесу
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div>
              <Label htmlFor="income-amount">Сума (₴)</Label>
              <Input
                id="income-amount"
                type="number"
                step="0.01"
                required
                value={incomeForm.amount}
                onChange={(e) =>
                  setIncomeForm({ ...incomeForm, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="income-source">Джерело доходу</Label>
              <Select
                id="income-source"
                value={incomeForm.source}
                onChange={(e) =>
                  setIncomeForm({ ...incomeForm, source: e.target.value })
                }
                required
              >
                {businessIncomeCategories.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="income-description">Опис (необов'язково)</Label>
              <Input
                id="income-description"
                value={incomeForm.description}
                onChange={(e) =>
                  setIncomeForm({ ...incomeForm, description: e.target.value })
                }
                placeholder="Короткий опис..."
              />
            </div>
            <div>
              <Label htmlFor="income-status">Статус</Label>
              <Select
                id="income-status"
                value={incomeForm.status}
                onChange={(e) =>
                  setIncomeForm({ ...incomeForm, status: e.target.value as "received" | "pending" })
                }
              >
                <option value="received">Отримано</option>
                <option value="pending">Очікується</option>
              </Select>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIncomeDialog(false)}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Додати дохід
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати бізнес-витрату</DialogTitle>
            <DialogDescription>
              Введіть інформацію про витрату бізнесу
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <Label htmlFor="expense-amount">Сума (₴)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                required
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="expense-category">Категорія</Label>
              <Select
                id="expense-category"
                value={expenseForm.category}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, category: e.target.value })
                }
              >
                {businessExpenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-description">Опис (необов'язково)</Label>
              <Input
                id="expense-description"
                value={expenseForm.description}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                }
                placeholder="Короткий опис..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExpenseDialog(false)}
              >
                Скасувати
              </Button>
              <Button type="submit" variant="destructive">
                Додати витрату
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expenses Chart Dialog */}
      <ExpensesChartDialog
        open={showExpensesChartDialog}
        onOpenChange={setShowExpensesChartDialog}
        expensesByCategory={expensesByCategory}
        totalExpenses={totalExpenses}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      {/* Income Chart Dialog */}
      <IncomeChartDialog
        open={showIncomeChartDialog}
        onOpenChange={setShowIncomeChartDialog}
        incomeBySource={incomeBySource}
        totalIncome={totalIncome}
        currency={currency}
        exchangeRate={exchangeRate}
      />
    </div>
  );
}
