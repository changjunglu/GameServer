#!/usr/bin/env node

// Railway 部署腳本
// 這個腳本會在 Railway 部署時執行

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 開始部署遊戲伺服器...');

// 檢查是否在 server 目錄
const currentDir = process.cwd();
const isInServerDir = fs.existsSync(path.join(currentDir, 'index.js'));

if (!isInServerDir) {
  console.log('📁 切換到 server 目錄...');
  process.chdir('server');
}

// 安裝依賴
console.log('📦 安裝依賴...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ 依賴安裝完成');
} catch (error) {
  console.error('❌ 依賴安裝失敗:', error.message);
  process.exit(1);
}

// 檢查檔案是否存在
const requiredFiles = ['index.js', 'package.json'];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ 缺少必要檔案: ${file}`);
    process.exit(1);
  }
}

console.log('✅ 部署準備完成');
console.log('🎮 伺服器將在 Railway 啟動...'); 