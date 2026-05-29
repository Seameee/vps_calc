# DESIGN.md - VPS 剩余价值计算器 设计规范

> 本文档定义本项目的完整视觉设计系统、交互规范与响应式策略。所有 UI 实现必须严格遵循本文档。
> 技术栈：React 18 + Vite + Tailwind CSS + shadcn/ui + TypeScript

---

## 1. 设计理念

### 1.1 核心概念

**"清澈的计算"** — 在通透的玻璃质感界面中，让用户专注于数字与价值的清晰呈现。背景如晨曦薄雾般柔和，内容如水晶般剔透。

### 1.2 风格定位

- **风格**: Glassmorphism（毛玻璃/高斯模糊）
- **情绪**: 专业、冷静、可信、现代
- **密度**: 中等信息密度 — 足够详细但不拥挤
- **动效**: 克制而精致的微交互，绝不喧宾夺主

### 1.3 设计原则

1. **背景优先**: 每日背景图是视觉核心，所有 UI 必须在其上保持可读性
2. **层级清晰**: 通过透明度、模糊度、阴影建立明确的 Z 轴层级
3. **留白呼吸**: 元素之间保持充足呼吸空间，拒绝拥挤
4. **细节丰富但不多余**: 每个视觉元素都有其功能目的，无纯装饰

---

## 2. 色彩系统

### 2.1 CSS 自定义属性（在 `src/index.css` 中定义）

本项目使用 Tailwind CSS 结合 CSS 自定义属性实现主题切换。所有颜色变量在 `@layer base` 中定义，并通过 `tailwind.config.ts` 扩展为 Tailwind 工具类。

#### 暗色主题（默认）

在 `src/index.css` 中：

```css
@layer base {
  :root {
    --bg-primary: rgba(10, 10, 20, 0.65);
    --bg-secondary: rgba(20, 20, 35, 0.50);
    --bg-tertiary: rgba(255, 255, 255, 0.08);
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.70);
    --text-tertiary: rgba(255, 255, 255, 0.50);
    --border-subtle: rgba(255, 255, 255, 0.12);
    --border-focus: rgba(255, 255, 255, 0.35);
    --accent-primary: #60a5fa;
    --accent-secondary: #a78bfa;
    --success: #34d399;
    --warning: #fbbf24;
    --error: #f87171;
    --radius: 24px;
  }
}
```

#### 亮色主题（备用）

```css
@layer base {
  .light {
    --bg-primary: rgba(255, 255, 255, 0.75);
    --bg-secondary: rgba(245, 245, 250, 0.65);
    --text-primary: rgba(15, 23, 42, 0.95);
    --text-secondary: rgba(51, 65, 85, 0.85);
    --border-subtle: rgba(15, 23, 42, 0.10);
    --accent-primary: #3b82f6;
  }
}
```

