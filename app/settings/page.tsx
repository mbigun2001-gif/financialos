"use client";

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
import {
  Settings as SettingsIcon,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Receipt,
  CreditCard,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Upload,
  Cloud,
  FileText,
  QrCode,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { dataStore, Category, Transaction } from "@/lib/data";
import { monobankAPI, MonobankAccount } from "@/lib/monobank-api";
import { TransactionImport } from "@/components/transaction-import";
import { motion } from "framer-motion";
import {
  exportToFile,
  importFromFile,
  generateSyncQRCode,
  parseSyncQRCode,
  startAutoSync,
} from "@/lib/sync";

export default function SettingsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "income" as "income" | "expense",
    color: "#3b82f6",
  });
  
  // Monobank налаштування
  const [monobankToken, setMonobankToken] = useState("");
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<"idle" | "success" | "error">("idle");
  const [tokenError, setTokenError] = useState("");
  const [accounts, setAccounts] = useState<MonobankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [defaultIncomeCategory, setDefaultIncomeCategory] = useState("");
  const [defaultExpenseCategory, setDefaultExpenseCategory] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");

  useEffect(() => {
    dataStore.init();
    loadCategories();
    loadMonobankSettings();
  }, []);

  const loadMonobankSettings = () => {
    const token = monobankAPI.getToken();
    if (token) {
      setMonobankToken(token);
      testToken(token);
    }
    const incomeCat = dataStore.settings.get("monobank_default_income_category");
    const expenseCat = dataStore.settings.get("monobank_default_expense_category");
    if (incomeCat) setDefaultIncomeCategory(incomeCat);
    if (expenseCat) setDefaultExpenseCategory(expenseCat);
  };

  const testToken = async (token?: string) => {
    const tokenToTest = token || monobankToken;
    if (!tokenToTest) return;

    setIsTestingToken(true);
    setTokenStatus("idle");
    setTokenError("");

    try {
      monobankAPI.setToken(tokenToTest);
      const clientInfo = await monobankAPI.getClientInfo();
      setAccounts(clientInfo.accounts);
      setTokenStatus("success");
      if (clientInfo.accounts.length > 0) {
        setSelectedAccount(clientInfo.accounts[0].id);
      }
    } catch (error: any) {
      setTokenStatus("error");
      setTokenError(error.message || "Помилка підключення до Monobank API");
      setAccounts([]);
    } finally {
      setIsTestingToken(false);
    }
  };

  const saveToken = () => {
    if (monobankToken.trim()) {
      monobankAPI.setToken(monobankToken.trim());
      testToken(monobankToken.trim());
    }
  };

  const removeToken = () => {
    monobankAPI.clearToken();
    setMonobankToken("");
    setTokenStatus("idle");
    setTokenError("");
    setAccounts([]);
    setSelectedAccount("");
  };

  const importTransactions = async () => {
    if (!selectedAccount) {
      alert("Будь ласка, оберіть рахунок");
      return;
    }

    setIsImporting(true);
    setImportProgress("Отримання транзакцій...");

    try {
      // Отримуємо транзакції за останні 30 днів
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const from = Math.floor(thirtyDaysAgo / 1000); // Monobank використовує секунди
      const to = Math.floor(now / 1000);

      const transactions = await monobankAPI.getStatement(selectedAccount, from, to);
      const account = accounts.find(a => a.id === selectedAccount);
      
      if (!account) {
        throw new Error("Рахунок не знайдено");
      }

      setImportProgress(`Обробка ${transactions.length} транзакцій...`);

      // Конвертуємо та додаємо транзакції
      let imported = 0;
      let skipped = 0;

      for (const monoTrans of transactions) {
        const converted = monobankAPI.convertTransaction(
          monoTrans,
          account,
          defaultIncomeCategory || undefined,
          defaultExpenseCategory || undefined
        );

        if (converted) {
          // Перевіряємо, чи транзакція вже існує (за ID з Monobank)
          const existing = dataStore.transactions.getAll().find(
            t => t.description.includes(monoTrans.id) || 
            (t.date === converted.date && t.amount === converted.amount && t.type === converted.type)
          );

          if (!existing) {
            const transaction: Transaction = {
              id: `mono_${monoTrans.id}_${Date.now()}`,
              ...converted,
            };
            dataStore.transactions.add(transaction);
            imported++;
          } else {
            skipped++;
          }
        }
      }

      setImportProgress(`Імпортовано: ${imported}, пропущено: ${skipped}`);
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress("");
        alert(`Імпорт завершено!\nІмпортовано: ${imported}\nПропущено (дублікати): ${skipped}`);
      }, 2000);
    } catch (error: any) {
      setIsImporting(false);
      setImportProgress("");
      alert(`Помилка імпорту: ${error.message}`);
    }
  };

  const loadCategories = () => {
    setCategories(dataStore.categories.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      dataStore.categories.update(editingCategory.id, {
        name: formData.name,
        type: formData.type,
        color: formData.color,
      });
    } else {
      const category: Category = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        color: formData.color,
      };
      dataStore.categories.add(category);
    }

    setFormData({ name: "", type: "income", color: "#3b82f6" });
    setShowAddDialog(false);
    setEditingCategory(null);
    loadCategories();
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || "#3b82f6",
    });
    setEditingCategory(category);
    setShowAddDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Ви впевнені, що хочете видалити цю категорію?")) {
      dataStore.categories.delete(id);
      loadCategories();
    }
  };

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  const presetColors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#6366f1", // indigo
    "#f97316", // orange
    "#6b7280", // gray
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Налаштування</h1>
          <p className="text-slate-400 mt-2">
            Керування категоріями доходів та розходів
          </p>
        </div>
      </motion.div>

      {/* Категорії доходів */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Категорії доходів
              </CardTitle>
              <Button
                onClick={() => {
                  setFormData({ name: "", type: "income", color: "#3b82f6" });
                  setEditingCategory(null);
                  setShowAddDialog(true);
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати категорію
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {incomeCategories.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                Поки що немає категорій доходів
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color || "#3b82f6" }}
                      />
                      <span className="text-slate-100 font-medium">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
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

      {/* Категорії розходів */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-400" />
                Категорії розходів
              </CardTitle>
              <Button
                onClick={() => {
                  setFormData({ name: "", type: "expense", color: "#ef4444" });
                  setEditingCategory(null);
                  setShowAddDialog(true);
                }}
                variant="destructive"
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати категорію
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                Поки що немає категорій розходів
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color || "#ef4444" }}
                      />
                      <span className="text-slate-100 font-medium">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
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

      {/* Імпорт транзакцій */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-400" />
              Імпорт транзакцій
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Імпортуйте доходи та розходи з таблиць (CSV, JSON) або фотографій
            </p>
            <TransactionImport />
          </CardContent>
        </Card>
      </motion.div>

      {/* Monobank інтеграція */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              Інтеграція з Monobank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="monobank-token" className="text-slate-300">
                Personal API Token
              </Label>
              <p className="text-xs text-slate-500 mb-2">
                Отримайте токен у додатку Monobank: Налаштування → API → Personal API
              </p>
              <div className="flex gap-2">
                <Input
                  id="monobank-token"
                  type="password"
                  value={monobankToken}
                  onChange={(e) => setMonobankToken(e.target.value)}
                  placeholder="Вставте ваш Personal API токен"
                  className="bg-slate-800 border-slate-700 text-slate-100 flex-1"
                />
                <Button
                  onClick={saveToken}
                  disabled={isTestingToken || !monobankToken.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isTestingToken ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Перевірка...
                    </>
                  ) : (
                    "Зберегти"
                  )}
                </Button>
                {monobankToken && (
                  <Button
                    onClick={removeToken}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                  >
                    Видалити
                  </Button>
                )}
              </div>
              {tokenStatus === "success" && (
                <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Токен валідний. Підключення успішне!</span>
                </div>
              )}
              {tokenStatus === "error" && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <XCircle className="h-4 w-4" />
                  <span>{tokenError}</span>
                </div>
              )}
            </div>

            {tokenStatus === "success" && accounts.length > 0 && (
              <>
                <div>
                  <Label htmlFor="monobank-account" className="text-slate-300">
                    Оберіть рахунок для імпорту
                  </Label>
                  <Select
                    id="monobank-account"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-slate-100 mt-1"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.maskedPan?.[0] || account.iban} - {account.balance / 100} ₴
                        {account.type === "black" ? " (Black)" : ""}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default-income-category" className="text-slate-300">
                      Категорія за замовчуванням для доходів
                    </Label>
                    <Select
                      id="default-income-category"
                      value={defaultIncomeCategory}
                      onChange={(e) => {
                        setDefaultIncomeCategory(e.target.value);
                        dataStore.settings.set("monobank_default_income_category", e.target.value);
                      }}
                      className="bg-slate-800 border-slate-700 text-slate-100 mt-1"
                    >
                      <option value="">Автоматично</option>
                      {incomeCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="default-expense-category" className="text-slate-300">
                      Категорія за замовчуванням для розходів
                    </Label>
                    <Select
                      id="default-expense-category"
                      value={defaultExpenseCategory}
                      onChange={(e) => {
                        setDefaultExpenseCategory(e.target.value);
                        dataStore.settings.set("monobank_default_expense_category", e.target.value);
                      }}
                      className="bg-slate-800 border-slate-700 text-slate-100 mt-1"
                    >
                      <option value="">Автоматично</option>
                      {expenseCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <Button
                    onClick={importTransactions}
                    disabled={isImporting || !selectedAccount}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {importProgress || "Імпорт..."}
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Імпортувати транзакції (останні 30 днів)
                      </>
                    )}
                  </Button>
                  {importProgress && (
                    <p className="text-sm text-slate-400 mt-2 text-center">{importProgress}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Синхронізація даних */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-400" />
              Синхронізація даних
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-400">
              Експортуйте або імпортуйте дані для синхронізації між пристроями (телефон, комп'ютер, веб-версія).
              <br />
              <span className="text-xs text-slate-500 mt-1 block">
                Включає: транзакції, цілі, активи, зобов'язання, категорії, користувачів та налаштування
              </span>
            </p>

            {syncStatus !== "idle" && (
              <div
                className={`p-3 rounded-lg ${
                  syncStatus === "success"
                    ? "bg-green-500/20 border border-green-500/30 text-green-300"
                    : syncStatus === "error"
                    ? "bg-red-500/20 border border-red-500/30 text-red-300"
                    : "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                }`}
              >
                {syncMessage || (syncStatus === "syncing" ? "Синхронізація..." : "")}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <Button
                onClick={() => {
                  try {
                    exportToFile();
                    setSyncStatus("success");
                    setSyncMessage("Дані успішно експортовано у файл");
                    setTimeout(() => setSyncStatus("idle"), 3000);
                  } catch (error) {
                    setSyncStatus("error");
                    setSyncMessage("Помилка експорту даних");
                    setTimeout(() => setSyncStatus("idle"), 3000);
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Експортувати дані
              </Button>

              <Button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      setSyncStatus("syncing");
                      setSyncMessage("Імпорт даних...");
                      try {
                        await importFromFile(file);
                        setSyncStatus("success");
                        setSyncMessage("Дані успішно імпортовано");
                        // Перезавантажуємо дані
                        loadCategories();
                        setTimeout(() => {
                          setSyncStatus("idle");
                          window.location.reload();
                        }, 2000);
                      } catch (error) {
                        setSyncStatus("error");
                        setSyncMessage("Помилка імпорту даних");
                        setTimeout(() => setSyncStatus("idle"), 3000);
                      }
                    }
                  };
                  input.click();
                }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Upload className="h-4 w-4 mr-2" />
                Імпортувати дані
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-3">
                Для синхронізації між пристроями:
              </p>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>Експортуйте дані на одному пристрої</li>
                <li>Передайте файл на інший пристрої (через email, cloud storage тощо)</li>
                <li>Імпортуйте дані на іншому пристрої</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Діалог додавання/редагування категорії */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {editingCategory ? "Редагувати категорію" : "Додати нову категорію"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingCategory
                ? "Оновіть інформацію про категорію"
                : "Створіть нову категорію для доходів або розходів"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category-name" className="text-slate-300">
                Назва категорії
              </Label>
              <Input
                id="category-name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Наприклад: Shopify, Бізнес, Оренда"
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
            <div>
              <Label htmlFor="category-type" className="text-slate-300">
                Тип категорії
              </Label>
              <Select
                id="category-type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "income" | "expense",
                  })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
              >
                <option value="income">Дохід</option>
                <option value="expense">Розхід</option>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 mb-2 block">Колір</Label>
              <div className="flex gap-2 flex-wrap">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? "border-slate-100 scale-110"
                        : "border-slate-700 hover:border-slate-500"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="mt-2 h-12 bg-slate-800 border-slate-700"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingCategory(null);
                  setFormData({ name: "", type: "income", color: "#3b82f6" });
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                className={
                  formData.type === "income"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                }
              >
                {editingCategory ? "Зберегти зміни" : "Додати категорію"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
