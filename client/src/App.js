import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './App.css';

// 開發環境的日誌函數
const log = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(message, data);
  }
};

// 伺服器 URL - 本地開發或生產環境
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gameserver-production-ddf0.up.railway.app' // Railway 生產環境網址
  : 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [lobbyChat, setLobbyChat] = useState([]);
  const [roomChat, setRoomChat] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [currentView, setCurrentView] = useState('login'); // login, lobby, room
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ 
    name: '', 
    maxPlayers: 4, 
    gameType: 'fruit-eating',
    gameDuration: 60 
  });
  const [gameData, setGameData] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameTime, setGameTime] = useState(60);
  const currentRoomRef = useRef(null);
  const canvasRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // eslint-disable-next-line
  useEffect(() => {
    // 建立 Socket.IO 連接
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // 連接事件
    newSocket.on('connect', () => {
      log('已連接到伺服器');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      log('與伺服器斷線');
      setConnected(false);
    });

    // 大廳事件
    const handleLobbyPlayerJoined = (player) => {
      log('新玩家加入大廳:', player);
      setLobbyPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
    };
    newSocket.on('lobby-player-joined', handleLobbyPlayerJoined);

    const handleLobbyPlayerLeft = (playerId) => {
      log('玩家離開大廳:', playerId);
      setLobbyPlayers(prev => prev.filter(p => p.id !== playerId));
    };
    newSocket.on('lobby-player-left', handleLobbyPlayerLeft);

    const handleLobbyNewMessage = (message) => {
      log('新聊天訊息:', message);
      setLobbyChat(prev => [...prev, message]);
    };
    newSocket.on('lobby-new-message', handleLobbyNewMessage);

    const handleLobbyStateUpdate = (state) => {
      log('大廳狀態更新:', state);
      setLobbyPlayers(state.players);
      setRooms(state.rooms);
    };
    newSocket.on('lobby-state-update', handleLobbyStateUpdate);

    // 房間事件
    const handleRoomCreated = (room) => {
      log('房間創建:', room);
      setRooms(prev => {
        // 移除重複的房間，然後添加新房間
        const filteredRooms = prev.filter(r => r.id !== room.id);
        return [...filteredRooms, room];
      });
    };
    newSocket.on('room-created', handleRoomCreated);

    const handleRoomJoined = (room) => {
      log('加入房間:', room);
      setCurrentRoom(room);
      setCurrentView('room');
      // 清空房間聊天記錄
      setRoomChat([]);
      // 更新當前玩家的房間狀態
      setCurrentPlayer(prev => prev ? { ...prev, currentRoom: room.id } : null);
    };
    newSocket.on('room-joined', handleRoomJoined);

    const handleRoomPlayerJoined = (data) => {
      log('玩家加入房間:', data);
      setCurrentRoom(data.room);
    };
    newSocket.on('room-player-joined', handleRoomPlayerJoined);

    const handleRoomPlayerLeft = (data) => {
      log('玩家離開房間:', data);
      if (currentRoomRef.current) {
        setCurrentRoom(data.room);
      }
    };
    newSocket.on('room-player-left', handleRoomPlayerLeft);

    const handleRoomDeleted = (roomId) => {
      log('房間刪除:', roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (currentRoomRef.current && currentRoomRef.current.id === roomId) {
        setCurrentRoom(null);
        setCurrentView('lobby');
      }
    };
    newSocket.on('room-deleted', handleRoomDeleted);

    const handleRoomJoinError = (error) => {
      log('加入房間錯誤:', error);
      alert(`加入房間失敗: ${error}`);
    };
    newSocket.on('room-join-error', handleRoomJoinError);

    // 房間聊天事件
    const handleRoomNewMessage = (message) => {
      log('房間新訊息:', message);
      setRoomChat(prev => [...prev, message]);
    };
    newSocket.on('room-new-message', handleRoomNewMessage);

    // 遊戲事件
    const handleGameStarted = (data) => {
      log('遊戲開始:', data);
      log('🎮 收到遊戲開始通知:', {
        roomStatus: data.room.status,
        playerCount: Object.keys(data.room.players).length,
        gameDataExists: !!data.gameData,
        scoresCount: data.gameData ? Object.keys(data.gameData.scores).length : 0
      });
      setGameData(data.gameData);
      setGameStarted(true);
      setGameTime(data.room.gameDuration || 60);
      setCurrentRoom(data.room);
      // 重置聊天輸入框
      setNewChatMessage('');
      
    };
    newSocket.on('game-started', handleGameStarted);

    const handleGameEnded = (data) => {
      log('遊戲結束:', data);
      log('🎯 遊戲結束處理:', {
        roomStatus: data.room.status,
        gameStarted: false,
        roomId: data.room.id
      });
      
      // 強制重置遊戲狀態
      setGameStarted(false);
      setGameData(null);
      setCurrentRoom(data.room);
      
      // 確保聊天輸入框可用
      setNewChatMessage('');
      
      // 顯示獲勝者信息
      const winnerName = data.winner.playerName || '未知';
      const winnerScore = data.winner.score || 0;
      alert(`遊戲結束！\n獲勝者: ${winnerName}\n分數: ${winnerScore}分`);
      
    };
    newSocket.on('game-ended', handleGameEnded);

    const handlePlayerMoved = (data) => {
      log('玩家移動:', data);
      // 更新其他玩家的移動
      if (gameData && gameData.scores[data.playerId]) {
        setGameData(prev => ({
          ...prev,
          scores: {
            ...prev.scores,
            [data.playerId]: {
              ...prev.scores[data.playerId],
              snake: {
                ...prev.scores[data.playerId].snake,
                direction: data.direction
              }
            }
          }
        }));
      }
    };
    newSocket.on('player-moved', handlePlayerMoved);

    const handleGameStateUpdate = (data) => {
      log('遊戲狀態更新:', data);
      setGameData(data.gameData);
    };
    newSocket.on('game-state-update', handleGameStateUpdate);

    return () => {
      // 清理所有事件監聽器
      newSocket.off('room-new-message', handleRoomNewMessage);
      newSocket.off('game-started', handleGameStarted);
      newSocket.off('game-ended', handleGameEnded);
      newSocket.off('player-moved', handlePlayerMoved);
      newSocket.off('game-state-update', handleGameStateUpdate);
      newSocket.off('lobby-new-message', handleLobbyNewMessage);
      newSocket.off('lobby-state-update', handleLobbyStateUpdate);
      newSocket.off('lobby-player-joined', handleLobbyPlayerJoined);
      newSocket.off('lobby-player-left', handleLobbyPlayerLeft);
      newSocket.off('room-created', handleRoomCreated);
      newSocket.off('room-joined', handleRoomJoined);
      newSocket.off('room-player-joined', handleRoomPlayerJoined);
      newSocket.off('room-player-left', handleRoomPlayerLeft);
      newSocket.off('room-deleted', handleRoomDeleted);
      newSocket.off('room-join-error', handleRoomJoinError);
      newSocket.off('player-logged-in');
      newSocket.close();
    };
  }, []); // 空依賴項，確保只註冊一次

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [roomChat, lobbyChat, gameData]);

  const handleLogin = () => {
    if (playerName.trim() && socket) {
      socket.emit('player-login', playerName.trim());
      // 等待後端回應後再設置 currentPlayer
      socket.once('player-logged-in', (data) => {
        setCurrentPlayer(data.player);
        setCurrentView('lobby');
      });
    }
  };

  const handleSendChat = useCallback(() => {
    if (newChatMessage.trim() && socket) {
      if (currentView === 'room') {
        // 房間聊天
        socket.emit('room-chat', newChatMessage.trim());
      } else {
        // 大廳聊天
        socket.emit('lobby-chat', newChatMessage.trim());
      }
      setNewChatMessage('');
    }
  }, [newChatMessage, socket, currentView]);

  const handleCreateRoom = () => {
    if (socket && newRoomData.name.trim()) {
      socket.emit('create-room', newRoomData);
      setShowCreateRoom(false);
      setNewRoomData({ name: '', maxPlayers: 4 });
    }
  };

  const handleJoinRoom = (roomId) => {
    if (socket && currentPlayer) {
      // 檢查是否已經在房間中
      if (currentPlayer.currentRoom) {
        alert('您已經在房間中了，請先離開當前房間');
        return;
      }
      socket.emit('join-room', roomId);
    }
  };

  const handleLeaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leave-room');
      setCurrentRoom(null);
      setCurrentView('lobby');
      // 清空房間聊天記錄
      setRoomChat([]);
      // 重置遊戲狀態
      setGameData(null);
      setGameStarted(false);
      setGameTime(60);
      // 更新當前玩家的房間狀態
      setCurrentPlayer(prev => prev ? { ...prev, currentRoom: null } : null);
    }
  };

  const handleStartGame = () => {
    if (socket && currentRoom && currentPlayer && currentRoom.host === currentPlayer.id) {
      // 如果遊戲已結束，先重置狀態
      if (currentRoom.status === 'finished') {
        setGameStarted(false);
        setGameData(null);
        setGameTime(currentRoom.gameDuration || 60);
      }
      socket.emit('start-game');
    }
  };

  const handleGameAction = useCallback((action) => {
    if (socket && gameStarted) {
      socket.emit('game-action', action);
    }
  }, [socket, gameStarted]);

  // 吃果子遊戲邏輯
  const gameLoop = useCallback(() => {
    if (!gameStarted || !gameData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gridSize = 20;
    const canvasSize = 400;

    // 清空畫布
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 繪製網格
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvasSize; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }

    // 繪製果子
    if (gameData.food) {
      ctx.fillStyle = '#e74c3c';
      gameData.food.forEach(food => {
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
      });
    }

    // 繪製所有玩家的角色
    Object.entries(gameData.scores).forEach(([playerId, playerData]) => {
      const character = playerData.snake; // 保持後端兼容性
      const isCurrentPlayer = currentPlayer && playerId === currentPlayer.id;
      
      ctx.fillStyle = isCurrentPlayer ? '#27ae60' : character.color || '#3498db';
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;

      character.body.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        
        // 繪製角色身體
        ctx.fillRect(x, y, gridSize, gridSize);
        ctx.strokeRect(x, y, gridSize, gridSize);
        
        // 如果是角色頭部，繪製眼睛
        if (index === 0) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(x + 4, y + 4, 4, 4);
          ctx.fillRect(x + 12, y + 4, 4, 4);
          ctx.fillStyle = isCurrentPlayer ? '#27ae60' : character.color || '#3498db';
        }
      });
    });
  }, [gameStarted, gameData, currentPlayer]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gameStarted) {
      const interval = setInterval(gameLoop, 100); // 10 FPS
      return () => clearInterval(interval);
    }
  }, [gameLoop, gameStarted]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gameStarted && gameTime > 0) {
      const timer = setInterval(() => {
        setGameTime(prev => {
          if (prev <= 1) {
            // 遊戲結束
            if (socket) {
              socket.emit('end-game');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameTime, socket]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gameStarted && currentRoom) {
      setGameTime(currentRoom.gameDuration || 60);
    }
  }, [gameStarted, currentRoom]);

  // 遊戲結束後重置狀態 - 移除這個 useEffect，因為 handleGameEnded 已經處理了狀態重置

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSendChat();
    }
  }, [handleSendChat]);

  // 鍵盤控制
  const handleKeyDown = useCallback((e) => {
    if (!gameStarted || !currentPlayer) return;

    let direction = null;
    switch (e.key) {
      case 'ArrowUp':
        direction = 'up';
        break;
      case 'ArrowDown':
        direction = 'down';
        break;
      case 'ArrowLeft':
        direction = 'left';
        break;
      case 'ArrowRight':
        direction = 'right';
        break;
      default:
        return;
    }

    e.preventDefault();
    handleGameAction({ type: 'move', direction });
  }, [gameStarted, currentPlayer, handleGameAction]);

  // 添加鍵盤事件監聽
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gameStarted) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, gameStarted]);

  // 登入界面
  if (currentView === 'login') {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-form">
            <h1>🎮 遊戲大廳</h1>
            <p>輸入您的名稱來進入遊戲大廳</p>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="輸入您的名稱"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="login-input"
            />
            <button 
              onClick={handleLogin} 
              disabled={!playerName.trim() || !connected}
              className="login-button"
            >
              {connected ? '進入大廳' : '連接中...'}
            </button>
            {!connected && (
              <div className="connection-status">
                <p>正在連接到伺服器...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 房間界面
  if (currentView === 'room' && currentRoom) {
    return (
      <div className="app">
        <div className="room-container">
          <div className="room-header">
            <h2>🏠 {currentRoom.name}</h2>
            <div className="room-info">
              <span>房主: {currentRoom.hostName}</span>
              <span>玩家: {Object.keys(currentRoom.players).length}/{currentRoom.maxPlayers}</span>
              <span>狀態: {currentRoom.status}</span>
              {currentRoom.gameType && <span>遊戲: {currentRoom.gameType === 'fruit-eating' ? '🍎 吃果子' : currentRoom.gameType}</span>}
              {gameStarted && <span>⏱️ 剩餘時間: {gameTime}秒</span>}
            </div>
            <div className="room-controls">
              {currentPlayer && currentRoom.host === currentPlayer.id && (currentRoom.status === 'waiting' || currentRoom.status === 'finished') && (
                <button onClick={handleStartGame} className="start-game-button">
                  {currentRoom.status === 'finished' ? '🎮 重新開始遊戲' : '🎮 開始遊戲'}
                </button>
              )}
              <button onClick={handleLeaveRoom} className="leave-room-button">
                離開房間
              </button>
            </div>
          </div>
          
          <div className="room-content">
            <div className="room-players">
              <h3>👥 房間玩家</h3>
              <div className="player-list">
                {Object.values(currentRoom.players).map(player => (
                  <div key={player.id} className="player-item">
                    <span className="player-name">
                      {player.name} {player.id === currentRoom.host && '(房主)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="room-content-wrapper">
              {gameStarted && currentRoom && currentRoom.status === 'playing' ? (
                <div className="game-area-with-chat">
                  <div className="game-main-area">
                    <h3>🎮 吃果子遊戲</h3>
                    <div className="game-header">
                      <div className="game-timer">
                        <span className={`timer ${gameTime <= 10 ? 'timer-warning' : ''}`}>
                          ⏱️ 剩餘時間: {gameTime}秒
                        </span>
                      </div>
                      {gameData && (
                        <div className="scores-display">
                          <h4>分數排行榜</h4>
                          {Object.entries(gameData.scores)
                            .sort(([,a], [,b]) => b.score - a.score)
                            .map(([playerId, data]) => (
                              <div key={playerId} className="score-item">
                                <span className="player-name">
                                  {currentRoom.players[playerId]?.name || '未知玩家'}
                                </span>
                                <span className="score">{data.score} 分</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="game-content-compact">
                      <div className="game-canvas-container">
                        <canvas
                          width={400}
                          height={400}
                          className="game-canvas"
                          ref={canvasRef}
                        />
                      </div>
                      <div className="virtual-keyboard">
                        <h4>虛擬鍵盤</h4>
                        <button onClick={() => handleGameAction({type: 'move', direction: 'up'})}>⬆️</button>
                        <div className="horizontal-keys">
                          <button onClick={() => handleGameAction({type: 'move', direction: 'left'})}>⬅️</button>
                          <button onClick={() => handleGameAction({type: 'move', direction: 'down'})}>⬇️</button>
                          <button onClick={() => handleGameAction({type: 'move', direction: 'right'})}>➡️</button>
                        </div>
                      </div>
                    </div>
                    <div className="game-instructions">
                      <p>使用方向鍵或虛擬鍵盤控制角色移動</p>
                      <p>在{currentRoom.gameDuration || 60}秒內吃到最多的果子獲勝！</p>
                    </div>
                  </div>
                  
                  {/* 遊戲進行時的聊天側邊欄 */}
                  <div className="game-chat-sidebar">
                    <h3>💬 遊戲聊天</h3>
                    <div className="chat-messages" ref={chatMessagesRef}>
                      {roomChat.map((msg) => (
                        <div key={msg.id} className="message">
                          <span className="player-name">{msg.playerName}:</span>
                          <span className="message-text">{msg.message}</span>
                          <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="chat-input">
                      <input
                        type="text"
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="輸入訊息..."
                      />
                      <button onClick={handleSendChat} disabled={!newChatMessage.trim()}>
                        發送
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="room-chat">
                  <h3>💬 房間聊天</h3>
                  <div className="chat-messages" ref={chatMessagesRef}>
                    {roomChat.map((msg) => (
                      <div key={msg.id} className="message">
                        <span className="player-name">{msg.playerName}:</span>
                        <span className="message-text">{msg.message}</span>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 聊天輸入框固定在底部（僅在非遊戲狀態時顯示） */}
            {!gameStarted && (
              <div className="room-chat-fixed">
                <div className="chat-input">
                  <input
                    type="text"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="輸入訊息..."
                  />
                  <button onClick={handleSendChat} disabled={!newChatMessage.trim()}>
                    發送
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 大廳界面
  return (
    <div className="app">
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>🎮 遊戲大廳</h1>
          <div className="lobby-status">
            <span>狀態: {connected ? '已連接' : '未連接'}</span>
            <span>玩家: {lobbyPlayers.length}</span>
            <span>房間: {rooms.length}</span>
            {currentPlayer && <span>歡迎, {currentPlayer.name}!</span>}
          </div>
        </div>
        
        <div className="lobby-content">
          <div className="lobby-chat">
            <h3>💬 大廳聊天</h3>
            <div className="chat-messages" ref={chatMessagesRef}>
              {lobbyChat.map((msg) => (
                <div key={msg.id} className="message">
                  <span className="player-name">{msg.playerName}:</span>
                  <span className="message-text">{msg.message}</span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入訊息..."
              />
              <button onClick={handleSendChat}>發送</button>
            </div>
          </div>
          
          <div className="lobby-sidebar">
            <div className="player-list-section">
              <h3>👥 在線玩家 ({lobbyPlayers.length})</h3>
              <div className="player-list">
                {lobbyPlayers.map(player => (
                  <div key={player.id} className="player-item">
                    <span className="player-name">{player.name}</span>
                    <span className="player-status">{player.status}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="room-list-section">
              <h3>🏠 遊戲房間 ({rooms.length})</h3>
              <button 
                onClick={() => setShowCreateRoom(true)}
                className="create-room-button"
              >
                ➕ 創建房間
              </button>
              <div className="room-list">
                {rooms.map(room => (
                  <div key={room.id} className="room-item">
                    <div className="room-info">
                      <h4>{room.name}</h4>
                      <p>房主: {room.hostName}</p>
                      <p>玩家: {Object.keys(room.players).length}/{room.maxPlayers}</p>
                      <p>狀態: {room.status}</p>
                    </div>
                    <button 
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={
                        room.status !== 'waiting' || 
                        Object.keys(room.players).length >= room.maxPlayers ||
                        (currentPlayer && currentPlayer.currentRoom === room.id)
                      }
                      className="join-room-button"
                    >
                      {currentPlayer && currentPlayer.currentRoom === room.id 
                        ? '已在房間' 
                        : room.status === 'waiting' 
                          ? '加入' 
                          : '遊戲中'
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 創建房間彈窗 */}
        {showCreateRoom && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>創建新房間</h3>
              <input
                type="text"
                value={newRoomData.name}
                onChange={(e) => setNewRoomData({...newRoomData, name: e.target.value})}
                placeholder="房間名稱"
              />
              <select
                value={newRoomData.maxPlayers}
                onChange={(e) => setNewRoomData({...newRoomData, maxPlayers: parseInt(e.target.value)})}
              >
                <option value={2}>2 人</option>
                <option value={4}>4 人</option>
                <option value={6}>6 人</option>
                <option value={8}>8 人</option>
              </select>
              <select
                value={newRoomData.gameType}
                onChange={(e) => setNewRoomData({...newRoomData, gameType: e.target.value})}
              >
                <option value="fruit-eating">🍎 吃果子</option>
              </select>
              <select
                value={newRoomData.gameDuration}
                onChange={(e) => setNewRoomData({...newRoomData, gameDuration: parseInt(e.target.value)})}
              >
                <option value={30}>30 秒</option>
                <option value={60}>60 秒</option>
              </select>
              <div className="modal-buttons">
                <button onClick={handleCreateRoom} disabled={!newRoomData.name.trim()}>
                  創建
                </button>
                <button onClick={() => setShowCreateRoom(false)}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 