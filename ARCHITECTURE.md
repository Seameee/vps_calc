# ARCHITECTURE.md - VPS 剩余价值计算器

> 本文档描述项目的技术架构、文件组织、模块划分与数据流。所有 AI Agent 在添加新功能或重构前必须阅读本文档。

---

## 1. 架构概述

### 1.1 架构风格

**React 18 单页应用 (Single-Page Application)**

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS + shadcn/ui 组件库
- **部署目标**: 任何静态文件托管（Vercel、Netlify、Cloudflare Pages、GitHub Pages 等）

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React 18 SPA (Vite Build)                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     Component Layer (JSX/TSX)                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐  │ │
│  │  │  Layout  │ │   Form   │ │   Result     │ │   TradePost  │  │ │
│  │  │Components│ │Components│ │   Components │ │   Components │  │ │
│  │  └──────────┘ └──────────┘ └──────────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│  ┌──────────────────────────────┴──────────────────────────────────┐ │
│  │                    Custom Hooks Layer                           │ │
│  │  ┌────────────┐ ┌──────────────┐ ┌──────────────┐             │ │
│  │  │useCalculator│ │useExchangeRate│ │useLocalStorage│            │ │
│  │  └────────────┘ └──────────────┘ └──────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│  ┌──────────────────────────────┴──────────────────────────────────┐ │
│  │                     Service / Utility Layer                     │ │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │dateCalc    │ │valueEngine │ │currency  │ │exportService │  │ │
│  │  │            │ │            │ │Converter │ │              │  │ │
│  │  └────────────┘ └────────────┘ └──────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                    │
│  ┌──────────────────────────────┴──────────────────────────────────┐ │
│  │                       External Layer                           │ │
│  │  ┌──────────────────┐  ┌──────────────────────────────────┐    │ │
│  │  │   汇率 API       │  │   背景图 API (seaya)             │    │ │
│  │  └──────────────────┘  └──────────────────────────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 文件结构

```
vps_calc/
├── public/                  # 静态资源（无需构建处理）
│   └── favicon.svg
├── src/                     # 源代码
│   ├── components/          # React 组件
│   │   ├── ui/              # shadcn/ui 组件（Button, Card, Input, Select...）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── label.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/          # 布局组件
│   │   │   ├── Background.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── form/            # 表单组件
│   │   │   ├── VPSInfoForm.tsx
│   │   │   ├── BillingForm.tsx
│   │   │   └── TradeSettings.tsx
│   │   ├── result/          # 结果展示组件
│   │   │   ├── ValueResult.tsx
│   │   │   ├── CalculationBreakdown.tsx
│   │   │   └── CurrencySelector.tsx
│   │   ├── export/          # 导出相关组件
│   │   │   ├── TradePostPreview.tsx
│   │   │   ├── CopyButtons.tsx
│   │   │   └── ExportImageButton.tsx
│   │   └── ...
│   ├── hooks/               # 自定义 React Hooks
│   │   ├── useCalculator.ts      # 计算逻辑 Hook
│   │   ├── useExchangeRate.ts    # 汇率获取与缓存 Hook
│   │   ├── useLocalStorage.ts    # localStorage 持久化 Hook
│   │   ├── useDebounce.ts        # 防抖 Hook
│   │   └── useClipboard.ts       # 剪贴板操作 Hook
│   ├── lib/                 # 工具函数
│   │   ├── dateCalculator.ts     # 日期计算（闰年/闰月精确天数）
│   │   ├── valueEngine.ts        # 价值计算引擎
│   │   ├── currencyConverter.ts  # 汇率转换
│   │   ├── exportService.ts      # 导出功能（Markdown / 图片）
│   │   ├── formatters.ts         # 格式化工具（数字、日期、货币）
│   │   ├── constants.ts          # 常量配置
│   │   └── utils.ts              # 通用工具函数
│   ├── types/               # TypeScript 类型定义
│   │   ├── calculator.ts         # 计算相关类型
│   │   ├── exchange.ts           # 汇率相关类型
│   │   ├── vps.ts                # VPS 信息类型
│   │   └── trade.ts              # 交易帖类型
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # Tailwind 入口 + 全局样式
├── index.html               # Vite 入口 HTML
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind CSS 配置
├── tsconfig.json            # TypeScript 配置
├── tsconfig.node.json       # Node 环境 TypeScript 配置
├── components.json          # shadcn/ui 配置
├── postcss.config.js        # PostCSS 配置
├── package.json             # 依赖管理
├── AGENTS.md                # AI 工作指导
├── SECURITY_AUDIT.md        # 安全审计规范
├── DESIGN.md                # 视觉设计规范
├── ARCHITECTURE.md          # 本文档
├── API.md                   # 外部接口规范
└── README.md                # 项目说明
```

