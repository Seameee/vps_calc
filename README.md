# VPS 剩余价值计算器

> 一个精美的单页 Web 应用，用于精确计算 VPS 订阅的剩余价值，并生成标准化交易帖。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 在线预览

访问 [vpscalc.seaya.link](https://vpscalc.seaya.link)

## 功能特性

- **精确日期计算**：支持闰年/闰月，按实际日历天数计算剩余价值
- **实时汇率**：自动获取 USD/CNY/EUR/GBP/JPY 汇率，失败时自动降级
- **交易帖生成**：一键生成 Markdown / 纯文本格式交易帖，支持导出为图片
- **溢价/折价计算**：支持设置溢价或折价，自动汇总到最终价值
- **响应式布局**：完美适配桌面端、平板和移动端
- **Glassmorphism 设计**：毛玻璃 UI + 每日背景图，视觉效果出众
- **主题切换**：支持深色/浅色/自动模式
- **表单持久化**：输入内容自动保存到 localStorage

## 技术栈

- **React 18** + **TypeScript** (strict mode)
- **Vite** 构建工具
- **Tailwind CSS** 样式框架
- **shadcn/ui** 组件库
- **Lucide React** 图标库

## 本地开发

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 部署

本项目为纯前端静态应用，构建后仅需部署 `dist/` 目录中的文件。

### 部署到 Vercel

```bash
npm i -g vercel
vercel --prod
```

### 部署到 Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### 部署到 Cloudflare Pages

```bash
npm i -g wrangler
wrangler pages deploy dist --project-name=vps-calc
```

### 手动部署

1. 执行 `npm run build` 构建生产版本
2. 将 `dist/` 目录中的文件上传到任意静态托管服务（Nginx、Apache、对象存储等）
3. 确保配置所有路由重定向到 `index.html`（SPA 路由）

## 项目结构

```
vps_calc/
├── public/              # 静态资源
├── src/
│   ├── components/      # React 组件
│   │   ├── ui/          # shadcn/ui 组件
│   │   ├── layout/      # 布局组件（Header, Footer, Background 等）
│   │   ├── calculator/  # 计算器相关组件
│   │   └── trade-post/  # 交易帖生成组件
│   ├── hooks/           # 自定义 React Hooks
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── lib/             # 库配置（cn() 工具函数等）
│   ├── App.tsx          # 根组件
│   └── main.tsx         # 应用入口
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## API 依赖

- **汇率 API**: `https://open.er-api.com/v6/latest/{base}`（免费，无需 Key）
- **背景图 API**: `https://api.seaya.link/daily/`（每日一图）

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

## 贡献

欢迎提交 Issue 和 Pull Request。请确保在提交前运行 `npm run lint` 和 `npx tsc --noEmit` 检查代码。
