# SECURITY_AUDIT.md - VPS 剩余价值计算器

> 本文档定义本项目的安全基线、风险模型、审计清单与合规要求。所有 AI Agent 在修改代码前必须阅读并遵循本文档。

---

## 1. 威胁模型

### 1.1 应用类型

本项目为 **React 18 SPA 构建于 Vite**，无后端服务、无用户认证、无数据持久化（除浏览器本地缓存外）。

### 1.2 威胁参与者

| 威胁参与者 | 能力 | 目标 |
|-----------|------|------|
| 被动网络监听者 | 可监控未加密流量 | 窃取用户输入的 VPS 信息（虽然无敏感数据） |
| 恶意 CDN/第三方 | 可篡改 CDN 资源 | 注入恶意脚本 |
| 背景图 API 攻击者 | 控制或仿冒图片 API | 返回恶意图片或重定向 |
| 汇率 API 攻击者 | 控制或仿冒汇率 API | 返回操纵的汇率数据 |
| 最终用户（误操作） | 复制/粘贴恶意内容 | 交易帖被篡改 |

### 1.3 风险评级

| 风险项 | 可能性 | 影响 | 等级 | 缓解措施 |
|--------|--------|------|------|----------|
| XSS 通过交易帖复制 | 中 | 中 | **中** | 输出转义，使用 React JSX 自动转义 + `textContent` |
| CDN 资源被篡改 | 低 | 高 | **中** | CSP + SRI (Subresource Integrity) + Vite 打包内联 |
| 汇率 API 返回恶意数据 | 低 | 中 | **低** | 输入验证 + 异常降级 |
| 背景图 API 返回恶意内容 | 低 | 低 | **低** | HTTPS + 图片尺寸限制 |
| MITM 攻击（HTTP 降级） | 中 | 中 | **中** | 强制 HTTPS，HSTS |
| 依赖漏洞（npm 包） | 低 | 高 | **中** | 定期 `npm audit`，最小化依赖 |

---

## 2. 安全基线要求

### 2.1 内容安全策略 (CSP)

必须在 HTML `<head>` 中实施以下 CSP。Vite 开发服务器使用 `http://localhost:5173`，在生产构建中使用 `self` 并配合 SRI。

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' https://api.seaya.link data: blob:;
  connect-src 'self' https://api.seaya.link https://open.er-api.com https://api.exchangerate-api.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'none';
">
```

> **Vite 注意**: Vite 开发服务器需要 `'unsafe-eval'` 以支持 HMR（热模块替换）。在生产构建中，如果代码中没有任何 `eval()` 或动态 `new Function()` 调用，可以移除 `'unsafe-eval'` 以收紧安全策略。`'unsafe-inline'` 仅用于内联样式（单文件应用必需）。

### 2.2 HTTPS 强制

- 所有外部资源加载必须使用 `https://`
- 不允许混合内容（mixed content）
- 背景图 API、汇率 API、CDN 资源全部走 HTTPS
- Vite 开发服务器默认运行在 `http://localhost`，仅限本地访问

### 2.3 子资源完整性 (SRI)

如从 CDN 引入外部库（图标、字体），必须添加 `integrity` 和 `crossorigin` 属性：

```html
<!-- 示例 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lucide-static@latest/font/lucide.min.css"
      integrity="sha384-..." crossorigin="anonymous">
```

若使用图标字体且无法获取可靠 SRI hash，优先使用 **内联 SVG** 或 **纯 CSS 图标**，避免外部字体依赖。

> **Vite 优势**: Vite 在构建时默认将 CSS 和字体资源打包，减少对外部 CDN 的依赖，天然降低 CDN 篡改风险。

### 2.4 Build-time 安全（Vite）

#### 2.4.1 环境变量与 .env 文件

