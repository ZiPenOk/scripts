#!/bin/bash
# 挂载监测

# ================= 配置区域 =================
NAS_IP="10.10.10.200"
MOUNT_PATH="/mnt/synology_nfs"
FLAG_FILE="$MOUNT_PATH/.nas_ready"
LOG_FILE="/home/script/logs/nfs_monitor.log"
# 日志保留行数 (建议 300 行，足够看一周左右)
MAX_LOG_LINES=300
# ===========================================

SESSION_LOG=""

# 记录函数：将消息加入本次运行的“块”中
log() {
    local MSG="$(date '+%Y-%m-%d %H:%M:%S') - $1"
    SESSION_LOG="${SESSION_LOG}${MSG}\n"
}

# 最终写入函数：将本次运行的所有记录作为一个整体插到文件开头
finalize_log() {
    local SEPARATOR="------------------------------------------------------------\n"
    local FULL_BLOCK="${SESSION_LOG}${SEPARATOR}"
    
    if [ -f "$LOG_FILE" ]; then
        # 提取旧内容的前 N 行，并在顶部加入新记录块
        local OLD_CONTENT=$(head -n "$MAX_LOG_LINES" "$LOG_FILE" 2>/dev/null)
        echo -e "${FULL_BLOCK}${OLD_CONTENT}" > "$LOG_FILE"
    else
        echo -e "${FULL_BLOCK}" > "$LOG_FILE"
    fi
}

mkdir -p "$(dirname "$LOG_FILE")"

# 1. 网络检测
if ! ping -c 1 -W 2 "$NAS_IP" > /dev/null 2>&1; then
    log "[OFFLINE] 警告: 无法 ping 通 NAS ($NAS_IP)，跳过。"
    finalize_log
    exit 0
fi

# 2. 挂载检测
if mountpoint -q "$MOUNT_PATH"; then
    if timeout 3 ls "$FLAG_FILE" > /dev/null 2>&1; then
        # 记录健康状态，并直接写入
        log "[HEALTHY] NFS 挂载正常且可读。"
        finalize_log
        exit 0
    else
        ERROR_MSG="挂载僵死 (Stale)"
    fi
else
    ERROR_MSG="挂载点丢失"
fi

# 3. 修复流程 (多步骤记录，将体现“块内正序”)
log "[RECOVER] 检测到异常: $ERROR_MSG，开始修复..."
umount -l "$MOUNT_PATH" > /dev/null 2>&1
umount -f "$MOUNT_PATH" > /dev/null 2>&1
sleep 2
mount -a
sleep 2

# 4. 验证结果
if mountpoint -q "$MOUNT_PATH" && [ -f "$FLAG_FILE" ]; then
    log "[SUCCESS] 挂载已恢复正常。"
else
    log "[FAILED] 自动修复失败，请检查 NAS 状态。"
fi

# 最后提交本次运行的所有日志
finalize_log