### 2.2 Tailwind 配置扩展（`tailwind.config.ts`）

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        glass: {
          primary: "rgba(255, 255, 255, 0.05)",
          "primary-dark": "rgba(10, 10, 20, 0.65)",
          secondary: "rgba(20, 20, 35, 0.50)",
          tertiary: "rgba(255, 255, 255, 0.08)",
        },
        text: {
          primary: "rgba(255, 255, 255, 0.95)",
          secondary: "rgba(255, 255, 255, 0.70)",
          tertiary: "rgba(255, 255, 255, 0.50)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.12)",
          focus: "rgba(255, 255, 255, 0.35)",
        },
        accent: {
          primary: "#60a5fa",
          secondary: "#a78bfa",
        },
        status: {
          success: "#34d399",
          warning: "#fbbf24",
          error: "#f87171",
        },
      },
      borderRadius: {
        glass: "24px",
        "glass-sm": "16px",
        "glass-input": "12px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 2.3 使用方式

```tsx
{/* 使用 Tailwind 类 */}
<div className="bg-white/5 backdrop-blur-xl border border-white/10">
  {/* 使用语义化颜色变量 */}
  <p className="text-[color:var(--text-primary)]">标题</p>
  <p className="text-[color:var(--text-secondary)]">正文</p>
</div>

{/* 或直接使用 Tailwind 色值 */}
<div className="bg-blue-500/10 border-blue-400/30">
  <p className="text-white/95">内容</p>
</div>
```

### 2.4 背景处理策略

**全局背景**:
- 图片来源: `https://api.seaya.link/daily/`
- 使用 Tailwind 类: `object-cover w-screen h-screen fixed inset-0`
- 暗化遮罩（暗色主题）: 叠加 `div` 使用 `bg-gradient-to-b from-black/30 to-black/50`
- 模糊层: `backdrop-blur-xl saturate-180` 应用于 UI 容器

**卡片背景** (Tailwind 类组合):
```tsx
<div className="
  bg-white/5
  backdrop-blur-xl saturate-180
  border border-white/[0.12]
  rounded-[24px]
  shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]
">
```

---

## 3. 字体系统

### 3.1 字体栈与 Tailwind 配置

在 `tailwind.config.ts` 中配置：

```typescript
const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'Inter'",
          "'Noto Sans SC'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "'PingFang SC'",
          "'Microsoft YaHei'",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'Fira Code'",
          "'Cascadia Code'",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
};
```

使用方式：
- `font-sans` — 默认无衬线字体
- `font-mono` — 等宽字体（用于汇率数字、代码预览）

**加载策略**:
- Inter: Google Fonts CDN (`https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap`)
- Noto Sans SC: Google Fonts CDN (`https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap`)
- 在 `index.html` 中通过 `<link>` 引入，使用 `display=swap` 避免 FOIT

### 3.2 字号规范（Tailwind 映射）

基于 `text-base` (16px) 根字号：

| 层级 | Tailwind 类 | 实际大小 | 字重 | 行高 | 用途 |
|------|-------------|----------|------|------|------|
| Display | `text-4xl` | `2.5rem` (40px) | `font-bold` | `leading-tight` | 页面主标题 |
| H1 | `text-3xl` | `2rem` (32px) | `font-bold` | `leading-snug` | 区块标题 |
| H2 | `text-2xl` | `1.5rem` (24px) | `font-semibold` | `leading-relaxed` | 卡片标题 |
| H3 | `text-xl` | `1.25rem` (20px) | `font-semibold` | `leading-relaxed` | 子区块标题 |
| Body | `text-base` | `1rem` (16px) | `font-normal` | `leading-[1.75]` | 正文 |
| Body Small | `text-sm` | `0.875rem` (14px) | `font-normal` | `leading-normal` | 次要文本 |
| Caption | `text-xs` | `0.75rem` (12px) | `font-medium` | `leading-normal` | 标签、辅助说明 |
| Data Large | `text-3xl` | `2rem` (32px) | `font-bold` | `leading-tight` | 核心计算结果 |
| Data Medium | `text-2xl` | `1.5rem` (24px) | `font-semibold` | `leading-snug` | 次级结果 |

### 3.3 数字显示规范

```tsx
{/* 等宽数字保证对齐 */}
<span className="font-mono tabular-nums text-3xl font-bold">
  ¥1,234.56
</span>

{/* 小数部分弱化 */}
<span className="font-mono tabular-nums">
  1,234
  <span className="opacity-70">.56</span>
</span>
```

---

## 4. 间距系统

### 4.1 基础映射

Tailwind 使用 `4px` 基础单位（`0.25rem`），与 8 点网格系统完全兼容。

| CSS 变量 | Tailwind 类 | 实际值 |
|----------|-------------|--------|
| `--space-1` | `p-1` `m-1` `gap-1` | `0.25rem` (4px) |
| `--space-2` | `p-2` `m-2` `gap-2` | `0.5rem` (8px) |
| `--space-3` | `p-3` `m-3` `gap-3` | `0.75rem` (12px) |
| `--space-4` | `p-4` `m-4` `gap-4` | `1rem` (16px) |
| `--space-5` | `p-5` `m-5` `gap-5` | `1.25rem` (20px) |
| `--space-6` | `p-6` `m-6` `gap-6` | `1.5rem` (24px) |
| `--space-8` | `p-8` `m-8` `gap-8` | `2rem` (32px) |
| `--space-10` | `p-10` `m-10` `gap-10` | `2.5rem` (40px) |
| `--space-12` | `p-12` `m-12` `gap-12` | `3rem` (48px) |
| `--space-16` | `p-16` `m-16` `gap-16` | `4rem` (64px) |

### 4.2 组件间距

| 场景 | Tailwind 类 | 说明 |
|------|-------------|------|
| 页面内边距 | `px-6 md:px-12` | 主容器与视口边缘 |
| 卡片内边距 | `p-6` | 玻璃卡片内部 |
| 卡片间距 | `gap-6` | 相邻卡片之间 |
| 表单字段间距 | `space-y-4` 或 `gap-4` | 表单项之间 |
| 标签与输入框 | `gap-1.5` | `<label>` 与 `<input>` 之间 |
| 按钮内边距 | `px-6 py-3` | 标准按钮 |
| 图标与文本 | `gap-2` | 行内图标与文字之间 |

---

## 5. 组件规范

### 5.1 玻璃卡片 (GlassCard) — React 组件

```tsx
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'subtle';
}

export function GlassCard({ children, className, variant = 'default' }: GlassCardProps) {
  return (
    <div
      className={cn(
        // 基础玻璃样式
        "rounded-3xl border border-white/10 backdrop-blur-xl saturate-180",
        "bg-white/5",
        "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]",
        // 交互
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.15),0_10px_10px_-5px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]",
        // 变体
        variant === 'accent' &&
          "border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10",
        variant === 'subtle' &&
          "bg-white/[0.03]",
        // 自定义
        className
      )}
    >
      {children}
    </div>
  );
}
```

使用示例：

```tsx
{/* 默认卡片 */}
<GlassCard>
  <h2 className="text-2xl font-semibold text-white/95">VPS 信息</h2>
  {/* ... */}
</GlassCard>

{/* 强调卡片 — 用于结果展示 */}
<GlassCard variant="accent" className="p-8">
  <p className="text-sm font-medium text-white/50">最终价值</p>
  <p className="font-mono text-3xl font-bold text-white/95">¥1,234.56</p>
</GlassCard>

{/* 弱化卡片 — 用于辅助信息 */}
<GlassCard variant="subtle" className="p-4">
  <p className="text-sm text-white/50">汇率信息来源</p>
</GlassCard>
```

### 5.2 输入框 — shadcn/ui Input + 玻璃样式

```tsx
import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes } from "react";

// 通过 shadcn/ui 的 Input 组件 + 自定义 className 实现玻璃样式
// 使用方式：<Input className="glass-input" />

const GlassInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 玻璃输入框样式
          "flex h-11 w-full rounded-xl border bg-white/[0.06] px-4 py-3",
          "border-white/[0.12] text-white/95 text-base",
          "placeholder:text-white/50",
          "transition-all duration-200",
          "focus:outline-none focus:border-blue-400 focus:bg-white/10",
          "focus:shadow-[0_0_0_3px_rgba(96,165,250,0.2)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // 错误状态
          "aria-[invalid=true]:border-red-400 aria-[invalid=true]:shadow-[0_0_0_3px_rgba(248,113,113,0.2)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassInput.displayName = "GlassInput";

export { GlassInput };
```

或直接使用 shadcn/ui 的 Input，传入自定义类：

```tsx
<Input
  className="
    bg-white/[0.06] border-white/[0.12] text-white/95
    placeholder:text-white/50 rounded-xl
    focus:border-blue-400 focus:bg-white/10
    focus:shadow-[0_0_0_3px_rgba(96,165,250,0.2)]
    transition-all duration-200
  "
  placeholder="请输入金额"
/>
```

**错误状态**:
```tsx
<Input
  className="
    bg-white/[0.06] rounded-xl
    border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.2)]
  "
  aria-invalid="true"
/>
<p className="flex items-center gap-1 mt-1 text-xs text-red-400">
  <AlertCircle className="w-3.5 h-3.5" />
  请输入有效金额
</p>
```

### 5.3 按钮 — shadcn/ui Button + 玻璃变体

**主按钮（渐变强调色）**:
```tsx
import { Button } from "@/components/ui/button";

<Button
  className="
    bg-gradient-to-r from-blue-400 to-purple-400
    text-white font-semibold
    rounded-xl px-6 py-3 h-auto
    shadow-[0_4px_6px_-1px_rgba(96,165,250,0.3)]
    hover:shadow-[0_10px_15px_-3px_rgba(96,165,250,0.4)]
    hover:brightness-110 hover:-translate-y-0.5
    active:translate-y-0 active:duration-100
    transition-all duration-200
  "
>
  <Calculator className="w-4 h-4" />
  计算价值
</Button>
```

**次按钮（玻璃透明）**:
```tsx
<Button
  variant="ghost"
  className="
    bg-white/10 border border-white/20
    text-white/95 rounded-xl
    hover:bg-white/[0.15] hover:text-white
    transition-all duration-200
  "
>
  取消
</Button>
```

**图标按钮**:
```tsx
<Button
  size="icon"
  variant="ghost"
  className="
    w-9 h-9 rounded-lg
    text-white/70 hover:text-white/95
    hover:bg-white/10
    transition-all duration-200
  "
>
  <RefreshCw className="w-4 h-4" />
</Button>
```

### 5.4 标签/特性 (Tags)

```tsx
import { cn } from "@/lib/utils";

interface TagProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Tag({ children, active, onClick, className }: TagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5",
        "rounded-full text-sm font-medium",
        "transition-all duration-200 select-none",
        "bg-white/[0.08] border border-white/[0.15]",
        "text-white/70 hover:bg-white/[0.15] hover:border-white/25",
        active && "bg-blue-500/20 border-blue-400/50 text-blue-400",
        className
      )}
    >
      {children}
    </button>
  );
}
```

### 5.5 结果展示卡片

使用 `GlassCard` 的 `accent` 变体，添加更大内边距和渐变背景：

```tsx
<GlassCard variant="accent" className="p-8">
  <div className="text-center space-y-4">
    <p className="text-sm font-medium text-white/50 tracking-wide uppercase">
      最终剩余价值
    </p>
    <p className="font-mono text-4xl font-bold text-white/95 tabular-nums">
      ¥ 1,<span className="opacity-70">234.56</span>
    </p>
    <div className="flex justify-center gap-6">
      <div className="text-center">
        <p className="text-xs text-white/50">剩余天数</p>
        <p className="font-mono text-xl font-semibold text-white/85">123 天</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-white/50">汇率</p>
        <p className="font-mono text-xl font-semibold text-white/85">7.23</p>
      </div>
    </div>
  </div>
</GlassCard>
```

**输入框组合（数值 + 单位）**:
```tsx
<div className="flex gap-2">
  <Input
    type="number"
    placeholder="请输入金额"
    className="flex-1 bg-white/[0.06] border-white/[0.12] rounded-xl"
  />
  <Select>
    <SelectTrigger className="w-24 bg-white/[0.06] border-white/[0.12] rounded-xl">
      <SelectValue placeholder="单位" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="CNY">CNY</SelectItem>
      <SelectItem value="USD">USD</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## 6. 布局规范

### 6.1 页面结构 — Tailwind 响应式网格

```tsx
{/* 页面根容器 */}
<div className="relative min-h-screen">
  {/* 背景图片 */}
  <img
    src="https://api.seaya.link/daily/"
    alt=""
    className="fixed inset-0 w-screen h-screen object-cover -z-10"
    aria-hidden="true"
  />
  {/* 暗化遮罩 */}
  <div className="fixed inset-0 bg-gradient-to-b from-black/30 to-black/50 -z-10" />

  {/* 主内容容器 */}
  <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-8">
    {/* Header */}
    <header className="flex items-center justify-between mb-8">
      {/* ... */}
    </header>

    {/* 两列布局 */}
    <main className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
      {/* 左侧：表单 */}
      <section>
        <GlassCard className="p-6">
          {/* 表单内容 */}
        </GlassCard>
      </section>

      {/* 右侧：结果面板（sticky） */}
      <aside className="lg:sticky lg:top-6">
        <GlassCard className="p-6">
          {/* 结果内容 */}
        </GlassCard>
      </aside>
    </main>

    {/* Footer */}
    <footer className="mt-12">
      {/* ... */}
    </footer>
  </div>
</div>
```

### 6.2 响应式断点

使用 Tailwind 默认断点（Mobile-first 策略）：

| 断点 | Tailwind 前缀 | 宽度 | 布局 |
|------|---------------|------|------|
| Mobile | （默认） | < 768px | 单列，表单和结果上下堆叠 |
| Tablet | `md:` | 768px+ | 两列 55/45，结果滚动跟随 |
| Desktop | `lg:` | 1024px+ | 两列 60/40，结果面板 sticky |
| Large | `xl:` | 1280px+ | 最大宽度 1200px，居中 |

```tsx
{/* 响应式网格 */}
<div className="
  grid
  grid-cols-1           /* Mobile: single column */
  md:grid-cols-2         /* Tablet: two columns 1/1 */
  lg:grid-cols-[1.2fr_0.8fr]  /* Desktop: 60/40 */
  gap-6
  items-start
">
  {/* 左侧表单 */}
  <section>{/* ... */}</section>
  {/* 右侧结果 */}
  <aside className="lg:sticky lg:top-6">{/* ... */}</aside>
</div>
```

---

## 7. 动效规范

### 7.1 原则

- **有目的的动效**: 每个动画都必须传达状态变化（如加载、成功、错误）
- **性能优先**: 仅使用 `transform` 和 `opacity`，避免触发布局重排
- **尊重用户偏好**: 使用 `motion-safe:` 和 `motion-reduce:` 前缀

### 7.2 具体动效 — Tailwind 实现

| 场景 | Tailwind 类 | 说明 |
|------|-------------|------|
| 卡片悬停 | `transition-all duration-300 ease-out hover:-translate-y-0.5` | transform + shadow |
| 按钮悬停 | `transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110` | transform + filter |
| 输入框聚焦 | `transition-all duration-200 focus:border-blue-400` | border + shadow |
| 标签切换 | `transition-all duration-150` | background + border |
| 结果数字变化 | `transition-transform duration-400` (需自定义) | 轻微放大回弹 |

### 7.3 入场动画 — 自定义 keyframes

在 `tailwind.config.ts` 中扩展动画：

```typescript
const config: Config = {
  theme: {
    extend: {
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-bounce": {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "scale-bounce": "scale-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
};
```

**使用入场动画：**

```tsx
<div
  className={cn(
    "opacity-0", // 初始隐藏
    "animate-fade-in-up",
    // Stagger delays
    "[animation-delay:100ms]",
    "[animation-delay:200ms]",
    "[animation-delay:300ms]",
  )}
>
  {/* 内容 */}
</div>

{/* 使用 motion-safe / motion-reduce */}
<div className="
  motion-safe:animate-fade-in-up
  motion-reduce:opacity-100
">
```

### 7.4 Toast 动画

```tsx
{/* Toast 使用 Tailwind + framer-motion 或纯 CSS 过渡 */}
<div className={cn(
  "fixed bottom-6 right-6 z-40",
  "transition-all duration-300 ease-out",
  "data-[state=open]:opacity-100 data-[state=open]:translate-y-0",
  "data-[state=closed]:opacity-0 data-[state=closed]:translate-y-4",
)}>
  <GlassCard className="p-4 flex items-center gap-3">
    <CheckCircle className="w-5 h-5 text-green-400" />
    <span className="text-sm text-white/85">复制成功</span>
  </GlassCard>
</div>
```

---

## 8. 图标系统

### 8.1 图标来源

使用 **Lucide React**（shadcn/ui 默认图标库）：

```bash
npm install lucide-react
```

```tsx
import { Calculator, Copy, Calendar, Server, Tag, CheckCircle, AlertCircle, RefreshCw, Sun, Moon } from "lucide-react";
```

### 8.2 图标尺寸 — Tailwind 类

| 用途 | Tailwind 类 | 实际尺寸 |
|------|-------------|----------|
| 行内文本图标 | `w-4 h-4` | `16px` (1rem) |
| 按钮图标 | `w-[18px] h-[18px]` | `18px` |
| 区块标题图标 | `w-5 h-5` | `20px` |
| 空状态/大图标 | `w-12 h-12` | `48px` |

### 8.3 关键图标映射

```tsx
// 计算
<Calculator className="w-5 h-5" />
// 复制
<Copy className="w-4 h-4" />
// 日历
<Calendar className="w-4 h-4" />
// 货币
<Banknote className="w-4 h-4" /> 或 <DollarSign className="w-4 h-4" />
// 服务器
<Server className="w-5 h-5" />
// CPU
<Cpu className="w-4 h-4" />
// 内存
<HardDrive className="w-4 h-4" />
// 网络
<Globe className="w-4 h-4" /> 或 <Wifi className="w-4 h-4" />
// 标签
<Tag className="w-4 h-4" />
// 成功
<CheckCircle className="w-5 h-5" />
// 警告
<AlertCircle className="w-5 h-5" />
// 刷新
<RefreshCw className="w-4 h-4" />
// 主题切换
<Sun className="w-5 h-5" /> / <Moon className="w-5 h-5" />
```

### 8.4 图标容器

```tsx
{/* 图标 + 文本组合 */}
<div className="flex items-center gap-2">
  <Server className="w-4 h-4 text-white/70" />
  <span className="text-sm text-white/70">Provider Name</span>
</div>

{/* 纯图标按钮 */}
<Button size="icon" variant="ghost" className="w-9 h-9 rounded-lg text-white/70 hover:text-white/95 hover:bg-white/10">
  <RefreshCw className="w-4 h-4" />
</Button>
```

---

## 9. 表单设计规范

### 9.1 输入框分组

```tsx
<fieldset className="space-y-4 border-0 p-0 m-0">
  <legend className="text-lg font-semibold text-white/95 mb-4">
    VPS 基本信息
  </legend>

  {/* 表单项 */}
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-white/70">
      提供商 <span className="text-red-400">*</span>
    </label>
    <Input
      className="bg-white/[0.06] border-white/[0.12] rounded-xl text-white/95"
      placeholder="例如: HostDare"
      required
    />
  </div>

  {/* 分割线 */}
  <hr className="border-white/[0.08] my-6" />

  <div className="space-y-1.5">
    <label className="text-sm font-medium text-white/70">
      月付金额 <span className="text-red-400">*</span>
    </label>
    <Input
      type="number"
      className="bg-white/[0.06] border-white/[0.12] rounded-xl text-white/95"
      placeholder="0.00"
    />
  </div>
</fieldset>
```

### 9.2 输入框组合（数值 + 单位）

```tsx
<div className="flex gap-2">
  <div className="flex-1 space-y-1.5">
    <label className="text-sm font-medium text-white/70">月付金额</label>
    <Input
      type="number"
      className="bg-white/[0.06] border-white/[0.12] rounded-xl text-white/95"
      placeholder="0.00"
    />
  </div>
  <div className="w-24 space-y-1.5">
    <label className="text-sm font-medium text-white/70">货币</label>
    <Select>
      <SelectTrigger className="bg-white/[0.06] border-white/[0.12] rounded-xl text-white/95">
        <SelectValue placeholder="CNY" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="CNY">CNY</SelectItem>
        <SelectItem value="USD">USD</SelectItem>
        <SelectItem value="EUR">EUR</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

### 9.3 错误状态

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium text-white/70">月付金额</label>
  <Input
    className="
      bg-white/[0.06] rounded-xl
      border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.2)]
    "
    aria-invalid="true"
    defaultValue="-100"
  />
  <p className="flex items-center gap-1 mt-1 text-xs text-red-400">
    <AlertCircle className="w-3.5 h-3.5" />
    金额不能为负数
  </p>
</div>
```

---

## 10. 特殊组件

### 10.1 汇率显示组件

```tsx
<GlassCard variant="subtle" className="p-4">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <RefreshCw className="w-4 h-4 text-blue-400" />
      <span className="text-sm font-medium text-white/70">汇率信息</span>
    </div>
    <Button
      size="icon"
      variant="ghost"
      className="w-8 h-8 rounded-lg text-white/50 hover:text-white/70"
    >
      <RefreshCw className="w-3.5 h-3.5" />
    </Button>
  </div>
  <p className="font-mono text-base text-white/95">
    1 USD = <span className="font-semibold">7.2345</span> CNY
  </p>
  <p className="text-xs text-white/50 mt-1">
    更新时间: 2026-05-29 10:30 | 来源: open.er-api
  </p>
</GlassCard>
```

**失败状态**:
```tsx
<GlassCard variant="subtle" className="p-4 border-yellow-400/30">
  <div className="flex items-center gap-2 mb-1">
    <AlertCircle className="w-4 h-4 text-yellow-400" />
    <span className="text-sm font-medium text-yellow-400">汇率获取失败</span>
  </div>
  <p className="text-sm text-white/70">
    使用默认汇率 (USD/CNY: 7.20)
  </p>
  <Button
    variant="ghost"
    className="mt-2 text-xs text-blue-400 hover:text-blue-300 h-auto p-0"
  >
    <RefreshCw className="w-3 h-3 mr-1" />
    重试
  </Button>
</GlassCard>
```

### 10.2 溢价/折价输入组件

```tsx
<GlassCard className="p-6">
  <div className="flex items-center gap-2 mb-4">
    <Banknote className="w-5 h-5 text-blue-400" />
    <h3 className="text-lg font-semibold text-white/95">溢价/折价金额</h3>
  </div>

  <div className="space-y-1.5">
    <label className="text-sm text-white/50">
      请输入金额（正数为溢价，负数为折价）
    </label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">¥</span>
      <Input
        type="number"
        step="0.01"
        className="
          pl-8 bg-white/[0.06] border-white/[0.12] rounded-xl
          text-white/95 text-lg font-mono
          focus:border-gradient-to-r focus:from-blue-400 focus:to-purple-400
        "
        placeholder="0.00"
      />
    </div>
    <p className={cn(
      "text-xs flex items-center gap-1",
      premium > 0 ? "text-green-400" : "text-yellow-400"
    )}>
      <Tag className="w-3 h-3" />
      {premium > 0
        ? `当前为溢价，将在剩余价值基础上增加 ¥${premium.toFixed(2)}`
        : `当前为折价，将在剩余价值基础上减去 ¥${Math.abs(premium).toFixed(2)}`
      }
    </p>
  </div>
</GlassCard>
```

### 10.3 结果导出组件

```tsx
<div className="flex gap-3">
  {/* 导出 Markdown */}
  <Button className="flex-1 bg-white/10 border border-white/20 text-white/95 rounded-xl hover:bg-white/[0.15]">
    <FileText className="w-4 h-4 mr-2" />
    导出为 Markdown
  </Button>

  {/* 导出图片（带下拉菜单） */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="flex-1 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl">
        <Image className="w-4 h-4 mr-2" />
        导出为图片
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="bg-gray-900/90 backdrop-blur-xl border-white/10 rounded-xl">
      <DropdownMenuItem className="text-white/85 hover:bg-white/10 cursor-pointer">
        <Download className="w-4 h-4 mr-2" />
        下载为 PNG
      </DropdownMenuItem>
      <DropdownMenuItem className="text-white/85 hover:bg-white/10 cursor-pointer">
        <Clipboard className="w-4 h-4 mr-2" />
        复制图片
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**图片导出规格**：
- 格式：PNG（默认）或 JPEG
- 质量：0.92（JPEG）
- 尺寸：根据容器实际尺寸，保持 2x 高清
- 背景：包含当前玻璃卡片背景和毛玻璃效果
- 使用 `html-to-image` 或 `dom-to-image` 库

### 10.4 交易帖预览组件

```tsx
<GlassCard className="p-6">
  <div className="flex items-center gap-2 mb-4">
    <FileText className="w-5 h-5 text-blue-400" />
    <h3 className="text-lg font-semibold text-white/95">交易帖预览</h3>
  </div>

  {/* 预览区域 */}
  <pre className="
    bg-black/20 rounded-xl p-4
    font-mono text-sm text-white/85
    whitespace-pre-wrap
    border border-white/5
    mb-4
  ">
{`[出售] HostDare - CN2 GIA
CPU: 1核 | 内存: 1GB | 硬盘: 20GB SSD
流量: 1TB/月 | 带宽: 1Gbps
到期时间: 2026-12-29
剩余天数: 215天
售价: ¥500.00`}
  </pre>

  {/* 操作按钮 */}
  <div className="flex gap-3">
    <Button className="flex-1 bg-white/10 border border-white/20 text-white/95 rounded-xl hover:bg-white/[0.15]">
      <Copy className="w-4 h-4 mr-2" />
      复制纯文本
    </Button>
    <Button className="flex-1 bg-white/10 border border-white/20 text-white/95 rounded-xl hover:bg-white/[0.15]">
      <Code className="w-4 h-4 mr-2" />
      复制 Markdown
    </Button>
  </div>
</GlassCard>
```

### 10.5 日期选择器

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium text-white/70">
    到期日期 <span className="text-red-400">*</span>
  </label>
  <Input
    type="date"
    className="
      bg-white/[0.06] border-white/[0.12] rounded-xl
      text-white/95
      [color-scheme:dark]
      focus:border-blue-400
      transition-all duration-200
    "
  />
  <p className="text-xs text-white/50 flex items-center gap-1">
    <Calendar className="w-3 h-3" />
    剩余 <span className="font-semibold text-white/70">123</span> 天
  </p>
</div>
```

---

## 11. 空状态与异常状态

### 11.1 无输入时的结果面板

```tsx
<GlassCard className="p-8 text-center">
  <div className="flex flex-col items-center gap-4">
    <Calculator className="w-12 h-12 text-white/30" />
    <div>
      <p className="text-lg font-medium text-white/50">价值分析</p>
      <p className="text-sm text-white/30 mt-1">
        输入 VPS 信息后开始计算
      </p>
      <p className="text-sm text-white/30">
        剩余价值将显示在这里
      </p>
    </div>
  </div>
</GlassCard>
```

### 11.2 汇率获取失败

```tsx
<GlassCard className="p-4 border-yellow-400/30 bg-yellow-500/5">
  <div className="flex items-center gap-3">
    <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium text-yellow-400">汇率获取失败</p>
      <p className="text-xs text-white/50 mt-0.5">
        使用默认汇率 (USD/CNY: 7.20)
      </p>
    </div>
    <Button
      size="sm"
      variant="ghost"
      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
    >
      <RefreshCw className="w-3.5 h-3.5 mr-1" />
      重试
    </Button>
  </div>
</GlassCard>
```

---

## 12. Z-Index 层级管理

使用 Tailwind 的 z-index 工具类：

| 层级 | Tailwind 类 | 用途 |
|------|-------------|------|
| 背景 | `-z-10` | 背景图片 |
| 常规内容 | `z-10` | 常规内容 |
| Sticky 面板 | `z-20` | sticky 面板 |
| 下拉菜单 | `z-30` | 下拉菜单（shadcn/ui Popover/Select 默认） |
| 模态框 | `z-40` | 模态框 |
| Toast | `z-50` | Toast 通知 |
| 工具提示 | `z-60` | 工具提示 |

---

## 13. shadcn/ui 组件自定义指南

### 13.1 全局样式覆盖

shadcn/ui 组件的默认样式在 `src/index.css` 中通过 CSS 变量定义：

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ...其他暗色变量 */
  }
}
```

### 13.2 `cn()` 工具函数

`src/lib/utils.ts` 中的 `cn()` 函数是条件类名合并的核心工具：

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**使用场景**：
```tsx
// 条件类名合并
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "accent" && "accent-class",
  className // 外部传入的自定义类
)}>
```

---

## 14. 设计校验清单

在交付任何 UI 代码前，确认以下项目：

- [ ] 所有文本在背景图上可读（对比度 ≥ 4.5:1）
- [ ] 玻璃效果在 Safari 中正常（`backdrop-blur-xl` + `-webkit-backdrop-filter`）
- [ ] 移动端触摸目标 ≥ 44×44px（使用 Tailwind 的 `min-h-[44px] min-w-[44px]`）
- [ ] 支持 `prefers-reduced-motion`（使用 `motion-safe:` / `motion-reduce:` 前缀）
- [ ] 所有图标使用 Lucide React 组件（无 emoji）
- [ ] 字体加载有 fallback（`font-display: swap`）
- [ ] 无水平滚动条（移动端）
- [ ] 深色/浅色主题切换正常
- [ ] 焦点状态可见（键盘导航），使用 `focus-visible:` 前缀
- [ ] `npm run build` 生产构建无报错
- [ ] `npx tsc --noEmit` 类型检查通过

---

> **Agent 注意**: 设计是活的规范。如果实现中发现设计不可行（如性能问题、浏览器兼容性），记录原因并提议修改，不要擅自偏离而不留痕。
