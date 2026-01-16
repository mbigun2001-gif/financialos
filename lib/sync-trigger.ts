// Helper для тригеру синхронізації після змін даних

export function triggerDataSync() {
  if (typeof window === "undefined") return;
  
  try {
    const { triggerSync } = require("./auto-sync");
    triggerSync();
  } catch (e) {
    // Ігноруємо помилки якщо модуль не завантажений
  }
}
