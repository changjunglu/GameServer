# 遊戲伺服器 API 文檔

## 概述

遊戲伺服器提供兩種通信方式：
1. **HTTP REST API** - 用於基本的伺服器狀態查詢
2. **Socket.IO WebSocket** - 用於實時遊戲通信

## 伺服器資訊

- **開發環境**: `http://localhost:3001`
- **生產環境**: `https://gameserver-production-ddf0.up.railway.app`
- **WebSocket**: 對應環境的 WebSocket 連接
- **技術棧**: Node.js + Express + Socket.IO

## HTTP REST API

### 1. 健康檢查

```http
GET /health
```

**回應**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 大廳狀態

```http
GET /api/lobby
```

**回應**:
```json
{
  "players": [
    {
      "id": "socket_id",
      "name": "玩家名稱",
      "status": "online",
      "joinTime": "2024-01-01T00:00:00.000Z",
      "currentRoom": "room_id"
    }
  ],
  "chat": [
    {
      "id": 1234567890,
      "playerId": "socket_id",
      "playerName": "玩家名稱",
      "message": "聊天訊息",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "type": "lobby"
    }
  ],
  "rooms": [
    {
      "id": "room_id",
      "name": "房間名稱",
      "host": "host_socket_id",
      "hostName": "房主名稱",
      "players": {},
      "maxPlayers": 4,
      "status": "waiting",
      "gameType": "fruit-eating",
      "gameDuration": 60,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Socket.IO 事件

### 客戶端 → 伺服器事件

#### 玩家管理

| 事件名稱 | 參數 | 描述 |
|---------|------|------|
| `player-login` | `{ name: string }` 或 `string` | 玩家登入並加入大廳 |

#### 聊天系統

| 事件名稱 | 參數 | 描述 |
|---------|------|------|
| `lobby-chat` | `string` | 在大廳發送聊天訊息 |
| `room-chat` | `string` | 在房間內發送聊天訊息 |

#### 房間管理

| 事件名稱 | 參數 | 描述 |
|---------|------|------|
| `create-room` | `{ name?: string, maxPlayers?: number, gameType?: string, gameDuration?: number }` | 創建遊戲房間 |
| `join-room` | `string` | 加入指定房間 |
| `leave-room` | 無 | 離開當前房間 |

#### 遊戲控制

| 事件名稱 | 參數 | 描述 |
|---------|------|------|
| `start-game` | 無 | 開始遊戲（僅房主） |
| `game-action` | `{ type: 'move', direction: 'up'|'down'|'left'|'right' }` | 遊戲動作（移動蛇） |
| `end-game` | 無 | 結束遊戲（僅房主） |

### 伺服器 → 客戶端事件

#### 玩家管理

| 事件名稱 | 回應數據 | 描述 |
|---------|----------|------|
| `player-logged-in` | `{ player: Player }` | 玩家成功登入 |
| `lobby-player-joined` | `Player` | 新玩家加入大廳 |
| `lobby-player-left` | `string` | 玩家離開大廳 |

#### 聊天系統

| 事件名稱 | 回應數據 | 描述 |
|---------|----------|------|
| `lobby-new-message` | `ChatMessage` | 大廳新聊天訊息 |
| `room-new-message` | `ChatMessage` | 房間新聊天訊息 |

#### 房間管理

| 事件名稱 | 回應數據 | 描述 |
|---------|----------|------|
| `room-created` | `Room` | 新房間創建 |
| `room-joined` | `Room` | 成功加入房間 |
| `room-join-error` | `string` | 加入房間失敗 |
| `room-player-joined` | `{ player: Player, room: Room }` | 新玩家加入房間 |
| `room-player-left` | `{ playerId: string, playerName: string, room: Room }` | 玩家離開房間 |
| `room-deleted` | `string` | 房間被刪除 |

#### 遊戲狀態

| 事件名稱 | 回應數據 | 描述 |
|---------|----------|------|
| `game-started` | `{ room: Room, gameData: GameData }` | 遊戲開始 |
| `game-state-update` | `{ gameData: GameData }` | 遊戲狀態更新 |
| `game-ended` | `{ room: Room, winner: Winner, scores: Object }` | 遊戲結束 |
| `lobby-state-update` | `{ players: Player[], rooms: Room[] }` | 大廳狀態更新 |

## 數據結構

### Player (玩家)

```typescript
interface Player {
  id: string;           // Socket ID
  name: string;         // 玩家名稱
  status: 'online';     // 玩家狀態
  joinTime: string;     // 加入時間 (ISO 8601)
  currentRoom: string | null; // 當前房間ID
}
```

### Room (房間)

```typescript
interface Room {
  id: string;                    // 房間唯一ID
  name: string;                  // 房間名稱
  host: string;                  // 房主Socket ID
  hostName: string;              // 房主名稱
  players: Record<string, Player>; // 房間內玩家
  maxPlayers: number;            // 最大玩家數
  status: 'waiting' | 'playing' | 'finished'; // 房間狀態
  gameType: string;              // 遊戲類型
  gameDuration: number;          // 遊戲時長（秒）
  createdAt: string;             // 創建時間
  gameData?: GameData;           // 遊戲數據
  chat?: ChatMessage[];          // 房間聊天記錄
}
```

### ChatMessage (聊天訊息)

```typescript
interface ChatMessage {
  id: number;           // 訊息ID
  playerId: string;     // 發送者Socket ID
  playerName: string;   // 發送者名稱
  message: string;      // 訊息內容
  timestamp: string;    // 發送時間
  type: 'lobby' | 'room'; // 訊息類型
  roomId?: string;      // 房間ID（房間訊息）
}
```

### GameData (遊戲數據)

```typescript
interface GameData {
  startTime: number;    // 遊戲開始時間戳
  duration: number;     // 遊戲時長（毫秒）
  food: Food[];         // 食物位置
  scores: Record<string, PlayerScore>; // 玩家分數
  gameStarted: boolean; // 遊戲是否已開始
}

