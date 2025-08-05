#!/usr/bin/env node

// 部署檢查腳本
const fs = require('fs');

console.log('🔍 檢查部署配置...');

// 檢查前端設定
console.log('\n📱 檢查前端設定...');
const clientApp = fs.readFileSync('client/src/App.js', 'utf8');

if (clientApp.includes('gameserver-production-ddf0.up.railway.app')) {
  console.log('✅ 前端已設定正確的 Railway 網址');
} else {
  console.log('❌ 前端未設定正確的 Railway 網址');
}

// 檢查後端 CORS 設定
console.log('\n🔧 檢查後端 CORS 設定...');
const serverIndex = fs.readFileSync('server/index.js', 'utf8');

if (serverIndex.includes('*.netlify.app')) {
  console.log('✅ 後端已設定允許 Netlify 網址');
} else {
  console.log('❌ 後端未設定允許 Netlify 網址');
}

// 檢查 Railway 配置
console.log('\n🚂 檢查 Railway 配置...');
if (fs.existsSync('server/railway.json')) {
  console.log('✅ Railway 配置檔案存在');
} else {
  console.log('❌ Railway 配置檔案不存在');
}

// 檢查 Netlify 配置
console.log('\n🌐 檢查 Netlify 配置...');
if (fs.existsSync('client/netlify.toml')) {
  console.log('✅ Netlify 配置檔案存在');
} else {
  console.log('❌ Netlify 配置檔案不存在');
}

console.log('\n📋 部署檢查完成！');
console.log('\n🎯 下一步：');
console.log('1. 推送到 GitHub');
console.log('2. 在 Netlify 部署前端');
console.log('3. 測試連接'); 