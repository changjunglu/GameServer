const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? true // 允許所有來源（簡化設定）
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 遊戲狀態管理
const gameState = {
  lobby: {
    players: {}, // 大廳玩家列表
    chat: [],    // 大廳聊天記錄
    rooms: {}    // 遊戲房間列表
  },
  rooms: {
    // 房間資料會在創建時動態添加
  }
};

// 中間件
app.use(cors());
app.use(express.json());

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 獲取大廳狀態端點
app.get('/api/lobby', (req, res) => {
  res.json({
    players: Object.values(gameState.lobby.players),
    chat: gameState.lobby.chat.slice(-50), // 只返回最近50條訊息
    rooms: Object.values(gameState.lobby.rooms)
  });
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log(`用戶連接: ${socket.id}`);

  // 玩家登入並加入大廳
  socket.on('player-login', (data) => {
    const playerName = typeof data === 'string' ? data : data.name;
    const player = {
      id: socket.id,
      name: playerName,
      status: 'online',
      joinTime: new Date().toISOString(),
      currentRoom: null
    };

    gameState.lobby.players[socket.id] = player;
    
    // 通知登入玩家
    socket.emit('player-logged-in', { player: player });
    
    // 通知所有玩家有新玩家加入大廳
    io.emit('lobby-player-joined', player);
    io.emit('lobby-state-update', {
      players: Object.values(gameState.lobby.players),
      rooms: Object.values(gameState.lobby.rooms)
    });
    
    console.log(`${playerName} 登入並加入大廳`);
  });

  // 玩家發送大廳聊天訊息
  socket.on('lobby-chat', (message) => {
    const player = gameState.lobby.players[socket.id];
    if (player) {
      const chatMessage = {
        id: Date.now(),
        playerId: socket.id,
        playerName: player.name,
        message: message,
        timestamp: new Date().toISOString(),
        type: 'lobby'
      };
      
      gameState.lobby.chat.push(chatMessage);
      
      // 限制聊天記錄數量
      if (gameState.lobby.chat.length > 100) {
        gameState.lobby.chat = gameState.lobby.chat.slice(-100);
      }
      
      io.emit('lobby-new-message', chatMessage);
    }
  });

  // 玩家發送房間聊天訊息
  socket.on('room-chat', (message) => {
    const player = gameState.lobby.players[socket.id];
    if (player && player.currentRoom) {
      const roomId = player.currentRoom;
      const room = gameState.lobby.rooms[roomId];
      
      if (room) {
        const chatMessage = {
          id: Date.now(),
          playerId: socket.id,
          playerName: player.name,
          message: message,
          timestamp: new Date().toISOString(),
          type: 'room',
          roomId: roomId
        };
        
        // 初始化房間聊天記錄
        if (!room.chat) {
          room.chat = [];
        }
        
        room.chat.push(chatMessage);
        
        // 限制聊天記錄數量
        if (room.chat.length > 100) {
          room.chat = room.chat.slice(-100);
        }
        
        // 通知房間內所有玩家
        Object.keys(room.players).forEach(playerId => {
          io.to(playerId).emit('room-new-message', chatMessage);
        });
        
        console.log(`${player.name} 在房間 ${room.name} 發送訊息: ${message}`);
      }
    }
  });

  // 創建遊戲房間
  socket.on('create-room', (roomData) => {
    const player = gameState.lobby.players[socket.id];
    if (player) {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const room = {
        id: roomId,
        name: roomData.name || `房間 ${Object.keys(gameState.lobby.rooms).length + 1}`,
        host: socket.id,
        hostName: player.name,
        players: {},
        maxPlayers: roomData.maxPlayers || 4,
        status: 'waiting', // waiting, playing, finished
        gameType: roomData.gameType || 'fruit-eating', // 遊戲類型
        gameDuration: roomData.gameDuration || 60, // 遊戲時間（秒）
        createdAt: new Date().toISOString(),
        gameData: {}
      };

      gameState.lobby.rooms[roomId] = room;
      gameState.rooms[roomId] = room;
      
      // 將創建者加入房間
      room.players[socket.id] = player;
      player.currentRoom = roomId;
      
      // 通知所有玩家有新房間創建
      io.emit('room-created', room);
      io.emit('lobby-state-update', {
        players: Object.values(gameState.lobby.players),
        rooms: Object.values(gameState.lobby.rooms)
      });
      
      // 通知房間內玩家
      socket.emit('room-joined', room);
      
      console.log(`${player.name} 創建房間: ${room.name}`);
    }
  });

  // 加入遊戲房間
  socket.on('join-room', (roomId) => {
    const player = gameState.lobby.players[socket.id];
    const room = gameState.lobby.rooms[roomId];
    
    if (player && room && room.status === 'waiting') {
      if (Object.keys(room.players).length < room.maxPlayers) {
        room.players[socket.id] = player;
        player.currentRoom = roomId;
        
        // 通知加入者成功加入房間
        socket.emit('room-joined', room);
        
        // 通知房間內其他玩家有新玩家加入
        Object.keys(room.players).forEach(playerId => {
          if (playerId !== socket.id) {
            io.to(playerId).emit('room-player-joined', {
              player: player,
              room: room
            });
          }
        });
        
        // 通知大廳玩家房間狀態更新
        io.emit('lobby-state-update', {
          players: Object.values(gameState.lobby.players),
          rooms: Object.values(gameState.lobby.rooms)
        });
        
        console.log(`${player.name} 加入房間: ${room.name}`);
      } else {
        socket.emit('room-join-error', '房間已滿');
      }
    } else {
      socket.emit('room-join-error', '房間不存在或已開始遊戲');
    }
  });

  // 開始遊戲
  socket.on('start-game', () => {
    const player = gameState.lobby.players[socket.id];
    if (player && player.currentRoom) {
      const roomId = player.currentRoom;
      const room = gameState.lobby.rooms[roomId];
      
      if (room && room.host === socket.id && (room.status === 'waiting' || room.status === 'finished')) {
        console.log(`🔄 重新開始遊戲: ${room.name}, 狀態: ${room.status}, 玩家數量: ${Object.keys(room.players).length}`);
        
        room.status = 'playing';
        
        // 初始化遊戲數據
        if (room.gameType === 'fruit-eating') {
          room.gameData = {
            startTime: Date.now(),
            duration: room.gameDuration * 1000, // 轉換為毫秒
            food: [],
            scores: {},
            gameStarted: true
          };
          
          // 為每個玩家初始化蛇和分數
          Object.keys(room.players).forEach(playerId => {
            const player = room.players[playerId];
            room.gameData.scores[playerId] = {
              score: 0,
              snake: {
                body: [{x: 10, y: 10}],
                direction: 'right',
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
              }
            };
            console.log(`✅ 初始化玩家 ${player.name} (${playerId}) 的遊戲數據`);
          });
          
          // 生成初始食物
          for (let i = 0; i < 5; i++) {
            room.gameData.food.push({
              x: Math.floor(Math.random() * 20),
              y: Math.floor(Math.random() * 20)
            });
          }
        }
        
        // 通知房間內所有玩家遊戲開始
        Object.keys(room.players).forEach(playerId => {
          console.log(`📤 發送遊戲開始通知給玩家 ${playerId}`);
          io.to(playerId).emit('game-started', {
            room: room,
            gameData: room.gameData
          });
        });
        
        // 通知大廳玩家房間狀態更新
        io.emit('lobby-state-update', {
          players: Object.values(gameState.lobby.players),
          rooms: Object.values(gameState.lobby.rooms)
        });
        
        console.log(`✅ 遊戲開始: ${room.name}, 玩家數量: ${Object.keys(room.players).length}`);
      }
    }
  });

  // 遊戲動作（貪食蛇移動）
  socket.on('game-action', (action) => {
    const player = gameState.lobby.players[socket.id];
    if (player && player.currentRoom) {
      const roomId = player.currentRoom;
      const room = gameState.lobby.rooms[roomId];
      
      if (room && room.status === 'playing' && room.gameType === 'fruit-eating') {
        const gameData = room.gameData;
        const playerScore = gameData.scores[socket.id];
        
        if (playerScore && action.type === 'move') {
          // 更新蛇的方向
          playerScore.snake.direction = action.direction;
          
          // 移動蛇
          moveSnake(playerScore.snake, action.direction);
          
          // 檢查是否吃到食物
          const head = playerScore.snake.body[0];
          const foodIndex = gameData.food.findIndex(food => 
            food.x === head.x && food.y === head.y
          );
          
          if (foodIndex !== -1) {
            // 吃到食物
            playerScore.score += 10;
            gameData.food.splice(foodIndex, 1);
            
            // 生成新食物
            if (gameData.food.length < 5) {
              gameData.food.push({
                x: Math.floor(Math.random() * 20),
                y: Math.floor(Math.random() * 20)
              });
            }
          }
          
          // 通知房間內所有玩家遊戲狀態更新
          Object.keys(room.players).forEach(playerId => {
            io.to(playerId).emit('game-state-update', {
              gameData: gameData
            });
          });
        }
      }
    }
  });

  // 蛇的移動邏輯
  function moveSnake(snake, direction) {
    const head = snake.body[0];
    let newHead = { ...head };
    
    switch (direction) {
      case 'up':
        newHead.y = Math.max(0, head.y - 1);
        break;
      case 'down':
        newHead.y = Math.min(19, head.y + 1);
        break;
      case 'left':
        newHead.x = Math.max(0, head.x - 1);
        break;
      case 'right':
        newHead.x = Math.min(19, head.x + 1);
        break;
    }
    
    // 檢查是否撞到自己
    const collision = snake.body.some(segment => 
      segment.x === newHead.x && segment.y === newHead.y
    );
    
    if (!collision) {
      snake.body.unshift(newHead);
      snake.body.pop(); // 移除尾部
    }
  }

  // 結束遊戲
  socket.on('end-game', () => {
    const player = gameState.lobby.players[socket.id];
    if (player && player.currentRoom) {
      const roomId = player.currentRoom;
      const room = gameState.lobby.rooms[roomId];
      
      if (room && room.host === socket.id && room.status === 'playing') {
        endGame(room);
      }
    }
  });

  // 遊戲結束邏輯
  function endGame(room) {
    room.status = 'finished';
    
    // 計算獲勝者
    const scores = Object.entries(room.gameData.scores);
    if (scores.length === 0) {
      console.log(`遊戲結束: ${room.name}, 沒有玩家參與`);
      return;
    }
    
    const winner = scores.reduce((max, [playerId, data]) => {
      const playerName = gameState.lobby.players[playerId]?.name || '未知玩家';
      return data.score > max.score ? {playerId, playerName, ...data} : max;
    }, {playerId: '', playerName: '未知玩家', score: -1});
    
    // 通知房間內所有玩家遊戲結束
    Object.keys(room.players).forEach(playerId => {
      io.to(playerId).emit('game-ended', {
        room: room,
        winner: winner,
        scores: room.gameData.scores
      });
    });
    
    const winnerPlayer = gameState.lobby.players[winner.playerId];
    const winnerName = winnerPlayer ? winnerPlayer.name : '未知玩家';
    console.log(`遊戲結束: ${room.name}, 獲勝者: ${winnerName} (ID: ${winner.playerId}), 遊戲時間: ${room.gameDuration}秒`);
    
    // 清理遊戲數據，但保留房間和玩家
    room.gameData = {};
  }

  // 自動遊戲結束檢查
  setInterval(() => {
    Object.values(gameState.lobby.rooms).forEach(room => {
      if (room.status === 'playing' && room.gameData && room.gameData.startTime) {
        const elapsed = Date.now() - room.gameData.startTime;
        if (elapsed >= room.gameData.duration) {
          console.log(`遊戲時間到，自動結束: ${room.name}`);
          endGame(room);
        }
      }
    });
  }, 1000); // 每秒檢查一次

  // 離開房間
  socket.on('leave-room', () => {
    const player = gameState.lobby.players[socket.id];
    if (player && player.currentRoom) {
      const roomId = player.currentRoom;
      const room = gameState.lobby.rooms[roomId];
      
      if (room) {
        delete room.players[socket.id];
        player.currentRoom = null;
        
        // 如果房間空了，刪除房間
        if (Object.keys(room.players).length === 0) {
          delete gameState.lobby.rooms[roomId];
          delete gameState.rooms[roomId];
          io.emit('room-deleted', roomId);
        } else {
          // 如果房主離開，轉移房主權限
          if (room.host === socket.id) {
            const newHostId = Object.keys(room.players)[0];
            room.host = newHostId;
            room.hostName = gameState.lobby.players[newHostId].name;
          }
          
          // 通知房間內其他玩家
          Object.keys(room.players).forEach(playerId => {
            io.to(playerId).emit('room-player-left', {
              playerId: socket.id,
              playerName: player.name,
              room: room
            });
          });
        }
        
        // 通知大廳玩家狀態更新
        io.emit('lobby-state-update', {
          players: Object.values(gameState.lobby.players),
          rooms: Object.values(gameState.lobby.rooms)
        });
        
        console.log(`${player.name} 離開房間: ${room.name}`);
      }
    }
  });

  // 玩家斷線處理
  socket.on('disconnect', () => {
    console.log(`用戶斷線: ${socket.id}`);
    const player = gameState.lobby.players[socket.id];
    
    if (player) {
      // 如果玩家在房間中，先離開房間
      if (player.currentRoom) {
        const roomId = player.currentRoom;
        const room = gameState.lobby.rooms[roomId];
        
        if (room) {
          delete room.players[socket.id];
          
          // 如果房間空了，刪除房間
          if (Object.keys(room.players).length === 0) {
            delete gameState.lobby.rooms[roomId];
            delete gameState.rooms[roomId];
            io.emit('room-deleted', roomId);
          } else {
            // 如果房主斷線，轉移房主權限
            if (room.host === socket.id) {
              const newHostId = Object.keys(room.players)[0];
              room.host = newHostId;
              room.hostName = gameState.lobby.players[newHostId].name;
            }
            
            // 通知房間內其他玩家
            Object.keys(room.players).forEach(playerId => {
              io.to(playerId).emit('room-player-left', {
                playerId: socket.id,
                playerName: player.name,
                room: room
              });
            });
          }
        }
      }
      
      // 從大廳移除玩家
      delete gameState.lobby.players[socket.id];
      
      // 通知所有玩家
      io.emit('lobby-player-left', socket.id);
      io.emit('lobby-state-update', {
        players: Object.values(gameState.lobby.players),
        rooms: Object.values(gameState.lobby.rooms)
      });
      
      console.log(`${player.name} 斷線離開`);
    }
  });
});

// 定期廣播大廳狀態
setInterval(() => {
  if (Object.keys(gameState.lobby.players).length > 0) {
    io.emit('lobby-state-update', {
      players: Object.values(gameState.lobby.players),
      rooms: Object.values(gameState.lobby.rooms)
    });
  }
}, 5000); // 每5秒更新一次

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`伺服器運行在 port ${PORT}`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
}); 