---

## 3. 模块设计

### 3.1 组件层级

```
App
├── Background              # 背景层（每日背景图 + blur 遮罩）
├── Header                  # 标题栏
├── main.content            # 主要内容区（玻璃卡片容器）
│   ├── VPSInfoForm         # VPS 基本信息表单
│   │   ├── ProviderSelect
│   │   ├── ModelInput
│   │   ├── SpecInputs      # CPU/内存/存储/带宽/流量
│   │   └── FeatureTags     # 特性标签
│   ├── BillingForm         # 计费信息表单
│   │   ├── PriceInput
│   │   ├── CurrencySelect
│   │   ├── BillingCycleSelect
│   │   └── ExpirationDatePicker
│   ├── TradeSettings       # 交易设置
│   │   ├── SurchargeInput
│   │   ├── PushFeeInput
│   │   └── RoundingToggle
│   ├── ValueResult         # 计算结果展示
│   │   ├── DailyPriceDisplay
│   │   ├── RemainingDaysDisplay
│   │   ├── RemainingValueDisplay
│   │   └── FinalValueDisplay
│   └── TradePostPreview    # 交易帖预览与导出
│       ├── FormatToggle    # Markdown / 纯文本切换
│       ├── CopyButtons     # 复制按钮
│       └── ExportButtons   # 导出按钮（图片/Markdown）
└── Footer                  # 页脚信息
```

### 3.2 自定义 Hooks

```typescript
// useCalculator — 核心计算逻辑 Hook
// 组合日期计算、价值引擎、汇率转换
function useCalculator(inputs: VPSInputs): CalculatorResult {
  const [result, setResult] = useState<CalculatorResult>(initialResult);
  
  useEffect(() => {
    const remainingDays = getExactDaysBetween(new Date(), inputs.expirationDate);
    const dailyPrice = calculateDailyPrice(inputs.renewalPrice, inputs.billingCycle, new Date());
    const remainingValue = dailyPrice * remainingDays;
    // ... 汇率转换、溢价计算
    setResult({ remainingDays, dailyPrice, remainingValue, finalValue, ... });
  }, [inputs]);
  
  return result;
}

// useExchangeRate — 汇率获取与缓存 Hook
function useExchangeRate(baseCurrency: string = 'USD'): ExchangeRateState {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  useEffect(() => {
    fetchExchangeRates(baseCurrency)
      .then(data => { setRates(data.rates); setLastUpdated(new Date()); })
      .catch(() => { setRates(FALLBACK_RATES); setIsFallback(true); });
  }, [baseCurrency]);
  
  return { rates, isFallback, lastUpdated };
}

// useLocalStorage — 持久化 Hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  
  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };
  
  return [storedValue, setValue];
}
```

### 3.3 状态管理

**方案选择**: 使用 React 内置状态管理（`useState` + `useReducer`），不引入额外状态库。理由：
- 应用状态复杂度适中，单页无跨路由共享状态需求
- 减少依赖体积
- 状态逻辑可通过自定义 Hooks 复用

如果未来需要跨组件共享全局状态（如主题、汇率缓存），使用 **React Context**：

```typescript
// 主题 Context
const ThemeContext = React.createContext<ThemeContextType>(defaultTheme);
// 汇率 Context
const ExchangeRateContext = React.createContext<ExchangeRateContextType>(defaultRates);
```

**备选方案**: 如果状态管理复杂度显著上升（如多 VPS 对比功能），可引入 **Zustand**（~1KB，零 boilerplate）。

---

## 4. 核心算法说明

### 4.1 闰年/闰月精确天数计算

**问题**: 不能简单地用 "30天" 或 "365天" 估算周期。

