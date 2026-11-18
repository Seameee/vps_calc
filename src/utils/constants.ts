import type { CurrencyCode, FallbackRateTable } from '@/types/currency';
import type { BillingCycle } from '@/types/calculator';

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['USD', 'CNY', 'EUR', 'GBP', 'JPY'];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  CNY: '¥',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi-annually', label: '半年付' },
  { value: 'annually', label: '年付' },
  { value: 'biennially', label: '两年付' },
  { value: 'triennially', label: '三年付' },
];

export const FALLBACK_RATES: FallbackRateTable = {
  USD: { CNY: 7.20, EUR: 0.92, GBP: 0.78, JPY: 155.0, USD: 1 },
  CNY: { USD: 0.139, EUR: 0.128, GBP: 0.108, JPY: 21.5, CNY: 1 },
  EUR: { USD: 1.09, CNY: 7.83, GBP: 0.85, JPY: 168.5, EUR: 1 },
  GBP: { USD: 1.28, CNY: 9.23, EUR: 1.18, JPY: 198.7, GBP: 1 },
  JPY: { USD: 0.0065, CNY: 0.0465, EUR: 0.0059, GBP: 0.0050, JPY: 1 },
};

export const CACHE_KEY_PREFIX = 'vps_calc_rates_v1';
export const CACHE_TTL_MS = 3_600_000;
export const REQUEST_TIMEOUT_MS = 5_000;
export const BG_API_URL = 'https://api.seaya.link/api/v1/daily/file';
export const BG_TIMEOUT_MS = 10_000;

export const FEATURES = [
  'CN2 GIA', 'CN2 GT', 'BGP', '直连', '高防', '原生IP', '家庭宽带', '不限流量', 'IPv6', 'DDoS防护'
];
