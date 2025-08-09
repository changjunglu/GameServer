# 🎮 多人即時遊戲平台 - 功能需求文件 (FRD)

## 📋 文件資訊

| 項目 | 內容 |
|------|------|
| **文件版本** | 1.0 |
| **建立日期** | 2024年12月 |
| **文件狀態** | 草稿 |
| **負責人** | 系統分析師 |
| **相關文件** | BRD.md, PRD.md |

---

## 🎯 1. 系統概述

### 1.1 系統目標
建立一個**即時、穩定、易用的多人遊戲平台**，支援多房間、多玩家同時進行貪食蛇遊戲，並提供豐富的社交互動功能。

### 1.2 系統範圍
- **包含**: 用戶管理、遊戲大廳、房間管理、多人遊戲、即時聊天
- **不包含**: 用戶註冊、密碼管理、付費功能、廣告系統

### 1.3 系統架構
- **前端**: React.js + Socket.IO Client
- **後端**: Node.js + Express + Socket.IO
- **通訊**: WebSocket 即時通訊
- **部署**: Railway (後端) + Netlify (前端)

---

## 👥 2. 用戶角色定義

### 2.1 主要角色

#### 2.1.1 遊戲玩家 (Player)
- **描述**: 使用平台進行遊戲的主要用戶
- **權限**: 登入、聊天、創建房間、加入房間、參與遊戲

#### 2.1.2 房主 (Host)
- **描述**: 創建遊戲房間的玩家
- **特殊權限**: 開始遊戲、結束遊戲、管理房間設定

#### 2.1.3 系統管理員 (Admin)
- **描述**: 管理平台運營的技術人員
- **權限**: 監控系統、處理問題、優化性能

---

## 🎮 3. 功能需求詳細規格

### 3.1 用戶管理模組

#### 3.1.1 用戶登入功能

**功能描述**: 玩家通過輸入名稱進入遊戲系統

**輸入規格**:
- **玩家名稱**: 字串類型，長度 1-20 字元
- **連接狀態**: 布林值，表示與伺服器的連接狀態

**輸出規格**:
- **登入成功**: 返回玩家資訊和進入大廳
- **登入失敗**: 顯示錯誤訊息

**業務規則**:
```
1. 名稱不能為空
2. 名稱長度限制 1-20 字元
3. 重複名稱自動處理（使用 Socket ID 區分）
4. 必須先建立 WebSocket 連接才能登入
```

**異常處理**:
- 網路連接失敗時顯示"連接中..."
- 名稱驗證失敗時提示重新輸入
- 伺服器錯誤時顯示錯誤訊息

#### 3.1.2 用戶狀態管理

**功能描述**: 追蹤和管理用戶在線狀態

**狀態定義**:
```javascript
const player = {
  id: socket.id,           // 用戶唯一標識
  name: playerName,        // 用戶名稱
  status: 'online',        // 狀態: online, offline, in-game
  joinTime: timestamp,     // 加入時間
  currentRoom: null        // 當前房間 ID
};
```

**狀態更新機制**:
- 即時同步到所有客戶端
- 斷線時自動清理用戶狀態
- 重新連接時恢復用戶狀態

### 3.2 遊戲大廳模組

#### 3.2.1 大廳顯示功能

**功能描述**: 顯示在線玩家和可用房間

**顯示內容**:
```javascript
const lobbyState = {
  players: [],     // 在線玩家列表
  rooms: [],       // 可用房間列表
  chat: []         // 大廳聊天記錄
};
```

**即時更新機制**:
- 新玩家加入時更新玩家列表
- 玩家離開時從列表中移除
- 房間狀態變化時更新房間列表

#### 3.2.2 大廳聊天功能

**功能描述**: 大廳內玩家間的即時聊天

**訊息格式**:
```javascript
const chatMessage = {
  id: timestamp,           // 訊息唯一標識
  playerId: socket.id,     // 發送者 ID
  playerName: player.name, // 發送者名稱
  message: message,        // 訊息內容
  timestamp: timestamp,    // 發送時間
  type: 'lobby'           // 訊息類型
};
```

**限制規則**:
- 最多保留 100 條歷史訊息
- 訊息長度限制 200 字元
- 防止 XSS 攻擊

### 3.3 房間管理模組

#### 3.3.1 創建房間功能

**功能描述**: 玩家可以創建新的遊戲房間

**房間設定**:
```javascript
const roomData = {
  name: roomName,              // 房間名稱
  maxPlayers: 2-8,            // 最大玩家數
  gameType: 'fruit-eating',   // 遊戲類型
  gameDuration: 30|60         // 遊戲時長（秒）
};
```