**解决方案**: 使用 JavaScript `Date` 对象的时间戳差值，它自动处理闰年：

```typescript
/**
 * 计算两个日期之间的精确天数（包含闰年闰月）
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 天数差（可为小数，精确到毫秒）
 */
function getExactDaysBetween(startDate: Date, endDate: Date): number {
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

```typescript
function calculateDailyPrice(price: number, billingCycle: BillingCycle, startDate: Date): number {
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

```typescript
interface RemainingValueResult {
  dailyPrice: number;
  remainingDays: number;
  remainingValue: number;
}

function calculateRemainingValue(price: number, billingCycle: BillingCycle, expirationDate: Date): RemainingValueResult {
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

```typescript
function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
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

```typescript
interface FinalValueOptions {
  isRoundingEnabled?: boolean;
}

interface FinalValueResult {
  remainingValue: number;
  surcharge: number;
  pushFee: number;
  finalValue: number;
  formula: string;
}

function calculateFinalValue(
  remainingValue: number,
  surcharge: number,
  pushFee: number,
  options: FinalValueOptions = {}
): FinalValueResult {
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
1. **html2canvas** (`html2canvas` npm 包)
   - 优点: 成熟稳定，支持 CSS 变换和阴影
   - 缺点: 体积较大 (~100KB)，部分 CSS 属性支持不完善
   - 使用方式: 将结果面板 DOM 元素转为 Canvas

2. **dom-to-image-more** (`dom-to-image-more` npm 包)
   - 优点: 支持现代 CSS 特性，体积较小
   - 缺点: 需要 CORS 图片支持
   - 使用方式: `domtoimage.toPng(node, options)`

**导出流程**:

```typescript
async function exportAsImage(node: HTMLElement, format: 'png' | 'jpeg' = 'png'): Promise<string> {
  try {
    // 显示加载状态
    // 克隆节点以隐藏按钮和交互元素
    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.no-export').forEach(el => el.remove());
    
    // 生成图片
    const dataUrl = await domtoimage.toPng(clone, {
      quality: 0.92,
      bgcolor: 'transparent',
      scale: 2 // 高清 2x
    });
    
    return dataUrl;
  } catch (error) {
    throw new Error('图片生成失败: ' + (error as Error).message);
  }
}

async function copyImageToClipboard(dataUrl: string): Promise<void> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
    } else {
      throw new Error('浏览器不支持复制图片到剪贴板');
    }
  } catch (error) {
    // 降级方案：提示用户下载
    downloadImage(dataUrl);
  }
}

