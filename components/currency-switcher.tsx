"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { currencyAPI } from "@/lib/currency-api";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CurrencySwitcherProps {
  currency: "UAH" | "USD";
  onCurrencyChange: (currency: "UAH" | "USD") => void;
  exchangeRate: number;
  onRateUpdate: (rate: number) => void;
}

export function CurrencySwitcher({
  currency,
  onCurrencyChange,
  exchangeRate,
  onRateUpdate,
}: CurrencySwitcherProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const newRate = await currencyAPI.refreshRate();
    onRateUpdate(newRate);
    setIsRefreshing(false);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <Label htmlFor="currency-switch" className="text-slate-300 cursor-pointer">
          UAH
        </Label>
        <Switch
          id="currency-switch"
          checked={currency === "USD"}
          onCheckedChange={(checked) => onCurrencyChange(checked ? "USD" : "UAH")}
        />
        <Label htmlFor="currency-switch" className="text-slate-300 cursor-pointer">
          USD
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Оновити курс валют</p>
            <p className="text-xs mt-1">1 USD = {exchangeRate.toFixed(2)} UAH</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
