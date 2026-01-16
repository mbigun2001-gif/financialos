// Система автентифікації з безпечним збереженням

// Простий хеш функція (для клієнтського використання)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Генерація токену сесії
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Хешований пароль
  email?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Session {
  token: string;
  userId: string;
  username: string;
  expiresAt: number; // Timestamp
  rememberMe: boolean;
}

const STORAGE_KEY_USERS = "financial_os_users";
const STORAGE_KEY_SESSION = "financial_os_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 днів для "remember me"
const SESSION_DURATION_SHORT = 24 * 60 * 60 * 1000; // 1 день для звичайної сесії

// Завантаження користувачів
function loadUsers(): User[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY_USERS);
  return stored ? JSON.parse(stored) : [];
}

// Збереження користувачів
function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

// Завантаження сесії
export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!stored) return null;
  
  try {
    const session: Session = JSON.parse(stored);
    // Перевіряємо чи сесія не закінчилась
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Збереження сесії
function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
}

// Видалення сесії
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
}

// Реєстрація нового користувача
export async function register(
  username: string,
  password: string,
  email?: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Браузер не підтримується" };
  }

  const users = loadUsers();

  // Перевірка чи користувач вже існує
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: "Користувач з таким логіном вже існує" };
  }

  // Валідація
  if (username.length < 3) {
    return { success: false, error: "Логін повинен містити мінімум 3 символи" };
  }

  if (password.length < 6) {
    return { success: false, error: "Пароль повинен містити мінімум 6 символів" };
  }

  // Хешування пароля
  const passwordHash = await hashPassword(password);

  // Створення користувача
  const newUser: User = {
    id: Date.now().toString(),
    username,
    passwordHash,
    email,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true };
}

// Авторизація
export async function login(
  username: string,
  password: string,
  rememberMe: boolean = false
): Promise<{ success: boolean; error?: string; session?: Session }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Браузер не підтримується" };
  }

  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return { success: false, error: "Невірний логін або пароль" };
  }

  // Перевірка пароля
  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return { success: false, error: "Невірний логін або пароль" };
  }

  // Оновлення останнього входу
  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  // Створення сесії
  const session: Session = {
    token: generateSessionToken(),
    userId: user.id,
    username: user.username,
    expiresAt: Date.now() + (rememberMe ? SESSION_DURATION : SESSION_DURATION_SHORT),
    rememberMe,
  };

  saveSession(session);

  return { success: true, session };
}

// Перевірка авторизації
export function isAuthenticated(): boolean {
  const session = loadSession();
  return session !== null;
}

// Отримання поточного користувача
export function getCurrentUser(): Session | null {
  return loadSession();
}

// Вихід
export function logout(): void {
  clearSession();
}

// Зміна пароля
export async function changePassword(
  username: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Браузер не підтримується" };
  }

  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return { success: false, error: "Користувач не знайдений" };
  }

  // Перевірка старого пароля
  const oldPasswordHash = await hashPassword(oldPassword);
  if (user.passwordHash !== oldPasswordHash) {
    return { success: false, error: "Невірний поточний пароль" };
  }

  // Валідація нового пароля
  if (newPassword.length < 6) {
    return { success: false, error: "Новий пароль повинен містити мінімум 6 символів" };
  }

  // Оновлення пароля
  const newPasswordHash = await hashPassword(newPassword);
  user.passwordHash = newPasswordHash;
  saveUsers(users);

  return { success: true };
}