function downloadImage(dataUrl: string, filename: string = 'VPS-交易信息.png'): void {
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
用户输入（表单组件）
    ↓
React State (useState / useReducer)
    ↓
useCalculator Hook (自动重新计算)
    ├─→ dateCalculator.ts  计算剩余天数
    ├─→ valueEngine.ts     计算日单价和剩余价值
    ├─→ currencyConverter.ts 货币转换（如需要）
    └─→ 组装最终交易价值
    ↓
React Re-render (组件重新渲染)
    ├─→ ValueResult 组件更新
    ├─→ TradePostPreview 组件更新
    └─→ 汇率信息显示
```

### 5.2 React 数据流图解

```
┌──────────────┐     props      ┌──────────────┐
│  App (state)  │ ────────────→ │  Child Comp   │
│  (useState)   │               │  (read-only)  │
│               │ ←─────────── │               │
└──────────────┘  callbacks     └──────────────┘

┌──────────────┐               ┌──────────────┐
│  Component   │  ────────→    │  Custom Hook  │  ──────→  │  Service/  │
│  (UI)        │  (调用 Hook)   │  (状态+逻辑)   │          │  Utility  │
└──────────────┘               └──────────────┘           └────────────┘
```

### 5.3 状态设计

```typescript
// ============ 类型定义 (src/types/calculator.ts) ============

interface VPSInputs {
  provider: string;
  model: string;
  expirationDate: Date;
  renewalPrice: number;
  billingCurrency: CurrencyCode;
  billingCycle: BillingCycle;
  surcharge: number;
  tradeCurrency: CurrencyCode;
  tradeMethod: TradeMethod;
  pushFee: number;
  feeBearer: FeeBearer;
  
  // 配置
  cpu: number | null;
  ram: { value: number; unit: 'GB' | 'MB' };
  storage: { value: number; type: 'SSD' | 'HDD' | 'NVMe' };
  bandwidth: { value: number; unit: 'Mbps' | 'Gbps' };
  traffic: { value: number; unit: 'GB' | 'TB'; unlimited: boolean };
  trafficCalc: 'bidirectional' | 'unidirectional';
  
  // 账户
  accountBalance: number;
  affBalance: number;
  balanceCurrency: CurrencyCode;
  
  // 特性
  features: string[];
  notes: string;
}

interface CalculatorResult {
  remainingDays: number;
  dailyPrice: number;
  remainingValue: number;
  convertedValue: number;
  finalValue: number;
  formula: string;
}

interface ExchangeRateState {
  rates: Record<string, number>;
  base: string;
  lastUpdated: Date | null;
  isFallback: boolean;
}

interface UIState {
  isRoundingEnabled: boolean;
  copiedFormat: 'text' | 'markdown' | null;
  theme: 'dark';
}
```

### 5.4 组件间通信

| 通信模式 | 方式 | 适用场景 |
|----------|------|----------|
| 父 → 子 | Props | 单向数据传递 |
| 子 → 父 | Callback Props (`onChange`) | 表单输入上报 |
| 跨层级 | React Context | 主题、汇率缓存等全局状态 |
| 兄弟组件 | 提升状态到共同父组件 | 表单与结果展示同步 |

---

## 6. 外部依赖

### 6.1 npm 依赖

| 包名 | 用途 | 是否必需 |
|------|------|----------|
| `react` (^18) | 前端框架 | 是 |
| `react-dom` (^18) | DOM 渲染 | 是 |
| `typescript` | 类型系统 | 是 |
| `vite` | 构建工具 | 是 |
| `@vitejs/plugin-react` | Vite React 插件 | 是 |
| `tailwindcss` | CSS 工具库 | 是 |
| `postcss` | CSS 处理器 | 是 |
| `autoprefixer` | CSS 前缀自动补全 | 是 |
| `@tailwindcss/forms` | 表单样式重置 | 是 |
| `@tailwindcss/typography` | 排版工具类（交易帖渲染） | 是 |
| `lucide-react` | 图标库 | 是 |
| `class-variance-authority` | shadcn/ui 依赖 | 是 |
| `clsx` | 类名合并工具 | 是 |
| `tailwind-merge` | Tailwind 类名合并 | 是 |
| `tailwindcss-animate` | 动画工具 | 是 |
| `@radix-ui/*` (多个) | shadcn/ui 底层原语 | 是 |

**可选依赖**:

| 包名 | 用途 | 引入条件 |
|------|------|----------|
| `html2canvas` | DOM→Canvas 导出图片 | 启用图片导出功能时 |
| `dom-to-image-more` | DOM→Canvas 导出图片 | html2canvas 替代方案 |
| `zustand` | 轻量状态管理 | 状态复杂度显著上升时 |

### 6.2 API 依赖

| API | URL | 用途 | 失败降级 |
|-----|-----|------|----------|
| 背景图 | `https://api.seaya.link/daily/` | 每日背景 | CSS 渐变背景 |
| 汇率 | `https://open.er-api.com/v6/latest/USD` | 实时汇率 | 硬编码汇率表 |

### 6.3 CDN 资源（仅用于构建后部署）

| 资源 | 来源 | 用途 |
|------|------|------|
| Inter 字体 | Google Fonts | 西文字体 |
| Noto Sans SC | Google Fonts | 中文字体 |

字体通过 `@fontsource/*` npm 包或在 `index.html` 中通过 `<link>` 引用。

---

## 7. 性能策略

### 7.1 构建性能（Vite）

- **ESBuild 预构建**: Vite 使用 ESBuild 预构建依赖，开发服务器启动极快
- **按需编译**: 仅在请求时编译当前页面所需模块
- **CSS 提取**: Tailwind 生成的生产 CSS 会自动 Tree-shaken，仅保留使用的类名

### 7.2 React 运行时优化

```typescript
// React.memo — 避免无关渲染
const ValueResult = React.memo(({ result }: ValueResultProps) => {
  return <div>{/* 结果展示 */}</div>;
});

