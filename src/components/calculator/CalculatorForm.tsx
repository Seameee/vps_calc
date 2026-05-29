import { useCallback } from 'react';
import type { VPSInputs } from '@/types/calculator';
import type { CurrencyCode } from '@/types/currency';
import { BILLING_CYCLES, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/utils/constants';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CalculatorFormProps {
  inputs: VPSInputs;
  onChange: (inputs: VPSInputs) => void;
}

/**
 * 计算器表单组件
 *
 * 收集 VPS 配置、计费与交易信息。
 */
export function CalculatorForm({ inputs, onChange }: CalculatorFormProps) {
  const updateField = useCallback(
    <K extends keyof VPSInputs>(field: K, value: VPSInputs[K]) => {
      onChange({ ...inputs, [field]: value });
    },
    [inputs, onChange],
  );

  return (
    <div className={cn('glass-card space-y-6 p-6')}>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-white/95">VPS 信息</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="provider">服务商</Label>
          <Input
            id="provider"
            placeholder="例如: Vultr, Linode, Racknerd"
            value={inputs.provider}
            onChange={(e) => updateField('provider', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="model">型号 / 套餐</Label>
          <Input
            id="model"
            placeholder="例如: 1C1G"
            value={inputs.model}
            onChange={(e) => updateField('model', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="renewalPrice">续费价格</Label>
            <Input
              id="renewalPrice"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={inputs.renewalPrice || ''}
              onChange={(e) => updateField('renewalPrice', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billingCurrency">计费货币</Label>
            <Select
              id="billingCurrency"
              value={inputs.billingCurrency}
              onChange={(e) => updateField('billingCurrency', e.target.value as CurrencyCode)}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} ({CURRENCY_SYMBOLS[c]})
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="billingCycle">计费周期</Label>
            <Select
              id="billingCycle"
              value={inputs.billingCycle}
              onChange={(e) => updateField('billingCycle', e.target.value as VPSInputs['billingCycle'])}
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expirationDate">到期时间</Label>
            <Input
              id="expirationDate"
              type="date"
              value={inputs.expirationDate.toISOString().split('T')[0]}
              onChange={(e) => updateField('expirationDate', new Date(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="mb-4 text-lg font-semibold text-white/95">交易设置</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="surcharge">溢价 / 折价</Label>
              <Input
                id="surcharge"
                type="number"
                step={0.01}
                placeholder="正数溢价，负数折价"
                value={inputs.surcharge || ''}
                onChange={(e) => updateField('surcharge', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pushFee">PUSH 费用</Label>
              <Input
                id="pushFee"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={inputs.pushFee || ''}
                onChange={(e) => updateField('pushFee', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="feeBearer">费用承担方</Label>
              <Select
                id="feeBearer"
                value={inputs.feeBearer}
                onChange={(e) => updateField('feeBearer', e.target.value as VPSInputs['feeBearer'])}
              >
                <option value="seller">卖家承担</option>
                <option value="buyer">买家承担</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tradeCurrency">交易货币</Label>
              <Select
                id="tradeCurrency"
                value={inputs.tradeCurrency}
                onChange={(e) => updateField('tradeCurrency', e.target.value as CurrencyCode)}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c]})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.06]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400"
              checked={inputs.isRoundingEnabled}
              onChange={(e) => updateField('isRoundingEnabled', e.target.checked)}
            />
            <span className="text-sm text-white/80">最终售价取整（四舍五入）</span>
          </label>
        </div>
      </div>
    </div>
  );
}
