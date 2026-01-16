// Supabase клієнт для синхронізації даних
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Перевірка чи ключ не є placeholder
const isValidKey = supabaseAnonKey && 
  !supabaseAnonKey.includes('твій') && 
  !supabaseAnonKey.includes('тут') && 
  !supabaseAnonKey.includes('ваш') &&
  !supabaseAnonKey.includes('anon_key') &&
  supabaseAnonKey.length > 20; // Мінімальна довжина реального ключа

if (!supabaseUrl || !supabaseAnonKey || !isValidKey) {
  console.warn('Supabase credentials not found or invalid. Using localStorage fallback.');
  console.warn('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  console.warn('Current values:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey, 
    isValid: isValidKey,
    keyLength: supabaseAnonKey?.length 
  });
}

export const supabase = supabaseUrl && supabaseAnonKey && isValidKey
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
