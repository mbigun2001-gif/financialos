// API для отримання курсу валют
export interface ExchangeRate {
  rate: number;
  lastUpdated: string;
}

const CACHE_KEY = "exchange_rate_cache";
const CACHE_DURATION = 60 * 60 * 1000; // 1 година

export const currencyAPI = {
  // Отримання курсу USD/UAH з кешу або API
  async getExchangeRate(): Promise<number> {
    if (typeof window === "undefined") {
      return 37.5; // Дефолтний курс для SSR
    }

    // Перевіряємо кеш
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return rate;
      }
    }

    try {
      // Спробуємо отримати з Monobank API
      const response = await fetch("https://api.monobank.ua/bank/currency");
      if (response.ok) {
        const data = await response.json();
        // Знаходимо курс USD/UAH (код 840 - USD, код 980 - UAH)
        const usdRate = data.find((item: any) => item.currencyCodeA === 840 && item.currencyCodeB === 980);
        if (usdRate) {
          const rate = usdRate.rateBuy || usdRate.rateSell || 37.5;
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            rate,
            timestamp: Date.now(),
          }));
          return rate;
        }
      }
    } catch (error) {
      console.error("Помилка отримання курсу:", error);
    }

    // Якщо API не працює, використовуємо дефолтний курс
    return 37.5;
  },

  // Оновлення курсу вручну
  async refreshRate(): Promise<number> {
    localStorage.removeItem(CACHE_KEY);
    return this.getExchangeRate();
  },
};
