# API.md - VPS 剩余价值计算器

> 本文档定义项目与外部 API 的交互规范，包括背景图 API、汇率 API 的使用方式、请求格式、响应结构、错误处理与降级策略。

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

### 1.2 使用方式

**HTML 方式**:
```html
<img 
  src="https://api.seaya.link/daily/" 
  alt="每日背景"
  crossorigin="anonymous"
  id="daily-bg"
>
```

**CSS 方式**（推荐）:
```css
.bg-image {
  background-image: url('https://api.seaya.link/daily/');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

### 1.3 响应行为

API 通常返回 **302 Found** 重定向到每日图片的实际 URL：
```
HTTP/1.1 302 Found
Location: https://.../image_20260529.jpg
```

浏览器会自动跟随重定向加载图片。

### 1.4 客户端处理

```javascript
const BackgroundService = {
  url: 'https://api.seaya.link/daily/',
  
  load() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      document.body.style.backgroundImage = `url(${this.url})`;
      document.body.classList.add('bg-loaded');
    };
    
    img.onerror = () => {
      console.warn('Background image load failed, using fallback gradient');
      document.body.classList.add('bg-fallback');
    };
    
    img.src = this.url;
  }
};
```

### 1.5 错误降级

- **网络错误**: 使用 CSS 渐变背景作为 fallback
- **加载超时**: 设置 10 秒超时，超时后切换 fallback
- **CORS 错误**: 背景图通常不需要 CORS，但如果需要 canvas 操作则必须加 `crossorigin`

```css
body {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

body.bg-loaded {
  background-image: url('https://api.seaya.link/daily/');
  background-size: cover;
  background-position: center;
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

### 2.3 客户端实现规范

```javascript
const ExchangeRateService = {
  endpoints: [
    { name: 'open-er', url: 'https://open.er-api.com/v6/latest/' },
    { name: 'exchange-rate-api', url: 'https://api.exchangerate-api.com/v4/latest/' }
  ],
  
  fallbackRates: {
    USD: { CNY: 7.20, EUR: 0.92, GBP: 0.78, JPY: 155.0 },
    CNY: { USD: 0.139, EUR: 0.128, GBP: 0.108, JPY: 21.5 },
    EUR: { USD: 1.09, CNY: 7.83, GBP: 0.85, JPY: 168.5 },
    GBP: { USD: 1.28, CNY: 9.23, EUR: 1.18, JPY: 198.7 },
    JPY: { USD: 0.0065, CNY: 0.0465, EUR: 0.0059, GBP: 0.0050 }
  },
  
  cacheKey: 'vps_calc_rates_v1',
  cacheTTL: 3600000,
  
  async fetchRates(base = 'USD') {
    const cached = this.getCachedRates(base);
    if (cached) {
      return { rates: cached, source: 'cache', isFallback: false };
    }
    
    for (const endpoint of this.endpoints) {
      try {
        const rates = await this.fetchFromEndpoint(endpoint, base);
        this.cacheRates(base, rates);
        return { rates, source: endpoint.name, isFallback: false };
      } catch (error) {
        console.warn(`Rate API ${endpoint.name} failed:`, error);
      }
    }
    
    const fallback = this.fallbackRates[base];
    if (fallback) {
      console.warn('Using fallback rates');
      return { rates: fallback, source: 'fallback', isFallback: true };
    }
    
    throw new Error('Unable to fetch exchange rates from any source');
  },
  
  async fetchFromEndpoint(endpoint, base) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`${endpoint.url}${base}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.result === 'error') {
        throw new Error(`API error: ${data['error-type']}`);
      }
      
      if (!data.rates || typeof data.rates !== 'object') {
        throw new Error('Invalid response structure');
      }
      
      return data.rates;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  },
  
  getCachedRates(base) {
    try {
      const raw = localStorage.getItem(`${this.cacheKey}_${base}`);
      if (!raw) return null;
      
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > this.cacheTTL) {
        localStorage.removeItem(`${this.cacheKey}_${base}`);
        return null;
      }
      
      return data.rates;
    } catch {
      return null;
    }
  },
  
  cacheRates(base, rates) {
    try {
      const data = { rates, timestamp: Date.now() };
      localStorage.setItem(`${this.cacheKey}_${base}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache rates:', error);
    }
  },
  
  convert(amount, from, to, rates) {
    if (from === to) return amount;
    if (!rates || typeof rates !== 'object') return amount;
    
    const inUSD = from === 'USD' ? amount : amount / (rates[from] || 1);
    return to === 'USD' ? inUSD : inUSD * (rates[to] || 1);
  }
};
```

### 2.4 汇率转换公式

基于 USD 基准的转换:
```
Currency A to Currency B = (Amount / Rate_A) * Rate_B
```

示例:
- 已知: rates = { USD: 1, CNY: 7.24, EUR: 0.92 }
- 转换 100 CNY 到 EUR: (100 / 7.24) * 0.92 = 12.71 EUR

### 2.5 错误处理矩阵

| 场景 | 用户可见反馈 | 降级行为 |
|------|-------------|----------|
| 网络断开 | "汇率获取失败，使用缓存汇率" | 使用 localStorage 缓存 |
| API 超时 | "汇率服务响应慢，使用默认汇率" | 使用硬编码 fallback |
| API 返回错误 | "汇率服务暂时不可用" | 使用硬编码 fallback |
| 浏览器不支持 fetch | "浏览器不支持实时汇率" | 使用硬编码 fallback |
| localStorage 被禁用 | "汇率将每次重新获取" | 每次请求 API，失败用 fallback |

---

## 3. API 安全注意事项

### 3.1 CORS

两个 API 均支持跨域（CORS），可直接从前端调用。

### 3.2 请求频率

| API | 免费版限制 | 建议策略 |
|-----|-----------|----------|
| Open ER API | 未知（generous）| 用户主动刷新时才请求，或每 1 小时自动刷新一次 |
| ExchangeRate-API | 1500 请求/月 | 同样保守策略 |

节流策略:
- 页面加载时：先读缓存，缓存过期才请求
- 用户手动刷新：立即请求，更新缓存
- 货币切换：不触发新请求（复用已有 rates）

### 3.3 数据验证

```javascript
function validateRate(rate) {
  return typeof rate === 'number' 
    && rate > 0 
    && rate < 10000 
    && Number.isFinite(rate);
}

function validateRates(rates) {
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

## 4. 测试用例

### 4.1 背景图 API 测试

| 用例 | 预期结果 |
|------|----------|
| 正常网络环境 | 背景图成功加载，页面显示背景 |
| 网络断开 | 显示 CSS 渐变 fallback，无报错 |
| API 返回 404 | 显示 CSS 渐变 fallback |
| 慢网络（>10s）| 超时后显示 fallback |

### 4.2 汇率 API 测试

| 用例 | 预期结果 |
|------|----------|
| 正常请求 USD 基准 | 返回包含 CNY/EUR/GBP/JPY 的 rates |
| 请求 CNY 基准 | 正确返回以 CNY 为 1 的汇率 |
| API 超时 | 显示警告，使用 fallback 汇率 |
| API 返回 500 | 尝试备用 API，最后使用 fallback |
| 浏览器无网络 | 使用 cached 或 fallback |
| 转换 100 USD 到 CNY | 显示约 720-730 CNY（根据实时汇率）|
| 转换相同货币 | 原值返回，无请求 |

---

> **Agent 注意**: 添加新的外部 API 依赖时，必须在本文件中记录其接口规范、错误处理策略和降级方案。
