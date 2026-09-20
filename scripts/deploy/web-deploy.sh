#!/usr/bin/env bash
# 部署一个由 GitHub Actions 构建的前端 standalone 产物。
# 用法: web-deploy.sh <tag>   例如 web-deploy.sh web-v1.0.0
# 流程: 下载 Release 资产 -> 解压到 releases/ -> 原子切软链 -> 重启 -> 健康检查 -> 失败回退。
# 服务器上不做任何构建（2G 内存约束）。
set -euo pipefail

TAG="${1:?usage: web-deploy.sh <tag>}"
case "$TAG" in
  web-v[0-9]*) ;;
  *) echo "[web-deploy] refusing non web-v* tag: $TAG" >&2; exit 2 ;;
esac

REPO="sparklyi/SOJ-web"
VER="${TAG#web-}"
BASE="/opt/soj/frontend-releases"
LIVE="/opt/soj/frontend"
URL="https://github.com/${REPO}/releases/download/${TAG}/soj-web-${VER}.tar.gz"
STATE_DIR="/opt/soj/state"
ENV_SRC="/opt/soj/frontend.env"

mkdir -p "$BASE" "$STATE_DIR"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "[web-deploy] downloading $URL"
curl -fsSL --retry 3 --retry-delay 5 -o "$TMP/bundle.tar.gz" "$URL"
tar -tzf "$TMP/bundle.tar.gz" >/dev/null   # 完整性预检

PREV="$(readlink -f "$LIVE" 2>/dev/null || true)"

rm -rf "$TMP/unpack"
mkdir -p "$TMP/unpack"
tar -xzf "$TMP/bundle.tar.gz" -C "$TMP/unpack"
[ -f "$TMP/unpack/server.js" ] || { echo "[web-deploy] bundle missing server.js" >&2; exit 1; }

# 运行时 env 进 release 目录（Next standalone 启动时从 cwd 读取 .env.production）
cp "$ENV_SRC" "$TMP/unpack/.env.production"
chmod 600 "$TMP/unpack/.env.production"

# 首次部署时 LIVE 还是真实目录（git checkout），先挪走
if [ -d "$LIVE" ] && [ ! -L "$LIVE" ]; then
  OLD="${LIVE}.old-$(date +%Y%m%d%H%M%S)"
  mv "$LIVE" "$OLD"
  PREV="$OLD"
fi

rm -rf "$BASE/$TAG"
mv "$TMP/unpack" "$BASE/$TAG"
chown -R soj:soj "$BASE/$TAG"

# 原子切换软链
ln -s "$BASE/$TAG" "${LIVE}.new"
mv -T "${LIVE}.new" "$LIVE"

systemctl restart soj-web

ok=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/; then ok=1; break; fi
  sleep 1
done

if [ "$ok" != 1 ]; then
  echo "[web-deploy] health check failed for $TAG, rolling back to ${PREV:-none}" >&2
  if [ -n "$PREV" ] && [ -d "$PREV" ]; then
    ln -s "$PREV" "${LIVE}.new"
    mv -T "${LIVE}.new" "$LIVE"
    systemctl restart soj-web
  fi
  exit 1
fi

echo "$TAG" > "$STATE_DIR/web-current"
echo "[web-deploy] $TAG is live (previous: ${PREV:-none})"

# 只保留最近 3 个版本
ls -1dt "$BASE"/web-v* 2>/dev/null | tail -n +4 | while read -r d; do rm -rf "$d"; done
