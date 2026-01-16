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
import { dataStore, Asset, AssetType } from "@/lib/data";
import {
  Building2,
  Plus,
  ArrowLeft,
  Wallet,
  Car,
  Coins,
  Home,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { currencyAPI } from "@/lib/currency-api";
import { cryptoAPI } from "@/lib/crypto-api";
import { currencyConverter } from "@/lib/currency";

const assetTypes: { value: AssetType; label: string; icon: any }[] = [
  { value: "liquid", label: "Ліквідний", icon: Wallet },
  { value: "illiquid", label: "Неліквідний", icon: Building2 },
  { value: "car", label: "Автомобіль", icon: Car },
  { value: "cash", label: "Готівка", icon: Wallet },
  { value: "crypto", label: "Криптовалюта", icon: Coins },
  { value: "property", label: "Нерухомість", icon: Home },
  { value: "other", label: "Інше", icon: TrendingUp },
];

const currencies = ["UAH", "USD", "EUR", "BTC", "ETH"];

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"];

export default function CapitalPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [currency, setCurrency] = useState<"UAH" | "USD">("UAH");
  const [exchangeRate, setExchangeRate] = useState(37.5);
  const [ethPrice, setEthPrice] = useState(3000); // USD
  const [btcPrice, setBtcPrice] = useState(50000); // USD
  const [formData, setFormData] = useState({
    name: "",
    type: "liquid" as AssetType,
    value: "",
    cryptoAmount: "", // Кількість криптовалюти
    currency: "UAH" as "UAH" | "USD" | "EUR" | "BTC" | "ETH",
    description: "",
    notes: "",
  });

  useEffect(() => {
    dataStore.init();
    loadExchangeRate();
    loadCryptoPrices().then(() => {
      loadAssets();
    });
    
    // Оновлюємо ціни криптовалют кожні 30 секунд
    const cryptoInterval = setInterval(() => {
      loadCryptoPrices().then(() => {
        // Після оновлення цін, перераховуємо вартість активів
        loadAssets();
      });
    }, 30000);
    return () => clearInterval(cryptoInterval);
  }, []);

  const loadExchangeRate = async () => {
    const rate = await currencyAPI.getExchangeRate();
    setExchangeRate(rate);
  };

  const loadCryptoPrices = async () => {
    const eth = await cryptoAPI.getETHPrice();
    const btc = await cryptoAPI.getBTCPrice();
    setEthPrice(eth);
    setBtcPrice(btc);
  };

  const loadAssets = () => {
    const allAssets = dataStore.assets.getAll();
    // Оновлюємо вартість активів з криптовалютою на основі актуальних цін
    const updatedAssets = allAssets.map(asset => {
      if ((asset.currency === "BTC" || asset.currency === "ETH") && asset.cryptoAmount) {
        // Оновлюємо вартість на основі актуальної ціни та збереженої кількості монет
        const currentCryptoPrice = asset.currency === "BTC" ? btcPrice : ethPrice;
        const newValue = asset.cryptoAmount * currentCryptoPrice * exchangeRate;
        // Оновлюємо вартість в dataStore (тільки якщо змінилася)
        if (Math.abs(asset.value - newValue) > 0.01) {
          dataStore.assets.update(asset.id, { value: newValue });
        }
        return { ...asset, value: newValue };
      }
      return asset;
    });
    setAssets(updatedAssets);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Конвертуємо значення в UAH для зберігання
    let valueInUAH = parseFloat(formData.value);
    let cryptoAmount: number | undefined = undefined;
    
    if (formData.currency === "USD") {
      valueInUAH = valueInUAH * exchangeRate;
    } else if (formData.currency === "EUR") {
      valueInUAH = valueInUAH * (exchangeRate * 1.1); // Приблизний курс EUR
    } else if (formData.currency === "BTC" || formData.currency === "ETH") {
      // Для криптовалют використовуємо кількість та актуальну ціну з API
      const cryptoRate = formData.currency === "BTC" ? btcPrice : ethPrice; // USD
      cryptoAmount = parseFloat(formData.cryptoAmount); // Кількість монет
      valueInUAH = cryptoAmount * cryptoRate * exchangeRate;
    }

    if (editingAsset) {
      dataStore.assets.update(editingAsset.id, {
        name: formData.name,
        type: formData.type,
        value: valueInUAH,
        currency: formData.currency,
        description: formData.description,
        notes: formData.notes,
        ...(formData.currency === "BTC" || formData.currency === "ETH" ? {
          cryptoAmount: cryptoAmount!,
          cryptoPriceAtPurchase: formData.currency === "BTC" ? btcPrice : ethPrice,
        } : {}),
      });
    } else {
      const asset: Asset = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        value: valueInUAH,
        currency: formData.currency,
        description: formData.description,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        notes: formData.notes,
        ...(formData.currency === "BTC" || formData.currency === "ETH" ? {
          cryptoAmount: cryptoAmount!,
          cryptoPriceAtPurchase: formData.currency === "BTC" ? btcPrice : ethPrice,
        } : {}),
      };
      dataStore.assets.add(asset);
    }

    setFormData({
      name: "",
      type: "liquid",
      value: "",
      cryptoAmount: "",
      currency: "UAH",
      description: "",
      notes: "",
    });
    setShowForm(false);
    setEditingAsset(null);
    loadAssets();
  };

  const handleEdit = (asset: Asset) => {
    // Конвертуємо назад для відображення
    let displayValue = asset.value;
    if (asset.currency === "USD") {
      displayValue = asset.value / exchangeRate;
    } else if (asset.currency === "EUR") {
      displayValue = asset.value / (exchangeRate * 1.1);
    }

    setFormData({
      name: asset.name,
      type: asset.type,
      value: (asset.currency === "BTC" || asset.currency === "ETH") ? "" : displayValue.toString(),
      cryptoAmount: (asset.currency === "BTC" || asset.currency === "ETH") && asset.cryptoAmount 
        ? asset.cryptoAmount.toString() 
        : "",
      currency: asset.currency,
      description: asset.description || "",
      notes: asset.notes || "",
    });
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Ви впевнені, що хочете видалити цей актив?")) {
      dataStore.assets.delete(id);
      loadAssets();
    }
  };

  const totalCapital = dataStore.assets.getTotal();
  const formatAmount = (amount: number) => {
    const converted = currency === "USD" ? amount / exchangeRate : amount;
    const symbol = currency === "USD" ? "$" : "₴";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Дані для графіка
  const chartData = assetTypes.map((type, index) => {
    const typeTotal = dataStore.assets.getTotal(type.value);
    return {
      name: type.label,
      value: typeTotal,
      color: COLORS[index % COLORS.length],
    };
  }).filter(item => item.value > 0);

  // Розподіл по типах
  const assetsByType = assetTypes.map((type) => ({
    type: type.label,
    total: dataStore.assets.getTotal(type.value),
    count: dataStore.assets.getByType(type.value).length,
  })).filter(item => item.total > 0 || item.count > 0);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Капітал</h1>
            <p className="text-slate-400 mt-2">
              Відстеження та управління вашими активами
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
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingAsset(null);
              setFormData({
                name: "",
                type: "liquid",
                value: "",
                cryptoAmount: "",
                currency: "UAH",
                description: "",
                notes: "",
              });
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати актив
          </Button>
        </div>
      </motion.div>

      {/* Total Capital */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-400" />
              Загальний капітал
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {formatAmount(totalCapital)}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {assets.length} активів у портфелі
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
              <CardHeader>
                <CardTitle className="text-slate-100">Розподіл капіталу</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatAmount(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
              <CardHeader>
                <CardTitle className="text-slate-100">Капітал по типах</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assetsByType.map((item, index) => {
                    const typeInfo = assetTypes.find(t => t.label === item.type);
                    const Icon = typeInfo?.icon || Building2;
                    const percentage = totalCapital > 0 ? (item.total / totalCapital) * 100 : 0;
                    return (
                      <div key={item.type} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-700/50">
                            <Icon className="h-5 w-5 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-slate-100 font-medium">{item.type}</p>
                            <p className="text-xs text-slate-400">{item.count} активів</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-100">
                            {formatAmount(item.total)}
                          </p>
                          <p className="text-xs text-slate-400">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Assets List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Мої активи</h2>
          <p className="text-slate-400 mt-1">
            Детальний список всіх активів
          </p>
        </div>
        {assets.length === 0 ? (
          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Поки що немає активів</p>
                <p className="text-sm text-slate-500 mt-2">
                  Додайте свій перший актив, щоб почати відстежувати капітал
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset, index) => {
              const typeInfo = assetTypes.find(t => t.value === asset.type);
              const Icon = typeInfo?.icon || Building2;
              
              // Конвертуємо для відображення
              let displayValue = asset.value;
              if (asset.currency === "USD") {
                displayValue = asset.value / exchangeRate;
              } else if (asset.currency === "EUR") {
                displayValue = asset.value / (exchangeRate * 1.1);
              } else if (asset.currency === "BTC" || asset.currency === "ETH") {
                const cryptoRate = asset.currency === "BTC" ? btcPrice : ethPrice;
                displayValue = asset.value / (cryptoRate * exchangeRate);
              }

              // Правильна конвертація для відображення
              let finalDisplayValue = asset.value;
              if (currency === "USD") {
                finalDisplayValue = asset.value / exchangeRate;
              }

              const originalSymbol = asset.currency === "USD" ? "$" : asset.currency === "EUR" ? "€" : asset.currency === "BTC" ? "₿" : asset.currency === "ETH" ? "Ξ" : "₴";
              const displaySymbol = currency === "USD" ? "$" : "₴";

              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-slate-800/50 hover:scale-[1.02] transition-transform duration-200 bg-gradient-to-br from-slate-900/80 to-slate-800/40">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800/50">
                            <Icon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-slate-100 text-lg">
                              {asset.name}
                            </CardTitle>
                            <p className="text-xs text-slate-400">
                              {typeInfo?.label || asset.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Вартість</p>
                          <p className="text-2xl font-bold text-slate-100">
                            {displaySymbol}{finalDisplayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {asset.currency !== "UAH" && (
                            <p className="text-xs text-slate-500 mt-1">
                              Оригінал: {originalSymbol}{displayValue.toLocaleString(undefined, { 
                                minimumFractionDigits: asset.currency === "BTC" || asset.currency === "ETH" ? 4 : 2, 
                                maximumFractionDigits: asset.currency === "BTC" || asset.currency === "ETH" ? 4 : 2 
                              })}
                            </p>
                          )}
                          {(asset.currency === "ETH" || asset.currency === "BTC") && asset.cryptoAmount && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-green-400 font-medium">
                                💰 Кількість: {asset.cryptoAmount.toLocaleString(undefined, { 
                                  minimumFractionDigits: asset.currency === "BTC" ? 8 : 6, 
                                  maximumFractionDigits: asset.currency === "BTC" ? 8 : 6 
                                })} {asset.currency}
                              </p>
                              <p className="text-xs text-green-400 font-medium">
                                📈 Актуальна ціна: ${asset.currency === "BTC" ? btcPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ethPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (оновлюється кожні 30 сек)
                              </p>
                            </div>
                          )}
                        </div>
                        {asset.description && (
                          <p className="text-sm text-slate-300">{asset.description}</p>
                        )}
                        {asset.notes && (
                          <p className="text-xs text-slate-500 italic">{asset.notes}</p>
                        )}
                        <div className="pt-2 border-t border-slate-800">
                          <p className="text-xs text-slate-500">
                            Додано: {new Date(asset.dateAdded).toLocaleDateString("uk-UA")}
                          </p>
                          {asset.dateUpdated !== asset.dateAdded && (
                            <p className="text-xs text-slate-500">
                              Оновлено: {new Date(asset.dateUpdated).toLocaleDateString("uk-UA")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? "Редагувати актив" : "Додати новий актив"}
            </DialogTitle>
            <DialogDescription>
              Введіть інформацію про ваш актив
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="asset-name">Назва активу</Label>
              <Input
                id="asset-name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Наприклад: Tesla Model 3, Bitcoin, Готівка в сейфі"
              />
            </div>
            <div>
              <Label htmlFor="asset-type">Тип активу</Label>
              <Select
                id="asset-type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as AssetType })
                }
              >
                {assetTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="asset-currency">Валюта</Label>
              <Select
                id="asset-currency"
                value={formData.currency}
                onChange={(e) => {
                  const newCurrency = e.target.value as "UAH" | "USD" | "EUR" | "BTC" | "ETH";
                  setFormData({
                    ...formData,
                    currency: newCurrency,
                    // Очищаємо поля при зміні валюти
                    value: newCurrency === "BTC" || newCurrency === "ETH" ? "" : formData.value,
                    cryptoAmount: newCurrency === "BTC" || newCurrency === "ETH" ? formData.cryptoAmount : "",
                  });
                }}
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </Select>
            </div>
            {(formData.currency === "BTC" || formData.currency === "ETH") ? (
              <div>
                <Label htmlFor="asset-crypto-amount">
                  Кількість {formData.currency}
                </Label>
                <Input
                  id="asset-crypto-amount"
                  type="number"
                  step="0.00000001"
                  required
                  value={formData.cryptoAmount}
                  onChange={(e) => {
                    const amount = e.target.value;
                    // Автоматично розраховуємо вартість
                    if (amount && !isNaN(parseFloat(amount))) {
                      const cryptoRate = formData.currency === "BTC" ? btcPrice : ethPrice;
                      const calculatedValue = parseFloat(amount) * cryptoRate * exchangeRate;
                      setFormData(prev => ({ 
                        ...prev, 
                        cryptoAmount: amount, 
                        value: calculatedValue.toFixed(2) 
                      }));
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        cryptoAmount: amount,
                        value: ""
                      }));
                    }
                  }}
                  placeholder="0.00000000"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Вартість розрахується автоматично на основі поточної ціни
                </p>
                {formData.cryptoAmount && !isNaN(parseFloat(formData.cryptoAmount)) && (
                  <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs text-slate-400">Розрахована вартість:</p>
                    <p className="text-lg font-bold text-blue-400">
                      ₴{(parseFloat(formData.cryptoAmount) * (formData.currency === "BTC" ? btcPrice : ethPrice) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Ціна {formData.currency}: ${formData.currency === "BTC" ? btcPrice.toLocaleString() : ethPrice.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="asset-value">Вартість</Label>
                <Input
                  id="asset-value"
                  type="number"
                  step="0.01"
                  required
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            )}
            <div>
              <Label htmlFor="asset-description">Опис (необов'язково)</Label>
              <Input
                id="asset-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Короткий опис активу"
              />
            </div>
            <div>
              <Label htmlFor="asset-notes">Примітки (необов'язково)</Label>
              <Input
                id="asset-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Додаткові примітки"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingAsset(null);
                }}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {editingAsset ? "Зберегти зміни" : "Додати актив"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
