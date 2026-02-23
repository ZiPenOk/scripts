#!/bin/bash
# Debian 计划任务 自动化管理 V8

# 获取当前 crontab 内容
get_cron_data() {
    mapfile -t ALL_LINES < <(crontab -l 2>/dev/null)
}

# 严格判断是否为 Cron 任务行
is_real_task() {
    local line="$1"
    local clean=$(echo "$line" | sed 's/^[[:space:]]*#[[:space:]]*//')
    # 匹配 5 个由空格分隔的字段，每个字段允许数字、*、/、,、-
    if [[ "$clean" =~ ^([0-9/*,-]+[[:space:]]+){4}[0-9/*,-]+[[:space:]]+ ]]; then
        return 0
    fi
    [[ "$clean" =~ ^@ ]] && return 0
    return 1
}

# --- 增强版翻译函数：支持 */n 步进识别 ---
translate_cron() {
    local -a parts=($1)
    local m=${parts[0]}; local h=${parts[1]}; local d=${parts[2]}; local mon=${parts[3]}; local w=${parts[4]}
    
    local time_desc=""
    local date_desc=""

    # 1. 解析日期/周期部分 (Day/Week)
    if [[ "$w" =~ ^[0-6,7]+$ ]]; then          # 匹配一个或多个数字、逗号、7
        # 将逗号分隔的星期数字转换成中文名称
        IFS=',' read -ra days <<< "$w"
        local day_names=()
        for d in "${days[@]}"; do
            case $d in
                0|7) day_names+=("周日") ;;
                1) day_names+=("周一") ;;
                2) day_names+=("周二") ;;
                3) day_names+=("周三") ;;
                4) day_names+=("周四") ;;
                5) day_names+=("周五") ;;
                6) day_names+=("周六") ;;
            esac
        done
        # 用顿号连接，例如“每周日、周三”
        local joined=$(IFS='、'; echo "${day_names[*]}")
        date_desc="每周${joined}"
    elif [[ "$d" =~ ^\*/([0-9]+)$ ]]; then
        date_desc="每${BASH_REMATCH[1]}天"
    elif [[ "$d" =~ ^[0-9]+$ ]]; then
        date_desc="每月${d}号"
    elif [[ "$d" == "*" ]]; then
        date_desc="每天"
    fi

    # 2. 解析时间部分 (Hour/Minute)
    if [[ "$h" =~ ^[0-9]+$ ]] && [[ "$m" =~ ^[0-9]+$ ]]; then
        time_desc=$(printf "%02d:%02d" $h $m)
    elif [[ "$h" =~ ^\*/([0-9]+)$ ]]; then
        time_desc="每隔${BASH_REMATCH[1]}小时"
    elif [[ "$m" =~ ^\*/([0-9]+)$ ]]; then
        time_desc="每${BASH_REMATCH[1]}分钟"
    else
        time_desc="${h}点${m}分"
    fi

    # 3. 组合
    echo "${date_desc} ${time_desc}"
}

# 验证格式
validate_cron() {
    local expr="$1"
    local tmp_check=$(mktemp)
    echo "$expr /bin/true" > "$tmp_check"
    if ! crontab "$tmp_check" 2>/dev/null; then
        rm "$tmp_check"
        return 1
    fi
    save_to_system
    rm "$tmp_check"
    return 0
}

