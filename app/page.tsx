"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Target, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const apps = [
  {
    id: "financial-os",
    name: "Фінансова ОС",
    description: "Операційна система для управління фінансами, капіталом, доходами та витратами",
    icon: DollarSign,
    href: "/dashboard",
    color: "from-blue-500 to-purple-600",
    features: ["Дашборд", "Капітал", "Доходи та розходи", "Бізнес-облік", "Вклади та зобов'язання"],
  },
  {
    id: "goals-tracker",
    name: "Досягнення цілей",
    description: "Трекер для відстеження прогресу досягнення ваших цілей з детальною аналітикою",
    icon: Target,
    href: "/goals-app",
    color: "from-purple-500 to-pink-600",
    features: ["Відстеження цілей", "Прогрес", "Аналітика", "Прогноз досягнення", "Статистика"],
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full space-y-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-slate-100 via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Оберіть додаток
            </h1>
          </div>
          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto px-4">
            Виберіть додаток для роботи з вашими фінансами та цілями
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {apps.map((app, index) => {
            const Icon = app.icon;
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-800/40 hover:border-slate-700 transition-all duration-300 cursor-pointer group h-full"
                  onClick={() => router.push(app.href)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${app.color} shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-100 mb-2">
                      {app.name}
                    </CardTitle>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {app.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Основні функції:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-xs text-slate-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      <Button
                        className={`w-full mt-4 bg-gradient-to-r ${app.color} hover:opacity-90 transition-opacity`}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(app.href);
                        }}
                      >
                        Відкрити додаток
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-slate-500">
            Всі додатки інтегровані та синхронізовані між собою
          </p>
        </motion.div>
      </div>
    </div>
  );
}
