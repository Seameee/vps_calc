import { cn } from '@/lib/utils';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { ArrowRight, ArrowDown, Equal, Calculator, RotateCcw, ArrowRightLeft, Percent } from 'lucide-react';
import type { CalculatorResult } from '@/types/calculator';
import type { CurrencyCode } from '@/types/currency';

interface CalculationBreakdownProps {
  result: CalculatorResult;
  billingCurrency: CurrencyCode;
  tradeCurrency: CurrencyCode;
  surcharge: number;
  pushFee: number;
  feeBearer: 'seller' | 'buyer';
  isRoundingEnabled: boolean;
}

interface Step {
  label: string;
  value: string;
  formula?: string;
  highlight?: boolean;
}

export function CalculationBreakdown({
  result,
  billingCurrency,
  tradeCurrency,
  surcharge,
  pushFee,
  feeBearer,
  isRoundingEnabled,
}: CalculationBreakdownProps) {
  const showConversion = billingCurrency !== tradeCurrency && result.exchangeRate !== null;

  const steps: Step[] = [
    {
      label: '日单价',
      value: `${CURRENCY_SYMBOLS[billingCurrency]}${result.dailyPrice.toFixed(4)}`,
      formula: '续费价格 ÷ 计费周期天数',
    },
    {
      label: '剩余天数',
      value: `${Math.floor(result.remainingDays)} 天`,
      formula: '到期日期 - 当前日期',
    },
    {
      label: '剩余价值',
      value: `${CURRENCY_SYMBOLS[billingCurrency]}${result.remainingValue.toFixed(2)}`,
      formula: '日单价 × 剩余天数',
      highlight: true,
    },
  ];

  if (showConversion) {
    steps.push({
      label: `汇率转换 (${billingCurrency} → ${tradeCurrency})`,
      value: `${CURRENCY_SYMBOLS[tradeCurrency]}${result.convertedValue.toFixed(2)}`,
      formula: `剩余价值 × 汇率 (${result.exchangeRate?.toFixed(4) ?? '--'})`,
      highlight: true,
    });
  }

  if (surcharge !== 0) {
    const sign = surcharge > 0 ? '+' : '';
    steps.push({
      label: surcharge > 0 ? '溢价' : '折价',
      value: `${sign}${CURRENCY_SYMBOLS[tradeCurrency]}${surcharge.toFixed(2)}`,
      formula: '用户手动输入',
    });
  }

  if (pushFee > 0) {
    steps.push({
      label: `Push 费用 (${feeBearer === 'seller' ? '卖家承担' : '买家承担'})`,
      value: `${CURRENCY_SYMBOLS[tradeCurrency]}${pushFee.toFixed(2)}`,
      formula: feeBearer === 'seller' ? '最终价值 - Push 费用' : '最终价值 + Push 费用',
    });
  }

  if (isRoundingEnabled) {
    steps.push({
      label: '四舍五入',
      value: `${CURRENCY_SYMBOLS[tradeCurrency]}${result.finalValue.toFixed(2)}`,
      formula: 'round(最终价值, 2)',
    });
  }

  steps.push({
    label: '最终价值',
    value: `${CURRENCY_SYMBOLS[tradeCurrency]}${result.finalValue.toFixed(2)}`,
    highlight: true,
  });

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-blue-400" />
        <h3 className="text-xl font-semibold text-white/95">计算明细</h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.label} className="relative">
            <div
              className={cn(
                'flex items-center justify-between p-4 rounded-2xl border transition-colors',
                step.highlight
                  ? 'bg-gradient-to-r from-blue-500/[0.08] to-purple-500/[0.08] border-blue-400/20'
                  : 'bg-white/[0.04] border-white/10'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white/40 w-5">{index + 1}</span>
                  <span className="text-sm font-medium text-white/70">{step.label}</span>
                </div>
                {step.formula && (
                  <div className="ml-7 mt-1 text-xs text-white/40 font-mono">{step.formula}</div>
                )}
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    step.highlight ? 'text-white/95' : 'text-white/70'
                  )}
                >
                  {step.value}
                </span>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-4 w-4 text-white/20" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <RotateCcw className="h-4 w-4" />
          <span>完整公式</span>
        </div>
        <code className="block text-sm text-white/70 font-mono break-all leading-relaxed">
          {result.formula}
        </code>
      </div>
    </div>
  );
}
