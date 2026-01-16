# Інструкції для push на GitHub

## Проблема з токеном

Якщо токен не працює, перевірте:

1. **Токен має правильні permissions:**
   - Перейдіть на https://github.com/settings/tokens
   - Переконайтеся, що токен має scope `repo` (повний доступ)

2. **Токен не застарів:**
   - Створіть новий токен, якщо старий не працює

## Спосіб 1: Через командний рядок

```bash
git push -u origin main
```

Коли запитає:
- **Username**: `mbigun2001-gif`
- **Password**: вставте ваш Personal Access Token (не пароль!)

## Спосіб 2: Через GitHub Desktop

1. Встановіть GitHub Desktop
2. Відкрийте репозиторій
3. Натисніть "Push origin"

## Спосіб 3: Через SSH (найбезпечніше)

1. Створіть SSH ключ:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Додайте ключ до GitHub:
```bash
cat ~/.ssh/id_ed25519.pub
# Скопіюйте і додайте на https://github.com/settings/keys
```

3. Змініть remote:
```bash
git remote set-url origin git@github.com:mbigun2001-gif/financialos.git
git push -u origin main
```

## Перевірка статусу

```bash
git status
git remote -v
```