show_menu() {
    echo -e "\n=========================================="
    echo -e "       Debian 计划任务 自动化管理 V8"
    echo -e "=========================================="
    get_cron_data
    TASK_MAPPING=()
    local display_idx=0
    echo -e "序号   状态      时间进度          命令内容"
    echo "------------------------------------------"
    
    for i in "${!ALL_LINES[@]}"; do
        line="${ALL_LINES[$i]}"
        if is_real_task "$line"; then
            TASK_MAPPING+=("$i")
            if [[ "$line" =~ ^[[:space:]]*# ]]; then
                status="\033[31m[已停止]\033[0m"
                clean_line=$(echo "$line" | sed 's/^[[:space:]]*#[[:space:]]*//')
            else
                status="\033[32m[运行中]\033[0m"
                clean_line="$line"
            fi
            
            # 提取前5位时间
            time_part=$(echo "$clean_line" | awk '{print $1,$2,$3,$4,$5}')
            cmd_part=$(echo "$clean_line" | cut -d' ' -f6-)
            
            # 显示备注
            prev_idx=$((i-1))
            if [ $prev_idx -ge 0 ] && ! is_real_task "${ALL_LINES[$prev_idx]}" && [[ -n "${ALL_LINES[$prev_idx]}" ]]; then
                note_content=$(echo "${ALL_LINES[$prev_idx]}" | sed 's/^[[:space:]]*#//')
                echo -e "      \033[90m(备注: $note_content)\033[0m"
            fi
            
            printf "[\033[1;34m%2d\033[0m]  %-10b \033[36m%-15s\033[0m %s\n" "$display_idx" "$status" "$time_part" "$cmd_part"
            ((display_idx++))
        fi
    done
}

edit_task() {
    local idx=$1
    local real_idx=${TASK_MAPPING[$idx]}
    local line="${ALL_LINES[$real_idx]}"
    
    local is_commented=false
    [[ "$line" =~ ^[[:space:]]*# ]] && is_commented=true
    clean_line=$(echo "$line" | sed 's/^[[:space:]]*#[[:space:]]*//')
    old_cmd=$(echo "$clean_line" | cut -d' ' -f6-)

    # 1. 输入时间
    echo -e "\n[修改任务 $idx] 命令: $old_cmd"
    set -f
    read -r -p "请输入 Cron 表达式 (例如 30 11 */3 * *): " user_time
    if ! validate_cron "$user_time"; then
        echo -e "\033[31m错误: 时间格式无效！\033[0m"
        set +f; return
    fi

    # 2. 识别业务名称
    prev_idx=$((real_idx-1))
    local biz_name="定时任务"
    if [ $prev_idx -ge 0 ] && ! is_real_task "${ALL_LINES[$prev_idx]}"; then
        # 尝试剥离旧备注中的序号和时间描述，只取核心名称
        biz_name=$(echo "${ALL_LINES[$prev_idx]}" | sed -E 's/^#[[:space:]]*//; s/^[0-9]+\.[[:space:]]*//; s/[:：].*//')
    fi
    
    echo -e "当前识别到的任务名称为: \033[33m$biz_name\033[0m"
    read -r -p "修改任务名称? (直接回车保持不变, 或输入新名称): " new_biz_name
    [[ -n "$new_biz_name" ]] && biz_name="$new_biz_name"

    # 3. 组合
    local time_desc=$(translate_cron "$user_time")
    [[ $is_commented == true ]] && ALL_LINES[$real_idx]="#$user_time $old_cmd" || ALL_LINES[$real_idx]="$user_time $old_cmd"
    
    # 重构备注行
    local seq=$((idx + 1))
    ALL_LINES[$prev_idx]="# $seq. $biz_name：$time_desc 运行一次"

    set +f
    save_to_system
    echo -e "\033[32m>>> 修改成功！已自动更新备注文字。\033[0m"
}

save_to_system() {
    local tmp=$(mktemp)
    for l in "${ALL_LINES[@]}"; do echo "$l" >> "$tmp"; done
    crontab "$tmp" && rm "$tmp"
}

# --- 主循环 ---
while true; do
    show_menu
    echo "------------------------------------------"
    echo "操作: [数字] 切换状态 | [e] 修改时间/备注 | [q] 退出"
    read -p "请输入: " opt
    case $opt in
        [0-9]*)
            r_idx=${TASK_MAPPING[$opt]}
            if [ -n "$r_idx" ]; then
                if [[ "${ALL_LINES[$r_idx]}" =~ ^[[:space:]]*# ]]; then
                    ALL_LINES[$r_idx]=$(echo "${ALL_LINES[$r_idx]}" | sed 's/^[[:space:]]*#[[:space:]]*//')
                else
                    ALL_LINES[$r_idx]="#${ALL_LINES[$r_idx]}"
                fi
                save_to_system
            fi ;;
        e)
            read -p "修改几号任务? " eid
            [[ -n "${TASK_MAPPING[$eid]}" ]] && edit_task $eid ;;
        q) exit 0 ;;
    esac
done