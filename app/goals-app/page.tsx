"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { dataStore, Goal } from "@/lib/data";
import { Target, Plus, Edit, X, TrendingUp, Calendar, Award, BarChart3, Sparkles, CheckCircle2, ArrowLeft, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { currencyAPI } from "@/lib/currency-api";
import { cn } from "@/lib/utils";

export default function GoalsAppPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showAddAmountForm, setShowAddAmountForm] = useState<string | null>(null);
  const [showSetAmountForm, setShowSetAmountForm] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [setAmount, setSetAmount] = useState("");
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<string[]>([]);
  const [currency, setCurrency] = useState<"UAH" | "USD">("UAH");
  const [exchangeRate, setExchangeRate] = useState(37.5);
  const [viewMode, setViewMode] = useState<"cards" | "analytics">("cards");
  const [formData, setFormData] = useState({
    title: "",
    type: "financial" as "financial" | "task",
    targetAmount: "",
    category: "Дохід",
    deadline: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  useEffect(() => {
    dataStore.init();
    loadIncomeCategories();
    loadGoals();
    loadExchangeRate();
    
    // Оновлюємо дані кожні 2 секунди для синхронізації
    const interval = setInterval(() => {
      loadGoals();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadExchangeRate = async () => {
    const rate = await currencyAPI.getExchangeRate();
    setExchangeRate(rate);
  };

  const loadIncomeCategories = () => {
    const incomeCats = dataStore.categories.getByType("income");
    const categories = incomeCats.map(c => c.name);
    setIncomeCategories(categories);
  };

  const loadGoals = () => {
    setGoals(dataStore.goals.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      dataStore.goals.update(editingGoal.id, {
        title: formData.title,
        type: formData.type,
        targetAmount: formData.type === "financial" ? parseFloat(formData.targetAmount) : 0,
        category: formData.category,
        incomeCategories: formData.type === "financial" && selectedIncomeCategories.length > 0 ? selectedIncomeCategories : undefined,
        deadline: formData.deadline || undefined,
        description: formData.type === "task" ? formData.description : undefined,
        priority: formData.type === "task" ? formData.priority : undefined,
      });
    } else {
      const goal: Goal = {
        id: Date.now().toString(),
        title: formData.title,
        type: formData.type,
        targetAmount: formData.type === "financial" ? parseFloat(formData.targetAmount) : 0,
        currentAmount: 0,
        category: formData.category,
        incomeCategories: formData.type === "financial" && selectedIncomeCategories.length > 0 ? selectedIncomeCategories : undefined,
        deadline: formData.deadline || undefined,
        description: formData.type === "task" ? formData.description : undefined,
        completed: formData.type === "task" ? false : undefined,
        priority: formData.type === "task" ? formData.priority : undefined,
      };
      dataStore.goals.add(goal);
    }
    setFormData({ 
      title: "", 
      type: "financial",
      targetAmount: "", 
      category: "Дохід", 
      deadline: "",
      description: "",
      priority: "medium",
    });
    setSelectedIncomeCategories([]);
    setShowForm(false);
    setEditingGoal(null);
    loadGoals();
  };

  const handleEdit = (goal: Goal) => {
    // Сумісність зі старими цілями
    const goalType = goal.type || (goal.targetAmount > 0 ? "financial" : "task");
    setFormData({
      title: goal.title,
      type: goalType,
      targetAmount: goal.targetAmount?.toString() || "",
      category: goal.category,
      deadline: goal.deadline || "",
      description: goal.description || "",
      priority: goal.priority || "medium",
    });
    const categories = goal.incomeCategories || (goal.incomeCategory ? [goal.incomeCategory] : []);
    setSelectedIncomeCategories(categories);
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Ви впевнені, що хочете видалити цю ціль?")) {
      dataStore.goals.delete(id);
      loadGoals();
    }
  };

  const handleAddCategory = (category: string) => {
    if (!selectedIncomeCategories.includes(category)) {
      setSelectedIncomeCategories([...selectedIncomeCategories, category]);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setSelectedIncomeCategories(selectedIncomeCategories.filter(c => c !== category));
  };

  const updateGoalProgress = (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal && goal.type === "financial") {
      const newAmount = Math.min(Math.max(0, goal.currentAmount + amount), goal.targetAmount);
      dataStore.goals.update(goalId, { currentAmount: newAmount });
      loadGoals();
    }
  };

  const toggleTaskCompletion = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal && goal.type === "task") {
      dataStore.goals.update(goalId, { completed: !goal.completed });
      loadGoals();
    }
  };

  const setGoalProgress = (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newAmount = Math.min(Math.max(0, amount), goal.targetAmount);
      dataStore.goals.update(goalId, { currentAmount: newAmount });
      loadGoals();
    }
  };

  const handleAddExactAmount = (goalId: string) => {
    const amount = parseFloat(addAmount);
    if (!isNaN(amount) && amount !== 0) {
      updateGoalProgress(goalId, amount);
      setAddAmount("");
      setShowAddAmountForm(null);
    }
  };

  const handleSetExactAmount = (goalId: string) => {
    const amount = parseFloat(setAmount);
    if (!isNaN(amount) && amount >= 0) {
      setGoalProgress(goalId, amount);
      setSetAmount("");
      setShowSetAmountForm(null);
    }
  };

  const formatAmount = (amount: number) => {
    const converted = currency === "USD" ? amount / exchangeRate : amount;
    const symbol = currency === "USD" ? "$" : "₴";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Розрахунок статистики
  const totalGoals = goals.length;
  const financialGoals = goals.filter(g => !g.type || g.type === "financial");
  const taskGoals = goals.filter(g => g.type === "task");
  const completedFinancialGoals = financialGoals.filter(g => g.currentAmount >= g.targetAmount).length;
  const completedTaskGoals = taskGoals.filter(g => g.completed).length;
  const completedGoals = completedFinancialGoals + completedTaskGoals;
  const activeGoals = goals.filter(g => {
    if (g.type === "task") {
      return !g.completed;
    }
    return g.currentAmount < g.targetAmount;
  });
  const totalTarget = financialGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const totalCurrent = financialGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  // Дані для графіка прогресу по часу
  const progressHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dayProgress = (totalCurrent / 30) * (i + 1);
    return {
      date: date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" }),
      progress: Math.min(dayProgress, totalCurrent),
    };
  });

  // Дані для кругової діаграми по категоріях
  const goalsByCategory = goals.reduce((acc, goal) => {
    const category = goal.category || "Інше";
    if (!acc[category]) {
      acc[category] = { category, total: 0, current: 0, count: 0 };
    }
    acc[category].total += goal.targetAmount;
    acc[category].current += goal.currentAmount;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { category: string; total: number; current: number; count: number }>);

  const categoryChartData = Object.values(goalsByCategory).map((item, index) => ({
    name: item.category,
    value: item.current,
    total: item.total,
    progress: item.total > 0 ? (item.current / item.total) * 100 : 0,
    color: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"][index % 6],
  }));

  // Розрахунок прогнозу досягнення
  const calculateForecast = (goal: Goal) => {
    if (!goal.deadline) return null;
    
    const deadline = new Date(goal.deadline);
    const today = new Date();
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) return null;
    
    const remaining = goal.targetAmount - goal.currentAmount;
    const dailyNeeded = remaining / daysRemaining;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTransactions = dataStore.transactions.getByDateRange(weekAgo, new Date()) || [];
    const weekIncome = weekTransactions
      .filter(t => t.type === "income" && t.status === "received")
      .reduce((sum, t) => sum + t.amount, 0);
    const averageDaily = weekIncome / 7;
    
    return {
      daysRemaining,
      dailyNeeded,
      averageDaily,
      canAchieve: dailyNeeded <= averageDaily * 1.5,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              До головної
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-400" />
                Досягнення цілей
              </h1>
              <p className="text-slate-400 mt-2">
                Відстежуйте прогрес та досягайте своїх фінансових цілей
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CurrencySwitcher
              currency={currency}
              onCurrencyChange={setCurrency}
              exchangeRate={exchangeRate}
              onRateUpdate={setExchangeRate}
            />
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className={viewMode === "cards" ? "bg-purple-600" : ""}
              >
                <Target className="h-4 w-4 mr-2" />
                Цілі
              </Button>
              <Button
                variant={viewMode === "analytics" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("analytics")}
                className={viewMode === "analytics" ? "bg-purple-600" : ""}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Аналітика
              </Button>
            </div>
            <Button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setEditingGoal(null);
                  setFormData({ title: "", type: "financial", targetAmount: "", category: "Дохід", deadline: "", description: "", priority: "medium" });
                  setSelectedIncomeCategories([]);
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? "Скасувати" : "Додати ціль"}
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-800 bg-gradient-to-br from-purple-900/20 to-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Всього цілей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-100">{totalGoals}</p>
              <p className="text-xs text-slate-500 mt-1">{activeGoals.length} активних</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-gradient-to-br from-green-900/20 to-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Досягнуто
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{completedGoals}</p>
              <p className="text-xs text-slate-500 mt-1">
                {totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(0) : 0}% успішності
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-gradient-to-br from-pink-900/20 to-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Загальний прогрес
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-pink-400">{overallProgress.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">
                {formatAmount(totalCurrent)} / {formatAmount(totalTarget)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-gradient-to-br from-orange-900/20 to-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Залишилось
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-400">
                {formatAmount(Math.max(0, totalTarget - totalCurrent))}
              </p>
              <p className="text-xs text-slate-500 mt-1">До всіх цілей</p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-slate-100">
                {editingGoal ? "Редагувати ціль" : "Створити нову ціль"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Тип</Label>
                  <Select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as "financial" | "task" })
                    }
                  >
                    <option value="financial">Фінансова ціль</option>
                    <option value="task">Текстова задача</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Назва {formData.type === "task" ? "задачі" : "цілі"}</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={formData.type === "task" ? "Наприклад: Завершити проект" : "Наприклад: Досягти $10,000 доходу на місяць"}
                  />
                </div>
                {formData.type === "financial" ? (
                  <>
                    <div>
                      <Label htmlFor="targetAmount">Цільова сума (₴)</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        step="0.01"
                        required
                        value={formData.targetAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, targetAmount: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="description">Опис задачі</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Детальний опис задачі..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Пріоритет</Label>
                      <Select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value as "low" | "medium" | "high" })
                        }
                      >
                        <option value="low">Низький</option>
                        <option value="medium">Середній</option>
                        <option value="high">Високий</option>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="category">Категорія/Напрямок</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Наприклад: Дохід, Бізнес, Інвестиції"
                  />
                </div>
                {formData.type === "financial" && (
                <div>
                  <Label>
                    Категорії доходу для автоматичного оновлення (необов'язково)
                  </Label>
                  <div className="space-y-2">
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddCategory(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Додати категорію...</option>
                      {incomeCategories
                        .filter(cat => !selectedIncomeCategories.includes(cat))
                        .map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                    </Select>
                    {selectedIncomeCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedIncomeCategories.map((cat) => (
                          <div
                            key={cat}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30"
                          >
                            <span className="text-sm text-purple-300">{cat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="text-purple-300 hover:text-red-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Прогрес цілі буде автоматично оновлюватися при додаванні доходу з вибраних категорій
                  </p>
                </div>
                )}
                <div>
                  <Label htmlFor="deadline">Термін досягнення (необов'язково)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingGoal(null);
                      setFormData({ title: "", type: "financial", targetAmount: "", category: "Дохід", deadline: "", description: "", priority: "medium" });
                      setSelectedIncomeCategories([]);
                    }}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {editingGoal ? "Зберегти зміни" : "Створити ціль"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && goals.length > 0 && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-slate-100">Прогрес за останні 30 днів</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={progressHistory}>
                      <defs>
                        <linearGradient id="colorProgressGoals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tickFormatter={(value) => formatAmount(value)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatAmount(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="progress"
                        stroke="#a855f7"
                        fillOpacity={1}
                        fill="url(#colorProgressGoals)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-slate-100">Розподіл по категоріях</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, progress }) => `${name}: ${progress.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${formatAmount(value)} (${props.payload.progress.toFixed(1)}%)`,
                          props.payload.name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
              <CardHeader>
                <CardTitle className="text-slate-100">Детальна статистика по категоріях</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(goalsByCategory).map((item, index) => {
                    const progress = item.total > 0 ? (item.current / item.total) * 100 : 0;
                    return (
                      <div key={item.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-slate-100 font-medium">{item.category}</p>
                            <p className="text-xs text-slate-400">{item.count} {item.count === 1 ? 'ціль' : 'цілей'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-100 font-bold">{progress.toFixed(1)}%</p>
                            <p className="text-xs text-slate-400">
                              {formatAmount(item.current)} / {formatAmount(item.total)}
                            </p>
                          </div>
                        </div>
                        <Progress value={Math.min(progress, 100)} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Goals Cards View */}
        {viewMode === "cards" && goals.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Поки що немає цілей</p>
                <p className="text-sm text-slate-500 mt-2">
                  Створіть свою першу ціль, щоб почати відстежувати прогрес
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "cards" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              // Сумісність зі старими цілями без поля type
              const goalType = goal.type || (goal.targetAmount > 0 ? "financial" : "task");
              const isTask = goalType === "task";
              const progress = isTask 
                ? (goal.completed ? 100 : 0)
                : goal.targetAmount > 0
                  ? (goal.currentAmount / goal.targetAmount) * 100
                  : 0;
              const isCompleted = isTask 
                ? (goal.completed || false)
                : (goal.currentAmount || 0) >= (goal.targetAmount || 0);
              const forecast = !isTask ? calculateForecast(goal) : null;
              
              const priorityColors = {
                low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
                high: "bg-red-500/20 text-red-300 border-red-500/30",
              };
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40 hover:border-slate-700 transition-all ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-slate-100 flex items-center gap-2 flex-1">
                          <Target className={`h-5 w-5 ${isCompleted ? 'text-green-400' : 'text-purple-400'}`} />
                          {goal.title}
                        </CardTitle>
                        <div className="flex gap-2">
                          {isCompleted && (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(goal)}
                            className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(goal.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isTask ? (
                          <>
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleTaskCompletion(goal.id)}
                                className={cn(
                                  "mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                                  isCompleted
                                    ? "bg-green-500 border-green-500"
                                    : "border-slate-600 hover:border-green-500"
                                )}
                              >
                                {isCompleted && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {goal.priority && (
                                    <span className={cn(
                                      "text-xs px-2 py-0.5 rounded border",
                                      priorityColors[goal.priority]
                                    )}>
                                      {goal.priority === "low" ? "Низький" : goal.priority === "medium" ? "Середній" : "Високий"} пріоритет
                                    </span>
                                  )}
                                </div>
                                {goal.description && (
                                  <p className="text-sm text-slate-300 mb-3">{goal.description}</p>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Прогрес</span>
                                <span className={`font-medium ${isCompleted ? 'text-green-400' : 'text-slate-300'}`}>
                                  {progress.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={Math.min(progress, 100)} className={isCompleted ? 'bg-green-500/20' : ''} />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <div>
                                  <p className="text-sm text-slate-400">Поточний прогрес</p>
                                  <p className="text-xl font-bold text-slate-100">
                                    {formatAmount(goal.currentAmount)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-400">Ціль</p>
                                  <p className="text-xl font-bold text-purple-400">
                                    {formatAmount(goal.targetAmount)}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-800">
                                <p className="text-sm text-slate-400 mb-1">Залишилось досягти</p>
                                <p className="text-lg font-bold text-orange-400">
                                  {formatAmount(Math.max(0, goal.targetAmount - goal.currentAmount))}
                                </p>
                                {forecast && !isCompleted && (
                                  <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Прогноз досягнення
                                    </p>
                                    <p className="text-xs text-slate-300">
                                      {forecast.daysRemaining} {forecast.daysRemaining === 1 ? 'день' : forecast.daysRemaining < 5 ? 'дні' : 'днів'} залишилось
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      Потрібно: {formatAmount(forecast.dailyNeeded)}/день
                                    </p>
                                    {forecast.averageDaily > 0 && (
                                      <p className={`text-xs mt-1 ${forecast.canAchieve ? 'text-green-400' : 'text-orange-400'}`}>
                                        {forecast.canAchieve ? '✓' : '⚠'} Середнє: {formatAmount(forecast.averageDaily)}/день
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                        {goal.category && (
                          <p className="text-xs text-slate-500">
                            Напрямок: {goal.category}
                          </p>
                        )}
                        {(goal.incomeCategories && goal.incomeCategories.length > 0) || goal.incomeCategory ? (
                          <div className="space-y-1">
                            <p className="text-xs text-green-400 font-medium">
                              📊 Автоматично оновлюється з категорій:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(goal.incomeCategories || (goal.incomeCategory ? [goal.incomeCategory] : [])).map((cat) => (
                                <span
                                  key={cat}
                                  className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {goal.deadline && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>Термін: {new Date(goal.deadline).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}</span>
                            {forecast && forecast.daysRemaining > 0 && (
                              <span className="text-orange-400">
                                ({forecast.daysRemaining} {forecast.daysRemaining === 1 ? 'день' : forecast.daysRemaining < 5 ? 'дні' : 'днів'})
                              </span>
                            )}
                          </div>
                        )}
                        {!isTask && showAddAmountForm === goal.id ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Введіть суму для додавання/віднімання (₴)"
                              value={addAmount}
                              onChange={(e) => setAddAmount(e.target.value)}
                              className="w-full"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAddExactAmount(goal.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={!addAmount || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) === 0}
                              >
                                Додати
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const amount = parseFloat(addAmount);
                                  if (!isNaN(amount) && amount !== 0) {
                                    updateGoalProgress(goal.id, -amount);
                                    setAddAmount("");
                                    setShowAddAmountForm(null);
                                  }
                                }}
                                variant="destructive"
                                className="flex-1"
                                disabled={!addAmount || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) === 0}
                              >
                                Відняти
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowAddAmountForm(null);
                                  setAddAmount("");
                                }}
                                className="flex-1"
                              >
                                Скасувати
                              </Button>
                            </div>
                          </div>
                        ) : !isTask && showSetAmountForm === goal.id ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Встановити точну суму (₴)"
                              value={setAmount}
                              onChange={(e) => setSetAmount(e.target.value)}
                              className="w-full"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSetExactAmount(goal.id)}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                disabled={!setAmount || isNaN(parseFloat(setAmount)) || parseFloat(setAmount) < 0}
                              >
                                Встановити
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowSetAmountForm(null);
                                  setSetAmount("");
                                }}
                                className="flex-1"
                              >
                                Скасувати
                              </Button>
                            </div>
                          </div>
                        ) : !isTask ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setShowAddAmountForm(goal.id);
                                  setShowSetAmountForm(null);
                                }}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              >
                                Додати/Відняти
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setShowSetAmountForm(goal.id);
                                  setShowAddAmountForm(null);
                                  setSetAmount(goal.currentAmount.toString());
                                }}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                Встановити суму
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateGoalProgress(goal.id, goal.targetAmount * 0.1)}
                                className="flex-1 bg-green-600/80 hover:bg-green-700"
                              >
                                +10%
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateGoalProgress(goal.id, goal.targetAmount * 0.25)}
                                className="flex-1 bg-purple-600/80 hover:bg-purple-700"
                              >
                                +25%
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateGoalProgress(goal.id, -goal.targetAmount * 0.1)}
                                variant="destructive"
                                className="flex-1"
                              >
                                -10%
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
