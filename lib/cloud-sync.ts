// Автоматична синхронізація через cloud storage (Supabase)
// Використовує Supabase для зберігання даних між пристроями

import { getCurrentUser } from "./auth";
import { exportData, importData, SyncData } from "./sync";
import { supabase, checkSupabaseConnection } from "./supabase";

const CLOUD_SYNC_KEY = "financial_os_cloud_sync";
const SYNC_CHECK_INTERVAL = 10000; // Перевірка кожні 10 секунд
const LAST_CLOUD_SYNC_KEY = "financial_os_last_cloud_sync";

// Простий cloud storage через localStorage + автоматичний sync
// Для production можна замінити на Firebase, Supabase або інший backend

// Збереження даних в cloud через Supabase
async function saveToCloud(data: SyncData): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const user = getCurrentUser();
    if (!user) return;

    const cloudData = {
      ...data,
      deviceId: getDeviceId(),
      syncedAt: Date.now(),
    };
    
    // Зберігаємо в localStorage як fallback
    localStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(cloudData));
    localStorage.setItem(LAST_CLOUD_SYNC_KEY, Date.now().toString());
    
    // Спробуємо зберегти в Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('sync_data')
          .upsert({
            user_id: user.userId,
            data: cloudData,
            device_id: getDeviceId(),
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.warn("Помилка збереження в Supabase, використовуємо localStorage:", error);
        } else {
          console.log("Дані успішно збережено в Supabase");
        }
      } catch (error) {
        console.warn("Неможливо з'єднатися з Supabase, використовуємо localStorage:", error);
      }
    } else {
      // Fallback на API endpoint якщо Supabase не налаштовано
      try {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.userId,
            data: cloudData,
            deviceId: getDeviceId(),
          }),
        });

        if (!response.ok) {
          console.warn("Помилка збереження на сервер, використовуємо localStorage");
        }
      } catch (error) {
        console.warn("Неможливо з'єднатися з сервером, використовуємо localStorage:", error);
      }
    }
  } catch (error) {
    console.error("Помилка збереження в cloud:", error);
  }
}

// Завантаження даних з cloud через Supabase
async function loadFromCloud(): Promise<SyncData | null> {
  if (typeof window === "undefined") return null;
  
  try {
    const user = getCurrentUser();
    if (!user) return null;

    // Спробуємо завантажити з Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('sync_data')
          .select('data, synced_at')
          .eq('user_id', user.userId)
          .single();

        if (!error && data && data.data) {
          const cloudData = data.data as SyncData;
          
          // Перевіряємо чи дані не застарілі (більше 1 години)
          const oneHour = 60 * 60 * 1000;
          const syncedAt = data.synced_at ? new Date(data.synced_at).getTime() : 0;
          if (syncedAt && Date.now() - syncedAt > oneHour) {
            return null;
          }
          
          console.log("Дані успішно завантажено з Supabase");
          return cloudData;
        } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.warn("Помилка завантаження з Supabase:", error);
        }
      } catch (error) {
        console.warn("Неможливо з'єднатися з Supabase, використовуємо localStorage:", error);
      }
    } else {
      // Fallback на API endpoint якщо Supabase не налаштовано
      try {
        const response = await fetch(`/api/sync?userId=${user.userId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            return result.data;
          }
        }
      } catch (error) {
        console.warn("Неможливо з'єднатися з сервером, використовуємо localStorage:", error);
      }
    }

    // Fallback на localStorage
    const stored = localStorage.getItem(CLOUD_SYNC_KEY);
    if (!stored) return null;
    
    const cloudData = JSON.parse(stored);
    
    // Перевіряємо чи дані не застарілі (більше 1 години)
    const oneHour = 60 * 60 * 1000;
    if (cloudData.syncedAt && Date.now() - cloudData.syncedAt > oneHour) {
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
  const performSync = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      // Експортуємо поточні дані
      const currentData = exportData();
      const lastSync = localStorage.getItem(LAST_CLOUD_SYNC_KEY);
      const lastSyncTime = lastSync ? parseInt(lastSync, 10) : 0;

      // Завантажуємо дані з cloud (async)
      const cloudData = await loadFromCloud();
      
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
        await saveToCloud(currentData);
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
export async function forceCloudSync(): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    return;
  }

  try {
    const currentData = exportData();
    await saveToCloud(currentData);
    
    // Невелика затримка перед перевіркою оновлень
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cloudData = await loadFromCloud();
    if (cloudData && cloudData.deviceId !== getDeviceId()) {
      importData(cloudData, true);
      window.dispatchEvent(new CustomEvent("dataSynced", { detail: cloudData }));
    }
  } catch (error) {
    console.error("Помилка примусової синхронізації:", error);
  }
}
