#!/usr/bin/env bash
# 轮询 GitHub 上的最新 web-v* tag，发现有新版本就调用 web-deploy.sh。
# 由 soj-web-deploy.timer 每 5 分钟拉起；flock 防并发。
set -euo pipefail

exec 9>"/run/soj-web-deploy.lock"
flock -n 9 || exit 0

STATE="/opt/soj/state/web-current"
LATEST="$(git ls-remote --tags --refs https://github.com/sparklyi/SOJ-web.git 'refs/tags/web-v*' \
  | awk -F/ '{print $NF}' | sort -V | tail -1)"

[ -n "$LATEST" ] || exit 0
CURRENT="$(cat "$STATE" 2>/dev/null || echo none)"
[ "$LATEST" = "$CURRENT" ] && exit 0

echo "[web-deploy-check] found new tag $LATEST (current: $CURRENT)"
exec /opt/soj/bin/web-deploy.sh "$LATEST"
