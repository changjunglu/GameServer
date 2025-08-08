# 🚀 遊戲伺服器部署指南

## 📋 目錄
- [快速部署](#快速部署)
- [詳細部署步驟](#詳細部署步驟)
- [測試指南](#測試指南)
- [Git 工作流程](#git-工作流程)
- [故障排除](#故障排除)

---

## 🚀 快速部署

### 當前狀態
✅ **Railway 後端已部署**: `https://gameserver-production-ddf0.up.railway.app`  
✅ **前端設定已更新**: 指向正確的 Railway 網址  
✅ **CORS 已設定**: 允許 Netlify 網址  

### 快速部署步驟

#### 1. 推送到 GitHub
```bash
git add .
git commit -m "更新前端設定以連接 Railway 後端"
git push origin main
```

#### 2. 部署到 Netlify
1. 登入 [Netlify](https://netlify.com/)
2. 點擊 "New site from Git"
3. 選擇您的 GitHub 倉庫
4. 設定部署選項：
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

#### 3. 測試部署
```bash
# 測試後端
curl https://gameserver-production-ddf0.up.railway.app/health

# 測試前端
# 訪問您的 Netlify 網址
```

---

## 📝 詳細部署步驟

### 本地開發測試

#### 1. 啟動後端伺服器
```bash
cd server
npm run dev
```

#### 2. 啟動前端應用
```bash
cd client
npm start
```

#### 3. 訪問應用
- 前端: http://localhost:3000
- 後端: http://localhost:3001

### Railway 後端部署

#### 方法 1: 直接部署 server 資料夾 (推薦)
1. 登入 [Railway](https://railway.app/)
2. 點擊 "New Project" → "Deploy from GitHub repo"
3. 選擇您的 GitHub 倉庫
4. **重要設定**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### 方法 2: 使用根目錄部署
- **Build Command**: `npm run deploy:server`
- **Start Command**: `npm start`

#### 環境變數設定
```
NODE_ENV=production
```

### Netlify 前端部署

#### 1. 更新伺服器網址
在 `client/src/App.js` 中更新 `SERVER_URL`：

```javascript
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gameserver-production-ddf0.up.railway.app'
  : 'http://localhost:3001';
```

#### 2. 部署設定
- **Base directory**: `client`
- **Build command**: `npm run build`
- **Publish directory**: `build`

---

## 🧪 測試指南

### 自動化測試結果
✅ 服務器連接: 通過  
✅ 玩家登入: 通過  
✅ 大廳聊天: 通過  
✅ 創建房間: 通過  
✅ 加入房間: 通過  
✅ 房間聊天: 通過  
✅ 開始遊戲: 通過  
✅ 遊戲動作: 通過  
✅ 遊戲同步: 通過  
✅ 食物系統: 通過  
✅ 分數系統: 通過  
✅ 遊戲結束: 通過  
✅ 離開房間: 通過  
✅ 斷線處理: 通過  

**總計: 14/14 項測試通過** 🎉

### 手動測試檢查清單

#### 基本功能檢查
- [ ] 打開 `http://localhost:3000`
- [ ] 輸入玩家名稱並登入
- [ ] 在大廳發送聊天訊息
- [ ] 創建一個貪食蛇房間
- [ ] 用另一個瀏覽器標籤加入房間
- [ ] 在房間內發送聊天訊息

#### 遊戲功能檢查
- [ ] 房主點擊"開始遊戲"
- [ ] 所有玩家進入遊戲界面
- [ ] 使用鍵盤方向鍵控制角色
- [ ] 使用虛擬按鈕控制角色
- [ ] 看到分數排行榜更新
- [ ] 選擇的遊戲時間後自動結束（30秒或60秒）

#### 多人遊戲檢查
- [ ] 3-4個玩家同時在遊戲中
- [ ] 每個玩家有不同顏色的角色
- [ ] 所有玩家看到相同的遊戲狀態
- [ ] 果子被吃掉後新果子生成
- [ ] 分數正確計算和同步

#### 界面檢查
- [ ] 遊戲畫布正常顯示
- [ ] 網格背景清晰
- [ ] 果子顯示為紅色方塊
- [ ] 角色有不同顏色
- [ ] 虛擬鍵盤按鈕響應
- [ ] 倒計時正常顯示

#### 錯誤處理檢查
- [ ] 關閉瀏覽器標籤後重新連接
- [ ] 房主離開後房主權限轉移
- [ ] 房間滿員時拒絕新玩家
- [ ] 遊戲進行中無法加入房間

### 測試腳本

#### 核心測試腳本
```bash
# 完整整合測試
node scripts/test/integration-test.js

# 多人遊戲測試
node scripts/test/multiplayer-game-test.js

# 貪食蛇遊戲測試
node scripts/test/snake-game-test.js
```

#### 部署測試腳本
```bash
# 部署環境測試
node scripts/deployment/deployment-test.js

# 快速部署檢查
node scripts/deployment/check-deployment.js
```

---

## 🔄 Git 工作流程

### 🚫 自動化已關閉
從現在開始，所有的 git commit 和 push 都需要手動執行。

### 📋 手動 Git 操作步驟

#### 1. 檢查狀態
```bash
git status
```

#### 2. 添加文件
```bash
# 添加所有更改
git add .

# 或添加特定文件
git add client/src/App.js
git add server/index.js
```

#### 3. 提交更改
```bash
# 使用模板（推薦）
git commit

# 或直接提交
git commit -m "feat: 新增遊戲大廳功能"
```

#### 4. 推送到遠端
```bash
git push origin main
```

### 🏷️ Commit 訊息格式

#### 類型
- `feat`: 新功能
- `fix`: 錯誤修正
- `docs`: 文檔更新
- `style`: 程式碼格式調整
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置或輔助工具變動

#### 範例
```bash
git commit -m "feat: 新增遊戲大廳和玩家列表"
git commit -m "fix: 修正 Socket.IO 連接問題"
git commit -m "docs: 更新部署指南"
git commit -m "refactor: 重構遊戲狀態管理"
```

### 🔍 常用命令
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

---

## 🐛 故障排除

### 常見問題

#### 1. CORS 錯誤
- 確保 Railway 網址正確
- 檢查 `server/index.js` 中的 CORS 設定

#### 2. Socket.IO 連接失敗
- 確認伺服器正在運行
- 檢查網路連接
- 查看瀏覽器控制台錯誤

#### 3. 部署失敗
- 檢查 `package.json` 中的腳本
- 確認所有依賴都已安裝
- 查看部署日誌

#### 4. ESLint 錯誤
- 檢查是否有未使用的變數或語法錯誤
- 本地測試: 執行 `npm run build` 檢查建置是否成功
- Console 語句: 生產環境中不允許 console.log，已使用環境變數控制

### 除錯技巧

#### 1. 本地測試
```bash
# 測試後端
curl http://localhost:3001/health

# 測試前端
open http://localhost:3000
```

#### 2. 查看日誌
- Railway: 在專案頁面查看部署日誌
- Netlify: 在部署頁面查看建置日誌

#### 3. 環境變數檢查
- 確保所有環境變數都已正確設定
- 檢查大小寫是否正確

### Railway 常見錯誤

#### 1. "react-scripts: not found"
- 原因：Railway 嘗試執行前端的 build 命令
- 解決：確保 Root Directory 設定為 `server`

#### 2. "npm run build" 失敗
- 原因：根目錄的 build 命令不適用於後端
- 解決：使用 `npm install` 作為 Build Command

#### 3. 端口錯誤
- 原因：Railway 自動設定 PORT 環境變數
- 解決：確保程式碼使用 `process.env.PORT`

### 檢查清單

- [x] Railway 後端已部署
- [x] 前端設定已更新
- [x] CORS 已設定
- [ ] 推送到 GitHub
- [ ] 部署到 Netlify
- [ ] 測試連接
- [ ] 測試多人功能

---

## 📊 監控和維護

### 健康檢查
定期檢查：
- Railway 服務狀態
- Netlify 部署狀態
- 應用程式響應時間

### 日誌監控
- 查看 Railway 應用日誌
- 監控錯誤率和性能

### 備份
- 定期備份程式碼到 GitHub
- 保存重要的環境變數設定

---

## 🎯 完成後

部署成功後，您將擁有：
- **後端**: `https://gameserver-production-ddf0.up.railway.app`
- **前端**: `https://your-netlify-app.netlify.app`

兩個服務可以正常通訊，支援即時多人遊戲功能！ 