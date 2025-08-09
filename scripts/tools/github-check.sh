#!/bin/bash

# 🚀 GitHub 上傳前檢查腳本
# 使用方法: ./github-check.sh

echo "🔍 開始執行 GitHub 上傳前檢查..."
echo "=================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查結果計數器
PASS=0
FAIL=0
WARN=0

# 檢查函數
check_item() {
    local description="$1"
    local command="$2"
    local expected_result="$3"
    
    echo -n "檢查: $description ... "
    
    if eval "$command" > /dev/null 2>&1; then
        if [ "$expected_result" = "false" ]; then
            echo -e "${RED}❌ 失敗${NC}"
            FAIL=$((FAIL + 1))
        else
            echo -e "${GREEN}✅ 通過${NC}"
            PASS=$((PASS + 1))
        fi
    else
        if [ "$expected_result" = "false" ]; then
            echo -e "${GREEN}✅ 通過${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "${RED}❌ 失敗${NC}"
            FAIL=$((FAIL + 1))
        fi
    fi
}

echo -e "\n${BLUE}1. 安全性檢查${NC}"
echo "----------------"

# 檢查是否有 .env 檔案
check_item "沒有 .env 檔案" "find . -name '.env*' -type f | grep -q ." "false"

# 檢查是否有敏感資訊
check_item "沒有硬編碼密碼" "grep -r 'password\|secret\|token\|key' . --exclude-dir=node_modules --exclude-dir=.git | grep -v 'password_hash\|session_token' | grep -q ." "false"

# 檢查是否有資料庫連接字串
check_item "沒有資料庫連接字串" "grep -r 'mongodb://\|postgres://\|mysql://\|redis://' . --exclude-dir=node_modules --exclude-dir=.git | grep -q ." "false"

# 檢查 .gitignore 是否存在
check_item ".gitignore 檔案存在" "test -f .gitignore" "true"

# 檢查 .gitignore 是否包含 .env
check_item ".gitignore 包含 .env" "grep -q '\.env' .gitignore" "true"

echo -e "\n${BLUE}2. 專案完整性檢查${NC}"
echo "----------------------"

# 檢查主要目錄
check_item "前端目錄存在" "test -d client" "true"
check_item "後端目錄存在" "test -d server" "true"
check_item "文檔目錄存在" "test -d docs" "true"
check_item "腳本目錄存在" "test -d scripts" "true"

# 檢查主要檔案
check_item "package.json 存在" "test -f package.json" "true"
check_item "server package.json 存在" "test -f server/package.json" "true"
check_item "client package.json 存在" "test -f client/package.json" "true"

echo -e "\n${BLUE}3. Git 狀態檢查${NC}"
echo "----------------"

# 檢查是否為 Git 倉庫
if [ -d .git ]; then
    echo -e "Git 倉庫狀態:"
    git status --short
    echo ""
    
    # 檢查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  有未提交的更改${NC}"
        WARN=$((WARN + 1))
    else
        echo -e "${GREEN}✅ 工作目錄乾淨${NC}"
        PASS=$((PASS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  不是 Git 倉庫${NC}"
    WARN=$((WARN + 1))
fi

echo -e "\n${BLUE}4. 程式碼品質檢查${NC}"
echo "----------------------"

# 檢查 Node.js 專案
if command -v node >/dev/null 2>&1; then
    # 檢查語法錯誤
    if [ -f "server/index.js" ]; then
        check_item "後端語法檢查" "node -c server/index.js" "true"
    fi
    
    # 檢查依賴是否安裝
    if [ -d "node_modules" ]; then
        echo -e "✅ 根目錄依賴已安裝"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  根目錄依賴未安裝${NC}"
        WARN=$((WARN + 1))
    fi
    
    if [ -d "server/node_modules" ]; then
        echo -e "✅ 後端依賴已安裝"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  後端依賴未安裝${NC}"
        WARN=$((WARN + 1))
    fi
    
    if [ -d "client/node_modules" ]; then
        echo -e "✅ 前端依賴已安裝"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}⚠️  前端依賴未安裝${NC}"
        WARN=$((WARN + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Node.js 未安裝${NC}"
    WARN=$((WARN + 1))
fi

echo -e "\n${BLUE}5. 檢查結果摘要${NC}"
echo "=================="

echo -e "✅ 通過: $PASS"
echo -e "❌ 失敗: $FAIL"
echo -e "⚠️  警告: $WARN"

echo -e "\n${BLUE}6. 建議操作${NC}"
echo "=============="

if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}🎉 所有檢查都通過！可以安全地上傳到 GitHub${NC}"
        echo -e "${GREEN}建議執行: git add . && git commit -m '更新專案' && git push${NC}"
    else
        echo -e "${GREEN}✅ 主要檢查通過，但有 $WARN 個警告${NC}"
        echo -e "${YELLOW}建議處理警告後再上傳${NC}"
    fi
else
    echo -e "${RED}❌ 有 $FAIL 個檢查失敗，請先解決這些問題${NC}"
    echo -e "${RED}不建議在問題解決前上傳到 GitHub${NC}"
fi

echo -e "\n${BLUE}7. 詳細檢查報告${NC}"
echo "=================="

echo -e "📋 請參考 docs/GITHUB_CHECKLIST.md 進行詳細檢查"
echo -e "🔍 使用 'git status' 檢查 Git 狀態"
echo -e "📝 使用 'git diff --cached' 檢查暫存區內容"

echo -e "\n=================================="
echo "🔍 GitHub 上傳前檢查完成！"