// useMemo — 缓存计算结果
const finalValue = useMemo(() => {
  return calculateFinalValue(remainingValue, surcharge, pushFee, options);
}, [remainingValue, surcharge, pushFee, options]);

// useCallback — 稳定回调引用
const handleInputChange = useCallback((field: string, value: unknown) => {
  dispatch({ type: 'UPDATE_INPUT', payload: { field, value } });
}, []);

// React.lazy — 代码分割（懒加载非首屏组件）
const TradePostPreview = React.lazy(() => import('./components/export/TradePostPreview'));
const ExportImageButton = React.lazy(() => import('./components/export/ExportImageButton'));
```

### 7.3 加载性能

- **字体优化**: `font-display: swap` 异步加载字体
- **图片优化**: 背景图通过 CSS `background-image` 加载，使用模糊渐入过渡效果
- **代码分割**: 使用 `React.lazy()` + `Suspense` 拆分导出相关组件

### 7.4 运行时性能

- **防抖计算**: 表单输入使用 `useDebounce` Hook（300ms）触发计算，避免高频重渲染
- **虚拟滚动**: 不需要（内容少）
- **will-change**: 仅在动画期间使用，动画结束后移除
- **条件渲染**: 非激活的 tab/面板使用条件渲染而非 CSS 隐藏，减少 DOM 节点

### 7.5 目标性能指标

| 指标 | 目标 |
|------|------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Lighthouse Performance | ≥ 90 |

---

## 8. 构建与部署

### 8.1 开发流程

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 5173）
npm run dev

# 代码检查
npx tsc --noEmit

# 运行测试（如有）
npm test
```

### 8.2 生产构建

```bash
# 构建生产版本，输出到 dist/
npm run build

# 预览生产构建
npm run preview
```

**构建产物** (`dist/`):

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js       # 主入口 JS
│   ├── index-[hash].css      # 压缩后 CSS
│   └── ...
├── favicon.svg
└── ...
```

### 8.3 部署

| 平台 | 配置方式 |
|------|----------|
| **Vercel** | 自动检测 Vite 项目，无需额外配置 |
| **Netlify** | 设置构建命令 `npm run build`，发布目录 `dist/` |
| **Cloudflare Pages** | 设置构建命令 `npm run build`，输出目录 `dist/` |
| **GitHub Pages** | 使用 `vite.config.ts` 设置 `base: '/<repo>/'`，通过 `gh-pages` 分支或 Actions 部署 |

### 8.4 npm scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

---

## 9. 浏览器兼容性

| 浏览器 | 最低版本 | 注意事项 |
|--------|----------|----------|
| Chrome | 90+ | `backdrop-filter` 完全支持 |
| Firefox | 88+ | `backdrop-filter` 完全支持 |
| Safari | 14+ | 需要 `-webkit-backdrop-filter` |
| Edge | 90+ | Chromium 内核，同 Chrome |

**降级策略**:
- 不支持 `backdrop-filter` 的浏览器：使用纯色半透明背景 `rgba(20, 20, 40, 0.9)`
- Vite 构建自动处理 CSS 前缀（通过 `autoprefixer` + `browserslist`）

```css
@supports not (backdrop-filter: blur(20px)) {
  .glass-card {
    background: rgba(20, 20, 40, 0.92);
  }
}
```

---

## 10. 扩展性设计

### 10.1 未来可能的功能

- 多 VPS 对比（同时计算多个 VPS 的价值）
- 历史汇率图表
- 本地数据导出/导入（JSON）
- PWA 支持（离线使用 + 主屏幕图标）
- 国际化 (i18n)

### 10.2 扩展接口

当前代码应预留以下扩展点：
- `CONSTANTS.BILLING_CYCLES` 数组：方便添加新的计费周期
- `CONSTANTS.CURRENCIES` 数组：方便添加新货币
- `CONSTANTS.FEATURES` 数组：方便添加预设特性标签
- `valueEngine.calculate()` 函数：封装计算逻辑，便于修改公式
- 组件通过 Props 注入配置，便于组合与测试

---

> **Agent 注意**: 架构变更（如更换状态管理库、添加后端、引入 PWA）必须经过讨论并更新本文档。保持 React 最佳实践是首要原则。
