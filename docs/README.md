# 遊戲伺服器

一個基於 Socket.IO 的多人遊戲伺服器，支援聊天功能和貪食蛇遊戲。

## 功能特色

- 🎮 多人遊戲支援
- 💬 即時聊天功能
- 🏠 房間管理系統
- 🐍 貪食蛇遊戲
- 📱 響應式設計

## 快速開始

### 安裝依賴

```bash
npm run install:all
```

### 開發模式

```bash
npm run dev
```

這會同時啟動伺服器（port 3001）和客戶端（port 3000）。

### 生產部署

```bash
npm run build
npm run deploy:server
```

## 測試檔案

專案包含以下測試檔案：

### 核心測試
- `scripts/test/integration-test.js` - 完整整合測試
- `scripts/test/multiplayer-game-test.js` - 多人遊戲測試
- `scripts/test/snake-game-test.js` - 貪食蛇遊戲測試

### 功能測試
- `scripts/tools/chat-test.html` - 聊天功能測試頁面
- `scripts/deployment/deployment-test.js` - 部署測試
- `scripts/deployment/check-deployment.js` - 部署檢查

### 部署相關
- `scripts/deployment/deploy-server.js` - 伺服器部署腳本

## 專案結構

```
GameServer/
├── client/          # React 前端
├── server/          # Express + Socket.IO 後端
├── *.js            # 測試腳本
├── *.md            # 文檔
└── *.json          # 配置檔案
```

## 開發指南

### 聊天功能
- 支援房間內即時聊天
- 聊天輸入框固定在底部，不會消失
- 無聊天次數限制

### 遊戲功能
- 支援多人貪食蛇遊戲
- 即時分數顯示
- 遊戲時長可配置

### 部署
- 支援 Railway 平台部署
- 自動健康檢查
- 環境變數配置

## 技術棧

- **前端**: React, Socket.IO Client
- **後端**: Node.js, Express, Socket.IO
- **部署**: Railway

## 貢獻

請參考 `GIT_WORKFLOW.md` 了解開發流程。

## 授權

MIT License 