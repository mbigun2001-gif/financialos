"use client";

import { useState, useEffect } from "react";
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
import { dataStore, Liability } from "@/lib/data";
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Calendar,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { currencyAPI } from "@/lib/currency-api";

export default function LiabilitiesPage() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<Liability | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [currency, setCurrency] = useState<"UAH" | "USD">("UAH");
  const [exchangeRate, setExchangeRate] = useState(37.5);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    totalAmount: "",
    paidAmount: "",
    currency: "USD" as "UAH" | "USD" | "EUR",
    paymentPeriod: "quarterly" as "monthly" | "quarterly" | "yearly",
    paymentAmount: "", // Сума платежу (вводиться вручну)
    firstPaymentDate: new Date().toISOString().split("T")[0], // Дата першого платежу
    description: "",
    notes: "",
  });

  useEffect(() => {
    dataStore.init();
    loadExchangeRate();
    loadLiabilities();
  }, []);

  const loadExchangeRate = async () => {
    const rate = await currencyAPI.getExchangeRate();
    setExchangeRate(rate);
  };

  const loadLiabilities = () => {
    const all = dataStore.liabilities.getAll();
    setLiabilities(all);
  };

  const calculateNextPaymentDate = (firstPaymentDate: string, period: string, currentPaid: number, paymentAmount: number) => {
    if (!paymentAmount || paymentAmount <= 0) {
      return new Date(firstPaymentDate);
    }
    
    const firstDate = new Date(firstPaymentDate);
    // Встановлюємо час на початок дня для правильної порівняння
    firstDate.setHours(0, 0, 0, 0);
    
    // Розраховуємо скільки платежів вже було зроблено
    const paidPayments = Math.floor(currentPaid / paymentAmount);
    
    // Розраховуємо наступну дату платежу від першої дати
    let nextDate = new Date(firstDate);
    
    // Додаємо періоди від першої дати платежу (наступний платіж = перший платіж + (вже зроблені платежі + 1) періодів)
    if (period === "monthly") {
      nextDate.setMonth(firstDate.getMonth() + paidPayments + 1);
    } else if (period === "quarterly") {
      nextDate.setMonth(firstDate.getMonth() + (paidPayments + 1) * 3);
    } else if (period === "yearly") {
      nextDate.setFullYear(firstDate.getFullYear() + paidPayments + 1);
    }
    
    // Якщо наступна дата вже минула, додаємо ще один період
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);
    
    if (nextDate <= today) {
      if (period === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (period === "quarterly") {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else if (period === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }
    
    return nextDate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = parseFloat(formData.totalAmount);
    const paidAmount = parseFloat(formData.paidAmount || "0");
    const paymentAmount = parseFloat(formData.paymentAmount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      alert("Будь ласка, вкажіть суму платежу");
      return;
    }
    
    // Розраховуємо наступну дату платежу
    const nextPaymentDate = calculateNextPaymentDate(formData.firstPaymentDate, formData.paymentPeriod, paidAmount, paymentAmount);

    if (editingLiability) {
      dataStore.liabilities.update(editingLiability.id, {
        name: formData.name,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        currency: formData.currency,
        paymentPeriod: formData.paymentPeriod,
        paymentAmount: paymentAmount,
        durationYears: 0,
        startDate: formData.firstPaymentDate,
        nextPaymentDate: nextPaymentDate.toISOString(),
        description: formData.description,
        notes: formData.notes,
      });
    } else {
      const liability: Liability = {
        id: Date.now().toString(),
        name: formData.name,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        currency: formData.currency,
        paymentPeriod: formData.paymentPeriod,
        paymentAmount: paymentAmount,
        durationYears: 0, // Не використовується, але залишаємо для сумісності
        startDate: formData.firstPaymentDate,
        nextPaymentDate: nextPaymentDate.toISOString(),
        description: formData.description,
        notes: formData.notes,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
      };
      dataStore.liabilities.add(liability);
    }

    setFormData({
      name: "",
      totalAmount: "",
      paidAmount: "",
      currency: "USD",
      paymentPeriod: "quarterly",
      paymentAmount: "",
      firstPaymentDate: new Date().toISOString().split("T")[0],
      description: "",
      notes: "",
    });
    setShowForm(false);
    setEditingLiability(null);
    loadLiabilities();
  };

  const handleEdit = (liability: Liability) => {
    setEditingLiability(liability);
    setFormData({
      name: liability.name,
      totalAmount: liability.totalAmount.toString(),
      paidAmount: liability.paidAmount.toString(),
      currency: liability.currency,
      paymentPeriod: liability.paymentPeriod,
      paymentAmount: liability.paymentAmount.toString(),
      firstPaymentDate: liability.startDate.split("T")[0],
      description: liability.description || "",
      notes: liability.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Ви впевнені, що хочете видалити це зобов'язання?")) {
      dataStore.liabilities.delete(id);
      loadLiabilities();
    }
  };

  const handleAddPayment = () => {
    if (!selectedLiability || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    dataStore.liabilities.addPayment(selectedLiability.id, amount);
    setShowPaymentDialog(false);
    setPaymentAmount("");
    setSelectedLiability(null);
    loadLiabilities();
  };

  const formatAmount = (amount: number, liabilityCurrency: "UAH" | "USD" | "EUR") => {
    const converted = currency === "USD" 
      ? (liabilityCurrency === "USD" ? amount : liabilityCurrency === "UAH" ? amount / exchangeRate : amount * 1.1)
      : (liabilityCurrency === "UAH" ? amount : liabilityCurrency === "USD" ? amount * exchangeRate : amount * exchangeRate * 1.1);
    const symbol = currency === "USD" ? "$" : "₴";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalLiabilities = dataStore.liabilities.getTotal();
  const totalPaid = dataStore.liabilities.getTotalPaid();
  const totalRemaining = dataStore.liabilities.getTotalRemaining();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Вклади та зобов'язання</h1>
          <p className="text-slate-400 mt-2">
            Відстеження ваших вкладів та поточних зобов'язань
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CurrencySwitcher
            currency={currency}
            onCurrencyChange={setCurrency}
            exchangeRate={exchangeRate}
            onRateUpdate={setExchangeRate}
          />
          <Button
            onClick={() => {
              setEditingLiability(null);
              setFormData({
                name: "",
                totalAmount: "",
                paidAmount: "",
                currency: "USD",
                paymentPeriod: "quarterly",
                paymentAmount: "",
                firstPaymentDate: new Date().toISOString().split("T")[0],
                description: "",
                notes: "",
              });
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати зобов'язання
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-gradient-to-br from-red-900/20 to-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              Загальна сума
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {formatAmount(totalLiabilities, "USD")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-gradient-to-br from-green-900/20 to-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Вже внесено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              {formatAmount(totalPaid, "USD")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {totalLiabilities > 0 ? ((totalPaid / totalLiabilities) * 100).toFixed(1) : 0}% від загальної суми
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-gradient-to-br from-orange-900/20 to-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Залишок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-400">
              {formatAmount(totalRemaining, "USD")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Залишилось виплатити
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">
              {editingLiability ? "Редагувати зобов'язання" : "Додати зобов'язання"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Введіть інформацію про ваше зобов'язання або вклад
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Назва</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Наприклад: Квартира"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="totalAmount">Загальна сума</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="71600"
                />
              </div>
              <div>
                <Label htmlFor="paidAmount">Вже внесено</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="16100"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="currency">Валюта</Label>
                <Select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as "UAH" | "USD" | "EUR" })}
                >
                  <option value="UAH">₴ UAH</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentPeriod">Період платежів</Label>
                <Select
                  id="paymentPeriod"
                  value={formData.paymentPeriod}
                  onChange={(e) => setFormData({ ...formData, paymentPeriod: e.target.value as "monthly" | "quarterly" | "yearly" })}
                >
                  <option value="monthly">Щомісяця</option>
                  <option value="quarterly">Поквартально</option>
                  <option value="yearly">Щорічно</option>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="paymentAmount">Сума платежу *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                  placeholder="13875"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Сума, яку ви платите {formData.paymentPeriod === "monthly" ? "щомісяця" : formData.paymentPeriod === "quarterly" ? "поквартально" : "щорічно"}
                </p>
              </div>
              <div>
                <Label htmlFor="firstPaymentDate">Дата першого платежу *</Label>
                <Input
                  id="firstPaymentDate"
                  type="date"
                  required
                  value={formData.firstPaymentDate}
                  onChange={(e) => setFormData({ ...formData, firstPaymentDate: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Дата, коли був/буде перший платіж
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Опис (необов'язково)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Короткий опис..."
              />
            </div>
            <div>
              <Label htmlFor="notes">Примітки (необов'язково)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Додаткові примітки..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingLiability(null);
                }}
              >
                Скасувати
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
                {editingLiability ? "Зберегти зміни" : "Додати зобов'язання"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-100">
              Додати платіж
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Вкажіть суму внесеного платежу для "{selectedLiability?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">Сума платежу</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {selectedLiability && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Поточний прогрес:</p>
                <p className="text-lg font-bold text-slate-100">
                  {formatAmount(selectedLiability.paidAmount, selectedLiability.currency)} / {formatAmount(selectedLiability.totalAmount, selectedLiability.currency)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Після платежу: {formatAmount(selectedLiability.paidAmount + parseFloat(paymentAmount || "0"), selectedLiability.currency)} / {formatAmount(selectedLiability.totalAmount, selectedLiability.currency)}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentAmount("");
                  setSelectedLiability(null);
                }}
              >
                Скасувати
              </Button>
              <Button
                onClick={handleAddPayment}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                Додати платіж
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Liabilities List */}
      {liabilities.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Поки що немає зобов'язань</p>
            <p className="text-sm text-slate-500 mt-2">
              Додайте ваше перше зобов'язання або вклад
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {liabilities.map((liability) => {
            const progress = (liability.paidAmount / liability.totalAmount) * 100;
            const remaining = liability.totalAmount - liability.paidAmount;
            const nextPayment = new Date(liability.nextPaymentDate);
            const isOverdue = nextPayment < new Date() && remaining > 0;
            const daysUntilPayment = Math.ceil((nextPayment.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={liability.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40 hover:border-slate-700 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-slate-100 text-xl mb-2">
                          {liability.name}
                        </CardTitle>
                        {liability.description && (
                          <p className="text-sm text-slate-400 mb-2">{liability.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(liability)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(liability.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Прогрес</span>
                        <span className="text-slate-300 font-medium">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Загальна сума</p>
                        <p className="text-lg font-bold text-red-400">
                          {formatAmount(liability.totalAmount, liability.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Внесено</p>
                        <p className="text-lg font-bold text-green-400">
                          {formatAmount(liability.paidAmount, liability.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Залишок</p>
                        <p className="text-lg font-bold text-orange-400">
                          {formatAmount(remaining, liability.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-slate-800">
                      <div>
                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Наступний платіж
                        </p>
                        <p className={`text-base font-bold ${isOverdue ? 'text-red-400' : 'text-slate-100'}`}>
                          {nextPayment.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {isOverdue ? (
                          <p className="text-xs text-red-400 mt-1">Прострочено</p>
                        ) : (
                          <p className="text-xs text-slate-500 mt-1">
                            {daysUntilPayment > 0 ? `Через ${daysUntilPayment} ${daysUntilPayment === 1 ? 'день' : daysUntilPayment < 5 ? 'дні' : 'днів'}` : 'Сьогодні'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Сума платежу</p>
                        <p className="text-base font-bold text-blue-400">
                          {formatAmount(liability.paymentAmount, liability.currency)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {liability.paymentPeriod === "monthly" ? "Щомісяця" : liability.paymentPeriod === "quarterly" ? "Поквартально" : "Щорічно"}
                        </p>
                      </div>
                    </div>

                    {remaining > 0 && (
                      <Button
                        onClick={() => {
                          setSelectedLiability(liability);
                          setPaymentAmount(liability.paymentAmount.toString());
                          setShowPaymentDialog(true);
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Додати платіж
                      </Button>
                    )}

                    {liability.notes && (
                      <div className="pt-2 border-t border-slate-800">
                        <p className="text-xs text-slate-500">{liability.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
