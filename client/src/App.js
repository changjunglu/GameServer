import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// 伺服器 URL - 本地開發或生產環境
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gameserver-production-ddf0.up.railway.app' // Railway 生產環境網址
  : 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState({});
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    // 建立 Socket.IO 連接
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // 連接事件
    newSocket.on('connect', () => {
      console.log('已連接到伺服器');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('與伺服器斷線');
      setConnected(false);
    });

    // 遊戲事件
    newSocket.on('player-joined', (player) => {
      console.log('新玩家加入:', player);
      setPlayers(prev => ({ ...prev, [player.id]: player }));
    });

    newSocket.on('player-left', (playerId) => {
      console.log('玩家離開:', playerId);
      setPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[playerId];
        return newPlayers;
      });
    });

    newSocket.on('player-moved', (data) => {
      setPlayers(prev => ({
        ...prev,
        [data.playerId]: {
          ...prev[data.playerId],
          position: data.position
        }
      }));
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('game-state-update', (gameState) => {
      setPlayers(gameState.players);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinGame = () => {
    if (playerName.trim() && socket) {
      socket.emit('join-game', playerName.trim());
      setJoined(true);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('send-message', newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // 處理滑鼠移動（簡單的移動控制）
  const handleCanvasClick = (e) => {
    if (!joined) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPos = { x, y };
    
    if (socket) {
      socket.emit('player-move', newPos);
    }
  };

  // 繪製遊戲畫面
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製所有玩家
    Object.values(players).forEach(player => {
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, 20, 0, 2 * Math.PI);
      ctx.fill();
      
      // 繪製玩家名稱
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.position.x, player.position.y - 30);
    });
  }, [players]);

  if (!connected) {
    return (
      <div className="app">
        <div className="loading">
          <h2>正在連接到伺服器...</h2>
          <p>請確保後端伺服器正在運行</p>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="app">
        <div className="join-form">
          <h1>多人遊戲</h1>
          <p>輸入您的名稱來加入遊戲</p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="輸入您的名稱"
            onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
          />
          <button onClick={handleJoinGame} disabled={!playerName.trim()}>
            加入遊戲
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-header">
          <h2>多人遊戲</h2>
          <div className="status">
            狀態: {connected ? '已連接' : '未連接'} | 
            玩家數: {Object.keys(players).length}
          </div>
        </div>
        
        <div className="game-content">
          <div className="game-area">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              onClick={handleCanvasClick}
              className="game-canvas"
            />
            <p className="instructions">點擊畫布來移動您的角色</p>
          </div>
          
          <div className="chat-area">
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className="message">
                  <span className="player-name">{msg.playerName}:</span>
                  <span className="message-text">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入訊息..."
              />
              <button onClick={handleSendMessage}>發送</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 