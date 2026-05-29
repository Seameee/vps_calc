# DESIGN.md - VPS 剩余价值计算器 设计规范

> 本文档定义本项目的完整视觉设计系统、交互规范与响应式策略。所有 UI 实现必须严格遵循本文档。

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

### 2.1 主题模式

本项目采用**自适应双主题**：基于背景图的亮度自动切换（或提供手动切换）。

#### 暗色主题（默认）

用于大多数背景图（暗调风景、夜景等）：

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-primary` | `rgba(10, 10, 20, 0.65)` | 主要卡片背景 |
| `--bg-secondary` | `rgba(20, 20, 35, 0.50)` | 次要面板背景 |
| `--bg-tertiary` | `rgba(255, 255, 255, 0.08)` | 输入框、标签背景 |
| `--text-primary` | `rgba(255, 255, 255, 0.95)` | 主标题、重要数据 |
| `--text-secondary` | `rgba(255, 255, 255, 0.70)` | 正文、标签 |
| `--text-tertiary` | `rgba(255, 255, 255, 0.50)` | 辅助说明、占位符 |
| `--border-subtle` | `rgba(255, 255, 255, 0.12)` | 卡片边框 |
| `--border-focus` | `rgba(255, 255, 255, 0.35)` | 聚焦状态边框 |
| `--accent-primary` | `#60a5fa` | 主强调色（蓝）|
| `--accent-secondary` | `#a78bfa` | 次强调色（紫）|
| `--accent-gradient` | `linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)` | 渐变强调 |
| `--success` | `#34d399` | 成功状态 |
| `--warning` | `#fbbf24` | 警告状态 |
| `--error` | `#f87171` | 错误状态 |

#### 亮色主题（备用）

用于极少数亮调背景图：

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-primary` | `rgba(255, 255, 255, 0.75)` | 主要卡片背景 |
| `--bg-secondary` | `rgba(245, 245, 250, 0.65)` | 次要面板背景 |
| `--text-primary` | `rgba(15, 23, 42, 0.95)` | 主标题 |
| `--text-secondary` | `rgba(51, 65, 85, 0.85)` | 正文 |
| `--border-subtle` | `rgba(15, 23, 42, 0.10)` | 边框 |
| `--accent-primary` | `#3b82f6` | 主强调色 |

### 2.2 背景处理策略

**全局背景**:
- 图片来源: `https://api.seaya.link/daily/`
- 覆盖方式: `object-fit: cover; width: 100vw; height: 100vh; position: fixed;`
- 暗化遮罩（暗色主题）: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))` 叠加在图片上
- 模糊层: `backdrop-filter: blur(20px) saturate(180%)` 应用于 UI 容器

**卡片背景**:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

---

## 3. 字体系统

### 3.1 字体栈

```css
:root {
  --font-sans: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
}
```

**加载策略**:
- Inter: Google Fonts CDN (`https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap`)
- Noto Sans SC: Google Fonts CDN (`https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap`)
- 使用 `font-display: swap` 避免 FOIT

### 3.2 字号规范

基于 16px 根字号 (`html { font-size: 16px; }`)：

| 层级 | 大小 | 字重 | 行高 | 字间距 | 用途 |
|------|------|------|------|--------|------|
| Display | `2.5rem` (40px) | 700 | 1.2 | -0.02em | 页面主标题 |
| H1 | `2rem` (32px) | 700 | 1.3 | -0.01em | 区块标题 |
| H2 | `1.5rem` (24px) | 600 | 1.4 | 0 | 卡片标题 |
| H3 | `1.25rem` (20px) | 600 | 1.5 | 0 | 子区块标题 |
| Body | `1rem` (16px) | 400 | 1.75 | 0 | 正文 |
| Body Small | `0.875rem` (14px) | 400 | 1.6 | 0 | 次要文本 |
| Caption | `0.75rem` (12px) | 500 | 1.5 | 0.01em | 标签、辅助说明 |
| Data Large | `2rem` (32px) | 700 | 1.2 | -0.02em | 核心计算结果（如最终价值）|
| Data Medium | `1.5rem` (24px) | 600 | 1.3 | -0.01em | 次级结果（如剩余天数）|

### 3.3 数字显示规范

- 金额数字使用 `font-variant-numeric: tabular-nums;` 保证对齐
- 货币符号使用 `0.875rem` 大小，与数字基线对齐
- 小数部分使用 `opacity: 0.7` 弱化显示（如 ¥123.**45**）

---

## 4. 间距系统

### 4.1 基础单位

以 `4px` 为基础单位，使用 8 点网格系统：

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 4.2 组件间距

| 场景 | 值 | 说明 |
|------|-----|------|
| 页面内边距 | `24px` (移动端) / `48px` (桌面端) | 主容器与视口边缘 |
| 卡片内边距 | `24px` | 玻璃卡片内部 |
| 卡片间距 | `24px` | 相邻卡片之间 |
| 表单字段间距 | `16px` | 表单项之间 |
| 标签与输入框 | `6px` | `<label>` 与 `<input>` 之间 |
| 按钮内边距 | `12px 24px` | 标准按钮 |
| 图标与文本 | `8px` | 行内图标与文字之间 |

---

## 5. 组件规范

### 5.1 玻璃卡片 (Glass Card)

**基础样式**:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.15),
    0 10px 10px -5px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

**变体**:
- `.glass-card--accent`: 边框使用 `--accent-gradient`，用于结果展示卡片
- `.glass-card--subtle`: 背景透明度降低到 `0.03`，用于次要信息

### 5.2 输入框 (Glass Input)

```css
.glass-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.5;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.glass-input::placeholder {
  color: var(--text-tertiary);
}

