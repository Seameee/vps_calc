# SECURITY_AUDIT.md - VPS 剩余价值计算器

> 本文档定义本项目的安全基线、风险模型、审计清单与合规要求。所有 AI Agent 在修改代码前必须阅读并遵循本文档。

---

## 1. 威胁模型

### 1.1 应用类型

本项目为**纯前端静态单页应用 (SPA)**，无后端服务、无用户认证、无数据持久化（除浏览器本地缓存外）。

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
| XSS 通过交易帖复制 | 中 | 中 | **中** | 输出转义，使用 `textContent` |
| CDN 资源被篡改 | 低 | 高 | **中** | CSP + SRI (Subresource Integrity) |
| 汇率 API 返回恶意数据 | 低 | 中 | **低** | 输入验证 + 异常降级 |
| 背景图 API 返回恶意内容 | 低 | 低 | **低** | HTTPS + 图片尺寸限制 |
| MITM 攻击（HTTP 降级） | 中 | 中 | **中** | 强制 HTTPS，HSTS |

---

## 2. 安全基线要求

### 2.1 内容安全策略 (CSP)

必须在 HTML `<head>` 中实施以下 CSP（可根据实际需求微调，但只允许收紧）：

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' https://api.seaya.link data: blob:;
  connect-src 'self' https://api.seaya.link https://open.er-api.com https://api.exchangerate-api.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'none';
">
```

**注意**: `'unsafe-inline'` 仅用于内联样式（单文件应用必需）。如使用外部 CSS 文件，应移除 `'unsafe-inline'`。

### 2.2 HTTPS 强制

- 所有外部资源加载必须使用 `https://`
- 不允许混合内容（mixed content）
- 背景图 API、汇率 API、CDN 资源全部走 HTTPS

### 2.3 子资源完整性 (SRI)

如从 CDN 引入外部库（图标、字体），必须添加 `integrity` 和 `crossorigin` 属性：

```html
<!-- 示例 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lucide-static@latest/font/lucide.min.css"
      integrity="sha384-..." crossorigin="anonymous">
```

若使用图标字体且无法获取可靠 SRI hash，优先使用**内联 SVG** 或**纯 CSS 图标**，避免外部字体依赖。

---

## 3. XSS 防护规范

### 3.1 输入处理

| 输入源 | 处理方式 | 说明 |
|--------|----------|------|
| 用户输入（供应商、型号等） | `textContent` 赋值 | 绝不使用 `innerHTML` |
| 日期选择 | 使用 `<input type="date">` + JS 验证 | 验证为有效日期对象 |
| 数值输入 | `Number()` 或 `parseFloat()` + 范围限制 | 拒绝 NaN 和 Infinity |
| 自定义特性标签 | 长度限制 10 字符 + 正则过滤 | `/^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,10}$/` |
| 备注文本 | 长度限制 200 字符 | 纯文本处理 |

### 3.2 输出处理

- **交易帖预览**: 使用 `textContent` 或模板字符串直接插入预格式化文本块
- **复制到剪贴板**: 使用 `navigator.clipboard.writeText()`，确保传入纯字符串
- **动态 HTML 生成**: 优先使用 `document.createElement()` + `element.textContent`，避免字符串拼接 HTML

### 3.3 禁止的危险模式

```javascript
// ❌ 禁止
element.innerHTML = userInput;
document.write(userInput);
window.location = userInput;  // 开放式重定向

// ✅ 推荐
element.textContent = userInput;
navigator.clipboard.writeText(userInput);
```

---

## 4. 外部 API 安全

### 4.1 汇率 API

**候选 API**:
1. `https://open.er-api.com/v6/latest/{base}` （无需 API Key）
2. `https://api.exchangerate-api.com/v4/latest/{base}` （无需 API Key）

**安全要求**:
- 请求必须使用 `fetch()`，设置 `mode: 'cors'`
- 实现请求超时（如 5 秒），超时后降级到缓存汇率
- 验证响应结构：必须包含 `rates` 对象和 `base` 字符串
- 验证汇率值：必须是正数，且在合理范围（如 0.0001 ~ 10000）
- 异常降级：API 失败时使用硬编码的最近已知汇率，UI 明确提示"汇率可能不是最新的"

```javascript
// 安全获取汇率示例
async function fetchExchangeRates(base = 'USD') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // 验证响应结构
    if (!data || typeof data !== 'object' || !data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid response structure');
    }
    
    // 验证汇率值
    for (const [currency, rate] of Object.entries(data.rates)) {
      if (typeof rate !== 'number' || rate <= 0 || rate > 10000) {
        throw new Error(`Invalid rate for ${currency}`);
      }
    }
    
    return data;
  } catch (error) {
    console.warn('Exchange rate fetch failed:', error);
    return getFallbackRates(base); // 返回硬编码降级汇率
  }
}
```

### 4.2 背景图 API

**API**: `https://api.seaya.link/daily/`

**安全要求**:
- 图片加载使用 `<img>` 标签，`crossorigin="anonymous"`
- 设置最大尺寸限制（如 max-width: 100vw, max-height: 100vh）
- 图片加载失败时，使用 CSS 渐变背景作为 fallback
- 不将图片数据传入 `canvas` 进行像素操作（避免 tainted canvas）

---

## 5. 数据隐私

### 5.1 数据收集声明

本应用**不收集、不上传、不存储**任何用户数据到服务器。

- 所有计算在浏览器本地完成
- 汇率 API 仅发送基础货币代码（如 "USD"），不包含任何用户标识
- 背景图 API 不发送任何用户数据

