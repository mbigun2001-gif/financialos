// Supabase клієнт для синхронізації даних
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using localStorage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Перевірка підключення до Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    // Простий запит для перевірки підключення
    const { error } = await supabase.from('sync_data').select('id').limit(1);
    // Якщо помилка про відсутність таблиці - це нормально, таблицю потрібно створити
    return error === null || error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist');
  } catch {
    return false;
  }
}
