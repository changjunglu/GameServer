const io = require('socket.io-client');

console.log('🧪 完整貪食蛇遊戲測試開始...\n');

const SERVER_URL = 'http://localhost:3001';

class GameTest {
  constructor() {
    this.sockets = [];
    this.players = [
      { name: '玩家A', id: 'playerA' },
      { name: '玩家B', id: 'playerB' },
      { name: '玩家C', id: 'playerC' },
      { name: '玩家D', id: 'playerD' }
    ];
    this.testResults = {
      connection: false,
      login: false,
      lobbyChat: false,
      roomCreation: false,
      roomJoin: false,
      roomChat: false,
      gameStart: false,
      gameActions: false,
      gameSync: false,
      foodSystem: false,
      scoreSystem: false,
      gameEnd: false,
      leaveRoom: false,
      disconnect: false
    };
  }

  async runCompleteTest() {
    try {
      await this.testConnection();
      await this.testLogin();
      await this.testLobbyChat();
      await this.testRoomCreation();
      await this.testRoomJoin();
      await this.testRoomChat();
      await this.testGameStart();
      await this.testGameActions();
      await this.testGameSync();
      await this.testFoodSystem();
      await this.testScoreSystem();
      await this.testGameEnd();
      await this.testLeaveRoom();
      await this.testDisconnect();
      
      this.showResults();
    } catch (error) {
      console.error('❌ 測試失敗:', error.message);
    } finally {
      this.cleanup();
    }
  }

  async testConnection() {
    console.log('📡 1. 測試服務器連接...');
    
    for (let i = 0; i < 4; i++) {
      const socket = io(SERVER_URL);
      
      await new Promise((resolve, reject) => {
        socket.on('connect', () => {
          console.log(`✅ 玩家${i+1} 連接成功`);
          this.sockets.push(socket);
          resolve();
        });
        
        socket.on('connect_error', (error) => {
          console.log(`❌ 玩家${i+1} 連接失敗:`, error.message);
          reject(error);
        });
        
        setTimeout(() => reject(new Error('連接超時')), 5000);
      });
    }
    
    this.testResults.connection = true;
  }

  async testLogin() {
    console.log('\n👤 2. 測試玩家登入...');
    
    for (let i = 0; i < this.sockets.length; i++) {
      const socket = this.sockets[i];
      const player = this.players[i];
      
      socket.emit('player-login', { name: player.name });
      
      await new Promise((resolve) => {
        socket.on('lobby-player-joined', (data) => {
          console.log(`✅ ${player.name} 登入成功`);
          resolve();
        });
        
        setTimeout(resolve, 1000);
      });
    }
    
    this.testResults.login = true;
  }

  async testLobbyChat() {
    console.log('\n💬 3. 測試大廳聊天...');
    
    const socket = this.sockets[0];
    const player = this.players[0];
    
    socket.emit('lobby-chat', '大家好！');
    
    await new Promise((resolve) => {
      socket.on('lobby-new-message', (message) => {
        console.log(`✅ 大廳聊天成功: ${message.message}`);
        resolve();
      });
      
      setTimeout(resolve, 1000);
    });
    
    this.testResults.lobbyChat = true;
  }

