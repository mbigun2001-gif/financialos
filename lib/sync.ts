// Система синхронізації даних між пристроями
// Використовує Firebase Firestore для синхронізації

import { getCurrentUser } from "./auth";

// Інтерфейс для синхронізації
export interface SyncData {
  transactions: any[];
  goals: any[];
  assets: any[];
  liabilities: any[];
  categories: any[];
  users?: any[]; // Додаємо користувачів для синхронізації
  sessions?: any[]; // Додаємо сесії для синхронізації
  settings: Record<string, string>;
  lastSync: number;
}

// Простий API для синхронізації через localStorage + cloud backup
// Для production можна використати Firebase, Supabase або інший backend

const SYNC_STORAGE_KEY = "financial_os_sync_data";
const SYNC_INTERVAL = 30000; // 30 секунд

// Експорт даних для синхронізації
export function exportData(): SyncData {
  if (typeof window === "undefined") {
    return {
      transactions: [],
      goals: [],
      assets: [],
      liabilities: [],
      categories: [],
      users: [],
      sessions: [],
      settings: {},
      lastSync: Date.now(),
    };
  }

  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
  const goals = JSON.parse(localStorage.getItem("goals") || "[]");
  const assets = JSON.parse(localStorage.getItem("assets") || "[]");
  const liabilities = JSON.parse(localStorage.getItem("liabilities") || "[]");
  const categories = JSON.parse(localStorage.getItem("categories") || "[]");
  
  // Експортуємо користувачів та сесії
  const users = JSON.parse(localStorage.getItem("financial_os_users") || "[]");
  const session = localStorage.getItem("financial_os_session");
  const sessions = session ? [JSON.parse(session)] : [];
  
  // Збираємо всі налаштування
  const settings: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("settings_")) {
      settings[key] = localStorage.getItem(key) || "";
    }
  }

  return {
    transactions,
    goals,
    assets,
    liabilities,
    categories,
    users,
    sessions,
    settings,
    lastSync: Date.now(),
  };
}