.glass-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.10);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}
```

### 5.3 按钮

**主按钮 (Primary)**:
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
  box-shadow: 0 4px 6px -1px rgba(96, 165, 250, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(96, 165, 250, 0.4);
  filter: brightness(1.1);
}

.btn-primary:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}
```

**次按钮 (Secondary)**:
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}
```

### 5.4 标签/特性 (Tags)

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.tag:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}

.tag--active {
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.5);
  color: var(--accent-primary);
}
```

### 5.5 结果展示卡片

核心计算结果使用**强调卡片**：
- 更大的内边距 (`32px`)
- 渐变边框或发光效果
- 金额数字使用 `Data Large` 字号
- 背景添加微妙的渐变：`linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(167, 139, 250, 0.1))`

---

## 6. 布局规范

### 6.1 页面结构

```
+--------------------------------------------------+
|  Background Image (fixed, full viewport)          |
|  +--------------------------------------------+   |
|  |  Header (logo + theme toggle)              |   |
|  +--------------------------------------------+   |
|  |                                            |   |
|  |  +------------------+  +----------------+  |   |
|  |  |  Input Form      |  |  Results Panel |  |   |
|  |  |  (glass card)    |  |  (sticky)      |  |   |
|  |  +------------------+  +----------------+  |   |
|  |                                            |   |
|  +--------------------------------------------+   |
|  |  Footer                                    |   |
|  +--------------------------------------------+   |
+--------------------------------------------------+
```

### 6.2 响应式断点

| 断点 | 宽度 | 布局 |
|------|------|------|
| Mobile | < 768px | 单列，表单和结果上下堆叠 |
| Tablet | 768px - 1023px | 两列 55/45，结果仍随页面滚动 |
| Desktop | 1024px+ | 两列 60/40，结果面板 sticky |
| Large | 1280px+ | 最大宽度 1200px，居中 |

### 6.3 网格系统

使用 CSS Grid：
```css
.app-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 1024px) {
  .app-layout {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: start;
  }
  
  .results-panel {
    position: sticky;
    top: 24px;
  }
}
```

---

## 7. 动效规范

### 7.1 原则

- **有目的的动效**: 每个动画都必须传达状态变化（如加载、成功、错误）
- **性能优先**: 仅使用 `transform` 和 `opacity`，避免触发布局重排
- **尊重用户偏好**: 支持 `prefers-reduced-motion`，动画减弱或关闭

