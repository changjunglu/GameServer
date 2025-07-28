#!/usr/bin/env node

// 連接診斷腳本
const https = require('https');
const http = require('http');

console.log('🔍 診斷連接問題...');

const RAILWAY_URL = 'https://gameserver-production-ddf0.up.railway.app';

// 測試 HTTP 連接
console.log('\n📡 測試 HTTP 連接...');
const testHttpConnection = () => {
  return new Promise((resolve, reject) => {
    const req = https.get(`${RAILWAY_URL}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`✅ HTTP 連接成功 (狀態碼: ${res.statusCode})`);
        console.log(`📄 回應: ${data}`);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error(`❌ HTTP 連接失敗: ${error.message}`);
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.error('❌ HTTP 連接超時');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

// 測試 Socket.IO 連接
console.log('\n🔌 測試 Socket.IO 連接...');
const testSocketConnection = () => {
  return new Promise((resolve, reject) => {
    const io = require('socket.io-client');
    
    const socket = io(RAILWAY_URL, {
      timeout: 5000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO 連接成功');
      console.log(`🆔 Socket ID: ${socket.id}`);
      socket.disconnect();
      resolve();
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ Socket.IO 連接失敗: ${error.message}`);
      reject(error);
    });

    socket.on('error', (error) => {
      console.error(`❌ Socket.IO 錯誤: ${error.message}`);
      reject(error);
    });

    setTimeout(() => {
      console.error('❌ Socket.IO 連接超時');
      socket.disconnect();
      reject(new Error('Socket.IO timeout'));
    }, 10000);
  });
};

// 執行診斷
async function runDiagnosis() {
  try {
    await testHttpConnection();
    await testSocketConnection();
    
    console.log('\n🎉 診斷完成！');
    console.log('\n📋 可能的問題和解決方案:');
    console.log('1. CORS 問題 - 已修正後端設定');
    console.log('2. 網路連接 - 檢查防火牆設定');
    console.log('3. 前端設定 - 確認 SERVER_URL 正確');
    console.log('4. 瀏覽器快取 - 清除瀏覽器快取');
    
  } catch (error) {
    console.error('\n❌ 診斷失敗:', error.message);
    console.log('\n🔧 建議的解決方案:');
    console.log('1. 檢查 Railway 服務狀態');
    console.log('2. 確認環境變數設定');
    console.log('3. 檢查網路連接');
  }
}

runDiagnosis(); 