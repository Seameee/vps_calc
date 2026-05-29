import { useState, useCallback } from 'react';
import type { VPSInputs } from '@/types/calculator';
import { useCalculator } from '@/hooks/useCalculator';
import { ApiErrorBoundary } from '@/components/layout/ApiErrorBoundary';
import { Background } from '@/components/layout/Background';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CalculatorForm } from '@/components/calculator/CalculatorForm';
import { ResultPanel } from '@/components/calculator/ResultPanel';
import { TradePostPanel } from '@/components/trade-post/TradePostPanel';
import { cn } from '@/lib/utils';

const defaultInputs: VPSInputs = {
  provider: '',
  model: '',
  cpu: null,
  ram: { value: 0, unit: 'GB' },
  storage: { value: 0, type: 'SSD' },
  bandwidth: { value: 0, unit: 'Mbps' },
  traffic: { value: 0, unit: 'GB', unlimited: false },
  trafficCalc: 'unidirectional',
  features: [],
  notes: '',
  renewalPrice: 0,
  billingCurrency: 'USD',
  billingCycle: 'monthly',
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  surcharge: 0,
  pushFee: 0,
  feeBearer: 'buyer',
  tradeCurrency: 'CNY',
  isRoundingEnabled: false,
  accountBalance: 0,
  affBalance: 0,
  balanceCurrency: 'USD',
};

/**
 * 主应用组件
 *
 * 管理全局 VPS 输入状态，组合布局与业务组件，
 * 提供响应式双栏布局（移动端单栏、桌面端双栏）。
 */
export default function App() {
  const [inputs, setInputs] = useState<VPSInputs>(defaultInputs);

  const result = useCalculator(inputs);

  const handleInputChange = useCallback((next: VPSInputs) => {
    setInputs(next);
  }, []);

  return (
    <ApiErrorBoundary>
      <div className="relative min-h-screen">
        <Background />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <Header />

          <main className="flex-1">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 左侧表单 */}
              <section className="space-y-6">
                <CalculatorForm inputs={inputs} onChange={handleInputChange} />
                <TradePostPanel inputs={inputs} result={result} />
              </section>

              {/* 右侧结果 */}
              <section className="space-y-6">
                <ResultPanel result={result} inputs={inputs} />
              </section>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ApiErrorBoundary>
  );
}