### 7.2 具体动效

| 场景 | 时长 | 缓动 | 属性 |
|------|------|------|------|
| 卡片悬停 | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform`, `box-shadow` |
| 按钮悬停 | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `transform`, `filter` |
| 输入框聚焦 | 200ms | ease-out | `border-color`, `box-shadow` |
| 标签切换 | 150ms | ease-in-out | `background`, `border-color` |
| 结果数字变化 | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `transform` (轻微放大回弹) |
| 页面加载入场 | 600ms | `cubic-bezier(0.4, 0, 0.2, 1)` | `opacity`, `translateY` |
| Toast 出现 | 300ms | ease-out | `opacity`, `translateY` |
| Toast 消失 | 200ms | ease-in | `opacity` |

### 7.3 入场动画序列

页面加载时的 stagger 入场：
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Stagger delays */
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
```

---

## 8. 图标系统

### 8.1 图标来源

使用 **Lucide Icons**（轻量、现代、线条风格统一）：
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```

或**内联 SVG**（推荐，零外部依赖）。

### 8.2 图标尺寸

| 用途 | 尺寸 |
|------|------|
| 行内文本图标 | `16px` (`1rem`) |
| 按钮图标 | `18px` |
| 区块标题图标 | `20px` |
| 空状态/大图标 | `48px` |

### 8.3 关键图标映射

| 功能 | 图标名 | SVG viewBox |
|------|--------|-------------|
| 计算 | `calculator` | `0 0 24 24` |
| 复制 | `copy` | `0 0 24 24` |
| 日历 | `calendar` | `0 0 24 24` |
| 货币 | `banknote` / `dollar-sign` | `0 0 24 24` |
| 服务器 | `server` | `0 0 24 24` |
| CPU | `cpu` | `0 0 24 24` |
| 内存 | `hard-drive` | `0 0 24 24` |
| 网络 | `globe` / `wifi` | `0 0 24 24` |
| 标签 | `tag` | `0 0 24 24` |
| 成功 | `check-circle` | `0 0 24 24` |
| 警告 | `alert-circle` | `0 0 24 24` |
| 刷新 | `refresh-cw` | `0 0 24 24` |
| 主题切换 | `sun` / `moon` | `0 0 24 24` |

---

## 9. 表单设计规范

### 9.1 输入框分组

- 使用 `<fieldset>` + `<legend>` 语义化分组
- 每组之间用 `24px` 间距 + 可选的分割线（`1px solid rgba(255,255,255,0.08)`）
- 必填字段标记红色星号 `*`（`color: var(--error)`）

### 9.2 输入框组合

数值 + 单位的组合输入：
```
+------------------+--------+  
| 数值输入框       | 单位  |  
| (flex: 1)        | 选择  |  
+------------------+--------+  
```

### 9.3 错误状态

```css
.glass-input--error {
  border-color: var(--error);
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.2);
}