interface Food {
  x: number;           // X座標
  y: number;           // Y座標
}

interface PlayerScore {
  score: number;        // 分數
  snake: Snake;         // 蛇的狀態
}

interface Snake {
  body: Position[];     // 蛇身位置
  direction: 'up' | 'down' | 'left' | 'right'; // 移動方向
  color: string;        // 蛇的顏色
}

interface Position {
  x: number;           // X座標
  y: number;           // Y座標
}
```

### Winner (獲勝者)

```typescript
interface Winner {
  playerId: string;     // 獲勝者Socket ID
  playerName: string;   // 獲勝者名稱
  score: number;        // 獲勝分數
}
```

## 錯誤處理

### 房間加入錯誤

當嘗試加入房間失敗時，伺服器會發送 `room-join-error` 事件，可能的錯誤訊息：

- `"房間不存在或已開始遊戲"`
- `"房間已滿"`

### 連接錯誤

- 如果客戶端與伺服器失去連接，所有相關的房間和玩家狀態會自動清理
- 房主斷線時，房主權限會自動轉移給房間內的其他玩家

## 遊戲邏輯

### 貪食蛇遊戲

1. **遊戲開始**: 房主點擊開始遊戲後，所有玩家同時開始
2. **移動控制**: 玩家發送方向指令控制蛇的移動
3. **食物系統**: 吃到食物後分數增加，蛇身變長
4. **遊戲結束**: 時間到或房主手動結束遊戲
5. **獲勝判定**: 根據分數高低決定獲勝者

### 遊戲規則

- 遊戲場地: 20x20 網格
- 初始食物數量: 5個
- 食物分數: 每個食物10分
- 蛇的移動: 每秒更新一次位置
- 碰撞檢測: 撞到自己身體時遊戲結束

## 安全考量

### CORS 設定

```javascript
cors: {
  origin: process.env.NODE_ENV === 'production' 
    ? true  // 生產環境允許所有來源
    : ["http://localhost:3000"], // 開發環境限制來源
  methods: ["GET", "POST"],
  credentials: true
}
```

### 輸入驗證

- 所有用戶輸入都會進行基本驗證
- 聊天訊息長度限制
- 房間名稱和玩家名稱的合法性檢查

## 性能優化

### 狀態更新頻率

- 大廳狀態: 每5秒自動更新
- 遊戲狀態: 實時更新（根據遊戲動作）
- 聊天記錄: 限制最近100條訊息

### 記憶體管理

- 自動清理斷線玩家的狀態
- 限制聊天記錄數量
- 遊戲結束後清理遊戲數據

## 部署配置

### 環境變數

- `PORT`: 伺服器端口（預設: 3001）
- `NODE_ENV`: 環境模式（development/production）

### 部署環境

- **開發環境**: 本地 localhost:3001
- **生產環境**: Railway 平台 (https://gameserver-production-ddf0.up.railway.app)
- **前端部署**: Netlify 平台

### Railway 部署

專案包含 `railway.json` 配置檔案，支援 Railway 平台部署。

## 測試

### 測試腳本

專案包含多個測試腳本：

- `integration-test.js`: 整合測試
- `multiplayer-game-test.js`: 多人遊戲測試
- `snake-game-test.js`: 貪食蛇遊戲測試

### 運行測試

```bash
cd scripts/test
node integration-test.js
node multiplayer-game-test.js
node snake-game-test.js
```

## 版本歷史

- **v1.0.0**: 初始版本，包含基本的多人貪食蛇遊戲功能
- 支援房間系統、聊天功能、實時遊戲同步
- 完整的玩家管理和狀態同步機制