### 5.2 本地存储

如需使用 `localStorage`（如缓存汇率），必须：
- 明确告知用户（在 UI 中说明"汇率已缓存于本地"）
- 存储数据加密义：仅存储汇率数值和时间戳，不存储用户输入
- 设置 TTL（生存时间）：如 1 小时，过期后自动重新获取
- 提供清除缓存的选项

```javascript
// 安全的本地存储示例
function cacheRates(rates) {
  const data = {
    rates,
    timestamp: Date.now(),
    ttl: 3600000 // 1小时
  };
  localStorage.setItem('vps_calc_rates', JSON.stringify(data));
}

function getCachedRates() {
  try {
    const raw = localStorage.getItem('vps_calc_rates');
    if (!raw) return null;
    const data = JSON.parse(raw);
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

## 6. 导出功能安全

### 6.1 导出为 Markdown

**风险**: 用户输入的内容可能包含恶意脚本，导出为 Markdown 文件后若被他人执行可能造成伤害。

**缓解措施**:
- 导出前对用户输入进行转义处理，确保 Markdown 文件中不包含可执行代码
- 使用 `textContent` 而非 `innerHTML` 获取用户输入
- 文件名使用 `encodeURIComponent` 处理，避免路径遍历
- 生成的 Markdown 文件不包含任何脚本或 HTML 标签

```javascript
function sanitizeForMarkdown(text) {
  // 转义 Markdown 特殊字符
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_');
}
```

### 6.2 导出为图片

**技术方案**: 使用 `html2canvas` 或 `dom-to-image` 将 DOM 元素转为图片

**安全风险**:
1. **DOM 克隆污染**: 克隆节点时可能意外包含敏感信息
2. **CORS 图片问题**: 背景图等跨域图片可能导致导出失败
3. **内存泄漏**: 大图片导出可能导致内存占用过高

**缓解措施**:
- 导出前清理克隆节点中的敏感元素（密码输入、隐藏字段等）
- 确保所有图片资源设置 `crossorigin="anonymous"`
- 限制导出图片的最大尺寸（如 3000×3000px），防止内存溢出
- 导出完成后立即释放临时创建的 canvas/blob URL

```javascript
function prepareNodeForExport(node) {
  const clone = node.cloneNode(true);
  
  // 移除敏感元素
  clone.querySelectorAll('input[type="password"], .sensitive-data').forEach(el => el.remove());
  
  // 移除交互元素（按钮、输入框等）
  clone.querySelectorAll('button, input, select, textarea').forEach(el => {
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.5';
  });
  
  return clone;
}
```

### 6.3 剪贴板操作安全

**风险**: `navigator.clipboard.write()` 需要用户手势触发（点击事件），否则会被浏览器阻止。

**缓解措施**:
- 仅在用户明确点击"复制"按钮时调用剪贴板 API
- 提供降级方案：当剪贴板 API 不可用时，自动触发文件下载
- 复制前确认数据不包含敏感信息

---

## 7. 审计清单

### 7.1 每次代码变更前的安全检查

- [ ] 未引入新的外部 CDN 资源（若引入，已添加 SRI）
- [ ] 未使用 `innerHTML` 插入动态内容
- [ ] 所有用户输入都有长度/类型/范围验证
- [ ] 所有外部 API 调用都有错误处理和降级逻辑
- [ ] CSP 策略仍然有效（在浏览器控制台检查 CSP 报错）
- [ ] 导出功能不会泄露用户敏感信息
- [ ] 剪贴板操作仅在用户手势触发时执行

### 7.2 发布前完整审计

- [ ] 在 DevTools 的 Network 面板确认所有请求为 HTTPS
- [ ] 在 DevTools 的 Console 面板确认无 CSP 违规
- [ ] 使用浏览器的"查看源代码"确认无敏感信息硬编码（API Key、密码等）
- [ ] 测试 XSS 向量：在输入框中输入 `<script>alert(1)</script>`，确认不会被注入
- [ ] 测试汇率 API 失败场景（断网或使用 DevTools 阻断请求）
- [ ] 验证 `localStorage` 中不存储敏感用户输入
- [ ] 测试导出为 Markdown 文件的内容安全性（无脚本注入）
- [ ] 测试导出为图片的内存占用（不应导致页面卡顿或崩溃）
- [ ] 测试剪贴板复制在不同浏览器的兼容性

---

## 7. 应急响应

### 7.1 汇率 API 失效

**症状**: 汇率显示 "--" 或明显错误值
**响应**:
1. 自动降级到硬编码汇率表
2. UI 显示警告横幅:"汇率获取失败，使用最近缓存/默认汇率"
3. 允许用户手动输入汇率

### 7.2 CDN 资源失效

**症状**: 图标/字体无法加载
**响应**:
1. 所有图标使用内联 SVG 作为 fallback
2. 字体使用系统字体栈作为 fallback：`font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`

### 7.3 背景图 API 失效

**症状**: 背景全黑或纯白
**响应**:
1. CSS fallback 背景：`background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
2. 定期重试加载（如 3 次，间隔 5 秒）

---

## 8. 合规声明

- 本应用不处理个人身份信息 (PII)
- 本应用不使用 Cookie（除 `localStorage` 可选缓存外）
- 建议在实际部署时添加简单的隐私声明页面

---

> **Agent 注意**: 任何安全相关代码的修改都必须同时更新本文档的对应章节。安全不是一次性的工作，而是持续的过程。
