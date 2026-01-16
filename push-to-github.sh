#!/bin/bash
# Скрипт для завантаження коду на GitHub

echo "Завантаження коду на GitHub..."
echo ""
echo "Якщо запитає username - введіть ваш GitHub username"
echo "Якщо запитає password - вставте Personal Access Token (не пароль!)"
echo ""
echo "Створіть токен тут: https://github.com/settings/tokens"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Код успішно завантажено на GitHub!"
    echo "Репозиторій: https://github.com/mbigun2001-gif/financialos"
else
    echo ""
    echo "❌ Помилка завантаження. Перевірте автентифікацію."
fi
