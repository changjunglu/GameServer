#!/usr/bin/env node

/**
 * Railway 部署檢查腳本
 * 用於檢查和修復Railway部署問題
 */

const https = require('https');
const { execSync } = require('child_process');

const RAILWAY_URL = 'https://gameserver-production-ddf0.up.railway.app';

// 檢查端點是否可訪問
function checkEndpoint(path) {
  return new Promise((resolve, reject) => {
    const url = `${RAILWAY_URL}${path}`;
    console.log(`🔍 檢查端點: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${path} - 狀態: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log(`📄 回應: ${data.substring(0, 100)}...`);
        }
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${path} - 錯誤: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${path} - 超時`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// 檢查WebSocket連接
function checkWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('🔌 檢查WebSocket連接...');
    
    // 使用簡單的HTTP請求檢查Socket.IO端點
    const url = `${RAILWAY_URL}/socket.io/`;
    const req = https.get(url, (res) => {
      console.log(`✅ Socket.IO端點 - 狀態: ${res.statusCode}`);
      resolve({ status: res.statusCode });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Socket.IO端點 - 錯誤: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ Socket.IO端點 - 超時`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// 主函數
async function main() {
  console.log('🚀 Railway 部署檢查開始...\n');
  
  try {
    // 檢查健康端點
    await checkEndpoint('/health');
    
    // 檢查API端點
    await checkEndpoint('/api/lobby');
    
    // 檢查Socket.IO端點
    await checkWebSocket();
    
    console.log('\n✅ 所有檢查完成！');
    
    // 提供修復建議
    console.log('\n📋 如果發現問題，請嘗試以下解決方案:');
    console.log('1. 在Railway控制台重新部署服務');
    console.log('2. 檢查Railway服務日誌');
    console.log('3. 確認環境變數設定正確');
    console.log('4. 檢查Railway服務是否在正確的目錄中運行');
    
  } catch (error) {
    console.log(`\n❌ 檢查失敗: ${error.message}`);
    console.log('\n🔧 建議的修復步驟:');
    console.log('1. 檢查Railway服務狀態');
    console.log('2. 重新部署服務');
    console.log('3. 檢查網路連接');
  }
}

// 執行檢查
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkEndpoint, checkWebSocket };
