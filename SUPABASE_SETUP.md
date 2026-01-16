# Налаштування Supabase для синхронізації даних

## Крок 1: Отримайте Anon Key

1. Відкрийте ваш Supabase проект: https://jmhvlboizpvdxtxqovhe.supabase.co
2. Перейдіть в **Settings** → **API**
3. Скопіюйте **anon/public** ключ

## Крок 2: Додайте змінні оточення

Створіть файл `.env.local` в корені проекту (якщо його немає) та додайте:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jmhvlboizpvdxtxqovhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key_тут
```

**Важливо:** Замініть `ваш_anon_key_тут` на реальний ключ з кроку 1.

## Крок 3: Створіть таблицю в Supabase

1. Відкрийте Supabase Dashboard
2. Перейдіть в **SQL Editor**
3. Відкрийте файл `supabase-setup.sql` з проекту
4. Скопіюйте весь SQL код
5. Вставте в SQL Editor та виконайте (Run)

Це створить таблицю `sync_data` для зберігання синхронізованих даних.

## Крок 4: Налаштування Row Level Security (RLS)

Якщо ви хочете використовувати Supabase Auth для безпеки:
- Політики RLS вже включені в SQL скрипті
- Налаштуйте Supabase Auth в проекті

Якщо ви НЕ використовуєте Supabase Auth:
- В SQL Editor виконайте:
```sql
DROP POLICY IF EXISTS "Users can read own sync data" ON sync_data;
DROP POLICY IF EXISTS "Users can insert own sync data" ON sync_data;
DROP POLICY IF EXISTS "Users can update own sync data" ON sync_data;
DROP POLICY IF EXISTS "Users can delete own sync data" ON sync_data;

CREATE POLICY "Public access" ON sync_data FOR ALL USING (true) WITH CHECK (true);
```

## Крок 5: Перезапустіть проект

```bash
npm run dev
```

## Перевірка роботи

1. Відкрийте консоль браузера (F12)
2. Перейдіть на будь-яку сторінку
3. Перевірте чи немає помилок підключення до Supabase
4. Зробіть зміни в даних - вони мають автоматично синхронізуватися

## Troubleshooting

### Помилка "relation sync_data does not exist"
- Виконайте SQL скрипт з `supabase-setup.sql` в SQL Editor

### Помилка "new row violates row-level security policy"
- Перевірте налаштування RLS політик (див. Крок 4)

### Дані не синхронізуються
- Перевірте чи правильно вказані змінні оточення в `.env.local`
- Перевірте консоль браузера на наявність помилок
- Переконайтеся що таблиця `sync_data` створена
