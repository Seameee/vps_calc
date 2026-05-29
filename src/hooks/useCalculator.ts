import { useMemo } from 'react';
import type { VPSInputs, CalculatorResult } from '@/types/calculator';
import type { RateMap } from '@/types/currency';
import { getExactDaysBetween, calculateDailyPrice } from '@/utils/date';
import { convertCurrency } from '@/utils/currency';
import { FALLBACK_RATES } from '@/utils/constants';
import { useExchangeRate } from '@/hooks/useExchangeRate';

/**
 * 组合日期计算、价值引擎和货币转换的计算器 Hook
 *
 * @param inputs - VPS 完整输入状态
 * @returns CalculatorResult 计算结果
 */
export function useCalculator(inputs: VPSInputs): CalculatorResult {
  const { data: rateData } = useExchangeRate(inputs.billingCurrency);

  return useMemo(() => {
    const now = new Date();
    const remainingDays = Math.max(0, getExactDaysBetween(now, inputs.expirationDate));
    const dailyPrice = calculateDailyPrice(inputs.renewalPrice, inputs.billingCycle, now);
    const remainingValue = dailyPrice * remainingDays;

    const rates = (rateData?.rates ?? (FALLBACK_RATES[inputs.billingCurrency] as RateMap)) as RateMap;
    const convertedValue = convertCurrency(
      remainingValue,
      inputs.billingCurrency,
      inputs.tradeCurrency,
      rates,
    );

    let finalValue = convertedValue + inputs.surcharge;
    if (inputs.feeBearer === 'buyer' && inputs.pushFee > 0) {
      finalValue += inputs.pushFee;
    }

    if (inputs.isRoundingEnabled) {
      finalValue = Math.round(finalValue);
    }

    const exchangeRate =
      inputs.billingCurrency === inputs.tradeCurrency
        ? 1
        : convertCurrency(1, inputs.billingCurrency, inputs.tradeCurrency, rates);

    const formulaLines: string[] = [
      `日单价: ${dailyPrice.toFixed(4)} ${inputs.billingCurrency}`,
      `剩余天数: ${remainingDays.toFixed(1)} 天`,
      `剩余价值: ${remainingValue.toFixed(2)} ${inputs.billingCurrency}`,
      `转换后: ${convertedValue.toFixed(2)} ${inputs.tradeCurrency}`,
    ];

    if (inputs.surcharge !== 0) {
      formulaLines.push(
        `溢价/折价: ${inputs.surcharge > 0 ? '+' : ''}${inputs.surcharge.toFixed(2)} ${inputs.tradeCurrency}`,
      );
    }

    if (inputs.pushFee > 0 && inputs.feeBearer === 'buyer') {
      formulaLines.push(`PUSH费: +${inputs.pushFee.toFixed(2)} ${inputs.tradeCurrency}`);
    }

    formulaLines.push(`最终售价: ${finalValue.toFixed(2)} ${inputs.tradeCurrency}`);

    const formula = formulaLines.join(' | ');

    return {
      remainingDays,
      dailyPrice,
      remainingValue,
      convertedValue,
      finalValue,
      formula,
      exchangeRate: exchangeRate ?? null,
    };
  }, [inputs, rateData]);
}