**創建流程**:
1. 驗證房間名稱不為空
2. 生成唯一房間 ID
3. 將創建者設為房主
4. 將創建者加入房間
5. 通知所有玩家房間創建

**房間狀態**:
- `waiting`: 等待玩家加入
- `playing`: 遊戲進行中
- `finished`: 遊戲已結束

#### 3.3.2 加入房間功能

**功能描述**: 玩家可以加入現有房間

**限制條件**:
```
1. 房間必須存在
2. 房間狀態必須為 'waiting'
3. 房間未滿員
4. 玩家不在其他房間中
```

**加入流程**:
1. 驗證加入條件
2. 將玩家加入房間
3. 通知房間內其他玩家
4. 更新大廳狀態

**異常處理**:
- 房間不存在時顯示錯誤
- 房間已滿時顯示錯誤
- 遊戲進行中時拒絕加入

#### 3.3.3 離開房間功能

**功能描述**: 玩家可以主動離開房間

**處理邏輯**:
```javascript
// 離開房間流程
1. 從房間玩家列表中移除
2. 清空玩家當前房間狀態
3. 如果房間空了，刪除房間
4. 如果房主離開，轉移房主權限
5. 通知其他玩家
6. 更新大廳狀態
```

**房主權限轉移**:
- 房主離開時自動轉移給第一個玩家
- 更新房間的 host 和 hostName 欄位
- 通知所有玩家權限變更

### 3.4 遊戲功能模組

#### 3.4.1 遊戲開始功能

**觸發條件**: 房主點擊開始遊戲

**初始化流程**:
```javascript
// 遊戲初始化
1. 設定房間狀態為 'playing'
2. 初始化遊戲數據結構
3. 為每個玩家初始化蛇和分數
4. 生成初始食物
5. 設定遊戲時長
6. 通知所有玩家遊戲開始
```

**遊戲數據結構**:
```javascript
const gameData = {
  startTime: Date.now(),        // 開始時間
  duration: gameDuration * 1000, // 遊戲時長（毫秒）
  food: [],                     // 食物列表
  scores: {},                   // 玩家分數
  gameStarted: true            // 遊戲狀態
};
```

**玩家初始化**:
```javascript
const playerScore = {
  score: 0,
  snake: {
    body: [{x: 10, y: 10}],    // 蛇身
    direction: 'right',         // 方向
    color: randomColor()        // 顏色
  }
};
```

#### 3.4.2 遊戲進行功能

**控制方式**:
- **鍵盤控制**: 方向鍵 (↑↓←→)
- **虛擬按鈕**: 觸控設備支援

**遊戲邏輯**:
```javascript
// 蛇的移動邏輯
function moveSnake(snake, direction) {
  const head = snake.body[0];
  let newHead = { ...head };
  
  switch (direction) {
    case 'up': newHead.y = Math.max(0, head.y - 1); break;
    case 'down': newHead.y = Math.min(19, head.y + 1); break;
    case 'left': newHead.x = Math.max(0, head.x - 1); break;
    case 'right': newHead.x = Math.min(19, head.x + 1); break;
  }
  
  // 檢查碰撞
  const collision = snake.body.some(segment => 
    segment.x === newHead.x && segment.y === newHead.y
  );
  
  if (!collision) {
    snake.body.unshift(newHead);
    snake.body.pop();
  }
}
```

**食物系統**:
```javascript
// 食物生成和收集
1. 初始生成 5 個食物
2. 食物被吃掉時生成新食物
3. 保持場上最多 5 個食物
4. 每個食物 10 分
```

**分數計算**:
- 每吃一個食物得 10 分
- 即時更新分數排行榜
- 所有玩家同步看到最新分數

#### 3.4.3 遊戲結束功能

**結束條件**:
- 時間到（30秒或60秒）
- 房主手動結束遊戲

**結束流程**:
```javascript
// 遊戲結束處理
1. 設定房間狀態為 'finished'
2. 計算最終分數和獲勝者
3. 通知所有玩家遊戲結束
4. 顯示獲勝者信息
5. 清理遊戲數據
6. 重置房間狀態
```

**結果統計**:
```javascript
const gameResult = {
  winner: {
    playerId: winnerId,
    playerName: winnerName,
    score: winnerScore
  },
  scores: allPlayerScores,
  duration: actualGameTime
};
```

### 3.5 聊天功能模組

#### 3.5.1 大廳聊天功能

**功能描述**: 大廳內所有玩家可見的聊天

