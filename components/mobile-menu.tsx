"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Building2,
  Briefcase,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout, getCurrentUser } from "@/lib/auth";

const navigation = [
  { name: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
  { name: "Капітал", href: "/capital", icon: Building2 },
  { name: "Цілі", href: "/goals", icon: Target },
  { name: "Доходи та розходи", href: "/transactions", icon: TrendingUp },
  { name: "Вклади та зобов'язання", href: "/liabilities", icon: CreditCard },
  { name: "Бізнес-облік", href: "/business", icon: Briefcase },
  { name: "Налаштування", href: "/settings", icon: Settings },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* Кнопка відкриття меню */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Мобільне меню */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950">
          <div className="flex flex-col h-full">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <Link 
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Фінансова ОС
                </span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Навігація */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = item.href === "/transactions" 
                  ? pathname === item.href || pathname === "/income" || pathname === "/expenses"
                  : pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-slate-100 border border-blue-500/30"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive && "text-blue-400")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Користувач та вихід */}
            <div className="border-t border-slate-800/50 p-4 space-y-3">
              <div className="px-3">
                <p className="text-xs text-slate-500 mb-1">Користувач</p>
                <p className="text-sm font-medium text-slate-300">
                  {getCurrentUser()?.username || "Невідомий"}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Вийти
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
