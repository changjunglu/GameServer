# 部署指南

## 本地開發測試

專案已經設定完成，可以進行本地開發測試：

### 1. 啟動後端伺服器
```bash
cd server
npm run dev
```

### 2. 啟動前端應用
```bash
cd client
npm start
```

### 3. 訪問應用
- 前端: http://localhost:3000
- 後端: http://localhost:3001

## 部署到 Railway (後端)

### 步驟 1: 準備 GitHub 倉庫
1. 將整個專案推送到 GitHub
2. 確保 `server/` 資料夾包含所有必要檔案

### 步驟 2: 在 Railway 部署
1. 登入 [Railway](https://railway.app/)
2. 點擊 "New Project" → "Deploy from GitHub repo"
3. 選擇您的 GitHub 倉庫
4. **重要**: 在部署設定中設定：
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 步驟 3: 設定環境變數
在 Railway 專案設定中添加：
- `NODE_ENV=production`
- `PORT` (Railway 會自動設定)

### 步驟 4: 獲取部署網址
部署完成後，Railway 會提供一個網址，例如：
`https://your-app-name.railway.app`

### 故障排除
如果部署失敗，請檢查：
1. **Root Directory**: 確保設定為 `server`
2. **Build Command**: 應該是 `npm install`
3. **Start Command**: 應該是 `npm start`
4. **環境變數**: 確保 `NODE_ENV=production`

## 部署到 Netlify (前端)

### 步驟 1: 更新伺服器網址
在 `client/src/App.js` 中更新 `SERVER_URL`：

```javascript
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-railway-app.railway.app' // 替換為您的 Railway 網址
  : 'http://localhost:3001';
```

### 步驟 2: 在 Netlify 部署
1. 登入 [Netlify](https://netlify.com/)
2. 點擊 "New site from Git"
3. 選擇您的 GitHub 倉庫
4. 設定部署選項：
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

### 步驟 3: 設定環境變數 (可選)
在 Netlify 中設定：
- `REACT_APP_SERVER_URL`: 您的 Railway 網址

## 測試部署

### 1. 測試後端
```bash
curl https://your-railway-app.railway.app/health
```

應該返回：
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00.000Z"}
```

### 2. 測試前端
訪問您的 Netlify 網址，應該能看到遊戲介面。

### 3. 測試多人功能
- 開啟多個瀏覽器視窗
- 輸入不同玩家名稱
- 測試移動和聊天功能

## 故障排除

### 常見問題

1. **CORS 錯誤**
   - 確保 Railway 網址正確
   - 檢查 `server/index.js` 中的 CORS 設定

2. **Socket.IO 連接失敗**
   - 確認伺服器正在運行
   - 檢查網路連接
   - 查看瀏覽器控制台錯誤

3. **部署失敗**
   - 檢查 `package.json` 中的腳本
   - 確認所有依賴都已安裝
   - 查看部署日誌

### 除錯技巧

1. **本地測試**
   ```bash
   # 測試後端
   curl http://localhost:3001/health
   
   # 測試前端
   open http://localhost:3000
   ```

2. **查看日誌**
   - Railway: 在專案頁面查看部署日誌
   - Netlify: 在部署頁面查看建置日誌

3. **環境變數檢查**
   - 確保所有環境變數都已正確設定
   - 檢查大小寫是否正確

## 更新部署

### 更新後端
1. 修改 `server/` 中的程式碼
2. 推送到 GitHub
3. Railway 會自動重新部署

### 更新前端
1. 修改 `client/` 中的程式碼
2. 推送到 GitHub
3. Netlify 會自動重新部署

## 監控和維護

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