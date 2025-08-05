#!/usr/bin/env node

// 測試部署腳本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 測試部署配置...');

// 檢查必要檔案
const requiredFiles = [
  'server/index.js',
  'server/package.json',
  'server/railway.json'
];

console.log('📁 檢查必要檔案...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.error(`❌ ${file} 不存在`);
    process.exit(1);
  }
}

// 檢查 server/package.json
console.log('📦 檢查 server/package.json...');
const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));

if (!serverPackage.scripts.start) {
  console.error('❌ server/package.json 缺少 start 腳本');
  process.exit(1);
}

if (!serverPackage.dependencies.express) {
  console.error('❌ server/package.json 缺少 express 依賴');
  process.exit(1);
}

if (!serverPackage.dependencies['socket.io']) {
  console.error('❌ server/package.json 缺少 socket.io 依賴');
  process.exit(1);
}

console.log('✅ server/package.json 配置正確');

// 檢查 server/index.js
console.log('🔧 檢查 server/index.js...');
const serverCode = fs.readFileSync('server/index.js', 'utf8');

if (!serverCode.includes('process.env.PORT')) {
  console.error('❌ server/index.js 沒有使用 process.env.PORT');
  process.exit(1);
}

if (!serverCode.includes('express')) {
  console.error('❌ server/index.js 沒有引入 express');
  process.exit(1);
}

if (!serverCode.includes('socket.io')) {
  console.error('❌ server/index.js 沒有引入 socket.io');
  process.exit(1);
}

console.log('✅ server/index.js 配置正確');

// 測試安裝依賴
console.log('📦 測試安裝依賴...');
try {
  process.chdir('server');
  execSync('npm install --dry-run', { stdio: 'pipe' });
  console.log('✅ 依賴安裝測試通過');
} catch (error) {
  console.error('❌ 依賴安裝測試失敗:', error.message);
  process.exit(1);
}

console.log('🎉 所有測試通過！部署配置正確。');
console.log('');
console.log('📋 Railway 部署設定:');
console.log('  - Root Directory: server');
console.log('  - Build Command: npm install');
console.log('  - Start Command: npm start');
console.log('  - Environment: NODE_ENV=production'); 