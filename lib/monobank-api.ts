// Monobank API Integration
// Документація: https://api.monobank.ua/docs

export interface MonobankAccount {
  id: string;
  sendId: string;
  balance: number;
  creditLimit: number;
  type: string;
  currencyCode: number; // 980 = UAH, 840 = USD, 978 = EUR
  cashbackType?: string;
  maskedPan?: string[];
  iban: string;
}

export interface MonobankTransaction {
  id: string;
  time: number; // Unix timestamp в секундах
  description: string;
  mcc: number; // Merchant Category Code
  originalMcc: number;
  hold: boolean;
  amount: number; // в мінімальних одиницях валюти (копійки для UAH)
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  comment?: string;
  receiptId?: string;
  invoiceId?: string;
  counterEdrpou?: string;
  counterIban?: string;
}

export interface MonobankClientInfo {
  clientId: string;
  name: string;
  webHookUrl?: string;
  permissions: string;
  accounts: MonobankAccount[];
}

class MonobankAPI {
  private baseUrl = "https://api.monobank.ua";
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("monobank_token", token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("monobank_token");
      return this.token;
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("monobank_token");
    }
  }

  async getClientInfo(): Promise<MonobankClientInfo> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Monobank токен не встановлено");
    }

    const response = await fetch(`${this.baseUrl}/personal/client-info`, {
      method: "GET",
      headers: {
        "X-Token": token,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Перевищено ліміт запитів. Спробуйте пізніше.");
      }
      if (response.status === 403) {
        throw new Error("Невірний токен або токен не має доступу");
      }
      throw new Error(`Помилка API: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStatement(
    accountId: string,
    from: number,
    to: number
  ): Promise<MonobankTransaction[]> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Monobank токен не встановлено");
    }

    // Monobank API вимагає, щоб різниця між from і to не перевищувала 31 день
    const daysDiff = (to - from) / (1000 * 60 * 60 * 24);
    if (daysDiff > 31) {
      throw new Error("Максимальний період виписки - 31 день");
    }

    const response = await fetch(
      `${this.baseUrl}/personal/statement/${accountId}/${from}/${to}`,
      {
        method: "GET",
        headers: {
          "X-Token": token,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Перевищено ліміт запитів. Спробуйте пізніше.");
      }
      if (response.status === 403) {
        throw new Error("Невірний токен або токен не має доступу");
      }
      if (response.status === 400) {
        throw new Error("Невірні параметри запиту");
      }
      throw new Error(`Помилка API: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Конвертує Monobank транзакцію в формат додатку
  convertTransaction(
    monoTransaction: MonobankTransaction,
    account: MonobankAccount,
    defaultIncomeCategory?: string,
    defaultExpenseCategory?: string
  ): {
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string;
    date: string;
    source?: string;
    status: "received" | "pending";
  } | null {
    // Конвертуємо суму з копійок в гривні
    // У Monobank: додатні значення = витрати (кошти йдуть з рахунку), від'ємні = доходи (кошти надходять)
    const amount = Math.abs(monoTransaction.amount) / 100;
    const isIncome = monoTransaction.amount < 0; // Від'ємна сума = дохід
    
    // Конвертуємо timestamp (Monobank використовує секунди)
    const date = new Date(monoTransaction.time * 1000).toISOString();

    // Визначаємо тип та категорію
    const type = isIncome ? "income" : "expense";
    const sourceCategory = isIncome 
      ? (defaultIncomeCategory || "Інше")
      : (defaultExpenseCategory || "Інше");

    return {
      type,
      amount,
      category: type, // "income" або "expense"
      description: monoTransaction.description || monoTransaction.comment || "Транзакція Monobank",
      date,
      source: isIncome ? sourceCategory : undefined,
      status: "received", // Monobank показує тільки виконані транзакції
    };
  }
}

export const monobankAPI = new MonobankAPI();