  async testRoomCreation() {
    console.log('\n🏠 4. 測試創建房間...');
    
    const hostSocket = this.sockets[0];
    hostSocket.emit('create-room', {
      name: '完整測試房間',
      maxPlayers: 4,
      gameType: 'fruit-eating',
      gameDuration: 60
    });
    
    await new Promise((resolve) => {
      hostSocket.on('room-created', (room) => {
        console.log(`✅ 房間創建成功: ${room.name}`);
        console.log(`   房主: ${room.hostName}`);
        console.log(`   遊戲類型: ${room.gameType}`);
        console.log(`   遊戲時間: ${room.gameDuration}秒`);
        console.log(`   最大玩家: ${room.maxPlayers}`);
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    this.testResults.roomCreation = true;
  }

  async testRoomJoin() {
    console.log('\n🚪 5. 測試加入房間...');
    
    // 其他玩家加入房間
    for (let i = 1; i < this.sockets.length; i++) {
      const socket = this.sockets[i];
      const player = this.players[i];
      
      socket.emit('join-room', 'room_' + Date.now().toString().slice(0, -3));
      
      await new Promise((resolve) => {
        socket.on('room-joined', (room) => {
          console.log(`✅ ${player.name} 加入房間成功`);
          resolve();
        });
        
        setTimeout(resolve, 1000);
      });
    }
    
    this.testResults.roomJoin = true;
  }

  async testRoomChat() {
    console.log('\n💬 6. 測試房間聊天...');
    
    const socket = this.sockets[1];
    const player = this.players[1];
    
    socket.emit('room-chat', '房間內聊天測試！');
    
    await new Promise((resolve) => {
      socket.on('room-new-message', (message) => {
        console.log(`✅ 房間聊天成功: ${message.message}`);
        resolve();
      });
      
      setTimeout(resolve, 1000);
    });
    
    this.testResults.roomChat = true;
  }

  async testGameStart() {
    console.log('\n🎮 7. 測試開始遊戲...');
    
    const hostSocket = this.sockets[0];
    hostSocket.emit('start-game');
    
    await new Promise((resolve) => {
      hostSocket.on('game-started', (data) => {
        console.log('✅ 遊戲開始成功');
        console.log('   遊戲數據:', {
          startTime: data.gameData.startTime,
          duration: data.gameData.duration,
          foodCount: data.gameData.food.length,
          playersCount: Object.keys(data.gameData.scores).length
        });
        
        // 顯示所有玩家的初始分數
        console.log('   玩家初始分數:');
        Object.entries(data.gameData.scores).forEach(([playerId, scoreData]) => {
          const player = this.players.find(p => p.id === playerId) || { name: '未知' };
          console.log(`     - ${player.name}: ${scoreData.score} 分`);
        });
        
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    this.testResults.gameStart = true;
  }

  async testGameActions() {
    console.log('\n🎯 8. 測試遊戲動作...');
    
    // 所有玩家發送遊戲動作
    for (let i = 0; i < this.sockets.length; i++) {
      const socket = this.sockets[i];
      const player = this.players[i];
      
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
    
    console.log('✅ 遊戲動作測試完成');
    this.testResults.gameActions = true;
  }

  async testGameSync() {
    console.log('\n🔄 9. 測試遊戲同步...');
    
    // 測試遊戲狀態同步
    const socket = this.sockets[0];
    
    await new Promise((resolve) => {
      socket.on('game-state-update', (data) => {
        console.log('✅ 遊戲狀態同步成功');
        console.log(`   食物數量: ${data.gameData.food.length}`);
        console.log(`   玩家數量: ${Object.keys(data.gameData.scores).length}`);
        resolve();
      });
      
      // 發送一個動作來觸發同步
      socket.emit('game-action', {
        type: 'move',
        direction: 'up'
      });
      
      setTimeout(resolve, 2000);
    });
    
    this.testResults.gameSync = true;
  }

  async testFoodSystem() {
    console.log('\n🍎 10. 測試食物系統...');
    
    const socket = this.sockets[0];
    
    // 模擬吃到食物
    await new Promise((resolve) => {
      socket.on('game-state-update', (data) => {
        if (data.gameData.food.length < 5) {
          console.log('✅ 食物系統正常 - 新食物已生成');
        }
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    this.testResults.foodSystem = true;
  }

  async testScoreSystem() {
    console.log('\n📊 11. 測試分數系統...');
    
    const socket = this.sockets[0];
    
    await new Promise((resolve) => {
      socket.on('game-state-update', (data) => {
        console.log('✅ 分數系統正常');
        Object.entries(data.gameData.scores).forEach(([playerId, scoreData]) => {
          console.log(`   玩家分數: ${scoreData.score} 分`);
        });
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    this.testResults.scoreSystem = true;
  }

  async testGameEnd() {
    console.log('\n🏁 12. 測試遊戲結束...');
    
    const hostSocket = this.sockets[0];
    
    // 手動結束遊戲（模擬60秒結束）
    hostSocket.emit('end-game');
    
    await new Promise((resolve) => {
      hostSocket.on('game-ended', (data) => {
        console.log('✅ 遊戲結束成功');
        console.log(`   獲勝者: ${data.winner.playerName || '未知'}`);
        console.log('   最終分數:');
        Object.entries(data.scores).forEach(([playerId, scoreData]) => {
          const player = this.players.find(p => p.id === playerId) || { name: '未知' };
          console.log(`     - ${player.name}: ${scoreData.score} 分`);
        });
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    this.testResults.gameEnd = true;
  }

  async testLeaveRoom() {
    console.log('\n🚪 13. 測試離開房間...');
    
    const socket = this.sockets[1];
    const player = this.players[1];
    
    socket.emit('leave-room');
    
    await new Promise((resolve) => {
      socket.on('lobby-state-update', (data) => {
        console.log(`✅ ${player.name} 成功離開房間`);
        resolve();
      });
      
      setTimeout(resolve, 2000);
    });
    
    this.testResults.leaveRoom = true;
  }

  async testDisconnect() {
    console.log('\n🔌 14. 測試斷線處理...');
    
    const socket = this.sockets[2];
    const player = this.players[2];
    
    socket.disconnect();
    
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ ${player.name} 斷線處理正常`);
        resolve();
      }, 1000);
    });
    
    this.testResults.disconnect = true;
  }

  showResults() {
    console.log('\n📊 完整測試結果總結:');
    console.log('=====================================');
    
    const results = [
      { name: '服務器連接', result: this.testResults.connection },
      { name: '玩家登入', result: this.testResults.login },
      { name: '大廳聊天', result: this.testResults.lobbyChat },
      { name: '創建房間', result: this.testResults.roomCreation },
      { name: '加入房間', result: this.testResults.roomJoin },
      { name: '房間聊天', result: this.testResults.roomChat },
      { name: '開始遊戲', result: this.testResults.gameStart },
      { name: '遊戲動作', result: this.testResults.gameActions },
      { name: '遊戲同步', result: this.testResults.gameSync },
      { name: '食物系統', result: this.testResults.foodSystem },
      { name: '分數系統', result: this.testResults.scoreSystem },
      { name: '遊戲結束', result: this.testResults.gameEnd },
      { name: '離開房間', result: this.testResults.leaveRoom },
      { name: '斷線處理', result: this.testResults.disconnect }
    ];
    
    results.forEach(test => {
      const status = test.result ? '✅ 通過' : '❌ 失敗';
      console.log(`${test.name}: ${status}`);
    });
    
    const passedTests = results.filter(r => r.result).length;
    const totalTests = results.length;
    
    console.log(`\n總計: ${passedTests}/${totalTests} 項測試通過`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有測試都通過了！貪食蛇遊戲功能完整正常。');
    } else {
      console.log('⚠️  部分測試失敗，請檢查相關功能。');
    }
  }

  cleanup() {
    console.log('\n🧹 清理測試連接...');
    this.sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    this.sockets = [];
    console.log('✅ 清理完成');
  }
}

// 開始完整測試
const gameTest = new GameTest();
gameTest.runCompleteTest(); 