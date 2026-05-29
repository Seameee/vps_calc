# AGENTS.md - VPS 剩余价值计算器

> 本文档指导所有 AI Agent 在参与本项目开发时应遵循的工作规范、决策路径与质量标准。

---

## 1. 项目概述

**项目名称**: VPS 剩余价值计算器 (VPS Value Calculator)
**目标**: 构建一个单页静态 Web 应用，用于精确计算 VPS 订阅的剩余价值，支持闰年/闰月时间计算、实时汇率获取，并生成标准化交易帖。
**技术栈**: React 18 + Vite + Tailwind CSS + shadcn/ui + TypeScript，零后端依赖。
**设计风格**: Glassmorphism（毛玻璃）+ 高斯模糊背景 + 深色主题。

---

## 2. 核心需求（不可妥协）

| 优先级 | 需求 | 说明 |
|--------|------|------|
| P0 | 闰年闰月精确时间计算 | 剩余天数计算必须考虑实际日历天数，不能简单按 30 或 365 天估算 |
| P0 | 汇率网络实时获取 | 从公开 API 获取实时汇率，支持 CNY/USD/EUR/GBP/JPY |
| P0 | 界面美观大气 | 使用 Glassmorphism 风格，高斯模糊背景，设计细节丰富但不多余 |
| P1 | 交易帖生成 | 自动生成并支持复制 Markdown / 纯文本格式的交易帖 |
| P1 | 溢价/折价计算 | 用户可手动填写溢价（正数）或折价（负数）金额，汇总到最终价值 |
| P1 | 结果导出 | 支持将 VPS 信息、计算过程和结果导出为 Markdown 文本或图片（PNG/JPG），图片可下载到文件或复制到剪贴板 |
| P1 | 响应式布局 | 完美适配移动端、平板、桌面端 |
| P2 | 离线可用 | 汇率获取失败时使用缓存或默认值，核心计算功能不依赖网络 |

---

## 3. 架构约束

1. **React 18 + TypeScript**: 使用 React 18 函数式组件 + Hooks，TypeScript 严格模式。禁止使用类组件。
2. **Vite 构建工具**: 使用 Vite 作为构建工具，开发服务器支持 HMR，生产构建输出到 `dist/` 目录。
3. **shadcn/ui 组件库**: 使用 shadcn/ui 作为 UI 组件库（基于 Radix UI + Tailwind CSS），禁止引入其他 UI 框架（Ant Design、MUI 等）。
4. **Tailwind CSS**: 使用 Tailwind CSS 进行样式管理，禁止全局 CSS 文件代替组件级样式。
5. **外部资源限制**:
   - 图标: 使用 `lucide-react`（shadcn/ui 默认图标库）
   - 字体: 使用 Google Fonts（Inter + Noto Sans SC）
   - 背景图片源: `https://api.seaya.link/daily/`（每日一图 API）
   - 汇率 API: 使用免费的公开 API（如 exchangerate-api.com、open.er-api.com 等）
6. **浏览器支持**: 支持 Chrome 90+, Firefox 88+, Safari 14+, Edge 90+。

---

## 4. 代码规范

### 4.1 TypeScript / React

- **严格模式**: `tsconfig.json` 中启用 `strict: true`，禁止使用 `any` 类型
- **React 组件**:
  - 函数式组件 + Hooks，禁止类组件
  - 组件名使用 `PascalCase`，文件名也使用 `PascalCase`（如 `ValueCalculator.tsx`）
  - 自定义 Hooks 使用 `use*` 前缀（如 `useExchangeRate`, `useLeapYear`）
  - Props 接口使用 `ComponentNameProps` 命名模式
- **命名规范**:
  - 常量: `UPPER_SNAKE_CASE`
  - 变量/函数: `camelCase`
  - 类型/接口: `PascalCase`
  - 枚举: `PascalCase`，枚举值使用 `UPPER_SNAKE_CASE`
  - 私有方法/属性: `_leadingUnderscore`
- **注释**: 复杂算法（如闰年计算、汇率转换）必须有 JSDoc / TSDoc 注释
- **禁止**:
  - `any` 类型（使用 `unknown` 代替）
  - `var`（使用 `let` / `const`）
  - `==`（必须使用 `===` / `!==`）
  - `eval()` 和 `new Function()`
  - 直接操作 DOM 的 `document.getElementById` 等（使用 React ref）
  - `innerHTML`（使用 React `dangerouslySetInnerHTML` 仅当绝对必要）

### 4.2 Tailwind CSS

