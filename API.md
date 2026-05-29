# API.md - VPS 剩余价值计算器

> 本文档定义项目与外部 API 的交互规范，包括背景图 API、汇率 API 的使用方式、请求格式、响应结构、错误处理与降级策略。
> 所有 API 调用封装为 React 自定义 Hooks，遵循 TypeScript 严格模式。

---

## 0. TypeScript 类型定义

所有 API 相关的类型集中在 `src/types/` 下：

### 0.1 汇率类型

```typescript
// src/types/currency.ts

/** 支持的货币代码 */
export type CurrencyCode = 'USD' | 'CNY' | 'EUR' | 'GBP' | 'JPY';

/** 汇率映射表：货币代码 → 汇率值 */
export type RateMap = Record<CurrencyCode, number>;

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
```

### 0.2 背景图类型

```typescript
// src/types/background.ts

/** 背景图状态 */
export type BackgroundStatus = 'loading' | 'loaded' | 'error';

/** 背景图 Hook 返回值 */
export interface UseBackgroundImageReturn {
  status: BackgroundStatus;
  imageUrl: string | null;
  retry: () => void;
}
```

### 0.3 错误边界类型

```typescript
// src/types/error.ts

/** API 错误分类 */
export type ApiErrorCategory =
  | 'network'       // 网络断开、DNS 失败
  | 'timeout'       // 请求超时
  | 'http_error'    // 非 2xx 状态码
  | 'api_error'     // API 返回的业务错误
  | 'parse_error'   // 响应数据格式异常
  | 'unknown';      // 未分类错误

/** 增强的 API 错误 */
export class ApiError extends Error {
  constructor(
    message: string,
    public category: ApiErrorCategory,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## 1. 背景图 API

### 1.1 接口信息

| 项目 | 值 |
|------|-----|
| 名称 | Seaya Daily Image API |
| 端点 | `https://api.seaya.link/daily/` |
| 方法 | `GET` |
| 认证 | 无 |
| 响应类型 | `image/jpeg` 或 `image/png`（302 重定向到实际图片 URL）|

### 1.2 响应行为

API 通常返回 **302 Found** 重定向到每日图片的实际 URL：
```
HTTP/1.1 302 Found
Location: https://.../image_20260529.jpg
```

浏览器会自动跟随重定向加载图片。

### 1.3 useBackgroundImage Hook

```typescript
// src/hooks/useBackgroundImage.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { BackgroundStatus, UseBackgroundImageReturn } from '@/types/background';

const BG_API_URL = 'https://api.seaya.link/daily/';
const TIMEOUT_MS = 10_000;

/**
 * 背景图加载 Hook
 *
 * - 组件挂载时自动加载背景图
 * - 加载成功/失败均更新状态
 * - 支持手动重试
 * - 自动清理：组件卸载时取消挂起的加载
 */
export function useBackgroundImage(): UseBackgroundImageReturn {
  const [status, setStatus] = useState<BackgroundStatus>('loading');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadImage = useCallback(() => {
    setStatus('loading');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setStatus('error');
      setImageUrl(null);
    }, TIMEOUT_MS);

    img.onload = () => {
      if (!mountedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('loaded');
      setImageUrl(BG_API_URL);
    };

    img.onerror = () => {
      if (!mountedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('error');
      setImageUrl(null);
    };

    img.src = BG_API_URL;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadImage();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadImage]);

  return { status, imageUrl, retry: loadImage };
}
```

### 1.4 组件消费示例

```tsx
// src/components/layout/Background.tsx
import { useBackgroundImage } from '@/hooks/useBackgroundImage';

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';

export function Background() {
  const { status, imageUrl, retry } = useBackgroundImage();

  const style: React.CSSProperties =
    status === 'loaded' && imageUrl
      ? {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : { background: FALLBACK_GRADIENT };

  // 加载失败时自动重试一次（也可由用户交互触发）
  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => retry(), 30_000);
      return () => clearTimeout(timer);
    }
  }, [status, retry]);

  return (
    <div
      className="fixed inset-0 -z-10 transition-opacity duration-700"
      style={style}
      aria-hidden="true"
    />
  );
}
```

### 1.5 错误降级

- **网络错误**: 使用 CSS 渐变背景作为 fallback
- **加载超时**: 设置 10 秒超时，超时后切换 fallback
- **CORS 错误**: 背景图通常不需要 CORS，但如果需要 canvas 操作则必须加 `crossorigin`

