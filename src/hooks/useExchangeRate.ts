import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CurrencyCode,
  ExchangeRateData,
  UseExchangeRateReturn,
  OpenErApiResponse,
  RateMap,
} from '@/types/currency';
import { ApiError } from '@/types/error';
import {
  FALLBACK_RATES,
  CACHE_KEY_PREFIX,
  CACHE_TTL_MS,
  REQUEST_TIMEOUT_MS,
} from '@/utils/constants';
import { validateRate, extractSupportedRates } from '@/utils/currency';

const ENDPOINTS = [
  { name: 'open-er' as const, url: 'https://open.er-api.com/v6/latest/' },
  { name: 'exchange-rate-api' as const, url: 'https://api.exchangerate-api.com/v4/latest/' },
];

function getCachedRates(base: CurrencyCode): RateMap | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}_${base}`);
    if (!raw) return null;
    const data = JSON.parse(raw) as { rates: RateMap; timestamp: number };
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}_${base}`);
      return null;
    }
    return data.rates;
  } catch {
    return null;
  }
}

function setCachedRates(base: CurrencyCode, rates: RateMap): void {
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}_${base}`,
      JSON.stringify({ rates, timestamp: Date.now() }),
    );
  } catch (error) {
    console.warn('[useExchangeRate] Failed to cache rates:', error);
  }
}

async function fetchFromEndpoint(
  endpoint: (typeof ENDPOINTS)[number],
  base: CurrencyCode,
  signal: AbortSignal,
): Promise<RateMap> {
  const response = await fetch(`${endpoint.url}${base}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, 'http_error', response.status);
  }

  const data: OpenErApiResponse = await response.json();

  if (data.result === 'error') {
    throw new ApiError(
      `API error: ${data['error-type'] ?? 'unknown'}`,
      'api_error',
      undefined,
      data['error-type'],
    );
  }

  if (!data.rates || typeof data.rates !== 'object') {
    throw new ApiError('Invalid response structure: rates missing', 'parse_error');
  }

  // 只提取支持的货币，避免某些高汇率货币（如 VES）导致验证失败
  const rates = extractSupportedRates(data.rates as unknown as Record<string, unknown>, base);
  return rates;
}

/**
 * useExchangeRate
 *
 * 获取实时汇率数据，支持：
 * - 多 API 源级联降级（Open ER → ExchangeRate-API → 硬编码 fallback）
 * - localStorage 缓存（1 小时 TTL）
 * - AbortController 请求取消与组件卸载自动清理
 * - 手动 refetch
 *
 * @param base - 基础货币代码，默认 'USD'
 */
export function useExchangeRate(base: CurrencyCode = 'USD'): UseExchangeRateReturn {
  const [data, setData] = useState<ExchangeRateData | null>(() => {
    const cached = getCachedRates(base);
    if (cached) {
      return {
        rates: cached,
        source: 'cache',
        isFallback: false,
        lastUpdated: new Date(),
        baseCode: base,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

    // 1. 先查缓存
    const cached = getCachedRates(base);
    if (cached) {
      if (!mountedRef.current) return;
      clearTimeout(timeoutId);
      setData({
        rates: cached,
        source: 'cache',
        isFallback: false,
        lastUpdated: new Date(),
        baseCode: base,
      });
      setLoading(false);
      return;
    }

    // 2. 级联请求 API
    for (const endpoint of ENDPOINTS) {
      try {
        const rates = await fetchFromEndpoint(endpoint, base, abortController.signal);
        if (!mountedRef.current) return;
        clearTimeout(timeoutId);

        setCachedRates(base, rates);
        setData({
          rates,
          source: endpoint.name,
          isFallback: false,
          lastUpdated: new Date(),
          baseCode: base,
        });
        setLoading(false);
        return;
      } catch (err) {
        console.warn(`[useExchangeRate] Endpoint "${endpoint.name}" failed:`, err);
      }
    }

    // 3. 所有 API 失败 → fallback
    clearTimeout(timeoutId);

    if (!mountedRef.current) return;

    const fallback = FALLBACK_RATES[base];
    if (fallback) {
      console.warn('[useExchangeRate] All APIs failed, using hardcoded fallback');
      setData({
        rates: fallback as RateMap,
        source: 'fallback',
        isFallback: true,
        lastUpdated: new Date(),
        baseCode: base,
      });
    } else {
      setError(new ApiError('Unable to fetch exchange rates from any source', 'unknown'));
    }

    setLoading(false);
  }, [base]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRates();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchRates]);

  return { data, loading, error, refetch: fetchRates };
}
