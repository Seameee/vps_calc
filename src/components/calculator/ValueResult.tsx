import { cn } from '@/lib/utils';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { Clock, TrendingUp, DollarSign, ArrowRightLeft, Sigma } from 'lucide-react';
import type { CalculatorResult } from '@/types/calculator';
import type { CurrencyCode } from '@/types/currency';

interface ValueResultProps {
  result: CalculatorResult;
  billingCurrency: CurrencyCode;
  tradeCurrency: CurrencyCode;
}

export function ValueResult({ result, billingCurrency, tradeCurrency }: ValueResultProps) {
  const showConversion = billingCurrency !== tradeCurrency && result.exchangeRate !== null;

  return (
    <div className={cn(
      "glass-card",
      "bg-gradient-to-br from-blue-500/[0.08] to-purple-500/[0.08]",
      "border-blue-400/20"
    )}>
      <div className="p-6 space-y-6">
        <h3 className="text-xl font-semibold text-white/95">价值计算结果</h3>

        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-white/50 mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm">剩余天数</span>
            </div>
            <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {Math.floor(result.remainingDays)}
            </div>
            <div className="text-sm text-white/50 mt-1">天</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <DollarSign className="h-4 w-4" />
              日单价
            </div>
            <div className="text-xl font-semibold text-white/95">
              {CURRENCY_SYMBOLS[billingCurrency]}
              {result.dailyPrice.toFixed(4)}
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <TrendingUp className="h-4 w-4" />
              剩余价值
            </div>
            <div className="text-xl font-semibold text-white/95">
              {CURRENCY_SYMBOLS[billingCurrency]}
              {result.remainingValue.toFixed(2)}
            </div>
          </div>
        </div>

        {showConversion && (
          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <ArrowRightLeft className="h-4 w-4" />
              转换后价值
            </div>
            <div className="text-xl font-semibold text-white/95">
              {CURRENCY_SYMBOLS[tradeCurrency]}
              {result.convertedValue.toFixed(2)}
            </div>
            {result.exchangeRate && (
              <div className="text-xs text-white/50">
                汇率: 1 {billingCurrency} ≈ {result.exchangeRate.toFixed(4)} {tradeCurrency}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Sigma className="h-4 w-4" />
            最终价值
          </div>
          <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {CURRENCY_SYMBOLS[tradeCurrency]}
            {result.finalValue.toFixed(2)}
          </div>
        </div>

        {result.formula && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-xs text-white/50 mb-1">计算公式</div>
            <code className="text-sm text-white/70 font-mono break-all">
              {result.formula}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