**訊息處理**:
```javascript
// 大廳聊天處理
1. 驗證訊息內容
2. 創建聊天訊息對象
3. 添加到大廳聊天記錄
4. 限制記錄數量（最多100條）
5. 廣播給所有玩家
```

**訊息格式**:
```javascript
const lobbyMessage = {
  id: Date.now(),
  playerId: socket.id,
  playerName: player.name,
  message: message,
  timestamp: new Date().toISOString(),
  type: 'lobby'
};
```

#### 3.5.2 房間聊天功能

**功能描述**: 房間內玩家間的私密聊天

**可見範圍**: 僅房間內玩家可見

**訊息處理**:
```javascript
// 房間聊天處理
1. 驗證玩家在房間中
2. 創建房間聊天訊息
3. 添加到房間聊天記錄
4. 只發送給房間內玩家
```

**訊息格式**:
```javascript
const roomMessage = {
  id: Date.now(),
  playerId: socket.id,
  playerName: player.name,
  message: message,
  timestamp: new Date().toISOString(),
  type: 'room',
  roomId: roomId
};
```

---

## 🎨 4. 用戶界面需求

### 4.1 登入界面

**界面元素**:
- 遊戲標題
- 名稱輸入框
- 登入按鈕
- 連接狀態顯示

**交互邏輯**:
```javascript
// 登入驗證
1. 檢查名稱是否為空
2. 檢查連接狀態
3. 發送登入請求
4. 等待伺服器回應
5. 成功後進入大廳
```

### 4.2 遊戲大廳界面

**界面佈局**:
```
┌─────────────────────────────────────┐
│ 遊戲大廳標題 + 狀態信息              │
├─────────────────┬───────────────────┤
│ 大廳聊天區域     │ 側邊欄            │
│                 │ ├ 在線玩家列表     │
│                 │ └ 遊戲房間列表     │
└─────────────────┴───────────────────┘
```

**即時更新**:
- 玩家列表即時更新
- 房間列表即時更新
- 聊天訊息即時顯示

### 4.3 房間界面

**界面佈局**:
```
┌─────────────────────────────────────┐
│ 房間標題 + 房間信息 + 控制按鈕       │
├─────────────────┬───────────────────┤
│ 房間玩家列表     │ 遊戲區域          │
│                 │ ├ 遊戲畫布        │
│                 │ ├ 分數排行榜      │
│                 │ └ 虛擬鍵盤        │
└─────────────────┴───────────────────┘
```

**遊戲狀態顯示**:
- 遊戲進行時顯示倒計時
- 即時更新分數排行榜
- 顯示遊戲說明

### 4.4 遊戲界面

**遊戲畫布**:
- 400x400 像素畫布
- 20x20 網格背景
- 不同顏色的蛇身
- 紅色食物方塊

**控制方式**:
- 鍵盤方向鍵控制
- 虛擬按鈕控制
- 防止重複按鍵

---

## 🔧 5. 技術需求

### 5.1 前端技術規格

#### 5.1.1 React 組件結構
```javascript
// 主要組件
App.js
├── LoginView          // 登入界面
├── LobbyView          // 大廳界面
└── RoomView           // 房間界面
    ├── GameCanvas     // 遊戲畫布
    ├── ScoreBoard     // 分數排行榜
    ├── VirtualKeyboard // 虛擬鍵盤
    └── ChatPanel      // 聊天面板
```

#### 5.1.2 狀態管理
```javascript
// 主要狀態
const [socket, setSocket] = useState(null);
const [connected, setConnected] = useState(false);
const [currentPlayer, setCurrentPlayer] = useState(null);
const [currentView, setCurrentView] = useState('login');
const [currentRoom, setCurrentRoom] = useState(null);
const [gameData, setGameData] = useState(null);
const [gameStarted, setGameStarted] = useState(false);
```

### 5.2 後端技術規格

#### 5.2.1 Socket.IO 事件定義
```javascript
// 客戶端發送事件
'player-login'          // 玩家登入
'lobby-chat'           // 大廳聊天
'create-room'          // 創建房間
'join-room'            // 加入房間
'leave-room'           // 離開房間
'start-game'           // 開始遊戲
'game-action'          // 遊戲動作
'room-chat'            // 房間聊天

// 伺服器發送事件
'player-logged-in'     // 登入成功
'lobby-player-joined'  // 玩家加入大廳
'lobby-player-left'    // 玩家離開大廳
'lobby-new-message'    // 新聊天訊息
'lobby-state-update'   // 大廳狀態更新
'room-created'         // 房間創建
'room-joined'          // 加入房間成功
'room-player-joined'   // 玩家加入房間
'room-player-left'     // 玩家離開房間
'room-deleted'         // 房間刪除
'room-join-error'      // 加入房間錯誤
'room-new-message'     // 房間新訊息
'game-started'         // 遊戲開始
'game-ended'           // 遊戲結束
'player-moved'         // 玩家移動
'game-state-update'    // 遊戲狀態更新
```

