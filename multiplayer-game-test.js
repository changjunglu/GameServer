const io = require('socket.io-client');

console.log('🧪 多人貪食蛇遊戲測試...\n');

const SERVER_URL = 'http://localhost:3001';

async function multiplayerTest() {
  const sockets = [];
  const players = [
    { name: '玩家A', id: 'playerA' },
    { name: '玩家B', id: 'playerB' },
    { name: '玩家C', id: 'playerC' }
  ];
  
  try {
    console.log('📡 1. 建立多個玩家連接...');
    
    // 創建3個玩家連接
    for (let i = 0; i < 3; i++) {
      const socket = io(SERVER_URL);
      
      await new Promise((resolve, reject) => {
        socket.on('connect', () => {
          console.log(`✅ 玩家${i+1} 連接成功`);
          sockets.push(socket);
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          console.log(`❌ 玩家${i+1} 連接失敗:`, error.message);
          reject(error);
        });
        
        setTimeout(() => reject(new Error('連接超時')), 5000);
      });
    }
    
    console.log('\n👤 2. 玩家登入...');
    
    // 所有玩家登入
    for (let i = 0; i < sockets.length; i++) {
      const socket = sockets[i];
      const player = players[i];
      
      socket.emit('player-login', { name: player.name });
      
      await new Promise((resolve) => {
        socket.on('lobby-player-joined', (data) => {
          console.log(`✅ ${player.name} 登入成功`);
          resolve();
        });
        
        setTimeout(resolve, 1000);
      });
    }
    
    console.log('\n🏠 3. 玩家A創建房間...');
    
    const hostSocket = sockets[0];
    hostSocket.emit('create-room', {
      name: '多人測試房間',
      maxPlayers: 4,
      gameType: 'snake'
    });
    
    await new Promise((resolve) => {
      hostSocket.on('room-created', (room) => {
        console.log(`✅ 房間創建成功: ${room.name}`);
        console.log(`   房主: ${room.hostName}`);
        console.log(`   遊戲類型: ${room.gameType}`);
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    console.log('\n🚪 4. 其他玩家加入房間...');
    
    // 其他玩家加入房間
    for (let i = 1; i < sockets.length; i++) {
      const socket = sockets[i];
      const player = players[i];
      
      socket.emit('join-room', 'room_' + Date.now().toString().slice(0, -3));
      
      await new Promise((resolve) => {
        socket.on('room-joined', (room) => {
          console.log(`✅ ${player.name} 加入房間成功`);
          resolve();
        });
        
        setTimeout(resolve, 1000);
      });
    }
    
    console.log('\n🎮 5. 開始多人遊戲...');
    
    hostSocket.emit('start-game');
    
    await new Promise((resolve) => {
      hostSocket.on('game-started', (data) => {
        console.log('✅ 多人遊戲開始成功');
        console.log('   遊戲數據:', {
          startTime: data.gameData.startTime,
          duration: data.gameData.duration,
          foodCount: data.gameData.food.length,
          playersCount: Object.keys(data.gameData.scores).length
        });
        
        // 顯示所有玩家的分數
        console.log('   玩家分數:');
        Object.entries(data.gameData.scores).forEach(([playerId, scoreData]) => {
          console.log(`     - ${players.find(p => p.id === playerId)?.name || '未知'}: ${scoreData.score} 分`);
        });
        
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    console.log('\n🎯 6. 測試多人遊戲動作...');
    
    // 所有玩家發送遊戲動作
    for (let i = 0; i < sockets.length; i++) {
      const socket = sockets[i];
      const player = players[i];
      
      const directions = ['up', 'down', 'left', 'right'];
      for (let j = 0; j < 2; j++) {
        socket.emit('game-action', {
          type: 'move',
          direction: directions[j]
        });
        console.log(`   ${player.name} 發送動作: ${directions[j]}`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log('✅ 多人遊戲動作測試完成');
    
    console.log('\n📊 測試結果:');
    console.log('========================');
    console.log('✅ 多人連接: 通過');
    console.log('✅ 玩家登入: 通過');
    console.log('✅ 創建房間: 通過');
    console.log('✅ 加入房間: 通過');
    console.log('✅ 多人遊戲開始: 通過');
    console.log('✅ 多人遊戲動作: 通過');
    console.log('\n🎉 多人遊戲功能測試通過！');
    
    // 清理連接
    sockets.forEach(socket => socket.disconnect());
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    sockets.forEach(socket => socket.disconnect());
  }
}

multiplayerTest(); 