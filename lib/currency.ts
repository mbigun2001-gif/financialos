// Курс валют (можна оновити або отримати з API)
const USD_TO_UAH = 37.5; // Прикладний курс, можна оновити

export const currencyConverter = {
  uahToUsd: (uah: number): number => {
    return uah / USD_TO_UAH;
  },
  usdToUah: (usd: number): number => {
    return usd * USD_TO_UAH;
  },
  formatUAH: (amount: number): string => {
    return `₴${amount.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
  formatUSD: (amount: number): string => {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
  getExchangeRate: (): number => {
    return USD_TO_UAH;
  },
};
