"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { dataStore, Transaction } from "@/lib/data";
import { TrendingUp, Receipt, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function TransactionsPage() {
  const [incomeTransactions, setIncomeTransactions] = useState<Transaction[]>([]);
  const [expenseTransactions, setExpenseTransactions] = useState<Transaction[]>([]);
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    source: "",
    description: "",
    status: "received" as "received" | "pending",
    assetId: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "",
    description: "",
    assetId: "",
  });
  const [availableAssets, setAvailableAssets] = useState<Array<{id: string, name: string, type: string}>>([]);

  useEffect(() => {
    dataStore.init();
    loadCategories();
    loadAssets();
    loadTransactions();
  }, []);

  const loadAssets = () => {
    const allAssets = dataStore.assets.getAll();
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
    setIncomeSources(sources.length > 0 ? sources : ["Shopify", "Менторинг", "Дерево", "Метал", "Інше"]);
    setExpenseCategories(categories.length > 0 ? categories : ["Бізнес", "Особисте", "Оренда", "Комунікації", "Транспорт", "Інше"]);
    
    if (sources.length > 0 && !incomeForm.source) {
      setIncomeForm(prev => ({ ...prev, source: sources[0] }));
    }
    if (categories.length > 0 && !expenseForm.category) {
      setExpenseForm(prev => ({ ...prev, category: categories[0] }));
    }
  };

  const loadTransactions = () => {
    const all = dataStore.transactions.getAll();
    setIncomeTransactions(all.filter(t => t.type === "income"));
    setExpenseTransactions(all.filter(t => t.type === "expense"));
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
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
      assetId: incomeForm.assetId || undefined,
    };
    dataStore.transactions.add(transaction);
    setIncomeForm({ 
      amount: "", 
      source: incomeSources[0] || "", 
      description: "",
      status: "received",
      assetId: incomeForm.assetId
    });
    setShowIncomeForm(false);
    loadTransactions();
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
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
    setExpenseForm({ 
      amount: "", 
      category: expenseCategories[0] || "", 
      description: "",
      assetId: expenseForm.assetId
    });
    setShowExpenseForm(false);
    loadTransactions();
  };

  const handleDelete = (id: string, type: "income" | "expense") => {
    if (confirm("Ви впевнені, що хочете видалити цю транзакцію?")) {
      dataStore.transactions.delete(id);
      loadTransactions();
    }
  };

  const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = incomeTotal - expenseTotal;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Доходи та розходи</h1>
          <p className="text-slate-400 mt-2">
            Управління вашими фінансовими транзакціями
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-slate-800 bg-gradient-to-br from-green-900/20 to-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Загальний дохід
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              ₴{incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-gradient-to-br from-red-900/20 to-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-400" />
              Загальні розходи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              ₴{expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className={`border-slate-800 ${netProfit >= 0 ? 'bg-gradient-to-br from-blue-900/20 to-slate-900/50' : 'bg-gradient-to-br from-orange-900/20 to-slate-900/50'}`}>
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Чистий прибуток</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {netProfit >= 0 ? '+' : ''}₴{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Income Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-400" />
              Доходи
            </h2>
            <Button
              onClick={() => setShowIncomeForm(!showIncomeForm)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-200"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showIncomeForm ? "Скасувати" : "Додати"}
            </Button>
          </div>

          {showIncomeForm && (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-100 text-lg">Додати дохід</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleIncomeSubmit} className="space-y-4">
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
                    >
                      {incomeSources.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="income-asset">Рахунок/Актив (необов'язково)</Label>
                    <Select
                      id="income-asset"
                      value={incomeForm.assetId}
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
                  <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    Додати дохід
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-slate-100 text-lg">Історія доходів</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeTransactions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Поки що немає доходів</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {incomeTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-100 font-medium truncate">
                          {transaction.source || "Дохід"}
                        </p>
                        <p className="text-sm text-slate-400 truncate">
                          {transaction.description || "Без опису"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(transaction.date).toLocaleDateString("uk-UA")}
                          {transaction.status && (
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                              transaction.status === "received" 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {transaction.status === "received" ? "Отримано" : "Очікується"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <p className="text-lg font-bold text-green-400 whitespace-nowrap">
                          +₴{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id, "income")}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-red-400" />
              Розходи
            </h2>
            <Button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              variant="destructive"
              className="shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showExpenseForm ? "Скасувати" : "Додати"}
            </Button>
          </div>

          {showExpenseForm && (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-100 text-lg">Додати розхід</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
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
                      value={expenseForm.assetId}
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
                  <Button type="submit" variant="destructive" className="w-full shadow-lg shadow-red-500/20 hover:shadow-red-500/30">
                    Додати розхід
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-slate-100 text-lg">Історія розходів</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseTransactions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Поки що немає розходів</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {expenseTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-100 font-medium truncate">
                          {transaction.category}
                        </p>
                        <p className="text-sm text-slate-400 truncate">
                          {transaction.description || "Без опису"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(transaction.date).toLocaleDateString("uk-UA")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <p className="text-lg font-bold text-red-400 whitespace-nowrap">
                          -₴{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id, "expense")}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
