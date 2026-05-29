# AGENTS.md - VPS 剩余价值计算器

> 本文档指导所有 AI Agent 在参与本项目开发时应遵循的工作规范、决策路径与质量标准。

---

## 1. 项目概述

**项目名称**: VPS 剩余价值计算器 (VPS Value Calculator)
**目标**: 构建一个单页静态 Web 应用，用于精确计算 VPS 订阅的剩余价值，支持闰年/闰月时间计算、实时汇率获取，并生成标准化交易帖。
**技术栈**: 纯前端（HTML5 + CSS3 + Vanilla JavaScript），零构建步骤，零后端依赖。
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

1. **单文件优先**: 核心功能应集中在 `index.html` 单文件中（或极少量文件），便于部署到任何静态托管服务。
2. **无构建工具**: 不使用 Webpack/Vite/Rollup/npm 等构建工具。直接编写原生 HTML/CSS/JS。
3. **无外部框架**: 不使用 React/Vue/Angular。使用原生 DOM API。
4. **外部资源限制**:
   - 允许 CDN 引入: 字体（Google Fonts）、图标（Lucide/Font Awesome via CDN）
   - 背景图片源: `https://api.seaya.link/daily/`（每日一图 API）
   - 汇率 API: 使用免费的公开 API（如 exchangerate-api.com、open.er-api.com 等）
5. **浏览器支持**: 支持 Chrome 90+, Firefox 88+, Safari 14+, Edge 90+。

---

## 4. 代码规范

### 4.1 JavaScript

- **严格模式**: 所有脚本文件顶部必须包含 `"use strict";`
- **模块化**: 使用 ES6 Modules (`type="module"`) 组织代码，避免全局命名空间污染
- **命名规范**:
  - 常量: `UPPER_SNAKE_CASE`
  - 变量/函数: `camelCase`
  - 类: `PascalCase`
  - 私有方法/属性: `_leadingUnderscore`
- **注释**: 复杂算法（如闰年计算、汇率转换）必须有 JSDoc 注释
- **禁止**:
  - `var`（使用 `let` / `const`）
  - `==`（必须使用 `===` / `!==`）
  - `eval()` 和 `new Function()`
  - 直接修改 DOM 字符串的 `innerHTML`（优先使用 `textContent` 或 `createElement`）

### 4.2 CSS

- **命名**: 使用 BEM 方法论（`.block__element--modifier`）
- **单位**:
  - 字体大小: `rem`（根元素 `font-size: 16px`）
  - 布局间距: `rem` 或 `%`
  - 边框/圆角: `px` 或 `rem`
- **颜色**: 使用 CSS 自定义属性（变量），禁止硬编码色值在多处重复
- **响应式**: Mobile-first，断点统一为:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

### 4.3 HTML

- **语义化**: 使用正确的 HTML5 语义标签（`header`, `main`, `section`, `footer`, `label`, `time` 等）
- **可访问性 (A11y)**:
  - 所有表单输入必须有关联的 `<label>` 或通过 `aria-label` 说明
  - 颜色对比度 ≥ 4.5:1（使用玻璃态时需特别注意文字可读性）
  - 支持键盘导航，交互元素可通过 Tab 键访问
  - 图片必须有 `alt` 文本
- **语言属性**: `<html lang="zh-CN">`

---

## 5. 设计系统参考

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

## 6. 安全规范

> 详细安全规范见 `SECURITY_AUDIT.md`

- **CSP (Content Security Policy)**: 实施严格的 CSP 策略，只允许来自指定 CDN 和 API 的资源加载
- **XSS 防护**: 禁止 `innerHTML` 插入用户输入；所有用户输入必须转义
- **API 安全**: 汇率 API 调用使用 `fetch`，处理所有网络错误和超时
- **HTTPS**: 所有外部资源（背景图片、API、CDN）必须通过 HTTPS 加载

---

## 7. AI Agent 工作流

### 7.1 开发前

1. **阅读所有相关文档**: 在开始任何修改前，阅读 `AGENTS.md`, `DESIGN.md`, `ARCHITECTURE.md`, `API.md`, `SECURITY_AUDIT.md`
2. **理解上下文**: 明确当前修改的范围，不引入范围外的依赖或功能
3. **检查现有代码**: 遵循已有的代码风格，保持命名和模式的一致性

### 7.2 开发中

1. **最小变更原则**: 每次修改只做一件事，不附带无关的重构
2. **优先原生 API**: 能用原生实现就不引入库；必须引入时记录理由
3. **实时验证**: 每次修改后，在浏览器中验证视觉效果和功能正确性
4. **注释决策**: 如果代码看起来"反直觉"，必须添加注释解释原因

### 7.3 开发后

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
2. **文档同步**: 如果修改了架构、API 或设计，同步更新对应文档

---

## 8. 决策权限矩阵

| 决策类型 | Agent 权限 | 需要确认？ |
|----------|-----------|-----------|
| 修改 UI 颜色/间距 | 可自主决策 | 否（遵循 DESIGN.md） |
| 引入新的 CDN 依赖 | 需要记录理由 | 否（单点引入） |
| 修改核心计算公式 | 必须验证并注释 | 是 |
| 更换汇率 API 源 | 需要对比可靠性 | 是 |
| 修改文件结构 | 需要说明理由 | 是 |
| 添加新的输入字段 | 需要评估必要性 | 是 |

---

## 9. 参考资源

- **竞品参考**:
  - https://vps-value-calc.pyvm.net/ （功能参考）
  - https://vps4sale.123114.xyz/ （功能与交互参考）
- **设计灵感**:
  - Glassmorphism 规范: https://ui.glass/
  - 背景图 API: https://api.seaya.link/daily/
- **汇率 API 候选**:
  - https://open.er-api.com/v6/latest/USD
  - https://api.exchangerate-api.com/v4/latest/USD

---

## 10. 更新日志

| 日期 | 版本 | 更新内容 | 更新者 |
|------|------|----------|--------|
| 2026-05-29 | 1.0 | 初始版本 | AI Agent |

---

> **注意**: 本文档是活的文档。当项目演进时，Agent 应同步更新本文档，确保后续 Agent 获得准确上下文。
