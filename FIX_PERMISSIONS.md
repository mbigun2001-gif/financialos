# Виправлення проблеми з дозволами macOS

Якщо ви бачите помилку "Operation not permitted" при запуску Next.js, це проблема дозволів macOS.

## Рішення 1: Додати Terminal до Full Disk Access

1. Відкрийте **System Settings** (Системні налаштування)
2. Перейдіть до **Privacy & Security** (Конфіденційність і безпека)
3. Знайдіть **Full Disk Access** (Повний доступ до диска)
4. Натисніть **+** і додайте:
   - **Terminal** (або iTerm, якщо використовуєте)
   - **Node.js** (якщо є в списку)
5. Перезапустіть термінал

## Рішення 2: Використати yarn замість npm

```bash
cd /Users/mbigun/Desktop/financial-os
rm -rf node_modules package-lock.json
yarn install
yarn dev
```

## Рішення 3: Перемістити проект

Перемістіть проект з Desktop в іншу папку (наприклад, ~/Projects):

```bash
mv /Users/mbigun/Desktop/financial-os ~/Projects/financial-os
cd ~/Projects/financial-os
npm install
npm run dev
```

## Рішення 4: Використати sudo (не рекомендовано)

```bash
cd /Users/mbigun/Desktop/financial-os
sudo npm install
sudo npm run dev
```

**Найкраще рішення**: Рішення 1 (додати Terminal до Full Disk Access)
