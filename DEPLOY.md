# Інструкції для деплою на GitHub та Vercel

## 1. Завантаження на GitHub

### Варіант A: Через Personal Access Token (рекомендовано)

1. Створіть Personal Access Token:
   - Перейдіть на https://github.com/settings/tokens
   - Натисніть "Generate new token (classic)"
   - Виберіть scope: `repo` (повний доступ до репозиторіїв)
   - Скопіюйте токен

2. Виконайте push:
```bash
git push -u origin main
```
   - Username: ваш GitHub username
   - Password: вставте токен (не пароль!)

### Варіант B: Через SSH

1. Створіть SSH ключ (якщо немає):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Додайте ключ до GitHub:
```bash
cat ~/.ssh/id_ed25519.pub
# Скопіюйте вивід і додайте на https://github.com/settings/keys
```

3. Змініть remote на SSH:
```bash
git remote set-url origin git@github.com:mbigun2001-gif/financialos.git
git push -u origin main
```

## 2. Деплой на Vercel

### Варіант A: Через веб-інтерфейс (найпростіше)

1. Перейдіть на https://vercel.com
2. Увійдіть через GitHub
3. Натисніть "Add New Project"
4. Імпортуйте репозиторій `mbigun2001-gif/financialos`
5. Vercel автоматично визначить Next.js
6. Натисніть "Deploy"

### Варіант B: Через Vercel CLI

1. Встановіть Vercel CLI:
```bash
npm i -g vercel
```

2. Увійдіть:
```bash
vercel login
```

3. Деплой:
```bash
vercel
```

4. Для production:
```bash
vercel --prod
```

## Налаштування змінних середовища (якщо потрібно)

Якщо у вас є змінні середовища, додайте їх у Vercel:
1. Project Settings → Environment Variables
2. Додайте необхідні змінні

## Після деплою

Vercel автоматично надасть вам URL типу:
`https://financialos-xxx.vercel.app`

Можна також додати власний домен у налаштуваннях проекту.
