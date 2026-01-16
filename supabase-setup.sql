-- SQL скрипт для створення таблиці синхронізації в Supabase
-- Виконайте цей скрипт в SQL Editor в Supabase Dashboard

-- Створення таблиці для синхронізації даних
CREATE TABLE IF NOT EXISTS sync_data (
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
CREATE TRIGGER update_sync_data_updated_at 
  BEFORE UPDATE ON sync_data 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Налаштування Row Level Security (RLS)
ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;

-- Політика: користувачі можуть читати тільки свої дані
CREATE POLICY "Users can read own sync data"
  ON sync_data
  FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Політика: користувачі можуть вставляти тільки свої дані
CREATE POLICY "Users can insert own sync data"
  ON sync_data
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Політика: користувачі можуть оновлювати тільки свої дані
CREATE POLICY "Users can update own sync data"
  ON sync_data
  FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Політика: користувачі можуть видаляти тільки свої дані
CREATE POLICY "Users can delete own sync data"
  ON sync_data
  FOR DELETE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Для публічного доступу (якщо не використовуєте Supabase Auth)
-- Можна використати цю політику замість вищевказаних:
-- CREATE POLICY "Public access" ON sync_data FOR ALL USING (true) WITH CHECK (true);
