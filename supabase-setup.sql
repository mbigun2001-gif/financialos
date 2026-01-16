-- SQL скрипт для створення таблиці синхронізації в Supabase
-- Виконайте цей скрипт в SQL Editor в Supabase Dashboard

-- Видалення таблиці якщо вона існує (для пересоздання)
DROP TABLE IF EXISTS sync_data CASCADE;

-- Створення таблиці для синхронізації даних
CREATE TABLE sync_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  device_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Створення індексу для швидкого пошуку по user_id
CREATE INDEX IF NOT EXISTS idx_sync_data_user_id ON sync_data(user_id);

-- Створення індексу для пошуку по device_id
CREATE INDEX IF NOT EXISTS idx_sync_data_device_id ON sync_data(device_id);

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригер для автоматичного оновлення updated_at
DROP TRIGGER IF EXISTS update_sync_data_updated_at ON sync_data;
CREATE TRIGGER update_sync_data_updated_at 
  BEFORE UPDATE ON sync_data 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Налаштування Row Level Security (RLS)
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;

-- Видалення старих політик якщо вони існують
DROP POLICY IF EXISTS "Users can read own sync data" ON sync_data;
DROP POLICY IF EXISTS "Users can insert own sync data" ON sync_data;
DROP POLICY IF EXISTS "Users can update own sync data" ON sync_data;
DROP POLICY IF EXISTS "Users can delete own sync data" ON sync_data;
DROP POLICY IF EXISTS "Public access" ON sync_data;

-- Для публічного доступу (оскільки не використовуємо Supabase Auth)
-- Це дозволяє всім користувачам читати/писати дані (безпека через user_id)
CREATE POLICY "Public access" 
  ON sync_data 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
