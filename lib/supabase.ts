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
  if (!supabase) {
    console.warn("Supabase client is null. Check environment variables.");
    return false;
  }
  
  try {
    // Простий запит для перевірки підключення
    const { data, error } = await supabase.from('sync_data').select('id').limit(1);
    
    // Якщо помилка про відсутність таблиці - це нормально, таблицю потрібно створити
    // Але якщо помилка про RLS або інші проблеми - це означає що підключення є
    if (error) {
      const isTableMissing = error.message?.includes('relation') || 
                            error.message?.includes('does not exist') ||
                            error.code === '42P01'; // PostgreSQL error code for "relation does not exist"
      const isRLSBlocked = error.code === '42501' || 
                          error.message?.includes('row-level security policy') ||
                          error.message?.includes('permission denied');
      
      if (isTableMissing) {
        console.warn("Supabase: Таблиця 'sync_data' не знайдена. Виконайте SQL скрипт.");
        return false; // Вважаємо, що не підключено, якщо таблиці немає
      }
      
      if (isRLSBlocked) {
        console.warn("Supabase: Доступ заблоковано RLS. Перевірте політики.");
        return true; // Підключено, але RLS блокує доступ
      }
      
      // Інші помилки - можливо підключення є, але є інші проблеми
      console.warn("Supabase: Помилка підключення:", error.message);
      return false;
    }
    
    // Якщо помилок немає - підключення успішне
    return true;
  } catch (e) {
    console.error("Supabase: Виняток при перевірці підключення:", e);
    return false;
  }
}
