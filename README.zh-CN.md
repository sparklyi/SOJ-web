# SOJ-web

[![CI](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml/badge.svg)](https://github.com/sparklyi/SOJ-web/actions/workflows/ci.yml)

[English](README.md) | 简体中文

**Sundial** 在线评测系统的 v2 前端，覆盖题库、题目详情、提交、比赛、排行榜与比赛大屏：一个带可切换 Mock 的 Next.js 应用。

> 2026-09-23 由 SOJ 改名而来。两个语种下站名都是 `Sundial`；仓库名、`soj-*` 设计变量和 `SOJ_*` 环境变量**有意**保留旧名——它们都不出现在界面上。
>
> 旧版 Vue 应用归档在 `archive/vue-v1` 分支。

## 快速开始

需要 Node.js 22 或更新版本，以及 npm。

```bash
git clone git@github.com:sparklyi/SOJ-web.git
cd SOJ-web
npm ci
cp .env.example .env.local   # 默认使用 Mock 数据
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SOJ_API_MODE` | 本地 `mock`，生产 `http` | 选择 API 适配器。 |
| `NEXT_PUBLIC_SOJ_API_BASE_URL` | 浏览器侧 `/soj-api` | `http` 模式下的公开 API 地址。不设置即走同源代理。 |
| `SOJ_API_INTERNAL_BASE_URL` | `http://localhost:8080` | 服务端请求与 `/soj-api/*` rewrite 的后端地址。 |

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务。 |
| `npm run build` / `npm run start` | 生产构建，然后启动。 |
| `npm run typecheck` | TypeScript 类型检查，不产出文件。 |
| `npm run lint` | ESLint，不允许 warning。 |
| `npm run lint:style` | 视觉系统样式规则检查。 |
| `npm run test` / `npm run test:e2e` | Vitest 单元测试 / Playwright 浏览器测试。 |
| `npm run ci:fast` | 类型检查 → lint → 样式检查 → 单元测试 → 构建。 |
| `npm run ci` | 完整检查，含 E2E。 |

## API 模式

- `mock`（本地默认）从 `lib/mock` 提供可复现的夹具数据。
- `http` 通过 `lib/api/http-adapter.ts` 调用后端。
- 生产构建默认 `http`；需要 Mock 必须显式选择。
- 浏览器请求走同源 `/soj-api/*` 代理，本地不需要额外处理 CORS。

## 项目结构

```text
app/                  Next.js 路由、布局与全局样式
components/layout/    应用外壳与导航
components/soj/       产品组件
components/ui/        底层 UI 原语
features/             页面与业务模块
lib/api/              API client、适配器、类型与错误
lib/domain/           领域映射与视图模型
lib/mock/             Mock 数据与构造器
tests/unit/           Vitest 单元测试
tests/e2e/            Playwright 浏览器测试
docs/                 设计系统与开发笔记
```

## 参与开发

```bash
npm run ci
```

执行与 `.github/workflows/ci.yml` 相同的步骤：安装依赖、Playwright 浏览器、类型检查、ESLint、样式检查、单元测试、生产构建、E2E。从 `main` 切分支，提交保持聚焦并使用 Conventional Commit 风格，提交邮箱用 `sparkyi@foxmail.com`。

## 部署

走 tag 触发，服务器不构建：

```bash
git tag web-v1.2.0 && git push origin web-v1.2.0
```

Actions 构建 standalone 产物并挂到 Release；服务器轮询新的 `web-v*` tag，原子切换软链、健康检查，失败自动回退。部署脚本在部署机上维护，不在本仓库。

## 相关文档

- 视觉语言：[`docs/design-system/soj-visual-language.md`](docs/design-system/soj-visual-language.md)
- OpenAPI 盘点：[`docs/development/openapi-inventory.md`](docs/development/openapi-inventory.md)
- 后端联调冒烟：[`docs/development/api-integration-smoke.md`](docs/development/api-integration-smoke.md)
