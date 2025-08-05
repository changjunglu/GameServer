# 測試腳本索引

## 核心測試

### `scripts/test/integration-test.js`
完整整合測試，包含：
- 玩家登入/登出
- 房間創建/加入/離開
- 聊天功能
- 遊戲開始/結束
- 多人同步

**使用方法：**
```bash
node scripts/test/integration-test.js
```

### `scripts/test/multiplayer-game-test.js`
多人遊戲測試，專注於：
- 多人房間管理
- 玩家同步
- 遊戲狀態同步

**使用方法：**
```bash
node scripts/test/multiplayer-game-test.js
```

### `scripts/test/snake-game-test.js`
貪食蛇遊戲測試，包含：
- 遊戲邏輯測試
- 移動控制
- 分數計算
- 遊戲結束條件

**使用方法：**
```bash
node scripts/test/snake-game-test.js
```

## 功能測試

### `scripts/tools/chat-test.html`
聊天功能測試頁面，用於：
- 測試聊天輸入框
- 驗證聊天訊息發送
- 檢查聊天記錄顯示

**使用方法：**
在瀏覽器中打開 `scripts/tools/chat-test.html`

## 部署測試

### `scripts/deployment/deployment-test.js`
部署環境測試，檢查：
- 伺服器連接
- 環境變數
- 健康檢查端點

**使用方法：**
```bash
node scripts/deployment/deployment-test.js
```

### `scripts/deployment/check-deployment.js`
快速部署檢查，驗證：
- Railway 部署狀態
- 伺服器響應
- 基本功能

**使用方法：**
```bash
node scripts/deployment/check-deployment.js
```

## 部署腳本

### `scripts/deployment/deploy-server.js`
伺服器部署腳本，用於：
- 自動部署到 Railway
- 環境配置
- 部署驗證

**使用方法：**
```bash
node scripts/deployment/deploy-server.js
```

## 測試建議

1. **開發階段**：使用 `scripts/test/integration-test.js` 進行完整測試
2. **功能測試**：使用 `scripts/tools/chat-test.html` 測試聊天功能
3. **遊戲測試**：使用 `scripts/test/snake-game-test.js` 測試遊戲邏輯
4. **部署前**：使用 `scripts/deployment/deployment-test.js` 驗證部署環境
5. **部署後**：使用 `scripts/deployment/check-deployment.js` 快速檢查

## 注意事項

- 所有測試腳本都需要先啟動伺服器
- 測試前確保沒有其他測試正在運行
- 某些測試可能需要多個客戶端連接
- 部署測試需要正確的環境變數設定 