```css
/* src/index.css */
.bg-fallback {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}
```

---

## 2. 汇率 API

### 2.1 候选 API 对比

| API | URL | 优点 | 缺点 | 推荐度 |
|-----|-----|------|------|--------|
| **Open ER API** | `https://open.er-api.com/v6/latest/{base}` | 无需 Key，支持 CORS，数据可靠 | 有请求频率限制 | ⭐⭐⭐⭐⭐ |
| **ExchangeRate-API** | `https://api.exchangerate-api.com/v4/latest/{base}` | 无需 Key，响应快 | 免费版更新较慢 | ⭐⭐⭐⭐ |
| **Frankfurter** | `https://api.frankfurter.app/latest?from={base}` | ECB 官方数据源，无需 Key | 支持的货币较少 | ⭐⭐⭐⭐ |

**推荐**: 优先使用 **Open ER API**，失败时降级到 **ExchangeRate-API**，最后使用硬编码汇率。

### 2.2 Open ER API 详细规范

#### 请求

```http
GET https://open.er-api.com/v6/latest/USD HTTP/1.1
Accept: application/json
```

**路径参数**:
- `base`: 基础货币代码（如 `USD`, `CNY`, `EUR`）

#### 成功响应 (200 OK)

```json
{
  "result": "success",
  "provider": "https://www.exchangerate-api.com",
  "documentation": "https://www.exchangerate-api.com/docs/free",
  "terms_of_use": "https://www.exchangerate-api.com/terms",
  "time_last_update_unix": 1716940800,
  "time_last_update_utc": "Wed, 29 May 2026 00:00:00 +0000",
  "time_next_update_unix": 1717027200,
  "time_next_update_utc": "Thu, 30 May 2026 00:00:00 +0000",
  "time_eol_unix": 0,
  "base_code": "USD",
  "rates": {
    "USD": 1,
    "CNY": 7.2456,
    "EUR": 0.9234,
    "GBP": 0.7890,
    "JPY": 156.78
  }
}
```

**关键字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `result` | string | `"success"` 或 `"error"` |
| `base_code` | string | 请求的基础货币 |
| `rates` | object | 以基础货币为 1 的其他货币汇率 |
| `time_last_update_unix` | number | 最后更新时间的 Unix 时间戳 |
| `time_next_update_unix` | number | 下次更新时间的 Unix 时间戳 |

#### 错误响应

```json
{
  "result": "error",
  "error-type": "unsupported-code"
}
```

**错误类型**:

| `error-type` | 说明 |
|--------------|------|
| `unsupported-code` | 不支持的货币代码 |
| `malformed-request` | 请求格式错误 |
| `invalid-key` | API Key 无效（不适用于免费端点）|
| `quota-reached` | 超出请求配额 |

### 2.3 useExchangeRate Hook

```typescript
// src/hooks/useExchangeRate.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CurrencyCode,
  ExchangeRateData,
  UseExchangeRateReturn,
  OpenErApiResponse,
  RateMap,
  FallbackRateTable,
} from '@/types/currency';
import { ApiError } from '@/types/error';

const ENDPOINTS = [
  { name: 'open-er' as const, url: 'https://open.er-api.com/v6/latest/' },
  { name: 'exchange-rate-api' as const, url: 'https://api.exchangerate-api.com/v4/latest/' },
];

const FALLBACK_RATES: FallbackRateTable = {
  USD: { CNY: 7.20, EUR: 0.92, GBP: 0.78, JPY: 155.0 },
  CNY: { USD: 0.139, EUR: 0.128, GBP: 0.108, JPY: 21.5 },
  EUR: { USD: 1.09, CNY: 7.83, GBP: 0.85, JPY: 168.5 },
  GBP: { USD: 1.28, CNY: 9.23, EUR: 1.18, JPY: 198.7 },
  JPY: { USD: 0.0065, CNY: 0.0465, EUR: 0.0059, GBP: 0.0050 },
};

const CACHE_KEY_PREFIX = 'vps_calc_rates_v1';
const CACHE_TTL_MS = 3_600_000; // 1 小时
const REQUEST_TIMEOUT_MS = 5_000;

// ---- 工具函数 ----

function validateRate(rate: unknown): rate is number {
  return typeof rate === 'number' && rate > 0 && rate < 10000 && Number.isFinite(rate);
}

function validateRates(rates: Record<string, unknown>): rates is RateMap {
  for (const [currency, rate] of Object.entries(rates)) {
    if (!/^[A-Z]{3}$/.test(currency)) throw new ApiError(`Invalid currency code: ${currency}`, 'parse_error');
    if (!validateRate(rate)) throw new ApiError(`Invalid rate for ${currency}: ${rate}`, 'parse_error');
  }
  return true;
}

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
  endpoint: typeof ENDPOINTS[number],
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

  validateRates(data.rates as unknown as Record<string, unknown>);
  return data.rates as RateMap;
}

// ---- Hook ----

/**
 * useExchangeRate
 *
 * 获取实时汇率数据，支持：
 * - 多 API 源级联降级（Open ER → ExchangeRate-API → 硬编码 fallback）
 * - localStorage 缓存（1 小时 TTL）
 * - AbortController 请求取消与组件卸载自动清理
 * - 手动 refetch
 *
 * @param base - 基础货币代码，默认 `'USD'`
 */
export function useExchangeRate(base: CurrencyCode = 'USD'): UseExchangeRateReturn {
  const [data, setData] = useState<ExchangeRateData | null>(() => {
    // 初始状态优先从缓存读取
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
```

