"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  DollarSign,
  Receipt,
  Settings,
  ArrowLeft,
  Building2,
  Briefcase,
  CreditCard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r border-slate-800/50 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-sm">
      <div className="flex h-16 items-center border-b border-slate-800/50 px-6 bg-slate-900/30">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer w-full">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex-1 text-left">
            Фінансова ОС
          </span>
        </Link>
      </div>
      {!isDashboard && (
        <div className="px-3 pt-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-full justify-start text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </div>
      )}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          // Для транзакцій також вважаємо активними старі маршрути
          const isActive = item.href === "/transactions" 
            ? pathname === item.href || pathname === "/income" || pathname === "/expenses"
            : pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-slate-100 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 hover:translate-x-1"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800/50 p-4">
        <div className="mb-3 px-3">
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
  );
}
