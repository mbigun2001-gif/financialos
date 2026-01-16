// Простий store для даних (пізніше можна замінити на localStorage або базу даних)
export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  source?: string; // для доходів
  status?: "received" | "pending"; // для доходів: отримано або очікується
  assetId?: string; // ID активу (рахунку), до/з якого додається/віднімається сума
}

export interface NicheROI {
  id: string;
  name: string;
  adSpend: number;
  income: number;
}

export interface LexusFund {
  targetAmount: number;
  currentAmount: number;
}

export type AssetType = "liquid" | "illiquid" | "car" | "cash" | "crypto" | "property" | "other";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number; // в UAH
  currency: "UAH" | "USD" | "EUR" | "BTC" | "ETH";
  description?: string;
  dateAdded: string;
  dateUpdated: string;
  notes?: string;
  cryptoAmount?: number; // Кількість криптовалюти (для BTC/ETH)
  cryptoPriceAtPurchase?: number; // Ціна на момент покупки в USD
}

export interface Goal {
  id: string;
  title: string;
  type: "financial" | "task"; // Тип цілі: фінансова або текстова задача
  targetAmount: number; // Для фінансових цілей
  currentAmount: number; // Для фінансових цілей
  category: string;
  deadline?: string;
  incomeCategories?: string[]; // Масив категорій доходу для автоматичного оновлення
  incomeCategory?: string; // Старе поле для сумісності (deprecated)
  description?: string; // Для текстових задач
  completed?: boolean; // Для текстових задач
  priority?: "low" | "medium" | "high"; // Пріоритет задачі
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
}

export interface Liability {
  id: string;
  name: string;
  totalAmount: number; // Загальна сума зобов'язання
  paidAmount: number; // Вже внесено
  currency: "UAH" | "USD" | "EUR";
  paymentPeriod: "monthly" | "quarterly" | "yearly"; // Період платежів
  paymentAmount: number; // Сума одного платежу
  durationYears: number; // Тривалість в роках
  startDate: string; // Дата початку
  nextPaymentDate: string; // Наступна дата платежу
  description?: string;
  notes?: string;
  dateAdded: string;
  dateUpdated: string;
}

// In-memory storage (в продакшені використовуйте localStorage або базу даних)
let transactions: Transaction[] = [];
let goals: Goal[] = [];
let niches: NicheROI[] = [];
let lexusFund: LexusFund = { targetAmount: 50000, currentAmount: 0 };
let assets: Asset[] = [];
let liabilities: Liability[] = [];
let categories: Category[] = [
  // Доходи
  { id: "shopify", name: "Shopify", type: "income", color: "#10b981" },
  { id: "mentoring", name: "Менторинг", type: "income", color: "#3b82f6" },
  { id: "wood", name: "Дерево", type: "income", color: "#8b5cf6" },
  { id: "metal", name: "Метал", type: "income", color: "#f59e0b" },
  { id: "other-income", name: "Інше", type: "income", color: "#6b7280" },
  // Розходи
  { id: "business", name: "Бізнес", type: "expense", color: "#ef4444" },
  { id: "personal", name: "Особисте", type: "expense", color: "#ec4899" },
  { id: "rent", name: "Оренда", type: "expense", color: "#f97316" },
  { id: "utilities", name: "Комунікації", type: "expense", color: "#14b8a6" },
  { id: "transport", name: "Транспорт", type: "expense", color: "#6366f1" },
  { id: "other-expense", name: "Інше", type: "expense", color: "#6b7280" },
];