### 2.4 纯函数汇率转换工具

```typescript
// src/utils/currency.ts
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
```

### 2.5 组件消费示例

```tsx
// src/components/calculator/ExchangeRateDisplay.tsx
import { useExchangeRate } from '@/hooks/useExchangeRate';
import type { CurrencyCode } from '@/types/currency';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ExchangeRateDisplayProps {
  base: CurrencyCode;
  target: CurrencyCode;
}

export function ExchangeRateDisplay({ base, target }: ExchangeRateDisplayProps) {
  const { data, loading, error, refetch } = useExchangeRate(base);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-white/60">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>加载汇率...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <AlertTriangle className="h-4 w-4" />
        <span>汇率获取失败</span>
        <button onClick={refetch} className="underline text-white/80 hover:text-white">
          重试
        </button>
      </div>
    );
  }

  if (!data) return null;

  const rate = data.rates[target];

  return (
    <div className="flex items-center gap-2 text-sm">
      {data.isFallback ? (
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
      )}
      <span>
        1 {base} ≈ {rate?.toFixed(4)} {target}
      </span>
      {data.source !== 'cache' && (
        <button
          onClick={refetch}
          className="ml-1 text-white/50 hover:text-white transition-colors"
          aria-label="刷新汇率"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
```

```tsx
// src/components/calculator/ValueCalculator.tsx (片段)
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { convertCurrency } from '@/utils/currency';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';

export function ValueCalculator() {
  const [amount, setAmount] = useState(0);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('CNY');
  const { data: rateData } = useExchangeRate('USD');

  const convertedAmount = rateData
    ? convertCurrency(amount, fromCurrency, toCurrency, rateData.rates)
    : 0;

  return (
    <div>
      <ExchangeRateDisplay base="USD" target="CNY" />
      {/* ... input fields ... */}
      <p>转换结果: {convertedAmount.toFixed(2)} {toCurrency}</p>
    </div>
  );
}
```

### 2.6 错误处理矩阵

| 场景 | 用户可见反馈 | 降级行为 |
|------|-------------|----------|
| 网络断开 | "汇率获取失败，使用缓存汇率" | 使用 localStorage 缓存 |
| API 超时 | "汇率服务响应慢，使用默认汇率" | 使用硬编码 fallback |
| API 返回错误 | "汇率服务暂时不可用" | 使用硬编码 fallback |
| 浏览器不支持 fetch | "浏览器不支持实时汇率" | 使用硬编码 fallback |
| localStorage 被禁用 | "汇率将每次重新获取" | 每次请求 API，失败用 fallback |

---

## 3. 数据获取通用模式

### 3.1 useEffect + AbortController 模式

所有数据获取 Hook 遵循以下模式（React 18 Strict Mode 安全）：