#### 5.2.2 數據結構定義
```javascript
// 遊戲狀態
const gameState = {
  lobby: {
    players: {},    // 大廳玩家
    chat: [],       // 大廳聊天
    rooms: {}       // 房間列表
  },
  rooms: {}         // 房間詳細數據
};

// 玩家數據
const player = {
  id: socket.id,
  name: playerName,
  status: 'online',
  joinTime: timestamp,
  currentRoom: null
};

// 房間數據
const room = {
  id: roomId,
  name: roomName,
  host: hostId,
  hostName: hostName,
  players: {},
  maxPlayers: maxPlayers,
  status: 'waiting',
  gameType: 'fruit-eating',
  gameDuration: duration,
  createdAt: timestamp,
  gameData: {}
};
```

### 5.3 性能需求

#### 5.3.1 響應時間要求
- **用戶操作響應**: < 100ms
- **遊戲同步延遲**: < 50ms
- **聊天訊息延遲**: < 200ms
- **頁面載入時間**: < 3秒

#### 5.3.2 並發處理
- **同時在線用戶**: 支援 100+ 用戶
- **單房間最大玩家**: 8 人
- **同時遊戲房間**: 支援 50+ 房間

#### 5.3.3 數據處理
- **聊天記錄限制**: 最多 100 條
- **遊戲狀態更新頻率**: 60fps
- **自動清理間隔**: 每秒檢查

---

## 🛡️ 6. 安全需求

### 6.1 輸入驗證
```javascript
// 名稱驗證
function validatePlayerName(name) {
  return name && name.trim().length > 0 && name.length <= 20;
}

// 聊天訊息驗證
function validateChatMessage(message) {
  return message && message.trim().length > 0 && message.length <= 200;
}
```

### 6.2 XSS 防護
- 所有用戶輸入進行 HTML 轉義
- 聊天訊息不允許 HTML 標籤
- 使用 React 的內建 XSS 防護

### 6.3 CORS 設定
```javascript
// CORS 配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true 
    : ["http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true
};
```

---

## 📊 7. 錯誤處理

### 7.1 網路錯誤處理
```javascript
// 連接錯誤處理
socket.on('connect_error', (error) => {
  console.log('連接錯誤:', error);
  setConnected(false);
});

socket.on('disconnect', (reason) => {
  console.log('斷線:', reason);
  setConnected(false);
});
```

### 7.2 遊戲錯誤處理
```javascript
// 房間加入錯誤
socket.on('room-join-error', (error) => {
  alert(`加入房間失敗: ${error}`);
});

// 遊戲動作錯誤
if (!gameStarted || !currentPlayer) {
  console.log('遊戲未開始或玩家未登入');
  return;
}
```

### 7.3 數據驗證錯誤
```javascript
// 數據驗證
if (!player || !player.currentRoom) {
  console.log('玩家或房間數據無效');
  return;
}
```

---

## ✅ 8. 驗收標準

### 8.1 功能驗收
- [ ] 用戶能夠成功登入系統
- [ ] 遊戲大廳正常顯示和更新
- [ ] 房間創建和加入功能正常
- [ ] 多人遊戲能夠正常進行
- [ ] 聊天功能正常運作
- [ ] 遊戲同步準確無誤
- [ ] 錯誤處理機制正常

### 8.2 性能驗收
- [ ] 系統響應時間 < 100ms
- [ ] 支援 50+ 同時在線用戶
- [ ] 遊戲同步延遲 < 50ms
- [ ] 系統可用性 > 99%

### 8.3 安全驗收
- [ ] 輸入驗證機制正常
- [ ] XSS 防護有效
- [ ] CORS 設定正確
- [ ] 錯誤訊息不洩露敏感信息

---

## 📝 9. 附錄

### 9.1 術語定義
- **Socket.IO**: 用於即時通訊的 JavaScript 庫
- **WebSocket**: 提供全雙工通訊的協議
- **遊戲同步**: 所有玩家看到相同的遊戲狀態
- **房主權限**: 創建房間玩家的特殊權限

### 9.2 參考文檔
- 業務需求文件 (BRD)
- 產品需求文件 (PRD)
- 技術架構文件
- API 設計文件

---

**文件結束**

*此文件基於程式碼逆向工程分析，反映了當前系統的實際功能需求和技術規格。*
