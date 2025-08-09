@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 🚀 GitHub 上傳前檢查腳本 (Windows 版本)
REM 使用方法: github-check.bat

echo 🔍 開始執行 GitHub 上傳前檢查...
echo ==================================

REM 檢查結果計數器
set PASS=0
set FAIL=0
set WARN=0

REM 檢查函數
:check_item
set description=%~1
set command=%~2
set expected_result=%~3

echo -n 檢查: %description% ... 

%command% >nul 2>&1
if %errorlevel% equ 0 (
    if "%expected_result%"=="false" (
        echo ❌ 失敗
        set /a FAIL+=1
    ) else (
        echo ✅ 通過
        set /a PASS+=1
    )
) else (
    if "%expected_result%"=="false" (
        echo ✅ 通過
        set /a PASS+=1
    ) else (
        echo ❌ 失敗
        set /a FAIL+=1
    )
)
goto :eof

echo.
echo 1. 安全性檢查
echo ----------------

REM 檢查是否有 .env 檔案
call :check_item "沒有 .env 檔案" "dir /b .env* 2>nul | findstr ." "false"

REM 檢查 .gitignore 是否存在
call :check_item ".gitignore 檔案存在" "if exist .gitignore (exit 0) else (exit 1)" "true"

REM 檢查 .gitignore 是否包含 .env
call :check_item ".gitignore 包含 .env" "findstr /c:".env" .gitignore >nul" "true"

echo.
echo 2. 專案完整性檢查
echo ------------------

REM 檢查主要目錄
call :check_item "前端目錄存在" "if exist client (exit 0) else (exit 1)" "true"
call :check_item "後端目錄存在" "if exist server (exit 0) else (exit 1)" "true"
call :check_item "文檔目錄存在" "if exist docs (exit 0) else (exit 1)" "true"
call :check_item "腳本目錄存在" "if exist scripts (exit 0) else (exit 1)" "true"

REM 檢查主要檔案
call :check_item "package.json 存在" "if exist package.json (exit 0) else (exit 1)" "true"
call :check_item "server package.json 存在" "if exist server\package.json (exit 0) else (exit 1)" "true"
call :check_item "client package.json 存在" "if exist client\package.json (exit 0) else (exit 1)" "true"

echo.
echo 3. Git 狀態檢查
echo --------------

REM 檢查是否為 Git 倉庫
if exist .git (
    echo Git 倉庫狀態:
    git status --short
    echo.
    
    REM 檢查是否有未提交的更改
    git status --porcelain >nul 2>&1
    if %errorlevel% equ 0 (
        echo ⚠️  有未提交的更改
        set /a WARN+=1
    ) else (
        echo ✅ 工作目錄乾淨
        set /a PASS+=1
    )
) else (
    echo ⚠️  不是 Git 倉庫
    set /a WARN+=1
)

echo.
echo 4. 程式碼品質檢查
echo ------------------

REM 檢查 Node.js 專案
where node >nul 2>&1
if %errorlevel% equ 0 (
    REM 檢查語法錯誤
    if exist "server\index.js" (
        call :check_item "後端語法檢查" "node -c server\index.js" "true"
    )
    
    REM 檢查依賴是否安裝
    if exist "node_modules" (
        echo ✅ 根目錄依賴已安裝
        set /a PASS+=1
    ) else (
        echo ⚠️  根目錄依賴未安裝
        set /a WARN+=1
    )
    
    if exist "server\node_modules" (
        echo ✅ 後端依賴已安裝
        set /a PASS+=1
    ) else (
        echo ⚠️  後端依賴未安裝
        set /a WARN+=1
    )
    
    if exist "client\node_modules" (
        echo ✅ 前端依賴已安裝
        set /a PASS+=1
    ) else (
        echo ⚠️  前端依賴未安裝
        set /a WARN+=1
    )
) else (
    echo ⚠️  Node.js 未安裝
    set /a WARN+=1
)

echo.
echo 5. 檢查結果摘要
echo ==================

echo ✅ 通過: %PASS%
echo ❌ 失敗: %FAIL%
echo ⚠️  警告: %WARN%

echo.
echo 6. 建議操作
echo =============

if %FAIL% equ 0 (
    if %WARN% equ 0 (
        echo 🎉 所有檢查都通過！可以安全地上傳到 GitHub
        echo 建議執行: git add . ^&^& git commit -m "更新專案" ^&^& git push
    ) else (
        echo ✅ 主要檢查通過，但有 %WARN% 個警告
        echo 建議處理警告後再上傳
    )
) else (
    echo ❌ 有 %FAIL% 個檢查失敗，請先解決這些問題
    echo 不建議在問題解決前上傳到 GitHub
)

echo.
echo 7. 詳細檢查報告
echo ==================

echo 📋 請參考 docs\GITHUB_CHECKLIST.md 進行詳細檢查
echo 🔍 使用 'git status' 檢查 Git 狀態
echo 📝 使用 'git diff --cached' 檢查暫存區內容

echo.
echo ==================================
echo 🔍 GitHub 上傳前檢查完成！
pause
