# ARCHITECTURE.md - VPS 剩余价值计算器

> 本文档描述项目的技术架构、文件组织、模块划分与数据流。所有 AI Agent 在添加新功能或重构前必须阅读本文档。

---

## 1. 架构概述

### 1.1 架构风格

**纯前端静态应用 (Static Single-Page Application)**

- 无后端服务器
- 无构建流程
- 无框架依赖
- 部署目标：任何静态文件托管（GitHub Pages、Cloudflare Pages、Vercel、Netlify、Nginx 等）

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器环境                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   背景层    │  │    UI 层    │  │     逻辑层          │  │
│  │             │  │             │  │                     │  │
│  │ • 每日背景图 │  │ • 玻璃卡片  │  │ • 日期/时间计算     │  │
│  │   (seaya)   │  │ • 表单输入  │  │ • 汇率转换          │  │
│  │             │  │ • 结果展示  │  │ • 价值计算引擎      │  │
│  │             │  │ • 交易帖生成 │  │ • 剪贴板操作        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│           │               │                  │              │
│           └───────────────┴──────────────────┘              │
│                           │                                 │
│                    ┌──────┴──────┐                         │
│                    │  外部 API   │                         │
│                    │ • 汇率 API  │                         │
│                    │ • 背景图 API│                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 文件结构

```
vps_calc/
├── index.html              # 主入口，包含完整应用
├── AGENTS.md               # AI 工作指导
├── SECURITY_AUDIT.md       # 安全审计规范
├── DESIGN.md               # 视觉设计规范
├── ARCHITECTURE.md         # 本文档
├── API.md                  # 外部接口规范
├── assets/                 # 静态资源（如需要）
│   └── icons/              # 内联 SVG 图标（可选）
├── docs/                   # 补充文档
└── README.md               # 项目说明（部署后）
```

**单文件策略说明**:

为简化部署，核心应用代码（HTML + CSS + JS）全部内联在 `index.html` 中。理由：
- 零配置部署到任何静态托管
- 减少 HTTP 请求
- 便于用户"另存为"离线使用

如果文件体积超过 200KB，再考虑拆分为 `index.html`, `styles.css`, `app.js`。

---

## 3. 模块设计

### 3.1 模块划分

```javascript
// 伪代码表示模块关系
app/
├── core/
│   ├── config.js          # 常量配置（货币列表、计费周期、默认汇率）
│   ├── state.js           # 全局状态管理（用户输入、计算结果、汇率缓存）
│   └── i18n.js            # 文案与格式化（数字、日期、货币）
├── domain/
│   ├── dateCalculator.js  # 日期计算（闰年/闰月精确天数）
│   ├── valueEngine.js     # 价值计算引擎（日单价 × 剩余天数）
│   └── currencyConverter.js # 汇率转换
├── services/
│   ├── exchangeRateService.js # 汇率 API 调用与缓存
│   └── backgroundService.js   # 背景图加载
├── ui/
│   ├── renderer.js        # DOM 渲染器
│   ├── components.js      # 可复用组件工厂
│   └── animations.js      # 动画工具
└── main.js                # 应用入口，初始化与事件绑定
```

### 3.2 实际实现（单文件内组织）

在 `index.html` 的 `<script type="module">` 中，使用 ES6 Module 的 import/export 组织代码，但所有模块内联在同一文件中（通过 `data:text/javascript` 或 `<script type="module" src="...">` 引用同文件内的 blob URL）。

**更简单的实现方式**: 使用 IIFE（立即执行函数）将代码划分为逻辑区块，通过注释分隔：

```html
<script>
// ============ CONFIG ============
const CONFIG = { ... };

// ============ STATE ============
const AppState = { ... };

// ============ DATE CALCULATOR ============
const DateCalculator = (() => { ... })();

// ============ VALUE ENGINE ============
const ValueEngine = (() => { ... })();

// ============ EXCHANGE RATE SERVICE ============
const ExchangeRateService = (() => { ... })();

// ============ UI RENDERER ============
const UIRenderer = (() => { ... })();

// ============ MAIN ============
document.addEventListener('DOMContentLoaded', () => { ... });
</script>
```

