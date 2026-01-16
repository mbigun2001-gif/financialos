"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { login, register, isAuthenticated } from "@/lib/auth";
import { DollarSign, Lock, User, Mail, Eye, EyeOff, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Якщо вже авторизований, перенаправляємо
    if (isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Логін
        const result = await login(username, password, rememberMe);
        if (result.success) {
          router.push("/");
        } else {
          setError(result.error || "Помилка авторизації");
        }
      } else {
        // Реєстрація
        if (password !== confirmPassword) {
          setError("Паролі не співпадають");
          setLoading(false);
          return;
        }

        const result = await register(username, password, email || undefined);
        if (result.success) {
          // Невелика затримка для гарантії збереження даних в localStorage
          await new Promise(resolve => setTimeout(resolve, 200));
          // Після реєстрації автоматично логінимо
          const loginResult = await login(username, password, rememberMe);
          if (loginResult.success) {
            // Додаткова затримка перед перенаправленням
            await new Promise(resolve => setTimeout(resolve, 100));
            window.location.href = "/"; // Використовуємо window.location для повного перезавантаження
          } else {
            setError(loginResult.error || "Реєстрація успішна, але не вдалося увійти. Спробуйте увійти вручну.");
            setLoading(false);
          }
        } else {
          setError(result.error || "Помилка реєстрації");
          setLoading(false);
        }
      }
    } catch (err) {
      setError("Сталася несподівана помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div className="text-center md:text-left">
                <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Фінансова ОС
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Система управління фінансами
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
              <Button
                type="button"
                variant={isLogin ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className={`flex-1 ${isLogin ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}`}
              >
                <Lock className="h-4 w-4 mr-2" />
                Вхід
              </Button>
              <Button
                type="button"
                variant={!isLogin ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className={`flex-1 ${!isLogin ? "bg-gradient-to-r from-purple-600 to-pink-600" : ""}`}
              >
                <User className="h-4 w-4 mr-2" />
                Реєстрація
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="username" className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Логін
                </Label>
                <Input
                  id="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введіть логін"
                  className="bg-slate-800/50 border-slate-700"
                  disabled={loading}
                />
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email (необов'язково)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-slate-800/50 border-slate-700"
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Пароль
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введіть пароль"
                    className="bg-slate-800/50 border-slate-700 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-slate-400" />
                    Підтвердіть пароль
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторіть пароль"
                    className="bg-slate-800/50 border-slate-700"
                    disabled={loading}
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    disabled={loading}
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer">
                    Запам'ятати мене
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  "Завантаження..."
                ) : isLogin ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Увійти
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Зареєструватися
                  </>
                )}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  При вході з "Запам'ятати мене" сесія зберігається на 7 днів
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
