"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataStore, Goal } from "@/lib/data";
import { PiggyBank, Plus, Target, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { currencyConverter } from "@/lib/currency";

const goalCategories = [
  "Накопичення",
  "Дохід",
  "Інвестиції",
  "Особисте",
  "Бізнес",
  "Інше",
];

export default function SavingsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    category: "Накопичення",
    deadline: "",
  });

  useEffect(() => {
    dataStore.init();
    loadGoals();
  }, []);

  const loadGoals = () => {
    setGoals(dataStore.goals.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goal: Goal = {
      id: Date.now().toString(),
      title: formData.title,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      category: formData.category,
      deadline: formData.deadline || undefined,
    };
    dataStore.goals.add(goal);
    setFormData({ title: "", targetAmount: "", category: "Накопичення", deadline: "" });
    setShowForm(false);
    loadGoals();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Накопичення та цілі</h1>
            <p className="text-slate-400 mt-2">
              Встановіть та відстежуйте свої фінансові цілі
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Скасувати" : "Додати ціль"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Створити нову ціль</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Назва цілі</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Наприклад: Накопичити на машину"
                />
              </div>
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
              <div>
                <Label htmlFor="category">Категорія</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {goalCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
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
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200">
                Створити ціль
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0
              ? (goal.currentAmount / goal.targetAmount) * 100
              : 0;
            return (
              <Card key={goal.id} className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Target className="h-5 w-5" />
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
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Поточний прогрес</p>
                          <p className="text-xl font-bold text-slate-100">
                            ₴{goal.currentAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {currencyConverter.formatUSD(currencyConverter.uahToUsd(goal.currentAmount))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Ціль</p>
                          <p className="text-xl font-bold text-blue-400">
                            ₴{goal.targetAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {currencyConverter.formatUSD(currencyConverter.uahToUsd(goal.targetAmount))}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <p className="text-sm text-slate-400 mb-1">Залишилось досягти</p>
                        <p className="text-lg font-bold text-orange-400">
                          ₴{Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {currencyConverter.formatUSD(currencyConverter.uahToUsd(Math.max(0, goal.targetAmount - goal.currentAmount)))}
                        </p>
                      </div>
                    </div>
                    {goal.category && (
                      <p className="text-xs text-slate-500">
                        Категорія: {goal.category}
                      </p>
                    )}
                    {goal.deadline && (
                      <p className="text-xs text-slate-500">
                        Термін: {new Date(goal.deadline).toLocaleDateString("uk-UA")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
