import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/utils/constants';
import { TrendingUp, Wallet, Repeat } from 'lucide-react';
import type { TradeSettings as TradeSettingsType, CalculatorResult } from '@/types/calculator';
import type { CurrencyCode } from '@/types/currency';

interface TradeSettingsProps {
  value: TradeSettingsType;
  onChange: (value: TradeSettingsType) => void;
  previewResult?: CalculatorResult;
}

export function TradeSettings({ value, onChange, previewResult }: TradeSettingsProps) {
  const updateField = <K extends keyof TradeSettingsType>(field: K, fieldValue: TradeSettingsType[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-xl font-semibold text-white/95">交易设置</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surcharge">
            <TrendingUp className="inline h-4 w-4 mr-1" />
            溢价/折价
          </Label>
          <Input
            id="surcharge"
            type="number"
            step="0.01"
            placeholder="正数=溢价, 负数=折价"
            value={value.surcharge}
            onChange={(e) => updateField('surcharge', Number(e.target.value))}
          />
          <p className="text-xs text-white/50">正数为溢价, 负数为折价</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pushFee">
            <Wallet className="inline h-4 w-4 mr-1" />
            Push 费用
          </Label>
          <Input
            id="pushFee"
            type="number"
            step="0.01"
            min={0}
            placeholder="例如: 0"
            value={value.pushFee}
            onChange={(e) => updateField('pushFee', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="feeBearer">费用承担方</Label>
          <Select
            id="feeBearer"
            value={value.feeBearer}
            onChange={(e) => updateField('feeBearer', e.target.value as 'seller' | 'buyer')}
          >
            <option value="seller">卖家承担</option>
            <option value="buyer">买家承担</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tradeCurrency">
            <Repeat className="inline h-4 w-4 mr-1" />
            交易货币
          </Label>
          <Select
            id="tradeCurrency"
            value={value.tradeCurrency}
            onChange={(e) => updateField('tradeCurrency', e.target.value as CurrencyCode)}
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency} ({CURRENCY_SYMBOLS[currency]})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value.isRoundingEnabled}
            onChange={(e) => updateField('isRoundingEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-400"></div>
          <span className="ml-3 text-sm font-medium text-white/70">启用四舍五入</span>
        </label>
      </div>

      {previewResult && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/[0.08] to-purple-500/[0.08] border border-blue-400/20 p-4 space-y-3">
          <h4 className="text-sm font-medium text-white/70">计算预览</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-white/50">剩余价值</div>
              <div className="text-lg font-semibold text-white/95">
                {CURRENCY_SYMBOLS[value.tradeCurrency]}
                {previewResult.remainingValue.toFixed(2)}
              </div>
            </div>
            {value.surcharge !== 0 && (
              <div className="space-y-1">
                <div className="text-xs text-white/50">溢价/折价</div>
                <div className={cn(
                  'text-lg font-semibold',
                  value.surcharge > 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {value.surcharge > 0 ? '+' : ''}
                  {CURRENCY_SYMBOLS[value.tradeCurrency]}
                  {value.surcharge.toFixed(2)}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-xs text-white/50">最终价值</div>
              <div className="text-lg font-semibold text-white/95">
                {CURRENCY_SYMBOLS[value.tradeCurrency]}
                {previewResult.finalValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
