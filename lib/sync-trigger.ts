// Helper для тригеру синхронізації після змін даних

export function triggerDataSync() {
  if (typeof window === "undefined") return;
  
  try {
    const { triggerSync } = require("./auto-sync");
    triggerSync();
    
    // Також тригеримо cloud sync
    const { forceCloudSync } = require("./cloud-sync");
    forceCloudSync();
  } catch (e) {
    // Ігноруємо помилки якщо модуль не завантажений
  }
}
