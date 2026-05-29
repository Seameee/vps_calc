/** 支持的货币代码 */
export type CurrencyCode = 'USD' | 'CNY' | 'EUR' | 'GBP' | 'JPY';

/** 汇率映射表：货币代码 → 汇率值（允许部分货币缺失） */
export type RateMap = Partial<Record<CurrencyCode, number>>;

/** Open ER API 原始响应 */
export interface OpenErApiResponse {
  result: 'success' | 'error';
  provider: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  time_eol_unix: number;
  base_code: CurrencyCode;
  rates: RateMap;
  'error-type'?: 'unsupported-code' | 'malformed-request' | 'invalid-key' | 'quota-reached';
}

/** 汇率 Hook 返回的数据结构 */
export interface ExchangeRateData {
  rates: RateMap;
  source: 'cache' | 'open-er' | 'exchange-rate-api' | 'fallback';
  isFallback: boolean;
  lastUpdated: Date;
  baseCode: CurrencyCode;
}

/** 汇率 Hook 返回值 */
export interface UseExchangeRateReturn {
  data: ExchangeRateData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/** 硬编码 fallback 汇率表 */
export type FallbackRateTable = Record<CurrencyCode, Partial<RateMap>>;