---

## 4. 核心算法说明

### 4.1 闰年/闰月精确天数计算

**问题**: 不能简单地用 "30天" 或 "365天" 估算周期。

**解决方案**: 使用 JavaScript `Date` 对象的时间戳差值，它自动处理闰年：

```javascript
/**
 * 计算两个日期之间的精确天数（包含闰年闰月）
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {number} 天数差（可为小数，精确到毫秒）
 */
function getExactDaysBetween(startDate, endDate) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / MS_PER_DAY;
}
```

**计费周期的精确天数**:

| 周期 | 计算方式 | 说明 |
|------|----------|------|
| 月付 | 按自然月天数 | 1月=31天，2月=28/29天，4月=30天 |
| 季付 | 3个自然月 | 精确到日 |
| 半年付 | 6个自然月 | 精确到日 |
| 年付 | 12个自然月 | 精确到日 |
| 两年付 | 24个自然月 | 精确到日 |
| 三年付 | 36个自然月 | 精确到日 |

**日单价计算**:

```javascript
function calculateDailyPrice(price, billingCycle, startDate) {
  switch (billingCycle) {
    case 'monthly':
      // 获取当前自然月的天数
      const daysInMonth = new Date(
        startDate.getFullYear(), 
        startDate.getMonth() + 1, 
        0
      ).getDate();
      return price / daysInMonth;
    
    case 'annually': {
      // 获取当前年份的天数（365 或 366）
      const year = startDate.getFullYear();
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      return price / (isLeap ? 366 : 365);
    }
    
    // ... 其他周期类似
  }
}
```

**剩余价值计算**:

```javascript
function calculateRemainingValue(price, billingCycle, expirationDate) {
  const now = new Date();
  const totalDays = getBillingCycleDays(billingCycle, now);
  const dailyPrice = price / totalDays;
  const remainingDays = getExactDaysBetween(now, expirationDate);
  
  return {
    dailyPrice,
    remainingDays: Math.max(0, remainingDays),
    remainingValue: Math.max(0, dailyPrice * remainingDays)
  };
}
```

### 4.2 汇率转换

```javascript
function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount;
  
  // 统一转换为 USD 基准
  const amountInUSD = fromCurrency === 'USD' 
    ? amount 
    : amount / rates[fromCurrency];
  
  return toCurrency === 'USD' 
    ? amountInUSD 
    : amountInUSD * rates[toCurrency];
}
```

### 4.3 溢价/折价与最终价值计算

**最终价值公式**:

```
最终价值 = 剩余价值 + 溢价/折价 + PUSH费用
```

其中：
- **剩余价值**: `(续费价格 / 计费周期天数) × 剩余天数`
- **溢价/折价**: 用户手动输入，正数为溢价（加价），负数为折价（减价）
- **PUSH费用**: 交易转移产生的费用（可选）

**计算逻辑**:

```javascript
function calculateFinalValue(remainingValue, surcharge, pushFee, options = {}) {
  let finalValue = remainingValue + surcharge + pushFee;
  
  // 抹零处理（可选）
  if (options.isRoundingEnabled) {
    finalValue = Math.floor(finalValue);
  }
  
  return {
    remainingValue,
    surcharge,
    pushFee,
    finalValue: Math.max(0, finalValue),
    formula: `剩余价值(${remainingValue.toFixed(2)}) + 溢价/折价(${surcharge.toFixed(2)}) + PUSH费(${pushFee.toFixed(2)}) = ${finalValue.toFixed(2)}`
  };
}
```

**输入验证**:
- 溢价/折价: 允许 `-999999.99` 到 `999999.99`，保留两位小数
- 零值时不显示在交易帖中
- 正数前缀显示 `+`，负数前缀显示 `-`