- Vite 使用 `import.meta.env` 访问环境变量
- **绝不提交 `.env` 文件**：确认 `.env` 已加入 `.gitignore`
- 通过 `VITE_` 前缀暴露的变量会编译进客户端代码，谨慎控制其内容
- 不要将 API Key、私有 Token 等敏感值放在客户端环境变量中

```bash
# .gitignore 必须包含
.env
.env.local
.env.*.local
```

#### 2.4.2 构建产物检查

- 生产构建输出到 `dist/` 目录
- 每次构建后检查 `dist/` 中是否包含：
  - 未预期的注释或调试代码
  - 开发环境变量值
  - 源映射文件（见 2.4.3）

#### 2.4.3 源映射 (Source Map) 处理

- 生产构建默认关闭 sourcemap（`vite.config.ts` 中 `build.sourcemap: false`）
- 如需保留 sourcemap 用于调试，仅在限流环境中部署，或部署为单独的 `.js.map` 文件并限制访问
- 使用 DevTools 确认生产环境 URL 不暴露 `.map` 文件

```typescript
// vite.config.ts - 推荐的生产配置
export default defineConfig({
  build: {
    sourcemap: false,       // 生产环境禁用 sourcemap
    minify: 'terser',       // 使用 Terser 混淆
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
      },
    },
  },
})
```

### 2.5 依赖安全

#### 2.5.1 npm 审计

每次安装新依赖、更新依赖或发布前，必须运行：

```bash
npm audit
npm audit fix
```

#### 2.5.2 最小化依赖原则

- 仅在必要时引入新 npm 包（遵循决策权限矩阵）
- 优先使用 React / Vite / Tailwind 等生态原生能力，减少第三方依赖
- 避免引入功能重叠的库（如同时使用多个日期处理库）
- 定期审查 `package.json` 中的依赖，移除不再使用的包

---

## 3. XSS 防护规范

### 3.1 React 内置 XSS 防护

React 的 JSX 语法**默认自动转义**所有嵌入的内容，这是第一层 XSS 防御。

```tsx
// ✅ 安全：React 自动转义 userInput 中的 HTML
const userInput = '<script>alert(1)</script>';
return <div>{userInput}</div>;
// 渲染结果：&lt;script&gt;alert(1)&lt;/script&gt;
```

**React 特有的风险点** — `dangerouslySetInnerHTML`：

```tsx
// ❌ 禁止：除非经过严格的 sanitize
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 安全替代方案：结构化组件
<div>{userInput}</div>
```

`dangerouslySetInnerHTML` 仅应在以下 **极少数** 情况下使用，且内容必须经过 sanitize（如 DOMPurify）：
- 渲染来自受信源的 Markdown 渲染结果
- 内联 SVG 图标（确认无动态内容注入）

### 3.2 输入处理

| 输入源 | 处理方式 | 说明 |
|--------|----------|------|
| 用户输入（供应商、型号等） | React state → JSX 渲染 | JSX 自动转义，不直接操作 DOM |
| 日期选择 | `<input type="date">` + React state 验证 | 验证为有效日期对象 |
| 数值输入 | `Number()` 或 `parseFloat()` + 范围限制 | 拒绝 NaN 和 Infinity |
| 自定义特性标签 | 长度限制 10 字符 + 正则过滤 | `/^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,10}$/` |
| 备注文本 | 长度限制 200 字符 | 纯文本处理 |

### 3.3 输出处理

- **交易帖预览**: 使用 JSX 表达式 `{postContent}`，React 自动转义
- **复制到剪贴板**: 使用 `navigator.clipboard.writeText()`，确保传入纯字符串
- **动态 HTML 生成**: 优先使用 JSX 组件组合，避免 `dangerouslySetInnerHTML`

### 3.4 禁止的危险模式

```typescript
// ❌ 禁止 - React 环境
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // 除非经 sanitize
document.getElementById('...').innerHTML = userInput;     // 直接 DOM 操作
window.location = userInput;                              // 开放式重定向

// ✅ 推荐 - React 安全写法
<div>{userInput}</div>
navigator.clipboard.writeText(userInput);
```

