# 前端发版 / 部署

服务器 `<deploy-host>` 只有 2G 内存，**禁止在服务器上构建**。构建全部发生在 GitHub Actions。

## 发版流程

```bash
git tag web-v1.0.0 && git push origin web-v1.0.0
```

1. `deploy-web.yml` 被触发：typecheck + lint + 单测 + `next build`（standalone，
   `NEXT_PUBLIC_SOJ_API_MODE=http`）→ 打包 `soj-web-<ver>.tar.gz` → 传到 GitHub Release。
2. 服务器上的 `soj-web-deploy.timer`（每 5 分钟）跑 `web-deploy-check.sh`，
   `git ls-remote` 比对最新 `web-v*` 与 `/opt/soj/state/web-current`，有新版就执行 `web-deploy.sh`。
3. `web-deploy.sh`：下载 Release 资产 → 解压到 `/opt/soj/frontend-releases/<tag>` →
   原子切换 `/opt/soj/frontend` 软链 → `systemctl restart soj-web` → 健康检查
   （30 秒内 127.0.0.1:3000 必须 200，失败自动软链回退 + 重启）→ 只保留最近 3 个版本。

## 手动触发 / 排查

```bash
ssh root@<deploy-host>
/opt/soj/bin/web-deploy.sh web-v1.0.0        # 手动部署指定 tag
journalctl -u soj-web-deploy -n 50           # 轮询日志
journalctl -u soj-web -n 50                  # 前端服务日志
readlink /opt/soj/frontend                   # 当前线上版本
```

## 服务器侧布局

- `/opt/soj/frontend` → 软链指向 `/opt/soj/frontend-releases/web-vX.Y.Z`
- `/opt/soj/frontend.env`（600）：运行时 env（`SOJ_API_INTERNAL_BASE_URL` 等），
  部署脚本会复制进每个 release 目录作 `.env.production`
- `/etc/systemd/system/soj-web.service.d/override.conf`：`ExecStart=/usr/bin/node server.js`
  （standalone），`PORT=3000`、`HOSTNAME=127.0.0.1`
- 轮询单元：`/etc/systemd/system/soj-web-deploy.{service,timer}`，脚本在 `/opt/soj/bin/`

## 后端

后端仓库 `sparklyi/SOJ`，独立节奏，线上跑 docker compose（v1.3.1）。前端 tag 一律 `web-v*` 前缀，
避免与后端 `v*` 混淆；本目录的轮询脚本只认 `web-v*`。
