const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          "https://your-netlify-app.netlify.app", // 請替換為您的 Netlify 網址
          "https://*.netlify.app", // 允許所有 Netlify 子網域
          process.env.FRONTEND_URL // 如果設定了環境變數
        ].filter(Boolean)
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 遊戲狀態
const gameState = {
  players: {},
  gameStarted: false,
  currentTurn: null
};

// 中間件
app.use(cors());
app.use(express.json());

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log(`用戶連接: ${socket.id}`);

  // 玩家加入遊戲
  socket.on('join-game', (playerName) => {
    const player = {
      id: socket.id,
      name: playerName,
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };

    gameState.players[socket.id] = player;
    
    // 通知所有玩家有新玩家加入
    io.emit('player-joined', player);
    io.emit('game-state-update', gameState);
    
    console.log(`${playerName} 加入遊戲`);
  });

  // 玩家移動
  socket.on('player-move', (newPosition) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].position = newPosition;
      // 廣播移動給所有其他玩家
      socket.broadcast.emit('player-moved', {
        playerId: socket.id,
        position: newPosition
      });
    }
  });

  // 玩家發送訊息
  socket.on('send-message', (message) => {
    const player = gameState.players[socket.id];
    if (player) {
      const chatMessage = {
        id: Date.now(),
        playerId: socket.id,
        playerName: player.name,
        message: message,
        timestamp: new Date().toISOString()
      };
      io.emit('new-message', chatMessage);
    }
  });

  // 玩家斷線
  socket.on('disconnect', () => {
    console.log(`用戶斷線: ${socket.id}`);
    if (gameState.players[socket.id]) {
      const playerName = gameState.players[socket.id].name;
      delete gameState.players[socket.id];
      io.emit('player-left', socket.id);
      io.emit('game-state-update', gameState);
      console.log(`${playerName} 離開遊戲`);
    }
  });
});

// 定期廣播遊戲狀態
setInterval(() => {
  if (Object.keys(gameState.players).length > 0) {
    io.emit('game-state-update', gameState);
  }
}, 1000);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`伺服器運行在 port ${PORT}`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
}); 