---

## 4. TypeScript 安全

### 4.1 严格模式

项目使用 TypeScript 严格模式（`tsconfig.json` 中 `strict: true`），在编译期捕获常见错误：

- `noImplicitAny`: 禁止隐式 `any`
- `strictNullChecks`: 检查 `null` / `undefined` 访问
- `strictFunctionTypes`: 函数参数逆变检查
- `strictBindCallApply`: 严格检查 `bind` / `call` / `apply`

### 4.2 类型安全规范

```typescript
// ❌ 禁止：使用 any
function processInput(input: any) { ... }

// ✅ 推荐：使用 unknown + 类型守卫
function processInput(input: unknown) {
  if (typeof input === 'string') {
    // 此时 input 被收窄为 string 类型
    return input.trim();
  }
  throw new Error('Invalid input type');
}
```

### 4.3 类型守卫与运行时验证

```typescript
// 汇率响应类型守卫
interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
}

function isExchangeRateResponse(data: unknown): data is ExchangeRateResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'base' in data &&
    'rates' in data &&
    typeof (data as ExchangeRateResponse).base === 'string' &&
    typeof (data as ExchangeRateResponse).rates === 'object'
  );
}
```

### 4.4 禁止模式

```typescript
// ❌ 禁止
const x: any = getData();
const fn: Function = callback;
as any  // 类型断言绕过检查

// ✅ 推荐
const x: unknown = getData();
type Fn = (args: string) => void;
```

---

## 5. 外部 API 安全

### 5.1 汇率 API

**候选 API**:
1. `https://open.er-api.com/v6/latest/{base}` （无需 API Key）
2. `https://api.exchangerate-api.com/v4/latest/{base}` （无需 API Key）

**安全要求**:
- 请求必须使用 `fetch()`，设置 `mode: 'cors'`
- 实现请求超时（如 5 秒），超时后降级到缓存汇率
- 验证响应结构：必须包含 `rates` 对象和 `base` 字符串
- 验证汇率值：必须是正数，且在合理范围（如 0.0001 ~ 10000）
- 异常降级：API 失败时使用硬编码的最近已知汇率，UI 明确提示"汇率可能不是最新的"

```typescript
// 安全获取汇率示例（React Hook 版本）
import { useState, useEffect, useCallback } from 'react';

interface RatesData {
  base: string;
  rates: Record<string, number>;
}

function useExchangeRate(base = 'USD') {
  const [rates, setRates] = useState<RatesData | null>(null);
  const [error, setError] = useState<boolean>(false);

  const fetchRates = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://open.er-api.com/v6/latest/${base}`,
        {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: unknown = await response.json();

      // 类型守卫验证响应
      if (!isExchangeRateResponse(data)) {
        throw new Error('Invalid response structure');
      }

      // 验证汇率值范围
      for (const rate of Object.values(data.rates)) {
        if (typeof rate !== 'number' || rate <= 0 || rate > 10000) {
          throw new Error('Invalid rate value');
        }
      }

      setRates(data);
      setError(false);
    } catch (err) {
      console.warn('Exchange rate fetch failed:', err);
      setError(true);
      setRates(getFallbackRates()); // 返回硬编码降级汇率
    }
  }, [base]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return { rates, error, refetch: fetchRates };
}
```

### 5.2 背景图 API

**API**: `https://api.seaya.link/daily/`

**安全要求**:
- 图片加载使用 `<img>` 标签，`crossorigin="anonymous"`
- 设置最大尺寸限制（如 max-width: 100vw, max-height: 100vh）
- 图片加载失败时，使用 CSS 渐变背景作为 fallback
- 不将图片数据传入 `canvas` 进行像素操作（避免 tainted canvas）

---

## 6. 数据隐私

### 6.1 数据收集声明

本应用**不收集、不上传、不存储**任何用户数据到服务器。

