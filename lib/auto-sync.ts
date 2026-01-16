// Автоматична синхронізація даних між пристроями через localStorage
// Використовує BroadcastChannel API для синхронізації між вкладками
// та localStorage events для синхронізації між пристроями

import { getCurrentUser } from "./auth";
import { exportData, importData, SyncData } from "./sync";

const SYNC_CHANNEL_NAME = "financial_os_sync";
const SYNC_CHECK_INTERVAL = 5000; // Перевірка кожні 5 секунд
const LAST_SYNC_KEY = "financial_os_last_sync_timestamp";

// BroadcastChannel для синхронізації між вкладками одного пристрою
let syncChannel: BroadcastChannel | null = null;

// Ініціалізація автоматичної синхронізації
export function initAutoSync(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // Ініціалізуємо BroadcastChannel
  try {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    
    // Слухаємо повідомлення від інших вкладок
    syncChannel.onmessage = (event) => {
      if (event.data.type === "SYNC_DATA") {
        handleIncomingSync(event.data.data as SyncData);
      }
    };
  } catch (error) {
    console.warn("BroadcastChannel не підтримується:", error);
  }

  // Слухаємо зміни в localStorage (для синхронізації між вкладками)
  window.addEventListener("storage", handleStorageChange);

  // Автоматична синхронізація через інтервал
  const syncInterval = setInterval(() => {
    performAutoSync();
  }, SYNC_CHECK_INTERVAL);

  // Синхронізація при завантаженні сторінки
  performAutoSync();

  // Повертаємо функцію очищення
  return () => {
    if (syncChannel) {
      syncChannel.close();
      syncChannel = null;
    }
    window.removeEventListener("storage", handleStorageChange);
    clearInterval(syncInterval);
  };
}

// Обробка змін в localStorage
function handleStorageChange(event: StorageEvent) {
  if (!event.key || !event.newValue) return;

  // Якщо змінився ключ синхронізації, імпортуємо дані
  if (event.key === "financial_os_sync_data") {
    try {
      const data = JSON.parse(event.newValue) as SyncData;
      handleIncomingSync(data);
    } catch (error) {
      console.error("Помилка парсингу даних синхронізації:", error);
    }
  }
}

// Виконання автоматичної синхронізації
function performAutoSync() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    // Експортуємо поточні дані
    const currentData = exportData();
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    const lastSyncTime = lastSync ? parseInt(lastSync, 10) : 0;

    // Якщо дані змінилися, синхронізуємо
    if (currentData.lastSync > lastSyncTime) {
      // Зберігаємо дані для синхронізації
      localStorage.setItem("financial_os_sync_data", JSON.stringify(currentData));
      localStorage.setItem(LAST_SYNC_KEY, currentData.lastSync.toString());

      // Відправляємо через BroadcastChannel
      if (syncChannel) {
        syncChannel.postMessage({
          type: "SYNC_DATA",
          data: currentData,
        });
      }
    }

    // Перевіряємо чи є новіші дані для імпорту
    const storedSyncData = localStorage.getItem("financial_os_sync_data");
    if (storedSyncData) {
      try {
        const storedData = JSON.parse(storedSyncData) as SyncData;
        if (storedData.lastSync > lastSyncTime && storedData.lastSync !== currentData.lastSync) {
          handleIncomingSync(storedData);
        }
      } catch (error) {
        console.error("Помилка читання даних синхронізації:", error);
      }
    }
  } catch (error) {
    console.error("Помилка автоматичної синхронізації:", error);
  }
}

// Обробка вхідних даних синхронізації
function handleIncomingSync(data: SyncData) {
  try {
    const currentData = exportData();
    
    // Якщо вхідні дані новіші, імпортуємо їх
    if (data.lastSync > currentData.lastSync) {
      importData(data, true);
      
      // Оновлюємо timestamp
      localStorage.setItem(LAST_SYNC_KEY, data.lastSync.toString());
      
      // Оновлюємо сторінку для відображення нових даних
      if (typeof window !== "undefined") {
        // Викликаємо подію для оновлення компонентів
        window.dispatchEvent(new CustomEvent("dataSynced", { detail: data }));
      }
    }
  } catch (error) {
    console.error("Помилка обробки синхронізації:", error);
  }
}

// Примусова синхронізація (для виклику після змін)
export function triggerSync() {
  if (typeof window === "undefined") return;
  
  const user = getCurrentUser();
  if (!user) return;

  const currentData = exportData();
  localStorage.setItem("financial_os_sync_data", JSON.stringify(currentData));
  localStorage.setItem(LAST_SYNC_KEY, currentData.lastSync.toString());

  if (syncChannel) {
    syncChannel.postMessage({
      type: "SYNC_DATA",
      data: currentData,
    });
  }
}
