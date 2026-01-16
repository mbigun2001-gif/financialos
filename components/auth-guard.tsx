"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

const publicRoutes = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Перевіряємо чи це публічний маршрут
    if (publicRoutes.includes(pathname)) {
      setIsChecking(false);
      return;
    }

    // Перевіряємо автентифікацію
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    setIsChecking(false);
  }, [pathname, router]);

  // Показуємо завантаження під час перевірки
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-slate-400">Перевірка автентифікації...</p>
        </div>
      </div>
    );
  }

  // Якщо це публічний маршрут, показуємо без перевірки
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Якщо не авторизований, не показуємо контент (буде редирект)
  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