- 所有计算在浏览器本地完成
- 汇率 API 仅发送基础货币代码（如 "USD"），不包含任何用户标识
- 背景图 API 不发送任何用户数据

### 6.2 本地存储

如需使用 `localStorage`（如缓存汇率），必须：
- 明确告知用户（在 UI 中说明"汇率已缓存于本地"）
- 存储数据加密义：仅存储汇率数值和时间戳，不存储用户输入
- 设置 TTL（生存时间）：如 1 小时，过期后自动重新获取
- 提供清除缓存的选项

```typescript
// 安全的本地存储示例（TypeScript）
interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
  ttl: number; // 毫秒
}

function cacheRates(rates: Record<string, number>): void {
  const data: CachedRates = {
    rates,
    timestamp: Date.now(),
    ttl: 3600000, // 1小时
  };
  localStorage.setItem('vps_calc_rates', JSON.stringify(data));
}

function getCachedRates(): Record<string, number> | null {
  try {
    const raw = localStorage.getItem('vps_calc_rates');
    if (!raw) return null;
    const data: CachedRates = JSON.parse(raw);
    if (Date.now() - data.timestamp > data.ttl) {
      localStorage.removeItem('vps_calc_rates');
      return null;
    }
    return data.rates;
  } catch {
    localStorage.removeItem('vps_calc_rates');
    return null;
  }
}
```

---

## 7. 导出功能安全

### 7.1 导出为 Markdown

**风险**: 用户输入的内容可能包含恶意脚本，导出为 Markdown 文件后若被他人执行可能造成伤害。

**缓解措施**:
- 导出前对用户输入进行转义处理，确保 Markdown 文件中不包含可执行代码
- 使用 React state 获取用户输入（而非直接 DOM 查询）
- 文件名使用 `encodeURIComponent` 处理，避免路径遍历
- 生成的 Markdown 文件不包含任何脚本或 HTML 标签

```typescript
function sanitizeForMarkdown(text: string): string {
  // 转义 Markdown 特殊字符
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_');
}
```

### 7.2 导出为图片

**技术方案**: 使用 `html2canvas` 将 React DOM 元素转为图片

**安全风险**:
1. **DOM 克隆污染**: 克隆节点时可能意外包含敏感信息
2. **CORS 图片问题**: 背景图等跨域图片可能导致导出失败
3. **内存泄漏**: 大图片导出可能导致内存占用过高
4. **React 组件卸载**: 导出过程跨越 React 生命周期，需处理组件卸载时的清理

**缓解措施**:
- 使用 React `useRef` 获取待导出元素的 DOM 引用（而非 `document.getElementById`）
- 导出前清理克隆节点中的敏感元素
- 确保所有图片资源设置 `crossorigin="anonymous"`
- 限制导出图片的最大尺寸（如 3000×3000px），防止内存溢出
- 导出完成后立即释放 canvas/blob URL
- 在 React `useEffect` 清理函数中取消进行中的导出操作

```typescript
// React 导出安全示例
import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

function ExportPanel() {
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExportImage = useCallback(async () => {
    if (!exportRef.current) return;

    // 克隆节点并清理敏感内容
    const clone = exportRef.current.cloneNode(true) as HTMLElement;

    // 移除交互元素
    clone.querySelectorAll('button, input, select, textarea').forEach(el => {
      (el as HTMLElement).style.pointerEvents = 'none';
      (el as HTMLElement).style.opacity = '0.5';
    });

    try {
      const canvas = await html2canvas(clone, {
        useCORS: true,         // 启用跨域图片支持
        scale: 2,              // 2x 高清导出
        maxWidth: 3000,
        maxHeight: 3000,
        logging: false,
      });

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        // 触发下载...
        URL.revokeObjectURL(url); // 立即释放
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  return <div ref={exportRef}>{/* 导出内容 */}</div>;
}
```

### 7.3 剪贴板操作安全

