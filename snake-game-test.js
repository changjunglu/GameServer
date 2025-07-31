const io = require('socket.io-client');

console.log('🧪 開始測試貪食蛇遊戲功能...\n');

// 測試配置
const SERVER_URL = 'http://localhost:3001';
const TEST_PLAYERS = [
  { name: '測試玩家1', id: 'player1' },
  { name: '測試玩家2', id: 'player2' },
  { name: '測試玩家3', id: 'player3' }
];

let sockets = [];
let testResults = {
  connection: false,
  login: false,
  roomCreation: false,
  roomJoin: false,
  gameStart: false,
  gameActions: false,
  gameEnd: false
};

// 測試連接
async function testConnection() {
  console.log('📡 測試 1: 服務器連接');
  
  try {
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
      console.log('✅ 連接成功');
      testResults.connection = true;
      sockets.push(socket);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ 連接失敗:', error.message);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.log('❌ 連接測試失敗:', error.message);
  }
}

// 測試玩家登入
async function testLogin() {
  console.log('\n👤 測試 2: 玩家登入');
  
  if (sockets.length === 0) {
    console.log('❌ 沒有可用的連接');
    return;
  }
  
  const socket = sockets[0];
  
  socket.emit('player-login', { name: TEST_PLAYERS[0].name });
  
  socket.on('lobby-player-joined', (data) => {
    console.log('✅ 玩家登入成功:', data.player.name);
    testResults.login = true;
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// 測試創建房間
async function testCreateRoom() {
  console.log('\n🏠 測試 3: 創建遊戲房間');
  
  if (sockets.length === 0) {
    console.log('❌ 沒有可用的連接');
    return;
  }
  
  const socket = sockets[0];
  
  socket.emit('create-room', {
    name: '測試貪食蛇房間',
    maxPlayers: 4,
    gameType: 'snake'
  });
  
  socket.on('room-created', (data) => {
    console.log('✅ 房間創建成功:', data.room.name);
    console.log('   遊戲類型:', data.room.gameType);
    testResults.roomCreation = true;
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// 測試加入房間
async function testJoinRoom() {
  console.log('\n🚪 測試 4: 加入房間');
  
  if (sockets.length < 2) {
    console.log('❌ 需要至少2個連接來測試加入房間');
    return;
  }
  
  const socket1 = sockets[0];
  const socket2 = sockets[1];
  
  // 第二個玩家登入
  socket2.emit('player-login', { name: TEST_PLAYERS[1].name });
  
  // 等待第一個玩家創建房間後，第二個玩家加入
  socket1.on('room-created', async (data) => {
    console.log('   房間已創建，第二個玩家準備加入...');
    
    socket2.emit('join-room', data.room.id);
    
    socket2.on('room-joined', (data) => {
      console.log('✅ 第二個玩家成功加入房間:', data.room.name);
      testResults.roomJoin = true;
    });
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
}

// 測試開始遊戲
async function testStartGame() {
  console.log('\n🎮 測試 5: 開始遊戲');
  
  if (sockets.length < 2) {
    console.log('❌ 需要至少2個連接來測試遊戲');
    return;
  }
  
  const socket1 = sockets[0];
  
  socket1.on('room-created', async (data) => {
    console.log('   房主準備開始遊戲...');
    
    // 等待一下讓其他玩家加入
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    socket1.emit('start-game');
    
    socket1.on('game-started', (data) => {
      console.log('✅ 遊戲開始成功');
      console.log('   遊戲數據:', {
        startTime: data.gameData.startTime,
        duration: data.gameData.duration,
        foodCount: data.gameData.food.length,
        playersCount: Object.keys(data.gameData.scores).length
      });
      testResults.gameStart = true;
    });
  });
  
  await new Promise(resolve => setTimeout(resolve, 4000));
}

// 測試遊戲動作
async function testGameActions() {
  console.log('\n🎯 測試 6: 遊戲動作');
  
  if (sockets.length < 2) {
    console.log('❌ 需要至少2個連接來測試遊戲動作');
    return;
  }
  
  const socket1 = sockets[0];
  
  socket1.on('game-started', async (data) => {
    console.log('   測試發送遊戲動作...');
    
    // 測試移動動作
    const directions = ['up', 'down', 'left', 'right'];
    for (let i = 0; i < 4; i++) {
      socket1.emit('game-action', {
        type: 'move',
        direction: directions[i]
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('✅ 遊戲動作測試完成');
    testResults.gameActions = true;
  });
  
  await new Promise(resolve => setTimeout(resolve, 6000));
}

// 測試遊戲結束
async function testGameEnd() {
  console.log('\n🏁 測試 7: 遊戲結束');
  
  if (sockets.length < 2) {
    console.log('❌ 需要至少2個連接來測試遊戲結束');
    return;
  }
  
  const socket1 = sockets[0];
  
  socket1.on('game-started', async (data) => {
    console.log('   等待遊戲自然結束...');
    
    // 等待遊戲時間結束
    await new Promise(resolve => setTimeout(resolve, 65000)); // 65秒
    
    socket1.on('game-ended', (data) => {
      console.log('✅ 遊戲結束成功');
      console.log('   獲勝者:', data.winner.playerName);
      console.log('   最終分數:', data.scores);
      testResults.gameEnd = true;
    });
  });
  
  await new Promise(resolve => setTimeout(resolve, 70000)); // 70秒
}

// 顯示測試結果
function showTestResults() {
  console.log('\n📊 測試結果總結:');
  console.log('========================');
  
  const results = [
    { name: '服務器連接', result: testResults.connection },
    { name: '玩家登入', result: testResults.login },
    { name: '創建房間', result: testResults.roomCreation },
    { name: '加入房間', result: testResults.roomJoin },
    { name: '開始遊戲', result: testResults.gameStart },
    { name: '遊戲動作', result: testResults.gameActions },
    { name: '遊戲結束', result: testResults.gameEnd }
  ];
  
  results.forEach(test => {
    const status = test.result ? '✅ 通過' : '❌ 失敗';
    console.log(`${test.name}: ${status}`);
  });
  
  const passedTests = results.filter(r => r.result).length;
  const totalTests = results.length;
  
  console.log(`\n總計: ${passedTests}/${totalTests} 項測試通過`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有測試都通過了！貪食蛇遊戲功能正常。');
  } else {
    console.log('⚠️  部分測試失敗，請檢查相關功能。');
  }
}

// 清理連接
function cleanup() {
  console.log('\n🧹 清理測試連接...');
  sockets.forEach(socket => {
    socket.disconnect();
  });
  sockets = [];
  console.log('✅ 清理完成');
}

// 執行測試
async function runTests() {
  try {
    await testConnection();
    await testLogin();
    await testCreateRoom();
    await testJoinRoom();
    await testStartGame();
    await testGameActions();
    // await testGameEnd(); // 註釋掉因為需要等待65秒
    
    showTestResults();
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  } finally {
    cleanup();
    process.exit(0);
  }
}

// 開始測試
runTests(); 