// Автоматична синхронізація через cloud storage
// Використовує localStorage як тимчасове сховище + автоматичний експорт/імпорт

import { getCurrentUser } from "./auth";
import { exportData, importData, SyncData } from "./sync";

const CLOUD_SYNC_KEY = "financial_os_cloud_sync";
const SYNC_CHECK_INTERVAL = 10000; // Перевірка кожні 10 секунд
const LAST_CLOUD_SYNC_KEY = "financial_os_last_cloud_sync";

// Простий cloud storage через localStorage + автоматичний sync
// Для production можна замінити на Firebase, Supabase або інший backend

// Збереження даних в cloud (через localStorage як тимчасове рішення)
// В production це має бути API endpoint
function saveToCloud(data: SyncData): void {
  if (typeof window === "undefined") return;
  
  try {
    // Зберігаємо в localStorage з timestamp
    const cloudData = {
      ...data,
      deviceId: getDeviceId(),
      syncedAt: Date.now(),
    };
    
    localStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(cloudData));
    localStorage.setItem(LAST_CLOUD_SYNC_KEY, Date.now().toString());
    
    // В production тут має бути API call:
    // await fetch('/api/sync', { method: 'POST', body: JSON.stringify(cloudData) });
  } catch (error) {
    console.error("Помилка збереження в cloud:", error);
  }
}

// Завантаження даних з cloud
function loadFromCloud(): SyncData | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(CLOUD_SYNC_KEY);
    if (!stored) return null;
    
    const cloudData = JSON.parse(stored);
    
    // Перевіряємо чи дані не застарілі (більше 1 години)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - cloudData.syncedAt > oneHour) {
      return null;
    }
    
    return cloudData;
  } catch (error) {
    console.error("Помилка завантаження з cloud:", error);
    return null;
  }
}

// Отримання унікального ID пристрою
function getDeviceId(): string {
  if (typeof window === "undefined") return "unknown";
  
  let deviceId = localStorage.getItem("financial_os_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("financial_os_device_id", deviceId);
  }
  return deviceId;
}

// Автоматична синхронізація з cloud
export function initCloudSync(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const user = getCurrentUser();
  if (!user) {
    return () => {};
  }

  // Функція синхронізації
  const performSync = () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      // Експортуємо поточні дані
      const currentData = exportData();
      const lastSync = localStorage.getItem(LAST_CLOUD_SYNC_KEY);
      const lastSyncTime = lastSync ? parseInt(lastSync, 10) : 0;

      // Завантажуємо дані з cloud
      const cloudData = loadFromCloud();
      
      if (cloudData) {
        // Якщо cloud дані новіші, імпортуємо їх
        if (cloudData.lastSync > currentData.lastSync && cloudData.deviceId !== getDeviceId()) {
          console.log("Синхронізація: імпорт даних з cloud");
          importData(cloudData, true);
          
          // Оновлюємо timestamp
          localStorage.setItem(LAST_CLOUD_SYNC_KEY, cloudData.lastSync.toString());
          
          // Викликаємо подію для оновлення UI
          window.dispatchEvent(new CustomEvent("dataSynced", { detail: cloudData }));
        }
      }

      // Якщо наші дані новіші, зберігаємо в cloud
      if (currentData.lastSync > lastSyncTime) {
        console.log("Синхронізація: експорт даних в cloud");
        saveToCloud(currentData);
      }
    } catch (error) {
      console.error("Помилка синхронізації:", error);
    }
  };

  // Синхронізація при завантаженні
  performSync();

  // Автоматична синхронізація через інтервал
  const syncInterval = setInterval(performSync, SYNC_CHECK_INTERVAL);

  // Синхронізація при фокусі на вікні (користувач повернувся на вкладку)
  window.addEventListener("focus", performSync);

  // Синхронізація при зміні даних в localStorage
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    
    // Якщо змінилися важливі дані, тригеримо синхронізацію
    if (key === "transactions" || key === "goals" || key === "assets" || 
        key === "liabilities" || key === "categories" || 
        key === "financial_os_users" || key === "financial_os_session") {
      setTimeout(performSync, 1000); // Затримка для накопичення змін
    }
  };

  // Повертаємо функцію очищення
  return () => {
    clearInterval(syncInterval);
    window.removeEventListener("focus", performSync);
    Storage.prototype.setItem = originalSetItem;
  };
}

// Примусова синхронізація
export function forceCloudSync(): Promise<void> {
  return new Promise((resolve) => {
    const user = getCurrentUser();
    if (!user) {
      resolve();
      return;
    }

    try {
      const currentData = exportData();
      saveToCloud(currentData);
      
      // Невелика затримка перед перевіркою оновлень
      setTimeout(() => {
        const cloudData = loadFromCloud();
        if (cloudData && cloudData.deviceId !== getDeviceId()) {
          importData(cloudData, true);
          window.dispatchEvent(new CustomEvent("dataSynced", { detail: cloudData }));
        }
        resolve();
      }, 500);
    } catch (error) {
      console.error("Помилка примусової синхронізації:", error);
      resolve();
    }
  });
}
