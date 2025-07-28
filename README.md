# 多人遊戲伺服器

這是一個簡單的多人遊戲專案，用於測試 Socket.IO 和即時狀態同步功能。

## 功能特色

- 🔄 即時 Socket.IO 連接
- 👥 多人遊戲支援
- 💬 即時聊天功能
- 🎮 簡單的點擊移動遊戲
- 📱 響應式設計
- 🚀 支援本地開發和雲端部署

## 專案結構

```
GameServer/
├── client/          # 前端 React 應用
├── server/          # 後端 Node.js 伺服器
├── package.json     # 根目錄配置
└── README.md        # 專案說明
```

## 本地開發

### 前置需求

- Node.js 18+
- npm 或 yarn

### 安裝依賴

```bash
# 安裝所有依賴（包含前端和後端）
npm run install:all
```

### 啟動開發伺服器

```bash
# 同時啟動前端和後端
npm run dev

# 或分別啟動
npm run server:dev  # 後端 (port 3001)
npm run client:dev  # 前端 (port 3000)
```

### 訪問應用

- 前端: http://localhost:3000
- 後端: http://localhost:3001

## 部署

### 前端部署到 Netlify

1. 將 `client` 資料夾推送到 GitHub
2. 在 Netlify 中連接 GitHub 倉庫
3. 設定建置指令：`npm run build`
4. 設定發布資料夾：`build`
5. 部署後，更新 `client/src/App.js` 中的 `SERVER_URL` 為您的 Railway 網址

### 後端部署到 Railway

1. 將 `server` 資料夾推送到 GitHub
2. 在 Railway 中連接 GitHub 倉庫
3. 設定環境變數：
   - `NODE_ENV=production`
   - `PORT` (Railway 會自動設定)
4. 部署後，更新前端的 `SERVER_URL` 為 Railway 提供的網址

## 環境變數

### 後端 (server/)

- `PORT`: 伺服器端口 (預設: 3001)
- `NODE_ENV`: 環境模式 (development/production)

### 前端 (client/)

- `REACT_APP_SERVER_URL`: 後端伺服器網址 (可選)

## 遊戲功能

### 基本操作

1. **加入遊戲**: 輸入玩家名稱並點擊「加入遊戲」
2. **移動角色**: 點擊遊戲畫布來移動您的角色
3. **聊天**: 在右側聊天區域發送訊息
4. **即時同步**: 所有玩家的位置和訊息都會即時同步

### 技術特色

- **Socket.IO**: 即時雙向通訊
- **Canvas API**: 遊戲畫面渲染
- **React Hooks**: 狀態管理
- **CORS**: 跨域請求處理
- **響應式設計**: 支援桌面和行動裝置

## 故障排除

### 常見問題

1. **無法連接到伺服器**
   - 確保後端伺服器正在運行
   - 檢查端口是否被佔用
   - 確認防火牆設定

2. **部署後無法連接**
   - 更新前端的 `SERVER_URL` 為正確的生產環境網址
   - 確認 Railway 服務正在運行
   - 檢查 CORS 設定

3. **Socket.IO 連接失敗**
   - 確認伺服器 URL 正確
   - 檢查網路連接
   - 查看瀏覽器控制台錯誤訊息

## 開發建議

- 使用 `npm run dev` 進行本地開發
- 修改程式碼後會自動重新載入
- 查看瀏覽器控制台和伺服器日誌來除錯
- 使用多個瀏覽器視窗來測試多人功能

## 授權

MIT License 