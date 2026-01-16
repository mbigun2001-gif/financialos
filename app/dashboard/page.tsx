"use client";

import { MetricCard } from "@/components/metric-card";
import {
  DollarSign,
  Target,
  TrendingDown,
  ArrowUpRight,
  Plus,
  TrendingUp,
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
import { dataStore, Goal, Transaction } from "@/lib/data";
import { useEffect, useState } from "react";
import { currencyConverter } from "@/lib/currency";
import { currencyAPI } from "@/lib/currency-api";
import { Progress } from "@/components/ui/progress";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { SmartForecast } from "@/components/smart-forecast";
import { TaxReserve } from "@/components/tax-reserve";
import { NicheROICard } from "@/components/niche-roi";
import { IncomeChart } from "@/components/income-chart";
import { IncomeSourcesChart } from "@/components/income-sources-chart";
import { FinancialInsights } from "@/components/financial-insights";
import { ExpensesChartDialog } from "@/components/expenses-chart-dialog";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [data, setData] = useState<{
    currentRevenue: number;
    monthlyGoal: number;
    burnRate: number;
    gapToGoal: number;
    activeGoal: Goal | null;
  }>({
    currentRevenue: 0,
    monthlyGoal: 0,
    burnRate: 0,
    gapToGoal: 0,
    activeGoal: null,
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showExpensesChartDialog, setShowExpensesChartDialog] = useState(false);
  const [currency, setCurrency] = useState<"UAH" | "USD">("UAH");
  const [exchangeRate, setExchangeRate] = useState(37.5);
  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    source: "",
    description: "",
    status: "received" as "received" | "pending",
    assetId: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "Бізнес",
    description: "",
    assetId: "",
  });
  const [availableAssets, setAvailableAssets] = useState<Array<{id: string, name: string, type: string}>>([]);

  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Товарка" | "Інфобіз" | "Особисте">("all");

  useEffect(() => {
    dataStore.init();
    
    // Ініціалізуємо ніші якщо їх немає
    const niches = dataStore.niches.getAll();
    if (niches.length === 0) {
      dataStore.niches.add({ id: "wood", name: "Дерево", adSpend: 0, income: 0 });
      dataStore.niches.add({ id: "metal", name: "Метал", adSpend: 0, income: 0 });
    }
    
    // Завантажуємо категорії та активи
    loadCategories();
    loadAssets();
    updateData();
    loadExchangeRate();
    
    // Оновлюємо дані кожні 2 секунди для синхронізації
    const interval = setInterval(() => {
      loadCategories();
      updateData();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadAssets = () => {
    const allAssets = dataStore.assets.getAll();
    // Фільтруємо тільки ліквідні активи та готівку (рахунки)
    const liquidAssets = allAssets.filter(a => 
      a.type === "liquid" || a.type === "cash" || a.type === "crypto"
    );
    setAvailableAssets(liquidAssets.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type
    })));
  };

  const loadCategories = () => {
    const incomeCats = dataStore.categories.getByType("income");
    const expenseCats = dataStore.categories.getByType("expense");
    const sources = incomeCats.map(c => c.name);
    const categories = expenseCats.map(c => c.name);
    setIncomeSources(sources);
    setExpenseCategories(categories);
    
    // Встановлюємо значення за замовчуванням для форми доходу ТІЛЬКИ якщо:
    // 1. Діалог закритий (щоб не перезаписувати вибір користувача)
    // 2. Значення порожнє або не існує в списку
    if (!showIncomeDialog && sources.length > 0 && (!incomeForm.source || !sources.includes(incomeForm.source))) {
      setIncomeForm(prev => ({ ...prev, source: sources[0] }));
    }
    
    // Встановлюємо значення за замовчуванням для форми розходів ТІЛЬКИ якщо:
    // 1. Діалог закритий (щоб не перезаписувати вибір користувача)
    // 2. Значення порожнє або не існує в списку
    if (!showExpenseDialog && categories.length > 0 && (!expenseForm.category || !categories.includes(expenseForm.category))) {
      setExpenseForm(prev => ({ ...prev, category: categories[0] }));
    }
  };

  const loadExchangeRate = async () => {
    const rate = await currencyAPI.getExchangeRate();
    setExchangeRate(rate);
  };

  const updateData = () => {
    const income = dataStore.transactions.getTotal("income");
    const expenses = dataStore.transactions.getTotal("expense");
    const allGoals = dataStore.goals.getAll();
    
    // Шукаємо ціль з категорією "Дохід" або першу ціль, якщо такої немає
    let goal = allGoals.find(g => g.category === "Дохід" || g.category === "revenue");
    if (!goal && allGoals.length > 0) {
      // Якщо немає цілі з категорією "Дохід", беремо першу ціль
      goal = allGoals[0];
    }
    
    const currentRevenue = income;
    // Використовуємо currentAmount з цілі, якщо вона є, інакше використовуємо дохід
    const goalCurrentAmount = goal ? goal.currentAmount : income;
    const monthlyGoal = goal?.targetAmount || null; // null означає що цілі немає
    const burnRate = expenses;
    const gapToGoal = monthlyGoal ? Math.max(0, monthlyGoal - goalCurrentAmount) : null;

    setData({ 
      currentRevenue, 
      monthlyGoal: monthlyGoal || 0, 
      burnRate, 
      gapToGoal: gapToGoal || 0,
      activeGoal: goal || null 
    });
    setGoals(allGoals);
  };

  // Використовуємо currentAmount з активної цілі, якщо вона є
  const goalCurrentAmount = data.activeGoal ? data.activeGoal.currentAmount : data.currentRevenue;
  const progress = data.monthlyGoal > 0 
    ? (goalCurrentAmount / data.monthlyGoal) * 100 
    : 0;
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const daysRemaining =
    daysInMonth - new Date().getDate();
  const dailyTarget = daysRemaining > 0 
    ? data.gapToGoal / daysRemaining 
    : 0;

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", incomeForm); // Для дебагу
    console.log("Available sources:", incomeSources); // Для дебагу
    
    if (!incomeForm.source || incomeForm.source.trim() === "") {
      alert("Будь ласка, оберіть джерело доходу");
      return;
    }
    
    if (!incomeSources.includes(incomeForm.source)) {
      alert(`Помилка: категорія "${incomeForm.source}" не знайдена в списку. Доступні категорії: ${incomeSources.join(", ")}`);
      return;
    }
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "income",
      amount: parseFloat(incomeForm.amount),
      category: "income",
      description: incomeForm.description,
      date: new Date().toISOString(),
      source: incomeForm.source,
      status: incomeForm.status,
      assetId: incomeForm.assetId || undefined,
    };
    dataStore.transactions.add(transaction);
    // Зберігаємо вибране джерело доходу після додавання
    const currentSource = incomeForm.source;
    const currentAsset = incomeForm.assetId;
    setIncomeForm({ amount: "", source: currentSource, description: "", status: "received", assetId: currentAsset });
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
      assetId: expenseForm.assetId || undefined,
    };
    dataStore.transactions.add(transaction);
    const currentCategory = expenseForm.category;
    const currentAsset = expenseForm.assetId;
    setExpenseForm({ amount: "", category: currentCategory, description: "", assetId: currentAsset });
    setShowExpenseDialog(false);
    updateData();
  };

  // Конвертація сум для відображення
  const formatAmount = (amount: number) => {
    const converted = currency === "USD" ? amount / exchangeRate : amount;
    const symbol = currency === "USD" ? "$" : "₴";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Розрахунок даних для графіків та аналітики
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  let monthTransactions = dataStore.transactions.getByDateRange(monthStart, monthEnd) || [];
  
  // Фільтрація за категорією
  if (categoryFilter !== "all") {
    monthTransactions = monthTransactions.filter((t) => {
      if (t.type === "expense") {
        // Для витрат перевіряємо категорію напряму
        // Також перевіряємо, чи категорія містить ключові слова
        const category = t.category || "";
        if (categoryFilter === "Товарка") {
          return category === "Товарка" || category.toLowerCase().includes("товар");
        }
        if (categoryFilter === "Інфобіз") {
          return category === "Інфобіз" || category.toLowerCase().includes("інфо") || category.toLowerCase().includes("бізнес");
        }
        if (categoryFilter === "Особисте") {
          return category === "Особисте" || category.toLowerCase().includes("особист");
        }
        return category === categoryFilter;
      }
      // Для доходів перевіряємо source
      if (t.type === "income") {
        const source = t.source || "";
        if (categoryFilter === "Товарка") {
          // Товарка: Shopify, Дерево, Метал та інші товарні категорії
          return ["Shopify", "Дерево", "Метал"].some(s => source.includes(s)) || 
                 source.toLowerCase().includes("товар");
        }
        if (categoryFilter === "Інфобіз") {
          // Інфобіз: Менторинг та інші інформаційні продукти
          return source === "Менторинг" || 
                 source.toLowerCase().includes("ментор") ||
                 source.toLowerCase().includes("інфо") ||
                 source.toLowerCase().includes("курс");
        }
        if (categoryFilter === "Особисте") {
          // Особисте: зазвичай не має доходів, але можна додати логіку
          return false; // Особисте зазвичай не має доходів
        }
      }
      return false;
    });
  }
  
  // Дані для графіка щоденного доходу
  const dailyIncomeData = Array.from({ length: monthEnd.getDate() }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    const dayTransactions = monthTransactions.filter(
      (t) =>
        t.type === "income" &&
        t.status === "received" &&
        new Date(t.date).toDateString() === date.toDateString()
    );
    return {
      date: date.toISOString(),
      amount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
    };
  });

  // Дані для кругової діаграми
  const incomeBySource = incomeSources.map((source) => {
    const sourceIncome = monthTransactions
      .filter((t) => t.type === "income" && t.source === source && t.status === "received")
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: source, value: sourceIncome };
  }).filter((item) => item.value > 0);

  // Дані для графіка витрат по категоріях
  const expenses = monthTransactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  // Збираємо всі унікальні категорії з транзакцій
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

  // Розрахунок Smart Forecast
  const receivedIncome = dataStore.transactions.getTotal("income", "received") || 0;
  const daysPassed = new Date().getDate();
  const averageDaily = daysPassed > 0 ? receivedIncome / daysPassed : 0;
  const forecastedAmount = receivedIncome + averageDaily * daysRemaining;

  // Розрахунок прогнозу досягнення 1 000 000$ капіталу
  const targetCapitalUSD = 1000000;
  const targetCapitalUAH = targetCapitalUSD * exchangeRate;
  
  // Отримуємо поточний капітал (використовуємо той самий метод, що і на сторінці капіталу)
  // Активів зберігаються в UAH, тому просто сумуємо їх значення
  const assetsCapital = dataStore.assets.getTotal();
  
  // Додаємо вклади та зобов'язання (вже внесені суми)
  // Конвертуємо з валюти зобов'язання в UAH
  const liabilitiesCapital = dataStore.liabilities.getAll().reduce((sum, liability) => {
    if (liability.currency === "UAH") {
      return sum + liability.paidAmount;
    } else if (liability.currency === "USD") {
      return sum + liability.paidAmount * exchangeRate;
    } else if (liability.currency === "EUR") {
      // EUR до UAH (приблизно через USD)
      return sum + liability.paidAmount * exchangeRate * 1.1; // Приблизний курс EUR/USD
    }
    return sum;
  }, 0);
  
  const currentCapital = assetsCapital + liabilitiesCapital;
  
  // Розраховуємо середній прибуток за останній тиждень
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTransactions = dataStore.transactions.getByDateRange(weekAgo, new Date()) || [];
  const weekIncome = weekTransactions
    .filter(t => t.type === "income" && t.status === "received")
    .reduce((sum, t) => sum + t.amount, 0);
  const weekExpenses = weekTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const weekProfit = weekIncome - weekExpenses;
  const averageWeeklyProfit = weekProfit;
  const averageDailyProfit = averageWeeklyProfit / 7;
  
  // Розраховуємо скільки потрібно досягти
  const capitalGap = targetCapitalUAH - currentCapital;
  const daysToTarget = averageDailyProfit > 0 ? Math.ceil(capitalGap / averageDailyProfit) : null;
  const targetDate = daysToTarget ? new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000) : null;

  // Податковий резерв (5% ФОП)
  const taxRate = 5;


  // ROI для ніш
  const niches = dataStore.niches.getAll() || [];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Дашборд</h1>
          <p className="text-slate-400 mt-2">
            Огляд вашої фінансової продуктивності
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <CurrencySwitcher
              currency={currency}
              onCurrencyChange={setCurrency}
              exchangeRate={exchangeRate}
              onRateUpdate={setExchangeRate}
            />
            <div className="flex-1 md:flex-none">
              <Label htmlFor="category-filter" className="text-slate-400 text-sm mb-1 block">Фільтр категорій</Label>
              <Select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as "all" | "Товарка" | "Інфобіз" | "Особисте")}
                className="bg-slate-800 border-slate-700 text-slate-100"
              >
                <option value="all">Всі категорії</option>
                <option value="Товарка">Товарка</option>
                <option value="Інфобіз">Інфобіз</option>
                <option value="Особисте">Особисте</option>
              </Select>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <Button
              onClick={() => setShowIncomeDialog(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Додати дохід
            </Button>
            <Button
              onClick={() => setShowExpenseDialog(true)}
              variant="destructive"
              className="shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Додати розхід
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Поточний дохід"
          value={formatAmount(data.currentRevenue)}
          description="Загальний дохід цього місяця"
          icon={DollarSign}
          trend={{
            value: `Отримано: ${formatAmount(dataStore.transactions.getTotal("income", "received"))} | Очікується: ${formatAmount(dataStore.transactions.getTotal("income", "pending"))}`,
            isPositive: true,
          }}
        />
        {data.activeGoal ? (
          <MetricCard
            title={`Прогрес до цілі: ${data.activeGoal.title}`}
            value={`${progress.toFixed(1)}%`}
            description={`${formatAmount(goalCurrentAmount)} з ${formatAmount(data.monthlyGoal)}`}
            icon={Target}
            progress={progress}
          />
        ) : (
          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Прогрес до цілі
              </CardTitle>
              <Target className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">—</div>
              <p className="text-xs text-slate-500 mt-1">
                Створіть ціль у розділі "Цілі"
              </p>
            </CardContent>
          </Card>
        )}
        <div 
          onClick={() => setShowExpensesChartDialog(true)}
          className="cursor-pointer"
        >
          <MetricCard
            title="Розходи"
            value={formatAmount(data.burnRate)}
            description="Витрати за місяць"
            icon={TrendingDown}
            trend={{
              value: "Бізнес витрати",
              isPositive: false,
            }}
          />
        </div>
        {data.activeGoal ? (
          <MetricCard
            title="Залишок до цілі"
            value={formatAmount(data.gapToGoal)}
            description={
              daysRemaining > 0
                ? `${formatAmount(dailyTarget)}/день потрібно`
                : "Період цілі закінчився"
            }
            icon={ArrowUpRight}
            trend={{
              value: `${daysRemaining} днів залишилось`,
              isPositive: daysRemaining > 0,
            }}
          />
        ) : (
          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Залишок до цілі
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">—</div>
              <p className="text-xs text-slate-500 mt-1">
                Створіть ціль у розділі "Цілі"
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Info Cards */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Чистий прибуток за місяць</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${(data.currentRevenue - data.burnRate) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatAmount(data.currentRevenue - data.burnRate)}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Доходи: {formatAmount(data.currentRevenue)} - Витрати: {formatAmount(data.burnRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Section */}
      {goals.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Ваші цілі</h2>
            <p className="text-slate-400 mt-1">
              Відстеження прогресу досягнення цілей
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0
                ? (goal.currentAmount / goal.targetAmount) * 100
                : 0;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              return (
                <Card key={goal.id} className="border-slate-800/50 hover:scale-[1.02] transition-transform duration-200">
                  <CardHeader>
                    <CardTitle className="text-slate-100 flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-blue-400" />
                      {goal.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-400">Прогрес</span>
                          <span className="text-slate-300 font-medium">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(progress, 100)} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-slate-400">Поточний прогрес</p>
                            <p className="text-lg font-bold text-slate-100">
                              ₴{goal.currentAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {currencyConverter.formatUSD(currencyConverter.uahToUsd(goal.currentAmount))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Ціль</p>
                            <p className="text-lg font-bold text-blue-400">
                              ₴{goal.targetAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {currencyConverter.formatUSD(currencyConverter.uahToUsd(goal.targetAmount))}
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800">
                          <p className="text-xs text-slate-400 mb-1">Залишилось досягнути</p>
                          <p className="text-base font-bold text-orange-400">
                            ₴{remaining.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {currencyConverter.formatUSD(currencyConverter.uahToUsd(remaining))}
                          </p>
                        </div>
                      </div>
                      {goal.category && (
                        <p className="text-xs text-slate-500">
                          Напрямок: {goal.category}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <IncomeChart
          data={dailyIncomeData}
          currency={currency}
          exchangeRate={exchangeRate}
        />
        <IncomeSourcesChart
          data={incomeBySource}
          currency={currency}
          exchangeRate={exchangeRate}
        />
      </div>

      {/* Smart Forecast */}
      <SmartForecast
        currentAmount={receivedIncome}
        targetAmount={data.monthlyGoal}
        daysRemaining={daysRemaining}
        averageDaily={averageDaily}
        forecastedAmount={forecastedAmount}
      />

      {/* Прогноз досягнення цілі 1 000 000$ */}
      <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" />
            Прогноз досягнення цілі: 1 000 000$ капіталу
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-400 mb-1">Поточний капітал</p>
              <p className="text-2xl font-bold text-slate-100">
                {formatAmount(currentCapital)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ${(currentCapital / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Цільовий капітал</p>
              <p className="text-2xl font-bold text-blue-400">
                ${targetCapitalUSD.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatAmount(targetCapitalUAH)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Середній прибуток/день</p>
              <p className="text-2xl font-bold text-green-400">
                {formatAmount(averageDailyProfit)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                За останній тиждень
              </p>
            </div>
          </div>
          {daysToTarget && daysToTarget > 0 ? (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Прогнозована дата досягнення</p>
                <p className="text-lg font-bold text-slate-100">
                  {targetDate?.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <p className="text-sm text-slate-400">
                Через {daysToTarget} {daysToTarget === 1 ? "день" : daysToTarget < 5 ? "дні" : "днів"} при поточному темпі
              </p>
              <div className="mt-4">
                <Progress value={Math.min((currentCapital / targetCapitalUAH) * 100, 100)} />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Прогрес: {((currentCapital / targetCapitalUAH) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                Недостатньо даних для прогнозу. Додайте транзакції за останній тиждень.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Insights */}
      <FinancialInsights
        transactions={monthTransactions}
        monthlyGoal={data.monthlyGoal}
        currentRevenue={data.currentRevenue}
      />

      {/* ROI для ніш */}
      {niches.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">ROI по нішах</h2>
            <p className="text-slate-400 mt-1">
              Аналіз рентабельності інвестицій у рекламу
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {niches.map((niche) => (
              <NicheROICard
                key={niche.id}
                niche={niche}
                currency={currency}
                exchangeRate={exchangeRate}
                onUpdate={updateData}
              />
            ))}
          </div>
        </div>
      )}


      {/* Income Dialog */}
      <Dialog 
        open={showIncomeDialog} 
        onOpenChange={(open) => {
          setShowIncomeDialog(open);
          if (open) {
            // Коли діалог відкривається, встановлюємо значення за замовчуванням
            const incomeCats = dataStore.categories.getByType("income");
            const sources = incomeCats.map(c => c.name);
            if (sources.length > 0) {
              setIncomeForm(prev => ({
                ...prev,
                source: prev.source && sources.includes(prev.source) ? prev.source : sources[0]
              }));
            }
          } else {
            // Коли діалог закривається, не скидаємо форму повністю, щоб зберегти вибір
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати дохід</DialogTitle>
            <DialogDescription>
              Введіть інформацію про ваш дохід
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
                value={incomeForm.source || ""}
                onChange={(e) => {
                  const selectedSource = e.target.value;
                  console.log("Selected source:", selectedSource); // Для дебагу
                  setIncomeForm({ ...incomeForm, source: selectedSource });
                }}
                required
              >
                {incomeSources.length === 0 ? (
                  <option value="">Завантаження категорій...</option>
                ) : (
                  <>
                    <option value="">Оберіть категорію...</option>
                    {incomeSources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </>
                )}
              </Select>
            </div>
            <div>
              <Label htmlFor="income-asset">Рахунок/Актив (необов'язково)</Label>
              <Select
                id="income-asset"
                value={incomeForm.assetId || ""}
                onChange={(e) =>
                  setIncomeForm({ ...incomeForm, assetId: e.target.value })
                }
              >
                <option value="">Не прив'язувати до активу</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.type})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                Якщо вибрати актив, дохід автоматично додасться до його вартості
              </p>
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
            <DialogTitle>Додати розхід</DialogTitle>
            <DialogDescription>
              Введіть інформацію про ваш розхід
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
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-asset">Рахунок/Актив (необов'язково)</Label>
              <Select
                id="expense-asset"
                value={expenseForm.assetId || ""}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, assetId: e.target.value })
                }
              >
                <option value="">Не прив'язувати до активу</option>
                {availableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.type})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-400 mt-1">
                Якщо вибрати актив, витрата автоматично відніметься від його вартості
              </p>
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
                Додати розхід
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

      {/* Мобільні кнопки - знизу під великий палець */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 p-2 safe-area-inset-bottom" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2 max-w-full mx-auto px-2">
          <Button
            onClick={() => setShowIncomeDialog(true)}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Додати дохід</span>
            <span className="xs:hidden">Дохід</span>
          </Button>
          <Button
            onClick={() => setShowExpenseDialog(true)}
            variant="destructive"
            className="flex-1 shadow-lg shadow-red-500/20 text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Додати розхід</span>
            <span className="xs:hidden">Розхід</span>
          </Button>
        </div>
      </div>
      
      {/* Додатковий відступ знизу для мобільних кнопок */}
      <div className="h-24 md:h-0"></div>
    </div>
  );
}