### 4.4 导出功能

**导出 Markdown**:
- 组装交易帖文本为 Markdown 格式
- 创建 Blob: `new Blob([markdown], { type: 'text/markdown' })`
- 使用临时 `<a>` 元素触发下载
- 文件名格式: `VPS-交易帖-{provider}-{date}.md`

**导出图片**:

技术方案选择（按优先级）:
1. **html2canvas** (`https://html2canvas.hertzen.com/dist/html2canvas.min.js`)
   - 优点: 成熟稳定，支持 CSS 变换和阴影
   - 缺点: 体积较大 (~100KB)，部分 CSS 属性支持不完善
   - 使用方式: 将结果面板 DOM 元素转为 Canvas

2. **dom-to-image-more** (`https://unpkg.com/dom-to-image-more@2.9.5/dist/dom-to-image-more.min.js`)
   - 优点: 支持现代 CSS 特性，体积较小
   - 缺点: 需要 CORS 图片支持
   - 使用方式: `domtoimage.toPng(node, options)`

**导出流程**:

```javascript
async function exportAsImage(node, format = 'png') {
  try {
    // 显示加载状态
    showLoading('正在生成图片...');
    
    // 克隆节点以隐藏按钮和交互元素
    const clone = node.cloneNode(true);
    clone.querySelectorAll('.no-export').forEach(el => el.remove());
    
    // 生成图片
    const dataUrl = await domtoimage.toPng(clone, {
      quality: 0.92,
      bgcolor: 'transparent',
      scale: 2 // 高清 2x
    });
    
    hideLoading();
    return dataUrl;
  } catch (error) {
    hideLoading();
    throw new Error('图片生成失败: ' + error.message);
  }
}

async function copyImageToClipboard(dataUrl) {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('图片已复制到剪贴板');
    } else {
      throw new Error('浏览器不支持复制图片到剪贴板');
    }
  } catch (error) {
    // 降级方案：提示用户下载
    showToast('复制失败，请使用下载功能');
    downloadImage(dataUrl);
  }
}

function downloadImage(dataUrl, filename = 'VPS-交易信息.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

**导出图片的 CSS 处理**:
- 导出前临时移除交互元素（按钮、输入框焦点状态）
- 确保 backdrop-filter 被正确渲染（可能需要 fallback 背景色）
- 固定容器尺寸，避免导出过程中内容变化
- 为导出内容添加专属样式类 `.export-only` 用于优化打印/导出效果

---

## 5. 数据流

### 5.1 用户输入 → 计算 → 渲染

```
用户输入（表单）
    ↓
DOM Event Listener (input/change)
    ↓
State Update (更新 AppState)
    ↓
Trigger Calculation
    ├─→ DateCalculator 计算剩余天数
    ├─→ ValueEngine 计算日单价和剩余价值
    ├─→ CurrencyConverter 货币转换（如需要）
    └─→ 组装最终交易价值
    ↓
UIRenderer 更新结果面板
    ├─→ 数字动画（可选）
    ├─→ 交易帖预览更新
    └─→ 汇率信息显示
