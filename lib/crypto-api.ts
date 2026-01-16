// API для отримання цін криптовалют
export const cryptoAPI = {
  // Отримати ціну ETH в USD
  getETHPrice: async (): Promise<number> => {
    try {
      // Використовуємо CoinGecko API (безкоштовний, не потребує API ключа)
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ETH price");
      }

      const data = await response.json();
      return data.ethereum?.usd || 3000; // Fallback до $3000 якщо API не працює
    } catch (error) {
      console.error("Error fetching ETH price:", error);
      // Fallback до приблизної ціни
      return 3000;
    }
  },

  // Отримати ціну BTC в USD
  getBTCPrice: async (): Promise<number> => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch BTC price");
      }

      const data = await response.json();
      return data.bitcoin?.usd || 50000; // Fallback до $50000
    } catch (error) {
      console.error("Error fetching BTC price:", error);
      return 50000;
    }
  },
};
