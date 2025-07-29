import React, { useState, useEffect, useRef } from 'react';
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
  const [newRoomData, setNewRoomData] = useState({ name: '', maxPlayers: 4 });
  const currentRoomRef = useRef(null);

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
    newSocket.on('lobby-player-joined', (player) => {
      log('新玩家加入大廳:', player);
      setLobbyPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
    });

    newSocket.on('lobby-player-left', (playerId) => {
      log('玩家離開大廳:', playerId);
      setLobbyPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    newSocket.on('lobby-new-message', (message) => {
      log('新聊天訊息:', message);
      setLobbyChat(prev => [...prev, message]);
    });

    newSocket.on('lobby-state-update', (state) => {
      log('大廳狀態更新:', state);
      setLobbyPlayers(state.players);
      setRooms(state.rooms);
    });

    // 房間事件
    newSocket.on('room-created', (room) => {
      log('房間創建:', room);
      setRooms(prev => {
        // 移除重複的房間，然後添加新房間
        const filteredRooms = prev.filter(r => r.id !== room.id);
        return [...filteredRooms, room];
      });
    });

    newSocket.on('room-joined', (room) => {
      log('加入房間:', room);
      setCurrentRoom(room);
      setCurrentView('room');
      // 清空房間聊天記錄
      setRoomChat([]);
      // 更新當前玩家的房間狀態
      setCurrentPlayer(prev => prev ? { ...prev, currentRoom: room.id } : null);
    });

    newSocket.on('room-player-joined', (data) => {
      log('玩家加入房間:', data);
      setCurrentRoom(data.room);
    });

    newSocket.on('room-player-left', (data) => {
      log('玩家離開房間:', data);
      if (currentRoomRef.current) {
        setCurrentRoom(data.room);
      }
    });

    newSocket.on('room-deleted', (roomId) => {
      log('房間刪除:', roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (currentRoomRef.current && currentRoomRef.current.id === roomId) {
        setCurrentRoom(null);
        setCurrentView('lobby');
      }
    });

    newSocket.on('room-join-error', (error) => {
      log('加入房間錯誤:', error);
      alert(`加入房間失敗: ${error}`);
    });

    // 房間聊天事件
    newSocket.on('room-new-message', (message) => {
      log('房間新訊息:', message);
      setRoomChat(prev => [...prev, message]);
    });

    return () => {
      newSocket.close();
    };
  }, []); // 移除 currentRoom 依賴項

  // 更新 currentRoomRef
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  const handleLogin = () => {
    if (playerName.trim() && socket) {
      socket.emit('player-login', playerName.trim());
      setCurrentPlayer({ id: socket.id, name: playerName.trim() });
      setCurrentView('lobby');
    }
  };

  const handleSendChat = () => {
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
  };

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
      // 更新當前玩家的房間狀態
      setCurrentPlayer(prev => prev ? { ...prev, currentRoom: null } : null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendChat();
    }
  };

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
            </div>
            <button onClick={handleLeaveRoom} className="leave-room-button">
              離開房間
            </button>
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
            
            <div className="room-chat">
              <h3>💬 房間聊天</h3>
              <div className="chat-messages">
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
                <button onClick={handleSendChat}>發送</button>
              </div>
            </div>
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
            <div className="chat-messages">
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