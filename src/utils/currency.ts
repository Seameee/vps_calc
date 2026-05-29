import type { CurrencyCode, RateMap } from '@/types/currency';

/**
 * 汇率转换（基于 USD 基准）
 *
 * 公式: Currency A to Currency B = (amount / rate_A) * rate_B
 *
 * @example
 * convertCurrency(100, 'CNY', 'EUR', { USD: 1, CNY: 7.24, EUR: 0.92 })
 * // → 12.71
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: RateMap,
): number {
  if (from === to) return amount;
  // 先转为 USD，再转为目标货币
  const inUSD = from === 'USD' ? amount : amount / (rates[from] ?? 1);
  return to === 'USD' ? inUSD : inUSD * (rates[to] ?? 1);
}

/**
 * 验证汇率值是否有效
 */
export function validateRate(rate: unknown): rate is number {
  return typeof rate === 'number' && rate > 0 && rate < 1000000 && Number.isFinite(rate);
}

/**
 * 从 API 响应中提取我们支持的货币
 * @param rates - API 返回的原始汇率对象
 * @param base - 基准货币代码（默认为 USD）
 * @returns 过滤后的 RateMap
 */
export function extractSupportedRates(
  rates: Record<string, unknown>,
  base: CurrencyCode = 'USD',
): RateMap {
  const supportedCurrencies: CurrencyCode[] = ['USD', 'CNY', 'EUR', 'GBP', 'JPY'];
  const result: RateMap = {};

  for (const currency of supportedCurrencies) {
    const rate = rates[currency];
    if (validateRate(rate)) {
      result[currency] = rate;
    }
  }

  // 确保 base 货币存在（API 通常返回 base=1）
  if (result[base] === undefined) {
    result[base] = 1;
  }

  // 确保至少有两种货币可用（base + 至少一种其他）
  const validCurrencies = Object.keys(result).filter((k) => result[k as CurrencyCode] !== undefined && result[k as CurrencyCode]! > 0);
  if (validCurrencies.length < 2) {
    throw new Error('No valid rates found in API response');
  }

  return result;
}