```typescript
// src/hooks/useFetch.ts — 通用数据获取基座（如不使用 SWR/React Query 时的参考）
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * 通用数据获取 Hook
 *
 * 关键行为:
 * - 组件卸载时自动取消请求（AbortController）
 * - 竞态条件防护（mounted ref + 请求序列号）
 * - Strict Mode 双重调用安全
 */
export function useFetch<T>(url: string, options?: RequestInit): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const abortController = new AbortController();
    const fetchId = ++fetchIdRef.current;

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController.signal,
      });

      if (!mountedRef.current || fetchId !== fetchIdRef.current) return;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = (await response.json()) as T;
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setData(result);
      }
    } catch (err) {
      // AbortError 不视为错误（组件卸载导致）
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }

    return () => abortController.abort();
  }, [url, options]);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = fetchData();
    return () => {
      mountedRef.current = false;
      cleanup.then((abort) => abort?.());
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

### 3.2 React Query / SWR 替代方案（可选）

如果未来引入 React Query 或 SWR，Hook 可简化（以 SWR 为例）：

```typescript
// 使用 SWR 的等价实现（备选，当前不使用，记录以备决策）
// import useSWR from 'swr';
//
// const fetcher = (url: string) => fetch(url).then((r) => r.json());
//
// export function useExchangeRateSwr(base: CurrencyCode = 'USD') {
//   const { data, error, isLoading, mutate } = useSWR(
//     `https://open.er-api.com/v6/latest/${base}`,
//     fetcher,
//     {
//       revalidateOnFocus: false,
//       dedupingInterval: 3_600_000, // 1h dedup
//       onError: () => { /* fallback logic */ },
//     },
//   );
//   return { data, loading: isLoading, error, refetch: mutate };
// }
```

**决策**: 当前不使用 SWR/React Query，依赖足够简单。如后续添加更多 API 调用，重新评估。

### 3.3 请求去重与缓存

- **内存缓存**: Hook 内部通过 `fetchIdRef` 序列号防止竞态
- **持久缓存**: 汇率数据通过 `localStorage` 持久化（1 小时 TTL）
- **请求去重**: 同一组件树中多次调用 `useExchangeRate` 不会发起多个请求（由调用方保证只在一个组件中使用，或通过 Context 共享）

---

## 4. React Error Boundary

### 4.1 ApiErrorBoundary 组件

将 API 错误统一捕获并展示友好界面：

```typescript
// src/components/layout/ApiErrorBoundary.tsx
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import type { ApiError } from '@/types/error';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * API 错误边界
 *
 * 捕获子树中所有 API 相关的未处理异常，
 * 展示友好的错误提示而非白屏。
 */
