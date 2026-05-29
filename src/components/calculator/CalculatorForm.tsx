import { useCallback } from 'react';
import type { VPSInputs } from '@/types/calculator';
import type { CurrencyCode } from '@/types/currency';
import { BILLING_CYCLES, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/utils/constants';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GlassSelect } from '@/components/ui/glass-select';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface CalculatorFormProps {
  inputs: VPSInputs;
  onChange: (inputs: VPSInputs) => void;
}

const BILLING_CYCLE_OPTIONS = BILLING_CYCLES.map((c) => ({ value: c.value, label: c.label }));
const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: `${c} (${CURRENCY_SYMBOLS[c]})` }));
const FEE_BEARER_OPTIONS = [
  { value: 'seller', label: '卖家承担' },
  { value: 'buyer', label: '买家承担' },
];
const TRAFFIC_CALC_OPTIONS = [
  { value: 'sum', label: '总和' },
  { value: 'max', label: '取最大' },
  { value: 'min', label: '取最小' },
  { value: 'upload', label: '仅上传' },
  { value: 'download', label: '仅下载' },
];

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
    <div className={cn('glass-card space-y-4 p-4')}>
      <h2 className="text-lg font-semibold text-white/95">VPS 信息</h2>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="provider">服务商</Label>
          <Input
            id="provider"
            placeholder="例如: Vultr, Linode, Racknerd"
            value={inputs.provider}
            onChange={(e) => updateField('provider', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="model">型号 / 套餐</Label>
          <Input
            id="model"
            placeholder="例如: 1C1G"
            value={inputs.model}
            onChange={(e) => updateField('model', e.target.value)}
          />
        </div>

        {/* 配置信息 */}
        <div className="border-t border-white/10 pt-3">
          <h3 className="mb-3 text-sm font-medium text-white/70">配置信息</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cpu">CPU</Label>
              <div className="flex gap-2">
                <Input
                  id="cpu"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="核数"
                  value={inputs.cpu ?? ''}
                  onChange={(e) => updateField('cpu', e.target.value === '' ? null : Number(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ram">内存</Label>
              <div className="flex gap-2">
                <Input
                  id="ram"
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="大小"
                  value={inputs.ram.value || ''}
                  onChange={(e) => updateField('ram', { ...inputs.ram, value: Number(e.target.value) })}
                  className="flex-1"
                />
                <select
                  value={inputs.ram.unit}
                  onChange={(e) => updateField('ram', { ...inputs.ram, unit: e.target.value as 'GB' | 'MB' })}
                  className="h-11 w-16 shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.06] px-2 text-sm text-white/95 focus:border-blue-400 focus:outline-none"
                >
                  <option value="GB">GB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="storage">存储</Label>
              <div className="flex gap-2">
                <Input
                  id="storage"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="容量"
                  value={inputs.storage.value || ''}
                  onChange={(e) => updateField('storage', { ...inputs.storage, value: Number(e.target.value) })}
                  className="flex-1"
                />
                <select
                  value={inputs.storage.type}
                  onChange={(e) => updateField('storage', { ...inputs.storage, type: e.target.value as 'SSD' | 'HDD' | 'NVMe' })}
                  className="h-11 w-20 shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.06] px-2 text-sm text-white/95 focus:border-blue-400 focus:outline-none"
                >
                  <option value="SSD">SSD</option>
                  <option value="HDD">HDD</option>
                  <option value="NVMe">NVMe</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bandwidth">带宽</Label>
              <div className="flex gap-2">
                <Input
                  id="bandwidth"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="大小"
                  value={inputs.bandwidth.value || ''}
                  onChange={(e) => updateField('bandwidth', { ...inputs.bandwidth, value: Number(e.target.value) })}
                  className="flex-1"
                />
                <select
                  value={inputs.bandwidth.unit}
                  onChange={(e) => updateField('bandwidth', { ...inputs.bandwidth, unit: e.target.value as 'Mbps' | 'Gbps' })}
                  className="h-11 w-20 shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.06] px-2 text-sm text-white/95 focus:border-blue-400 focus:outline-none"
                >
                  <option value="Mbps">Mbps</option>
                  <option value="Gbps">Gbps</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <Label htmlFor="traffic">流量</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="traffic"
                type="number"
                min={0}
                step={1}
                placeholder="月流量"
                disabled={inputs.traffic.unlimited}
                value={inputs.traffic.value || ''}
                onChange={(e) => updateField('traffic', { ...inputs.traffic, value: Number(e.target.value) })}
                className="flex-1"
              />
              <select
                value={inputs.traffic.unit}
                onChange={(e) => updateField('traffic', { ...inputs.traffic, unit: e.target.value as 'GB' | 'TB' })}
                disabled={inputs.traffic.unlimited}
                className="h-11 w-20 shrink-0 rounded-lg border border-white/[0.12] bg-white/[0.06] px-2 text-sm text-white/95 focus:border-blue-400 focus:outline-none disabled:opacity-50"
              >
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-white/60 whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.traffic.unlimited}
                  onChange={(e) => updateField('traffic', { ...inputs.traffic, unlimited: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-white/[0.06] text-blue-400"
                />
                不限
              </label>
            </div>
          </div>

          {/* 流量计算方式 */}
          <div className="mt-3 space-y-1">
            <Label htmlFor="trafficCalc">流量计算方式</Label>
            <GlassSelect
              value={inputs.trafficCalc}
              onChange={(value) => updateField('trafficCalc', value as VPSInputs['trafficCalc'])}
              options={TRAFFIC_CALC_OPTIONS}
            />
          </div>

          <div className="mt-3 space-y-1">
            <Label htmlFor="features">特性标签</Label>
            <Input
              id="features"
              placeholder="例如: CN2 GIA, BGP, 原生IP (按回车确认)"
              value={inputs.features.join(', ')}
              onChange={() => {
                // 只更新显示值，不触发标签更新
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const text = input.value.trim();
                  if (text) {
                    const newTags = text.split(/[,，]/).map(t => t.trim()).filter(Boolean);
                    const combined = [...inputs.features, ...newTags.filter(t => !inputs.features.includes(t))];
                    updateField('features', combined);
                    input.value = '';
                  }
                }
              }}
              onBlur={(e) => {
                const text = e.currentTarget.value.trim();
                if (text) {
                  const newTags = text.split(/[,，]/).map(t => t.trim()).filter(Boolean);
                  const combined = [...inputs.features, ...newTags.filter(t => !inputs.features.includes(t))];
                  updateField('features', combined);
                  e.currentTarget.value = '';
                }
              }}
            />
            {inputs.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {inputs.features.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-400"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newFeatures = [...inputs.features];
                        newFeatures.splice(index, 1);
                        updateField('features', newFeatures);
                      }}
                      className="text-blue-400/60 hover:text-blue-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
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
          <div className="space-y-1">
            <Label htmlFor="billingCurrency">计费货币</Label>
            <GlassSelect
              value={inputs.billingCurrency}
              onChange={(value) => updateField('billingCurrency', value as CurrencyCode)}
              options={CURRENCY_OPTIONS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="billingCycle">计费周期</Label>
            <GlassSelect
              value={inputs.billingCycle}
              onChange={(value) => updateField('billingCycle', value as VPSInputs['billingCycle'])}
              options={BILLING_CYCLE_OPTIONS}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="expirationDate">到期时间</Label>
            <Input
              id="expirationDate"
              type="date"
              value={inputs.expirationDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const dateStr = e.target.value;
                if (!dateStr) return;
                const [year, month, day] = dateStr.split('-').map(Number);
                if (isNaN(year) || isNaN(month) || isNaN(day)) return;
                updateField('expirationDate', new Date(year, month - 1, day));
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-3">
        <h3 className="mb-3 text-base font-semibold text-white/95">交易设置</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
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
            <div className="space-y-1">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="feeBearer">费用承担方</Label>
              <GlassSelect
                value={inputs.feeBearer}
                onChange={(value) => updateField('feeBearer', value as VPSInputs['feeBearer'])}
                options={FEE_BEARER_OPTIONS}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tradeCurrency">交易货币</Label>
              <GlassSelect
                value={inputs.tradeCurrency}
                onChange={(value) => updateField('tradeCurrency', value as CurrencyCode)}
                options={CURRENCY_OPTIONS}
              />
            </div>
          </div>

          <Toggle
            checked={inputs.isRoundingEnabled}
            onChange={(checked) => updateField('isRoundingEnabled', checked)}
            label="最终售价取整"
            description="启用后最终售价将向下取整到整数"
          />
        </div>
      </div>
    </div>
  );
}
