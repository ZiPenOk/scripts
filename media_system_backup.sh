#!/bin/bash
# Emby 配置+Strm+Json备份

# ================= 配置区域 =================
SOURCE_STRM="/mnt/smartstrm/strm"
PREFIX_STRM="115_Strm_Backup_"
SOURCE_JSON="/mnt/smartstrm/StrmAssistant/json/"
PREFIX_JSON="115_Json_Backup_"
SOURCE_EMBY="/home/embyserver/config"
PREFIX_EMBY="Emby_Config_Backup_"

DEST_DIR="/mnt/synology_nfs/video/emby_backup/"
LOG_FILE="/home/script/logs/media_backup_all.log" 
KEEP_NUM=2
# 日志保留总行数
MAX_LOG_LINES=500
# ===========================================

# 临时变量，用于存储本次运行的所有日志
SESSION_LOG=""

if [ -t 1 ]; then RUN_MODE="SSH"; else RUN_MODE="CRON"; fi

log() {
    local STEP=$1
    local CONTENT=$2
    local MSG="$(date '+%Y-%m-%d %H:%M:%S') - [${STEP}] ${CONTENT}"
    
    # 将日志追加到临时变量中（正序排列）
    SESSION_LOG="${SESSION_LOG}${MSG}\n"
    
    if [ "$RUN_MODE" == "SSH" ]; then 
        echo -e "\e[32m${MSG}\e[0m"
    fi
}

# 脚本结束前调用的函数：将本次运行记录整体推送到文件顶部
finalize_log() {
    local SEPARATOR="================================================================================\n"
    local FULL_BLOCK="${SESSION_LOG}${SEPARATOR}"
    
    if [ -f "$LOG_FILE" ]; then
        # 读取旧日志的前 N 行，并把新块拼在最前面
        local OLD_CONTENT=$(head -n "$MAX_LOG_LINES" "$LOG_FILE" 2>/dev/null)
        echo -e "${FULL_BLOCK}${OLD_CONTENT}" > "$LOG_FILE"
    else
        echo -e "${FULL_BLOCK}" > "$LOG_FILE"
    fi
}

mkdir -p "$(dirname "$LOG_FILE")"

if [ ! -d "$DEST_DIR" ]; then
    log "CRITICAL" "错误：目标备份目录不存在！任务终止。"
    finalize_log
    exit 1
fi

do_backup() {
    local SRC="$1"
    local PREFIX="$2"
    local EXCLUDE_OPTS="$3"
    local TASK_NAME=$(basename "$SRC" | cut -c 1-10)
    local STATE_LIST="$DEST_DIR/.${PREFIX}list_last.txt"
    local CURR_LIST="$DEST_DIR/.${PREFIX}list_curr.txt"

    log "$TASK_NAME" ">>> 检查任务: $SRC"
    if [ ! -d "$SRC" ]; then
        log "$TASK_NAME" "跳过: 源目录不存在。"
        return
    fi

    export LC_ALL=C
    find "$SRC" -noleaf -type f $EXCLUDE_OPTS \
        ! -path "*/@eaDir/*" ! -path "*/#recycle/*" \
        ! -name ".DS_Store" ! -name ".*" \
        -printf '%p %s\n' | sort > "$CURR_LIST"

    local IF_CHANGED=true
    if [ -f "$STATE_LIST" ]; then
        if diff "$STATE_LIST" "$CURR_LIST" > /dev/null; then
            log "$TASK_NAME" "内容未变动，跳过。"
            rm "$CURR_LIST"
            IF_CHANGED=false
        fi
    fi

    if [ "$IF_CHANGED" = true ]; then
        local DATE_STR=$(date +%Y%m%d_%H%M%S)
        local BACKUP_NAME="${PREFIX}${DATE_STR}.tar.gz"
        log "$TASK_NAME" "执行打包: $BACKUP_NAME"
        
        tar --warning=no-file-changed -czf "$DEST_DIR/$BACKUP_NAME" \
            --exclude="cache" --exclude="logs" --exclude="transcoding-temp" \
            -C "$(dirname "$SRC")" "$(basename "$SRC")" 2>/dev/null
        
        if [ $? -eq 0 ] || [ $? -eq 1 ]; then
            mv "$CURR_LIST" "$STATE_LIST"
            cd "$DEST_DIR" || return
            ls -tp | grep -v '/$' | grep "$PREFIX" | tail -n +$((KEEP_NUM + 1)) | xargs -r rm
            log "$TASK_NAME" "成功。"
        else
            log "$TASK_NAME" "失败！"
        fi
    fi
    SESSION_LOG="${SESSION_LOG}------------------------------------------------------------\n"
}

# 主程序逻辑
SESSION_LOG="${SESSION_LOG}--- 任务启动 (模式: $RUN_MODE) - $(date) ---\n"

do_backup "$SOURCE_STRM" "$PREFIX_STRM"
do_backup "$SOURCE_JSON" "$PREFIX_JSON"
do_backup "$SOURCE_EMBY" "$PREFIX_EMBY" "! -path '*/cache/*' ! -path '*/logs/*' ! -path '*/metadata/*'"

log "SYSTEM" "--- 所有任务已完成 ---"
# 最后统一写入文件
finalize_log