.error-message {
  color: var(--error);
  font-size: 0.75rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

---

## 10. 特殊组件

### 10.1 汇率显示组件

```
+------------------------------------------+
|  💱 汇率信息                              |
|  1 USD = 7.23 CNY                         |
|  更新时间: 2026-05-29 10:30              |
|  [刷新图标] 手动刷新 | 来源: open.er-api  |
+------------------------------------------+
```

- 使用小型玻璃卡片
- 汇率数字使用等宽字体 `--font-mono`
- 刷新按钮带旋转动画
- 失败状态显示黄色警告图标 + "使用缓存汇率"

### 10.2 溢价/折价输入组件

```
+------------------------------------------+
|  💰 溢价/折价金额                         |
|  +------------------------------------+  |
|  |  请输入金额（正数为溢价，负数为折价）|  |
|  |  +------------------------------+  |  |
|  |  | ¥ -500.00                  |  |  |
|  |  +------------------------------+  |  |
|  +------------------------------------+  |
|  当前为折价，将在剩余价值基础上减去 ¥500.00 |
+------------------------------------------+
```

- 输入框接受正数（溢价）或负数（折价）
- 实时显示当前为"溢价"还是"折价"提示
- 金额显示格式化（千分位 + 两位小数）
- 聚焦时边框使用强调色渐变

### 10.3 结果导出组件

**导出按钮组**：
```
+------------------------------------------+
|  [导出为 Markdown]  [导出为图片 ↓]        |
+------------------------------------------+
```

**导出为图片下拉菜单**：
```
+------------------+
|  📥 下载为 PNG   |
|  📋 复制图片     |
+------------------+
```

- 导出 Markdown：生成 `.md` 文件并触发下载
- 导出图片：使用 html2canvas 或 dom-to-image 将结果面板转为图片
- 复制到剪贴板：使用 `navigator.clipboard.write([ClipboardItem])` API
- 导出前显示加载动画（旋转的加载图标）
- 成功/失败显示 Toast 通知

**图片导出规格**：
- 格式：PNG（默认）或 JPEG
- 质量：0.92（JPEG）
- 尺寸：根据容器实际尺寸，保持 2x 高清
- 背景：包含当前玻璃卡片背景和毛玻璃效果

### 10.4 交易帖预览组件

```
+------------------------------------------+
|  📋 交易帖预览                            |
|  +------------------------------------+  |
|  | [出售] Provider - Model             |  |
|  | 基本配置: ...                       |  |
|  | ...                                 |  |
|  | 售价: ¥1,234.56                     |  |
|  +------------------------------------+  |
|  [复制纯文本]  [复制 Markdown]          |
+------------------------------------------+
```

- 预览区域使用等宽字体 + 略暗背景 (`rgba(0,0,0,0.2)`) 模拟代码块
- 复制成功时按钮变为绿色 + 勾选图标，2 秒后恢复

### 10.5 日期选择器

- 优先使用原生 `<input type="date">`（移动端体验好）
- 自定义样式匹配 glass 主题
- 显示"剩余 X 天"的实时提示
- 日期格式统一为 `YYYY-MM-DD`

---

## 11. 空状态与异常状态

### 11.1 无输入时的结果面板

```
+------------------------------------------+
|  💡 价值分析                              |
|                                          |
|  [计算器图标]                            |
|  输入 VPS 信息后开始计算                  |
|  剩余价值将显示在这里                     |
|                                          |
+------------------------------------------+
```

- 居中布局，大图标 (`48px`)
- 文字使用 `--text-tertiary`
- 轻微浮动动画吸引注意力

### 11.2 汇率获取失败

```
+------------------------------------------+
|  ⚠️ 汇率获取失败                          |
|  使用默认汇率 (USD/CNY: 7.20)            |
|  [重试按钮]                              |
+------------------------------------------+
```

- 黄色边框 + 图标
- 提供手动刷新按钮
- 不影响核心计算功能

---

## 12. Z-Index 层级管理

```css
:root {
  --z-background: -1;    /* 背景图片 */
  --z-content: 1;        /* 常规内容 */
  --z-sticky: 10;        /* sticky 面板 */
  --z-dropdown: 20;      /* 下拉菜单 */
  --z-modal: 30;         /* 模态框 */
  --z-toast: 40;         /* Toast 通知 */
  --z-tooltip: 50;       /* 工具提示 */
}
```

---

## 13. 设计校验清单

在交付任何 UI 代码前，确认以下项目：

- [ ] 所有文本在背景图上可读（对比度 ≥ 4.5:1）
- [ ] 玻璃效果在 Safari 中正常（`-webkit-backdrop-filter`）
- [ ] 移动端触摸目标 ≥ 44×44px
- [ ] 支持 `prefers-reduced-motion`
- [ ] 所有图标使用 SVG（无 emoji）
- [ ] 字体加载有 fallback（`font-display: swap`）
- [ ] 无水平滚动条（移动端）
- [ ] 深色/浅色主题切换正常
- [ ] 焦点状态可见（键盘导航）

---

> **Agent 注意**: 设计是活的规范。如果实现中发现设计不可行（如性能问题、浏览器兼容性），记录原因并提议修改，不要擅自偏离而不留痕。
