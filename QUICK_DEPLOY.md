# 快速部署指南

## 🚀 當前狀態

✅ **Railway 後端已部署**: `https://gameserver-production-ddf0.up.railway.app`  
✅ **前端設定已更新**: 指向正確的 Railway 網址  
✅ **CORS 已設定**: 允許 Netlify 網址  

## 📱 部署前端到 Netlify

### 步驟 1: 推送到 GitHub
```bash
git add .
git commit -m "更新前端設定以連接 Railway 後端"
git push origin main
```

### 步驟 2: 在 Netlify 部署
1. 登入 [Netlify](https://netlify.com/)
2. 點擊 "New site from Git"
3. 選擇您的 GitHub 倉庫
4. 設定部署選項：
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

### 步驟 3: 獲取 Netlify 網址
部署完成後，Netlify 會提供一個網址，例如：
`https://your-app-name.netlify.app`

## 🧪 測試部署

### 1. 測試後端
```bash
curl https://gameserver-production-ddf0.up.railway.app/health
```

### 2. 測試前端
訪問您的 Netlify 網址，應該能看到遊戲介面。

### 3. 測試多人功能
- 開啟多個瀏覽器視窗
- 輸入不同玩家名稱
- 測試移動和聊天功能

## 🔧 故障排除

### 如果前端無法連接到後端：
1. 檢查瀏覽器控制台錯誤
2. 確認 Railway 服務正在運行
3. 檢查 CORS 設定

### 如果部署失敗：
1. 檢查 Netlify 建置日誌
2. 確認 `client/package.json` 正確
3. 確認所有依賴都已安裝
4. **ESLint 錯誤**: 檢查是否有未使用的變數或語法錯誤
5. **本地測試**: 執行 `npm run build` 檢查建置是否成功
6. **Console 語句**: 生產環境中不允許 console.log，已使用環境變數控制

## 📋 檢查清單

- [x] Railway 後端已部署
- [x] 前端設定已更新
- [x] CORS 已設定
- [ ] 推送到 GitHub
- [ ] 部署到 Netlify
- [ ] 測試連接
- [ ] 測試多人功能

## 🎯 完成後

部署成功後，您將擁有：
- **後端**: `https://gameserver-production-ddf0.up.railway.app`
- **前端**: `https://your-netlify-app.netlify.app`

兩個服務可以正常通訊，支援即時多人遊戲功能！ 