```

### 5.2 状态设计

```javascript
const AppState = {
  // 用户输入
  inputs: {
    provider: '',
    model: '',
    expirationDate: null,
    renewalPrice: 0,
    billingCurrency: 'CNY',
    billingCycle: 'annually',
    surcharge: 0,
    tradeCurrency: 'CNY',
    tradeMethod: 'original_email',
    pushFee: 0,
    feeBearer: 'buyer',
    
    // 配置
    cpu: null,
    ram: { value: null, unit: 'GB' },
    storage: { value: null, type: 'SSD' },
    bandwidth: { value: null, unit: 'Mbps' },
    traffic: { value: null, unit: 'GB', unlimited: false },
    trafficCalc: 'bidirectional',
    
    // 账户
    accountBalance: 0,
    affBalance: 0,
    balanceCurrency: 'CNY',
    
    // 特性
    features: [], // 预设 + 自定义
    notes: ''
  },
  
  // 计算结果
  results: {
    remainingDays: 0,
    dailyPrice: 0,
    remainingValue: 0,
    convertedValue: 0,
    finalValue: 0,
    formula: ''
  },
  
  // 汇率
  exchangeRates: {
    rates: {},
    base: 'USD',
    lastUpdated: null,
    isFallback: false
  },
  
  // UI 状态
  ui: {
    isRoundingEnabled: false,
    copiedFormat: null, // 'text' | 'markdown' | null
    theme: 'dark'
  }
};
```

---

## 6. 外部依赖

### 6.1 CDN 资源（可选）

| 资源 | URL | 用途 | 是否必需 |
|------|-----|------|----------|
| Inter 字体 | Google Fonts | 西文字体 | 否（有 fallback）|
| Noto Sans SC | Google Fonts | 中文字体 | 否（有 fallback）|
| Lucide Icons | unpkg CDN | 图标 | 否（内联 SVG fallback）|

### 6.2 API 依赖

| API | URL | 用途 | 失败降级 |
|-----|-----|------|----------|
| 背景图 | `https://api.seaya.link/daily/` | 每日背景 | CSS 渐变背景 |
| 汇率 | `https://open.er-api.com/v6/latest/USD` | 实时汇率 | 硬编码汇率表 |

---

## 7. 性能策略

### 7.1 加载性能

- **内联关键 CSS**: 所有样式内联在 `<style>` 中，避免阻塞渲染的外部 CSS
- **异步加载字体**: `font-display: swap`
- **图片优化**: 背景图通过 CSS `background-image` 加载，使用 `loading="lazy"` 无效（fixed 背景），但可添加模糊渐入效果

### 7.2 运行时性能

- **防抖计算**: 用户输入时使用 `debounce`（300ms）触发计算，避免频繁重算
- **虚拟滚动**: 不需要（内容少）
- **will-change**: 仅在动画期间使用，动画结束后移除

### 7.3 目标性能指标

| 指标 | 目标 |
|------|------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3s |
| Cumulative Layout Shift (CLS) | < 0.1 |

---

## 8. 浏览器兼容性

| 浏览器 | 最低版本 | 注意事项 |
|--------|----------|----------|
| Chrome | 90+ | `backdrop-filter` 完全支持 |
| Firefox | 88+ | `backdrop-filter` 需要 `-webkit-` 前缀？不，Firefox 已支持 |
| Safari | 14+ | 需要 `-webkit-backdrop-filter` |
| Edge | 90+ | Chromium 内核，同 Chrome |

**降级策略**:
- 不支持 `backdrop-filter` 的浏览器：使用纯色半透明背景 `rgba(20, 20, 40, 0.9)`
- 不支持 CSS Grid 的浏览器：使用 Flexbox 布局（极少见，可忽略）

```css
@supports not (backdrop-filter: blur(20px)) {
  .glass-card {
    background: rgba(20, 20, 40, 0.92);
  }
}
```

---

## 9. 扩展性设计

### 9.1 未来可能的功能

- 多 VPS 对比（同时计算多个 VPS 的价值）
- 历史汇率图表
- 本地数据导出/导入（JSON）
- PWA 支持（离线使用 + 主屏幕图标）

### 9.2 扩展接口

当前代码应预留以下扩展点：
- `CONFIG.BILLING_CYCLES` 数组：方便添加新的计费周期
- `CONFIG.CURRENCIES` 数组：方便添加新货币
- `CONFIG.FEATURES` 数组：方便添加预设特性标签
- `ValueEngine.calculate()` 方法：封装计算逻辑，便于修改公式

---

> **Agent 注意**: 架构变更（如引入构建工具、拆分文件、添加框架）必须经过讨论并更新本文档。保持简单是首要原则。
