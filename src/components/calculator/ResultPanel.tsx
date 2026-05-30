import type { CalculatorResult } from '@/types/calculator';
import type { VPSInputs } from '@/types/calculator';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { formatNumber } from '@/utils/formatters';
import { Calculator, Clock, TrendingUp, DollarSign, Percent, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultPanelProps {
  result: CalculatorResult | null;
  inputs: VPSInputs;
}

/**
 * 计算结果展示面板
 *
 * Glassmorphism 卡片展示剩余天数、日单价、剩余价值与最终售价。
 */
export function ResultPanel({ result, inputs }: ResultPanelProps) {
  if (!result) {
    return (
      <div className={cn('glass-card flex items-center justify-center p-8')}>
        <p className="text-white/50">请输入 VPS 信息以查看计算结果</p>
      </div>
    );
  }

  const symbol = CURRENCY_SYMBOLS[inputs.tradeCurrency];
  const billingSymbol = CURRENCY_SYMBOLS[inputs.billingCurrency];

  const stats = [
    {
      icon: Clock,
      label: '剩余天数',
      value: `${formatNumber(result.remainingDays, 1)} 天`,
      accent: 'text-blue-400',
    },
    {
      icon: TrendingUp,
      label: '日单价',
      value: `${billingSymbol}${result.dailyPrice.toFixed(4)}`,
      accent: 'text-purple-400',
    },
    {
      icon: DollarSign,
      label: '剩余价值',
      value: `${symbol}${result.remainingValue.toFixed(2)}`,
      accent: 'text-green-400',
    },
    {
      icon: ArrowRightLeft,
      label: '溢价/折价',
      value: `${result.calculatedSurcharge >= 0 ? '+' : ''}${symbol}${result.calculatedSurcharge.toFixed(2)}`,
      accent: result.calculatedSurcharge >= 0 ? 'text-amber-400' : 'text-red-400',
    },
    {
      icon: Calculator,
      label: '最终售价',
      value: `${symbol}${result.finalValue.toFixed(2)}`,
      accent: 'text-amber-400',
      highlight: true,
    },
  ];

  return (
    <div className={cn('glass-card space-y-4 p-4')}>
      <div className="flex items-center gap-2">
        <Percent className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white/95">计算结果</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all',
              stat.label === '最终售价' ? 'col-span-2' : '',
              stat.highlight && 'ring-1 ring-amber-400/30 bg-amber-400/5',
            )}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <stat.icon className={cn('h-3.5 w-3.5', stat.accent)} />
              <span className="text-xs font-medium text-white/60">{stat.label}</span>
            </div>
            <p className={cn('text-xl font-bold tracking-tight', stat.highlight ? 'text-amber-400' : 'text-white/95')}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className="mb-1 text-xs font-medium text-white/60">计算过程</p>
        <p className="break-words text-xs leading-relaxed text-white/70">{result.formula}</p>
      </div>

      {result.exchangeRate !== null && inputs.billingCurrency !== inputs.tradeCurrency && (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <TrendingUp className="h-3 w-3" />
          <span>
            汇率: 1 {inputs.billingCurrency} ≈ {result.exchangeRate.toFixed(4)} {inputs.tradeCurrency}
          </span>
        </div>
      )}
    </div>
  );
}