export const dataStore = {
  transactions: {
    getAll: () => transactions,
    add: (transaction: Transaction) => {
      transactions.push(transaction);
      // Зберегти в localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("transactions", JSON.stringify(transactions));
        
        // Оновити актив, якщо він вказаний
        if (transaction.assetId) {
          const asset = assets.find(a => a.id === transaction.assetId);
          if (asset) {
            let newValue = asset.value;
            if (transaction.type === "income" && transaction.status === "received") {
              // Дохід додається до активу
              newValue = asset.value + transaction.amount;
            } else if (transaction.type === "expense") {
              // Витрата віднімається від активу
              newValue = Math.max(0, asset.value - transaction.amount);
            }
            dataStore.assets.update(transaction.assetId, { 
              value: newValue,
              dateUpdated: new Date().toISOString()
            });
          }
        }
        
        // Якщо це дохід, оновити прогрес цілей з відповідною категорією доходу та Lexus Fund
        if (transaction.type === "income" && transaction.status === "received") {
          // Оновити цілі, які прив'язані до цієї категорії доходу
          const matchingGoals = goals.filter(g => {
            // Підтримка нового формату (масив) та старого (одна категорія)
            const categories = g.incomeCategories || (g.incomeCategory ? [g.incomeCategory] : []);
            return categories.includes(transaction.source);
          });
          
          matchingGoals.forEach(goal => {
            const newAmount = Math.min(
              goal.currentAmount + transaction.amount,
              goal.targetAmount
            );
            dataStore.goals.update(goal.id, { currentAmount: newAmount });
          });

          // Також оновити цілі з категорією "Дохід" (загальний дохід)
          const incomeGoals = goals.filter(g => 
            (g.category === "Дохід" || g.category === "revenue") && 
            !g.incomeCategory // Тільки якщо не прив'язана до конкретної категорії
          );
          const totalIncome = transactions
            .filter(t => t.type === "income" && t.status === "received")
            .reduce((sum, t) => sum + t.amount, 0);
          
          incomeGoals.forEach(goal => {
            if (totalIncome <= goal.targetAmount) {
              dataStore.goals.update(goal.id, { currentAmount: totalIncome });
            }
          });

          // Оновити Lexus Fund (5% з доходу)
          const currentFund = dataStore.lexusFund.get();
          const contribution = transaction.amount * 0.05;
          dataStore.lexusFund.update(currentFund.currentAmount + contribution);
        }
      }
      return transaction;
    },
    delete: (id: string) => {
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        // Якщо це дохід, відкотити зміни в цілях та Lexus Fund
        if (transaction.type === "income" && transaction.status === "received") {
          // Відкотити зміни в активах
          if (transaction.assetId) {
            const asset = assets.find(a => a.id === transaction.assetId);
            if (asset) {
              let newValue = asset.value;
              if (transaction.type === "income" && transaction.status === "received") {
                // Відкотити дохід - відняти від активу
                newValue = Math.max(0, asset.value - transaction.amount);
              } else if (transaction.type === "expense") {
                // Відкотити витрату - додати до активу
                newValue = asset.value + transaction.amount;
              }
              dataStore.assets.update(transaction.assetId, { 
                value: newValue,
                dateUpdated: new Date().toISOString()
              });
            }
          }

          // Відкотити зміни в цілях
          const matchingGoals = goals.filter(g => {
            const categories = g.incomeCategories || (g.incomeCategory ? [g.incomeCategory] : []);
            return categories.includes(transaction.source);
          });
          
          matchingGoals.forEach(goal => {
            const newAmount = Math.max(0, goal.currentAmount - transaction.amount);
            dataStore.goals.update(goal.id, { currentAmount: newAmount });
          });

          // Відкотити загальні цілі
          const incomeGoals = goals.filter(g => 
            (g.category === "Дохід" || g.category === "revenue") && 
            !g.incomeCategory
          );
          const totalIncome = transactions
            .filter(t => t.type === "income" && t.status === "received" && t.id !== id)
            .reduce((sum, t) => sum + t.amount, 0);
          
          incomeGoals.forEach(goal => {
            dataStore.goals.update(goal.id, { currentAmount: Math.min(totalIncome, goal.targetAmount) });
          });

          // Відкотити Lexus Fund
          const currentFund = dataStore.lexusFund.get();
          const contribution = transaction.amount * 0.05;
          dataStore.lexusFund.update(Math.max(0, currentFund.currentAmount - contribution));
        }
        
        transactions = transactions.filter(t => t.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem("transactions", JSON.stringify(transactions));
        }
      }
    },
    getByType: (type: "income" | "expense") => 
      transactions.filter(t => t.type === type),
    getTotal: (type: "income" | "expense", status?: "received" | "pending") =>
      transactions
        .filter(t => {
          if (t.type !== type) return false;
          if (status && t.status !== status) return false;
          return true;
        })
        .reduce((sum, t) => sum + t.amount, 0),
    getByDateRange: (startDate: Date, endDate: Date) =>
      transactions.filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
      }),
  },
  niches: {
    getAll: () => niches,
    add: (niche: NicheROI) => {
      const existing = niches.find(n => n.id === niche.id);
      if (existing) {
        existing.adSpend = niche.adSpend;
        existing.income = niche.income;
      } else {
        niches.push(niche);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("niches", JSON.stringify(niches));
      }
      return niche;
    },
    getROI: (nicheId: string) => {
      const niche = niches.find(n => n.id === nicheId);
      if (!niche || niche.adSpend === 0) return 0;
      return ((niche.income - niche.adSpend) / niche.adSpend) * 100;
    },
  },
  lexusFund: {
    get: () => lexusFund,
    update: (amount: number) => {
      lexusFund.currentAmount = Math.min(amount, lexusFund.targetAmount);
      if (typeof window !== "undefined") {
        localStorage.setItem("lexusFund", JSON.stringify(lexusFund));
      }
    },
    setTarget: (target: number) => {
      lexusFund.targetAmount = target;
      if (typeof window !== "undefined") {
        localStorage.setItem("lexusFund", JSON.stringify(lexusFund));
      }
    },
  },
  assets: {
    getAll: () => assets,
    getByType: (type: AssetType) => assets.filter(a => a.type === type),
    add: (asset: Asset) => {
      assets.push(asset);
      if (typeof window !== "undefined") {
        localStorage.setItem("assets", JSON.stringify(assets));
      }
      return asset;
    },
    update: (id: string, updates: Partial<Asset>) => {
      const index = assets.findIndex(a => a.id === id);
      if (index !== -1) {
        assets[index] = { ...assets[index], ...updates, dateUpdated: new Date().toISOString() };
        if (typeof window !== "undefined") {
          localStorage.setItem("assets", JSON.stringify(assets));
        }
      }
    },
    delete: (id: string) => {
      assets = assets.filter(a => a.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("assets", JSON.stringify(assets));
      }
    },
    getTotal: (type?: AssetType) => {
      const filtered = type ? assets.filter(a => a.type === type) : assets;
      return filtered.reduce((sum, a) => sum + a.value, 0);
    },
    getTotalByCurrency: (currency: string) => {
      return assets
        .filter(a => a.currency === currency)
        .reduce((sum, a) => sum + a.value, 0);
    },
  },
  categories: {
    getAll: () => categories,
    getByType: (type: "income" | "expense") => categories.filter(c => c.type === type),
    add: (category: Category) => {
      categories.push(category);
      if (typeof window !== "undefined") {
        localStorage.setItem("categories", JSON.stringify(categories));
      }
      return category;
    },
    update: (id: string, updates: Partial<Category>) => {
      const index = categories.findIndex(c => c.id === id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...updates };
        if (typeof window !== "undefined") {
          localStorage.setItem("categories", JSON.stringify(categories));
        }
      }
    },
    delete: (id: string) => {
      categories = categories.filter(c => c.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("categories", JSON.stringify(categories));
      }
    },
  },
  goals: {
    getAll: () => goals,
    add: (goal: Goal) => {
      goals.push(goal);
      if (typeof window !== "undefined") {
        localStorage.setItem("goals", JSON.stringify(goals));
      }
      return goal;
    },
    update: (id: string, updates: Partial<Goal>) => {
      const index = goals.findIndex(g => g.id === id);
      if (index !== -1) {
        goals[index] = { ...goals[index], ...updates };
        if (typeof window !== "undefined") {
          localStorage.setItem("goals", JSON.stringify(goals));
        }
      }
    },
    delete: (id: string) => {
      goals = goals.filter(g => g.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("goals", JSON.stringify(goals));
      }
    },
  },
  settings: {
    get: (key: string): string | null => {
      if (typeof window !== "undefined") {
        return localStorage.getItem(`settings_${key}`);
      }
      return null;
    },
    set: (key: string, value: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(`settings_${key}`, value);
      }
    },
    remove: (key: string) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`settings_${key}`);
      }
    },
  },
  liabilities: {
    getAll: () => liabilities,
    getById: (id: string) => liabilities.find(l => l.id === id),
    add: (liability: Liability) => {
      liabilities.push(liability);
      if (typeof window !== "undefined") {
        localStorage.setItem("liabilities", JSON.stringify(liabilities));
      }
      return liability;
    },
    update: (id: string, updates: Partial<Liability>) => {
      const index = liabilities.findIndex(l => l.id === id);
      if (index !== -1) {
        liabilities[index] = { ...liabilities[index], ...updates, dateUpdated: new Date().toISOString() };
        if (typeof window !== "undefined") {
          localStorage.setItem("liabilities", JSON.stringify(liabilities));
        }
      }
    },
    delete: (id: string) => {
      liabilities = liabilities.filter(l => l.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("liabilities", JSON.stringify(liabilities));
      }
    },
    addPayment: (id: string, amount: number) => {
      const liability = liabilities.find(l => l.id === id);
      if (liability) {
        const newPaidAmount = liability.paidAmount + amount;
        const remainingAmount = liability.totalAmount - newPaidAmount;
        
        // Розраховуємо наступну дату платежу від першої дати платежу
        const firstPaymentDate = new Date(liability.startDate);
        firstPaymentDate.setHours(0, 0, 0, 0);
        
        const paidPayments = Math.floor(newPaidAmount / liability.paymentAmount);
        
        let nextPaymentDate = new Date(firstPaymentDate);
        
        // Додаємо періоди від першої дати (наступний платіж = перший платіж + (вже зроблені платежі + 1) періодів)
        if (liability.paymentPeriod === "monthly") {
          nextPaymentDate.setMonth(firstPaymentDate.getMonth() + paidPayments + 1);
        } else if (liability.paymentPeriod === "quarterly") {
          nextPaymentDate.setMonth(firstPaymentDate.getMonth() + (paidPayments + 1) * 3);
        } else if (liability.paymentPeriod === "yearly") {
          nextPaymentDate.setFullYear(firstPaymentDate.getFullYear() + paidPayments + 1);
        }
        
        // Якщо наступна дата вже минула, додаємо ще один період
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextPaymentDate.setHours(0, 0, 0, 0);
        
        if (nextPaymentDate <= today) {
          if (liability.paymentPeriod === "monthly") {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          } else if (liability.paymentPeriod === "quarterly") {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
          } else if (liability.paymentPeriod === "yearly") {
            nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
          }
        }
        
        dataStore.liabilities.update(id, {
          paidAmount: newPaidAmount,
          nextPaymentDate: nextPaymentDate.toISOString(),
        });
      }
    },
    getTotal: () => {
      return liabilities.reduce((sum, l) => sum + l.totalAmount, 0);
    },
    getTotalPaid: () => {
      return liabilities.reduce((sum, l) => sum + l.paidAmount, 0);
    },
    getTotalRemaining: () => {
      return liabilities.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);
    },
  },
  init: () => {
    if (typeof window !== "undefined") {
      const savedTransactions = localStorage.getItem("transactions");
      const savedGoals = localStorage.getItem("goals");
      const savedNiches = localStorage.getItem("niches");
      const savedLexusFund = localStorage.getItem("lexusFund");
      const savedAssets = localStorage.getItem("assets");
      const savedCategories = localStorage.getItem("categories");
      
      if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
      }
      if (savedGoals) {
        goals = JSON.parse(savedGoals);
      }
      if (savedNiches) {
        niches = JSON.parse(savedNiches);
      }
      if (savedLexusFund) {
        lexusFund = JSON.parse(savedLexusFund);
      }
      if (savedAssets) {
        assets = JSON.parse(savedAssets);
      }
      if (savedCategories) {
        categories = JSON.parse(savedCategories);
      }
      const savedLiabilities = localStorage.getItem("liabilities");
      if (savedLiabilities) {
        liabilities = JSON.parse(savedLiabilities);
      }
    }
  },
};