- **工具类优先**: 使用 Tailwind 工具类直接编写样式，避免编写自定义 CSS
- **@apply 限制**: 仅在组件频繁复用相同工具类组合时使用 `@apply`，且仅限 `index.css` 或组件级 CSS 文件
- **自定义变量**: 使用 `tailwind.config.ts` 中的 `theme.extend` 定义项目级颜色、间距、阴影等设计 Token
- **单位**: 遵循 Tailwind 默认单位体系（`rem` 基础），无需手动指定
- **响应式**: 使用 Tailwind 断点（`sm:`, `md:`, `lg:`, `xl:`），Mobile-first 策略
- **颜色**: 使用 Tailwind 颜色变量和 CSS 自定义属性配合 shadcn/ui 的 `cn()` 工具函数
- **禁止**:
  - BEM 命名方法（使用 Tailwind 工具类代替）
  - 在全局 CSS 中定义大量组件级样式
  - 使用 `!important`（除非 Tailwind 优先级冲突无法解决）

### 4.3 shadcn/ui

- **组件安装**: 使用 `npx shadcn-ui@latest add <component-name>` 安装组件
- **组件定制**: 安装后的组件源码在 `src/components/ui/` 目录下，可直接修改定制
- **主题**: 通过 `src/lib/utils.ts` 中的 `cn()` 函数和 `tailwind.config.ts` 中的 CSS 变量定制主题
- **使用原则**: 优先使用 shadcn/ui 现有组件（Button, Input, Card, Select, Dialog 等），不重复造轮子
- **新增组件**: 引入新的 shadcn/ui 组件需记录理由（见决策权限矩阵）

### 4.4 HTML / A11y

- **语义化**: 使用正确的 HTML5 语义标签（`header`, `main`, `section`, `footer`, `label`, `time` 等）
- **可访问性 (A11y)**:
  - 所有表单输入必须有关联的 `<label>` 或通过 `aria-label` 说明
  - 颜色对比度 ≥ 4.5:1（使用玻璃态时需特别注意文字可读性）
  - 支持键盘导航，交互元素可通过 Tab 键访问
  - 图片必须有 `alt` 文本
  - 使用 Radix UI 原生的无障碍支持（shadcn/ui 基于 Radix UI）
- **语言属性**: `<html lang="zh-CN">`

---

## 5. 项目结构

采用标准 React + Vite + TypeScript 项目结构：

```
vps_calc/
├── index.html                  # Vite 入口 HTML
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置（strict: true）
├── tsconfig.node.json          # Node 端 TypeScript 配置
├── tailwind.config.ts          # Tailwind CSS 配置（主题扩展）
├── postcss.config.js           # PostCSS 配置（Tailwind + Autoprefixer）
├── package.json                # 依赖管理
├── public/
│   └── favicon.ico
└── src/
    ├── main.tsx                # React 应用入口
    ├── App.tsx                 # 根组件（路由/布局）
    ├── index.css               # Tailwind 指令 + 全局样式
    ├── lib/
    │   └── utils.ts            # cn() 工具函数 + 其他工具
    ├── components/
    │   ├── ui/                 # shadcn/ui 组件（通过 CLI 安装）
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   └── ...
    │   ├── layout/             # 布局组件（Header, Footer, Background 等）
    │   ├── calculator/         # 计算器相关组件（DateInput, PriceInput 等）
    │   └── trade-post/         # 交易帖相关组件（PostPreview, PostCopy 等）
    ├── hooks/                  # 自定义 Hooks
    │   ├── useExchangeRate.ts  # 汇率获取 Hook
    │   ├── useLeapYear.ts      # 闰年计算 Hook
    │   └── useExport.ts        # 导出功能 Hook
    ├── types/                  # TypeScript 类型定义
    │   ├── index.ts            # 核心类型（VpsInfo, ExchangeRate 等）
    │   └── calculator.ts       # 计算相关类型
    └── utils/                  # 纯工具函数
        ├── date.ts             # 日期/闰年计算
        ├── currency.ts         # 汇率/货币转换
        └── export.ts           # 导出（Markdown / 图片）
```

### 目录规范

- `src/components/ui/` — 存放 shadcn/ui CLI 生成的组件，可直接修改源码定制样式
- `src/components/layout/` — 应用级布局组件（背景、导航、页脚）
- `src/components/calculator/` — 与 VPS 计算相关的业务组件
- `src/components/trade-post/` — 与交易帖生成/展示相关的组件
- `src/hooks/` — 自定义 React Hooks，每个文件一个 Hook
- `src/types/` — TypeScript 类型定义，按模块拆分
- `src/utils/` — 纯函数工具，不依赖 React
- `src/lib/` — 库配置/工具（如 `utils.ts` 中的 `cn()`）

---

## 6. 设计系统参考

> 详细设计规范见 `DESIGN.md`

