"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  progress?: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  progress,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("border-slate-800/50 hover:scale-[1.02] transition-transform duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <div className="p-1.5 rounded-lg bg-slate-800/50">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">{value}</div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        {progress !== undefined && (
          <div className="mt-4">
            <Progress value={Math.min(progress, 100)} className="h-2" />
            <p className="text-xs text-slate-500 mt-2">
              {progress.toFixed(1)}% виконано
            </p>
          </div>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs mt-2",
              trend.isPositive ? "text-green-400" : "text-red-400"
            )}
          >
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