// Імпорт даних з синхронізації
export function importData(data: SyncData, merge: boolean = true): void {
  if (typeof window === "undefined") return;

  if (merge) {
    // Об'єднуємо дані (використовуємо найновіші версії)
    const existingTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    const existingGoals = JSON.parse(localStorage.getItem("goals") || "[]");
    const existingAssets = JSON.parse(localStorage.getItem("assets") || "[]");
    const existingLiabilities = JSON.parse(localStorage.getItem("liabilities") || "[]");
    const existingCategories = JSON.parse(localStorage.getItem("categories") || "[]");

    // Об'єднуємо транзакції (видаляємо дублікати по ID)
    const mergedTransactions = [...existingTransactions];
    data.transactions.forEach((t) => {
      const index = mergedTransactions.findIndex((et) => et.id === t.id);
      if (index === -1) {
        mergedTransactions.push(t);
      } else {
        // Використовуємо новішу версію
        const existingDate = new Date(mergedTransactions[index].date || 0).getTime();
        const newDate = new Date(t.date || 0).getTime();
        if (newDate > existingDate) {
          mergedTransactions[index] = t;
        }
      }
    });

    // Об'єднуємо цілі
    const mergedGoals = [...existingGoals];
    data.goals.forEach((g) => {
      const index = mergedGoals.findIndex((eg) => eg.id === g.id);
      if (index === -1) {
        mergedGoals.push(g);
      } else {
        mergedGoals[index] = g;
      }
    });

    // Об'єднуємо активи
    const mergedAssets = [...existingAssets];
    data.assets.forEach((a) => {
      const index = mergedAssets.findIndex((ea) => ea.id === a.id);
      if (index === -1) {
        mergedAssets.push(a);
      } else {
        mergedAssets[index] = a;
      }
    });

    // Об'єднуємо зобов'язання
    const mergedLiabilities = [...existingLiabilities];
    data.liabilities.forEach((l) => {
      const index = mergedLiabilities.findIndex((el) => el.id === l.id);
      if (index === -1) {
        mergedLiabilities.push(l);
      } else {
        mergedLiabilities[index] = l;
      }
    });

    // Об'єднуємо категорії
    const mergedCategories = [...existingCategories];
    data.categories.forEach((c) => {
      const index = mergedCategories.findIndex((ec) => ec.id === c.id);
      if (index === -1) {
        mergedCategories.push(c);
      } else {
        mergedCategories[index] = c;
      }
    });

    localStorage.setItem("transactions", JSON.stringify(mergedTransactions));
    localStorage.setItem("goals", JSON.stringify(mergedGoals));
    localStorage.setItem("assets", JSON.stringify(mergedAssets));
    localStorage.setItem("liabilities", JSON.stringify(mergedLiabilities));
    localStorage.setItem("categories", JSON.stringify(mergedCategories));
    
    // Об'єднуємо користувачів (важливо для синхронізації між пристроями)
    if (data.users && data.users.length > 0) {
      const existingUsers = JSON.parse(localStorage.getItem("financial_os_users") || "[]");
      const mergedUsers = [...existingUsers];
      data.users.forEach((u) => {
        const index = mergedUsers.findIndex((eu) => eu.id === u.id || eu.username.toLowerCase() === u.username.toLowerCase());
        if (index === -1) {
          mergedUsers.push(u);
        } else {
          // Використовуємо новішу версію (за датою створення)
          const existingDate = new Date(mergedUsers[index].createdAt || 0).getTime();
          const newDate = new Date(u.createdAt || 0).getTime();
          if (newDate >= existingDate) {
            mergedUsers[index] = u;
          }
        }
      });
      localStorage.setItem("financial_os_users", JSON.stringify(mergedUsers));
    }
    
    // Об'єднуємо сесії (використовуємо найновішу активну сесію)
    if (data.sessions && data.sessions.length > 0) {
      const existingSession = localStorage.getItem("financial_os_session");
      const newSession = data.sessions[0]; // Беремо першу сесію
      if (newSession && newSession.expiresAt && newSession.expiresAt > Date.now()) {
        // Якщо нова сесія валідна, використовуємо її
        if (!existingSession || JSON.parse(existingSession).expiresAt < newSession.expiresAt) {
          localStorage.setItem("financial_os_session", JSON.stringify(newSession));
        }
      }
    }
  } else {
    // Повна заміна
    localStorage.setItem("transactions", JSON.stringify(data.transactions));
    localStorage.setItem("goals", JSON.stringify(data.goals));
    localStorage.setItem("assets", JSON.stringify(data.assets));
    localStorage.setItem("liabilities", JSON.stringify(data.liabilities));
    localStorage.setItem("categories", JSON.stringify(data.categories));
    
    // Замінюємо користувачів та сесії
    if (data.users) {
      localStorage.setItem("financial_os_users", JSON.stringify(data.users));
    }
    if (data.sessions && data.sessions.length > 0) {
      localStorage.setItem("financial_os_session", JSON.stringify(data.sessions[0]));
    }
  }

  // Оновлюємо налаштування
  Object.entries(data.settings).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(data));
}

// Збереження даних для синхронізації (для експорту/імпорту)
export function saveSyncData(data: SyncData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(data));
}

// Завантаження даних синхронізації
export function loadSyncData(): SyncData | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SYNC_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Експорт даних у JSON файл
export function exportToFile(): void {
  const data = exportData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financial-os-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Імпорт даних з JSON файлу
export function importFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as SyncData;
        importData(data, true);
        resolve();
      } catch (error) {
        reject(new Error("Помилка читання файлу"));
      }
    };
    reader.onerror = () => reject(new Error("Помилка читання файлу"));
    reader.readAsText(file);
  });
}

// Синхронізація через QR код (для швидкого перенесення між пристроями)
export function generateSyncQRCode(): string {
  const data = exportData();
  const json = JSON.stringify(data);
  // Використовуємо base64 для кодування
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `financial-os-sync:${base64}`;
}

// Розшифровка QR коду
export function parseSyncQRCode(qrData: string): SyncData | null {
  try {
    if (!qrData.startsWith("financial-os-sync:")) {
      return null;
    }
    const base64 = qrData.replace("financial-os-sync:", "");
    const json = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(json) as SyncData;
  } catch {
    return null;
  }
}

// Автоматична синхронізація (для майбутнього використання з cloud storage)
export function startAutoSync(callback?: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const interval = setInterval(() => {
    const user = getCurrentUser();
    if (user) {
      // Тут можна додати логіку синхронізації з cloud storage
      // Наприклад, через Firebase, Supabase або інший backend
      const data = exportData();
      saveSyncData(data);
      
      if (callback) {
        callback();
      }
    }
  }, SYNC_INTERVAL);

  return () => clearInterval(interval);
}