**核心风格**: Glassmorphism（毛玻璃效果）
- 背景: 使用 `https://api.seaya.link/daily/` 获取每日图片，全屏覆盖
- 背景处理: `backdrop-filter: blur(20px)` + `background: rgba(255,255,255,0.05-0.15)`
- 边框: 1px solid `rgba(255,255,255,0.1-0.2)`
- 阴影: 柔和的环境光阴影 `box-shadow: 0 8px 32px rgba(0,0,0,0.3)`
- 圆角: 大圆角 `16px-28px`
- 字体: 无衬线现代字体（Inter / Noto Sans SC）
- 动画: 微交互 150-300ms，使用 `cubic-bezier(0.4, 0, 0.2, 1)`

---

## 7. 安全规范

> 详细安全规范见 `SECURITY_AUDIT.md`

- **CSP (Content Security Policy)**: 实施严格的 CSP 策略，只允许来自指定 CDN 和 API 的资源加载
- **XSS 防护**: 使用 React 默认的 JSX 转义机制；所有用户输入自动转义
- **API 安全**: 汇率 API 调用使用 `fetch`，处理所有网络错误和超时
- **HTTPS**: 所有外部资源（背景图片、API、CDN）必须通过 HTTPS 加载

---

## 8. AI Agent 工作流

### 8.1 开发前

1. **阅读所有相关文档**: 在开始任何修改前，阅读 `AGENTS.md`, `DESIGN.md`, `ARCHITECTURE.md`, `API.md`, `SECURITY_AUDIT.md`
2. **理解上下文**: 明确当前修改的范围，不引入范围外的依赖或功能
3. **检查现有代码**: 遵循已有的代码风格，保持命名和模式的一致性

### 8.2 开发中

1. **最小变更原则**: 每次修改只做一件事，不附带无关的重构
2. **优先原生 API**: 能用原生实现就不引入额外依赖；必须引入时记录理由
3. **实时验证**: 每次修改后，在浏览器中验证视觉效果和功能正确性
4. **注释决策**: 如果代码看起来"反直觉"，必须添加注释解释原因

### 8.3 开发后

1. **自测清单**:
   - [ ] 在 Chrome DevTools 的移动端视图中测试响应式
   - [ ] 验证键盘可访问性（Tab 导航）
   - [ ] 检查颜色对比度
   - [ ] 测试汇率获取失败时的降级表现
   - [ ] 验证闰年日期计算（如 2024-02-29 到 2025-02-28）
   - [ ] 测试溢价/折价金额是否正确汇总到最终价值
   - [ ] 测试交易帖复制功能
   - [ ] 测试导出 Markdown 文本功能
   - [ ] 测试导出图片功能（下载文件 + 复制到剪贴板）
   - [ ] 运行 `npm run build` 确保生产构建无报错
   - [ ] 运行 `npx tsc --noEmit` 确保类型检查通过
2. **文档同步**: 如果修改了架构、API 或设计，同步更新对应文档

---

## 9. 决策权限矩阵

| 决策类型 | Agent 权限 | 需要确认？ |
|----------|-----------|-----------|
| 修改 UI 颜色/间距 | 可自主决策 | 否（遵循 DESIGN.md） |
| 引入新的 shadcn/ui 组件 | 需要记录理由 | 否（单点引入） |
| 修改核心计算公式 | 必须验证并注释 | 是 |
| 更换汇率 API 源 | 需要对比可靠性 | 是 |
| 修改文件结构 | 需要说明理由 | 是 |
| 添加新的输入字段 | 需要评估必要性 | 是 |
| 新增 npm 依赖包 | 需要评估必要性 | 是 |

---

## 10. 参考资源

- **竞品参考**:
  - https://vps-value-calc.pyvm.net/ （功能参考）
  - https://vps4sale.123114.xyz/ （功能与交互参考）
- **设计灵感**:
  - Glassmorphism 规范: https://ui.glass/
  - 背景图 API: https://api.seaya.link/daily/
- **汇率 API 候选**:
  - https://open.er-api.com/v6/latest/USD
  - https://api.exchangerate-api.com/v4/latest/USD
- **框架与工具文档**:
  - React 18: https://react.dev/
  - Vite: https://vite.dev/
  - Tailwind CSS: https://tailwindcss.com/docs
  - shadcn/ui: https://ui.shadcn.com/
  - TypeScript: https://www.typescriptlang.org/docs/
  - Lucide React: https://lucide.dev/guide/packages/lucide-react

---

## 11. 更新日志

| 日期 | 版本 | 更新内容 | 更新者 |
|------|------|----------|--------|
| 2026-05-29 | 1.0 | 初始版本 | AI Agent |
| 2026-05-29 | 2.0 | 技术栈从纯 HTML/CSS/JS 迁移至 React 18 + Vite + Tailwind CSS + shadcn/ui + TypeScript；更新架构约束、代码规范、项目结构、决策矩阵及参考资源 | AI Agent |

---

> **注意**: 本文档是活的文档。当项目演进时，Agent 应同步更新本文档，确保后续 Agent 获得准确上下文。
