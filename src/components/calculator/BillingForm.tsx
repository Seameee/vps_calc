import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { calculateRemainingValue } from '@/utils/date';
import { BILLING_CYCLES, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/utils/constants';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import type { BillingInfo, BillingCycle } from '@/types/calculator';
import type { CurrencyCode } from '@/types/currency';

interface BillingFormProps {
  value: BillingInfo;
  onChange: (value: BillingInfo) => void;
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateFromInput(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function BillingForm({ value, onChange }: BillingFormProps) {
  const updateField = <K extends keyof BillingInfo>(field: K, fieldValue: BillingInfo[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const computed = useMemo(() => {
    return calculateRemainingValue(
      value.renewalPrice,
      value.billingCycle,
      value.expirationDate
    );
  }, [value.renewalPrice, value.billingCycle, value.expirationDate]);

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-xl font-semibold text-white/95">计费信息</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="renewalPrice">
            <DollarSign className="inline h-4 w-4 mr-1" />
            续费价格
          </Label>
          <Input
            id="renewalPrice"
            type="number"
            step="0.01"
            min={0}
            placeholder="例如: 5.00"
            value={value.renewalPrice ?? ''}
            onChange={(e) => updateField('renewalPrice', Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billingCurrency">计费货币</Label>
          <Select
            id="billingCurrency"
            value={value.billingCurrency}
            onChange={(e) => updateField('billingCurrency', e.target.value as CurrencyCode)}
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency} ({CURRENCY_SYMBOLS[currency]})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingCycle">计费周期</Label>
        <Select
          id="billingCycle"
          value={value.billingCycle}
          onChange={(e) => updateField('billingCycle', e.target.value as BillingCycle)}
        >
          {BILLING_CYCLES.map((cycle) => (
            <option key={cycle.value} value={cycle.value}>
              {cycle.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expirationDate">
          <Calendar className="inline h-4 w-4 mr-1" />
          到期日期
        </Label>
        <Input
          id="expirationDate"
          type="date"
          value={formatDateForInput(value.expirationDate)}
          onChange={(e) => updateField('expirationDate', parseDateFromInput(e.target.value))}
        />
      </div>

      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
        <h4 className="text-sm font-medium text-white/70">计算预览</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Clock className="h-3.5 w-3.5" />
              剩余天数
            </div>
            <div className="text-2xl font-bold text-white/95">
              {computed.remainingDays.toFixed(1)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-white/50">
              <DollarSign className="h-3.5 w-3.5" />
              日单价
            </div>
            <div className="text-2xl font-bold text-white/95">
              {CURRENCY_SYMBOLS[value.billingCurrency]}
              {computed.dailyPrice.toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
