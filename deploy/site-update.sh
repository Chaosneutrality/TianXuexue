#!/bin/bash
# 自动同步脚本：检查 GitHub 是否有新提交，有就拉取 → 构建 → 重启
# 由 cron 定时调用，也可手动执行：/usr/local/bin/site-update.sh

set -u

REPO_DIR=/var/www/site
LOG=/var/log/site-update.log

log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }

# 防止重复执行
exec 9>/var/lock/site-update.lock
if ! flock -n 9; then
  exit 0
fi

cd "$REPO_DIR" || { log "目录不存在: $REPO_DIR"; exit 1; }

git fetch --quiet origin main || { log "fetch 失败（网络？）"; exit 1; }

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

log "发现新提交 $LOCAL -> $REMOTE"

# 是否需要重装依赖
NEED_INSTALL=0
if git diff --name-only "$LOCAL" "$REMOTE" | grep -q '^XHBlogs/package-lock.json'; then
  NEED_INSTALL=1
fi

git reset --hard origin/main >>"$LOG" 2>&1 || { log "reset 失败"; exit 1; }

cd "$REPO_DIR/XHBlogs" || { log "子目录不存在"; exit 1; }

if [ "$NEED_INSTALL" = "1" ]; then
  log "依赖有变化，执行 npm ci"
  npm ci >>"$LOG" 2>&1 || { log "npm ci 失败"; exit 1; }
fi

log "开始构建"
if npm run build >>"$LOG" 2>&1; then
  pm2 restart XHBlogs >>"$LOG" 2>&1
  log "构建并重启完成，当前版本 $REMOTE"
else
  log "构建失败，保持旧版本运行"
  exit 1
fi