**风险**: `navigator.clipboard.write()` 需要用户手势触发（点击事件），否则会被浏览器阻止。

**缓解措施**:
- 仅在用户明确点击"复制"按钮时调用剪贴板 API
- 提供降级方案：当剪贴板 API 不可用时，自动触发文件下载
- React 事件处理：将剪贴板调用绑定在点击事件处理器内，确保在用户手势上下文中执行
- 复制前确认数据不包含敏感信息

---

## 8. 审计清单

### 8.1 每次代码变更前的安全检查

- [ ] 未引入新的外部 CDN 资源（若引入，已添加 SRI）
- [ ] 未使用 `dangerouslySetInnerHTML` 插入动态内容
- [ ] 未使用 `any` 类型（使用 `unknown` + 类型守卫代替）
- [ ] 所有用户输入都有长度/类型/范围验证
- [ ] 所有外部 API 调用都有错误处理和降级逻辑
- [ ] CSP 策略仍然有效（在浏览器控制台检查 CSP 报错）
- [ ] 导出功能不会泄露用户敏感信息
- [ ] 剪贴板操作仅在用户手势触发时执行
- [ ] `npm audit` 无高危及以上漏洞
- [ ] 构建产物 `dist/` 无源映射或敏感数据泄露

### 8.2 发布前完整审计

- [ ] 在 DevTools 的 Network 面板确认所有请求为 HTTPS
- [ ] 在 DevTools 的 Console 面板确认无 CSP 违规
- [ ] 运行 `npm run build` 确认无编译错误
- [ ] 运行 `npx tsc --noEmit` 确认类型检查通过
- [ ] 使用浏览器的"查看源代码"确认无敏感信息硬编码
- [ ] 测试 XSS 向量：在输入框中输入 `<script>alert(1)</script>`，确认不会被注入
- [ ] 测试汇率 API 失败场景（断网或使用 DevTools 阻断请求）
- [ ] 验证 `localStorage` 中不存储敏感用户输入
- [ ] 测试导出为 Markdown 文件的内容安全性（无脚本注入）
- [ ] 测试导出为图片的内存占用（不应导致页面卡顿或崩溃）
- [ ] 测试剪贴板复制在不同浏览器的兼容性
- [ ] 检查 `dist/` 目录中不包含 `.env` 值或调试代码
- [ ] 确认 `sourcemap` 在生产构建中已禁用

---

## 9. 应急响应

### 9.1 汇率 API 失效

**症状**: 汇率显示 "--" 或明显错误值
**响应**:
1. 自动降级到硬编码汇率表
2. UI 显示警告横幅："汇率获取失败，使用最近缓存/默认汇率"
3. 允许用户手动输入汇率

### 9.2 CDN 资源失效

**症状**: 图标/字体无法加载
**响应**:
1. 所有图标使用内联 SVG 作为 fallback（React 组件内置）
2. 字体使用系统字体栈作为 fallback：`font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`
3. Vite 构建已内联大部分资源，减少 CDN 依赖

### 9.3 背景图 API 失效

**症状**: 背景全黑或纯白
**响应**:
1. CSS fallback 背景：`background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
2. 定期重试加载（如 3 次，间隔 5 秒）

### 9.4 构建/依赖问题

**症状**: `npm run dev` 或 `npm run build` 失败
**响应**:
1. 检查 `npm audit` 输出，修复或升级有漏洞的依赖
2. 删除 `node_modules` 和 `package-lock.json`，重新 `npm install`
3. 检查 `vite.config.ts` 配置是否兼容当前 Vite 版本

---

## 10. 合规声明

- 本应用不处理个人身份信息 (PII)
- 本应用不使用 Cookie（除 `localStorage` 可选缓存外）
- 建议在实际部署时添加简单的隐私声明页面

---

> **Agent 注意**: 任何安全相关代码的修改都必须同时更新本文档的对应章节。安全不是一次性的工作，而是持续的过程。