export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const apiError = error as ApiError;
    console.error(
      `[ApiErrorBoundary] ${apiError.category ?? 'unknown'}: ${error.message}`,
      errorInfo,
    );
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const apiError = this.state.error as ApiError;

      return (
        <div className="glass-panel p-6 text-center" role="alert">
          <h3 className="text-lg font-semibold text-white mb-2">
            {apiError.category === 'network'
              ? '网络连接异常'
              : apiError.category === 'timeout'
                ? '请求超时'
                : '服务暂时不可用'}
          </h3>
          <p className="text-white/60 text-sm mb-4">
            {this.state.error?.message ?? '请检查网络后重试'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4.2 使用示例

```tsx
// src/App.tsx
import { ApiErrorBoundary } from '@/components/layout/ApiErrorBoundary';
import { ValueCalculator } from '@/components/calculator/ValueCalculator';

export default function App() {
  return (
    <main className="min-h-screen">
      <ApiErrorBoundary>
        <ValueCalculator />
      </ApiErrorBoundary>
    </main>
  );
}
```

---

## 5. API 安全注意事项

### 5.1 CORS

两个 API 均支持跨域（CORS），可直接从前端调用。

### 5.2 请求频率

| API | 免费版限制 | 建议策略 |
|-----|-----------|----------|
| Open ER API | 未知（generous）| 用户主动刷新时才请求，或每 1 小时自动刷新一次 |
| ExchangeRate-API | 1500 请求/月 | 同样保守策略 |

节流策略:
- 页面加载时：先读缓存，缓存过期才请求
- 用户手动刷新：立即请求，更新缓存
- 货币切换：不触发新请求（复用已有 rates）

### 5.3 数据验证

```typescript
// src/utils/currency.ts 中验证函数
function validateRate(rate: unknown): rate is number {
  return typeof rate === 'number'
    && rate > 0
    && rate < 10000
    && Number.isFinite(rate);
}

function validateRates(rates: Record<string, unknown>): rates is RateMap {
  for (const [currency, rate] of Object.entries(rates)) {
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(`Invalid currency code: ${currency}`);
    }
    if (!validateRate(rate)) {
      throw new Error(`Invalid rate for ${currency}: ${rate}`);
    }
  }
  return true;
}
```

---

## 6. 测试用例

### 6.1 背景图 API 测试

| 用例 | 预期结果 |
|------|----------|
| 正常网络环境 | `useBackgroundImage` 返回 `status: 'loaded'`，`imageUrl` 非 null |
| 网络断开 | `status` 为 `'error'`，页面显示 CSS 渐变 fallback，无报错 |
| API 返回 404 | `status` 为 `'error'`，显示 CSS 渐变 fallback |
| 慢网络（>10s）| 超时后 `status` 切换为 `'error'` |
| 组件卸载 | 已挂起的 Image 加载取消，无内存泄漏 |
| `retry()` 调用 | 重新触发加载流程，状态重置为 `'loading'` |

### 6.2 汇率 API 测试

| 用例 | 预期结果 |
|------|----------|
| 正常请求 USD 基准 | `data.rates` 包含 `CNY`/`EUR`/`GBP`/`JPY`，`isFallback` 为 `false` |
| 请求 CNY 基准 | 正确返回以 CNY 为 1 的汇率 |
| API 超时 | `loading` 结束后 `data.source` 为 `'fallback'`，`isFallback` 为 `true` |
| API 返回 500 | 自动尝试备用 API，最后 `data.source` 为 `'fallback'` |
| 浏览器无网络 | 命中缓存则 `data.source` 为 `'cache'`，否则为 `'fallback'` |
| `convertCurrency(100, 'USD', 'CNY', rates)` | 返回约 720-730（根据实时汇率）|
| `convertCurrency(100, 'USD', 'USD', rates)` | 返回 100（相同货币）|
| 组件卸载中请求完成 | 不执行 `setState`，无 React warning |
| Strict Mode 双重渲染 | 无重复请求，`fetchIdRef` 确保最新响应生效 |
| Error Boundary 捕获 | API 抛出的 `ApiError` 被 `ApiErrorBoundary` 捕获并显示 fallback UI |

### 6.3 缓存测试

| 用例 | 预期结果 |
|------|----------|
| 首次访问无缓存 | 发起网络请求 |
| 缓存未过期（<1h）| 直接使用缓存，无网络请求 |
| 缓存已过期（>1h）| 发起网络请求更新缓存 |
| localStorage 不可用 | 静默降级，每次发起网络请求 |

---

## 7. 文件结构索引

```
src/
├── types/
│   ├── currency.ts              # 汇率相关类型（CurrencyCode, RateMap, ExchangeRateData 等）
│   ├── background.ts            # 背景图相关类型（BackgroundStatus）
│   └── error.ts                 # 错误类型（ApiError, ApiErrorCategory）
├── hooks/
│   ├── useExchangeRate.ts       # 汇率获取 Hook
│   ├── useBackgroundImage.ts    # 背景图加载 Hook
│   └── useFetch.ts              # 通用数据获取 Hook（参考实现）
├── utils/
│   └── currency.ts              # 纯函数汇率转换工具
├── components/
│   ├── layout/
│   │   ├── Background.tsx        # 背景图组件（消费 useBackgroundImage）
│   │   └── ApiErrorBoundary.tsx  # API 错误边界
│   └── calculator/
│       ├── ExchangeRateDisplay.tsx  # 汇率展示组件
│       └── ValueCalculator.tsx      # 核心计算器（消费 useExchangeRate）
└── App.tsx                       # 根组件（包裹 ApiErrorBoundary）
```

---

## 8. 决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-05-29 | 使用自定义 Hook 而非 SWR/React Query | 仅 2 个 API 调用，依赖轻量，无需额外库 |
| 2026-05-29 | 汇率 API 级联降级而非并行 | 减少不必要请求，用户等待时间可接受 |
| 2026-05-29 | Error Boundary 而非全局错误事件 | 粒度更细，UI 可局部恢复而非整页崩溃 |

---

> **Agent 注意**: 添加新的外部 API 依赖时，必须：
> 1. 在本文件中记录接口规范、错误处理策略和降级方案
> 2. 在 `src/types/` 下添加对应的 TypeScript 类型
> 3. 创建对应的自定义 Hook 在 `src/hooks/`
> 4. 更新 `src/components/layout/ApiErrorBoundary.tsx` 中的错误分类（如需要）
> 5. 更新测试用例章节
> 6. 在决策记录表中记录引入理由
