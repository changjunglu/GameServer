# Git 手動工作流程

## 🚫 自動化已關閉

從現在開始，所有的 git commit 和 push 都需要手動執行。

## 📋 手動 Git 操作步驟

### 1. 檢查狀態
```bash
git status
```

### 2. 添加文件
```bash
# 添加所有更改
git add .

# 或添加特定文件
git add client/src/App.js
git add server/index.js
```

### 3. 提交更改
```bash
# 使用模板（推薦）
git commit

# 或直接提交
git commit -m "feat: 新增遊戲大廳功能"
```

### 4. 推送到遠端
```bash
git push origin main
```

## 🏷️ Commit 訊息格式

### 類型
- `feat`: 新功能
- `fix`: 錯誤修正
- `docs`: 文檔更新
- `style`: 程式碼格式調整
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置或輔助工具變動

### 範例
```bash
git commit -m "feat: 新增遊戲大廳和玩家列表"
git commit -m "fix: 修正 Socket.IO 連接問題"
git commit -m "docs: 更新部署指南"
git commit -m "refactor: 重構遊戲狀態管理"
```

## ⚠️ 注意事項

1. **每次提交前檢查**: 使用 `git status` 確認要提交的內容
2. **有意義的訊息**: 寫清楚此次更改的目的和影響
3. **小步提交**: 每次提交專注於一個功能或修正
4. **測試後提交**: 確保程式碼能正常運行後再提交

## 🔍 常用命令

```bash
# 查看更改內容
git diff

# 查看提交歷史
git log --oneline

# 查看特定文件的歷史
git log --follow client/src/App.js

# 撤銷最後一次提交（保留更改）
git reset --soft HEAD~1

# 撤銷最後一次提交（丟棄更改）
git reset --hard HEAD~1
```

## 🎯 開發流程建議

1. **功能開發**: 在本地分支開發新功能
2. **測試驗證**: 確保功能正常運作
3. **提交更改**: 使用有意義的 commit 訊息
4. **推送到遠端**: 同步到 GitHub
5. **部署測試**: 確認部署後功能正常 