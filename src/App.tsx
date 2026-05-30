import { useState, useCallback, useEffect } from 'react';
import type { VPSInputs } from '@/types/calculator';
import { useCalculator } from '@/hooks/useCalculator';
import { ApiErrorBoundary } from '@/components/layout/ApiErrorBoundary';
import { Background } from '@/components/layout/Background';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { CalculatorForm } from '@/components/calculator/CalculatorForm';
import { ResultPanel } from '@/components/calculator/ResultPanel';
import { TradePostPanel } from '@/components/trade-post/TradePostPanel';
import { CURRENCY_SYMBOLS } from '@/utils/constants';

const STORAGE_KEY = 'vps-calc-inputs-v1';

const defaultInputs: VPSInputs = {
  provider: '',
  model: '',
  cpu: null,
  ram: { value: 0, unit: 'GB' },
  storage: { value: 0, type: 'SSD' },
  bandwidth: { value: 0, unit: 'Mbps' },
  traffic: { value: 0, unit: 'GB', unlimited: false },
  trafficCalc: 'sum',
  features: [],
  notes: '',
  renewalPrice: 0,
  billingCurrency: 'USD',
  billingCycle: 'monthly',
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  surcharge: 0,
  targetFinalPrice: null,
  tradeMethod: null,
  pushFee: 0,
  feeBearer: 'buyer',
  tradeCurrency: 'CNY',
  isRoundingEnabled: false,
  accountBalance: 0,
  affBalance: 0,
  balanceCurrency: 'USD',
};

function serializeInputs(inputs: VPSInputs): unknown {
  return {
    ...inputs,
    expirationDate: inputs.expirationDate.toISOString(),
    ram: { ...inputs.ram },
    storage: { ...inputs.storage },
    bandwidth: { ...inputs.bandwidth },
    traffic: { ...inputs.traffic },
  };
}

function deserializeInputs(data: unknown): VPSInputs | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  try {
    const expiration = new Date(d.expirationDate as string);
    if (isNaN(expiration.getTime())) return null;
    return {
      provider: String(d.provider ?? ''),
      model: String(d.model ?? ''),
      cpu: d.cpu !== null ? Number(d.cpu) : null,
      ram: { value: Number((d.ram as Record<string, unknown>)?.value ?? 0), unit: ((d.ram as Record<string, unknown>)?.unit ?? 'GB') as 'GB' | 'MB' },
      storage: { value: Number((d.storage as Record<string, unknown>)?.value ?? 0), type: ((d.storage as Record<string, unknown>)?.type ?? 'SSD') as 'SSD' | 'HDD' | 'NVMe' },
      bandwidth: { value: Number((d.bandwidth as Record<string, unknown>)?.value ?? 0), unit: ((d.bandwidth as Record<string, unknown>)?.unit ?? 'Mbps') as 'Mbps' | 'Gbps' },
      traffic: {
        value: Number((d.traffic as Record<string, unknown>)?.value ?? 0),
        unit: ((d.traffic as Record<string, unknown>)?.unit ?? 'GB') as 'GB' | 'TB',
        unlimited: Boolean((d.traffic as Record<string, unknown>)?.unlimited),
      },
      trafficCalc: (d.trafficCalc ?? 'sum') as 'sum' | 'max' | 'min' | 'upload' | 'download',
      features: Array.isArray(d.features) ? d.features.map(String) : [],
      notes: String(d.notes ?? ''),
      renewalPrice: Number(d.renewalPrice ?? 0),
      billingCurrency: (d.billingCurrency ?? 'USD') as VPSInputs['billingCurrency'],
      billingCycle: (d.billingCycle ?? 'monthly') as VPSInputs['billingCycle'],
      expirationDate: expiration,
      surcharge: Number(d.surcharge ?? 0),
      targetFinalPrice: d.targetFinalPrice != null ? Number(d.targetFinalPrice) : null,
      tradeMethod: (d.tradeMethod ?? null) as VPSInputs['tradeMethod'],
      pushFee: Number(d.pushFee ?? 0),
      feeBearer: (d.feeBearer ?? 'buyer') as VPSInputs['feeBearer'],
      tradeCurrency: (d.tradeCurrency ?? 'CNY') as VPSInputs['tradeCurrency'],
      isRoundingEnabled: Boolean(d.isRoundingEnabled),
      accountBalance: Number(d.accountBalance ?? 0),
      affBalance: Number(d.affBalance ?? 0),
      balanceCurrency: (d.balanceCurrency ?? 'USD') as VPSInputs['balanceCurrency'],
    };
  } catch {
    return null;
  }
}

function getStoredInputs(): VPSInputs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return deserializeInputs(parsed);
  } catch {
    return null;
  }
}

function setStoredInputs(inputs: VPSInputs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeInputs(inputs)));
  } catch {
    // ignore storage errors
  }
}

/**
 * 主应用组件
 *
 * 管理全局 VPS 输入状态，组合布局与业务组件，
 * 提供响应式双栏布局（移动端单栏、桌面端双栏）。
 * 支持 localStorage 持久化保存填写内容。
 */
export default function App() {
  const [inputs, setInputs] = useState<VPSInputs>(() => getStoredInputs() ?? defaultInputs);

  const result = useCalculator(inputs);

  const handleInputChange = useCallback((next: VPSInputs) => {
    setInputs(next);
    setStoredInputs(next);
  }, []);

  return (
    <ThemeProvider>
      <ApiErrorBoundary>
        <div className="relative min-h-screen">
          <Background />

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-4 sm:px-4 lg:px-6">
            <Header />

            <main className="flex-1">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
                {/* 左侧表单 */}
                <section className="space-y-3">
                  <CalculatorForm inputs={inputs} onChange={handleInputChange} />
                </section>

                {/* 右侧结果 + 交易帖 — sticky跟随 */}
                <section className="space-y-3 lg:sticky lg:top-4 lg:self-start">
                  <ResultPanel result={result} inputs={inputs} />
                  <TradePostPanel inputs={inputs} result={result} />
                </section>
              </div>
            </main>

            <Footer />
          </div>
        </div>
      </ApiErrorBoundary>
    </ThemeProvider>
  );
}
