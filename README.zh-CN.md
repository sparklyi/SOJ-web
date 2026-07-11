# SOJ-web

[![CI](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml/badge.svg)](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml)

[English](README.md) | 简体中文

SOJ-web 是 SOJ 在线评测系统的 v2 前端项目，覆盖题库、题目详情、提交、比赛、排行榜和比赛大屏等用户侧体验。当前版本已经从旧 Vue 应用重写为 Next.js 应用，并使用 Signal Arena 视觉系统、可切换的 API 适配层和可稳定复现的 Mock 数据。

> 旧版 Vue 应用已归档在 `archive/vue-v1` 分支。当前开发入口是仓库根目录的 Next.js v2 应用。

## 目录

- [功能](#功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [常用脚本](#常用脚本)
- [项目结构](#项目结构)
- [API 模式](#api-模式)
- [质量检查](#质量检查)
- [开发流程](#开发流程)
- [项目状态](#项目状态)
- [相关文档](#相关文档)

## 功能

- 基于 Next.js v2 的产品级应用外壳和统一顶部导航。
- Signal Arena 暗色技术竞赛风格视觉系统。
- 题库、题目详情和代码工作区。
- 比赛大厅、比赛详情、比赛题目工作区、排行榜和 Arena 大屏。
- 提交列表和提交详情生命周期视图。
- Mock API 模式，方便在后端未完全接入时快速开发和评审。
- HTTP API 适配层，用于对接 SOJ 后端契约。
- 题目作者工作台，覆盖草稿创建、题面维护、测试数据上传、校验和发布门禁。
- CI 中包含类型检查、lint、视觉规则检查、单元测试、生产构建和浏览器 E2E 测试。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Radix UI primitives
- Motion
- Vitest
- Playwright
- GitHub Actions

## 快速开始

### 前置要求

- Node.js 22 或更新版本
- npm

### 安装依赖

```bash
git clone git@github.com:sparklyi/SOJ-web.git
cd SOJ-web
npm ci
```

### 配置环境变量

```bash
cp .env.example .env.local
```

默认使用 Mock 数据：

```bash
NEXT_PUBLIC_SOJ_API_MODE=mock
# NEXT_PUBLIC_SOJ_API_BASE_URL=http://localhost:8080
SOJ_API_INTERNAL_BASE_URL=http://localhost:8080
```

### 本地启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SOJ_API_MODE` | `mock` | 选择前端 API 适配器。本地评审使用 `mock`，真实后端联调用 `http`。 |
| `NEXT_PUBLIC_SOJ_API_BASE_URL` | 浏览器：`/soj-api`，服务端/测试：`http://localhost:8080` | `NEXT_PUBLIC_SOJ_API_MODE=http` 时的公开 API 地址。保持未设置即可使用 Next.js 同源代理。 |
| `SOJ_API_INTERNAL_BASE_URL` | `http://localhost:8080` | 服务端请求和 `/soj-api/*` rewrite 使用的后端地址。 |

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Next.js 本地开发服务。 |
| `npm run build` | 生成生产构建。 |
| `npm run start` | 在 `npm run build` 后启动生产服务。 |
| `npm run typecheck` | 执行 TypeScript 类型检查。 |
| `npm run lint` | 执行 ESLint，且不允许 warning。 |
| `npm run lint:style` | 执行 SOJ 视觉系统样式规则检查。 |
| `npm run test` | 使用 Vitest 运行单元测试。 |
| `npm run test:e2e` | 使用 Playwright 运行浏览器 E2E 测试。 |
| `npm run ci:fast` | 执行类型检查、lint、样式检查、单元测试和构建。 |
| `npm run ci` | 执行完整本地 CI，包括 E2E 测试。 |

## 项目结构

```text
app/                  Next.js 路由、布局和全局样式
components/layout/    应用外壳和导航组件
components/soj/       SOJ 产品组件
components/ui/        底层 UI 原语
features/             页面和业务模块
lib/api/              API client、适配器、类型和错误处理
lib/domain/           领域映射和视图模型辅助函数
lib/mock/             Mock 数据和构造器
tests/unit/           Vitest 单元测试
tests/e2e/            Playwright 浏览器测试
docs/                 设计、计划和 API 盘点文档
```

## API 模式

SOJ-web 使用基于适配器的 API 边界：

- `mock` 模式从 `lib/mock` 提供稳定的前端夹具数据。
- `http` 模式通过 `lib/api/http-adapter.ts` 调用后端。
- 浏览器请求默认走 `/soj-api/*` 同源代理，避免本地 CORS 阻塞。

代码工作区的语言选择由评测语言目录驱动。HTTP 模式会读取后端启用的 SOJ agent 语言；Mock 模式使用相同契约的模拟数据。

## 质量检查

创建 Pull Request 前建议运行完整本地检查：

```bash
npm run ci
```

GitHub Actions 会执行：

1. `npm ci`
2. 安装 Playwright 浏览器
3. TypeScript 检查
4. ESLint
5. SOJ 样式规则检查
6. 单元测试
7. 生产构建
8. E2E 测试

## 开发流程

1. 从 `main` 新建开发分支。
2. 保持提交聚焦，提交信息使用清晰的 Conventional Commit 风格。
3. 项目提交邮箱使用 `sparkyi@foxmail.com`。
4. 推送前运行相关本地检查。
5. 创建到 `main` 的 Pull Request。
6. 等待 GitHub Actions 通过。
7. 分支无冲突且检查通过后合并。

## 项目状态

SOJ-web v2 正在持续开发中。当前前端可以在 Mock 模式下独立运行，HTTP 模式用于后端联调。部分 v2 页面会先用 Mock 数据表达后续后端契约字段，等待 SOJ API 扩展后再切换到真实接口。

## 相关文档

- Signal Arena 设计系统：[`docs/design-system/signal-arena.md`](docs/design-system/signal-arena.md)
- OpenAPI 盘点：[`docs/development/openapi-inventory.md`](docs/development/openapi-inventory.md)
- 旧版 Vue 归档分支：[`archive/vue-v1`](https://github.com/sparklyi/SOJ-web/tree/archive/vue-v1)
