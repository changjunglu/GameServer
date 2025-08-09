# 🗄️ 遊戲平台資料庫設計文檔 (Database Design)

## 📋 文件資訊

| 項目 | 內容 |
|------|------|
| **文件版本** | 1.0 |
| **建立日期** | 2024年12月 |
| **資料庫類型** | PostgreSQL (Supabase) |
| **設計原則** | 正規化設計，支援擴展性 |

---

## 🎯 1. 設計目標

### 1.1 主要目標
- **持久化儲存**: 將重要的遊戲資料和用戶資訊持久化儲存
- **用戶管理**: 支援用戶註冊、登入、個人資料管理
- **遊戲記錄**: 儲存遊戲歷史、分數統計、排行榜
- **社交功能**: 支援好友系統、聊天記錄
- **擴展性**: 為未來功能預留擴展空間

### 1.2 資料分類
- **即時資料**: 保留在記憶體中（遊戲狀態、即時聊天）
- **持久化資料**: 儲存在Supabase（用戶資料、遊戲記錄、統計）

---

## 🏗️ 2. 資料庫架構

### 2.1 核心表格

#### 2.1.1 用戶管理 (User Management)
- `users` - 用戶基本資料
- `user_profiles` - 用戶詳細資料
- `user_sessions` - 用戶會話管理

#### 2.1.2 遊戲相關 (Game Related)
- `games` - 遊戲記錄
- `game_sessions` - 遊戲會話
- `game_scores` - 遊戲分數
- `game_rooms` - 房間記錄

#### 2.1.3 社交功能 (Social Features)
- `friendships` - 好友關係
- `chat_messages` - 聊天記錄
- `user_achievements` - 用戶成就

#### 2.1.4 統計分析 (Analytics)
- `user_statistics` - 用戶統計
- `game_statistics` - 遊戲統計
- `leaderboards` - 排行榜

---

## 📊 3. 詳細表格設計

### 3.1 用戶管理表格

#### 3.1.1 users 表格
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin'))
);
```

#### 3.1.2 user_profiles 表格
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    country VARCHAR(100),
    timezone VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.1.3 user_sessions 表格
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    socket_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 3.2 遊戲相關表格

#### 3.2.1 games 表格
```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_type VARCHAR(50) NOT NULL,
    max_players INTEGER DEFAULT 4,
    min_players INTEGER DEFAULT 1,
    rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2.2 game_sessions 表格
```sql
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    room_id VARCHAR(255) NOT NULL,
    host_user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    max_players INTEGER DEFAULT 4,
    actual_players INTEGER DEFAULT 0,
    game_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2.3 game_participants 表格
```sql
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    final_score INTEGER DEFAULT 0,
    final_rank INTEGER,
    is_winner BOOLEAN DEFAULT FALSE,
    game_data JSONB DEFAULT '{}'
);
```

#### 3.2.4 game_scores 表格
```sql
CREATE TABLE game_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    score_type VARCHAR(50) DEFAULT 'final', -- final, intermediate, bonus
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_data JSONB DEFAULT '{}'
);
```

### 3.3 社交功能表格

#### 3.3.1 friendships 表格
```sql
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);
```

#### 3.3.2 chat_messages 表格
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    room_id VARCHAR(255),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'game')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);
```

#### 3.3.3 user_achievements 表格
```sql
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);
```

### 3.4 統計分析表格

#### 3.4.1 user_statistics 表格
```sql
CREATE TABLE user_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_games_played INTEGER DEFAULT 0,
    total_games_won INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    average_score DECIMAL(10,2) DEFAULT 0,
    total_play_time_seconds INTEGER DEFAULT 0,
    last_game_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.4.2 game_statistics 表格
```sql
CREATE TABLE game_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type VARCHAR(50) NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_players INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0,
    average_players_per_session DECIMAL(5,2) DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.4.3 leaderboards 表格
```sql
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, all_time
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔧 4. Supabase 資料庫腳本

### 4.1 完整資料庫建立腳本

```sql
-- 啟用必要的擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 建立用戶管理表格
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin'))
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    country VARCHAR(100),
    timezone VARCHAR(50),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    socket_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 建立遊戲相關表格
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_type VARCHAR(50) NOT NULL,
    max_players INTEGER DEFAULT 4,
    min_players INTEGER DEFAULT 1,
    rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id),
    room_id VARCHAR(255) NOT NULL,
    host_user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    max_players INTEGER DEFAULT 4,
    actual_players INTEGER DEFAULT 0,
    game_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    final_score INTEGER DEFAULT 0,
    final_rank INTEGER,
    is_winner BOOLEAN DEFAULT FALSE,
    game_data JSONB DEFAULT '{}'
);

CREATE TABLE game_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    score_type VARCHAR(50) DEFAULT 'final',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_data JSONB DEFAULT '{}'
);

-- 建立社交功能表格
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    room_id VARCHAR(255),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'game')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 建立統計分析表格
CREATE TABLE user_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_games_played INTEGER DEFAULT 0,
    total_games_won INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    average_score DECIMAL(10,2) DEFAULT 0,
    total_play_time_seconds INTEGER DEFAULT 0,
    last_game_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE game_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type VARCHAR(50) NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_players INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0,
    average_players_per_session DECIMAL(5,2) DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_game_sessions_room_id ON game_sessions(room_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_participants_session_id ON game_participants(session_id);
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_game_scores_session_id ON game_scores(session_id);
CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee_id ON friendships(addressee_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_user_statistics_user_id ON user_statistics(user_id);
CREATE INDEX idx_leaderboards_type_period ON leaderboards(leaderboard_type, period_start);

-- 建立觸發器以自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 初始資料插入腳本

```sql
-- 插入預設遊戲類型
INSERT INTO games (name, description, game_type, max_players, min_players, rules) VALUES
('貪食蛇多人競技', '經典的貪食蛇遊戲，支援多人同時競技', 'fruit-eating', 4, 1, '{"grid_size": 20, "food_score": 10, "collision_detection": true}'),
('俄羅斯方塊競技', '多人俄羅斯方塊競技遊戲', 'tetris', 4, 1, '{"lines_per_level": 10, "speed_increase": true}');

-- 插入預設成就類型
INSERT INTO user_achievements (achievement_type, achievement_name, description) VALUES
('first_game', '初次遊戲', '完成第一場遊戲'),
('first_win', '初次勝利', '贏得第一場遊戲'),
('score_master', '分數大師', '單場遊戲獲得1000分以上'),
('social_butterfly', '社交蝴蝶', '與10個不同玩家進行遊戲'),
('speed_demon', '速度惡魔', '在30秒內完成遊戲');
```

---

## 🔐 5. Supabase 設定

### 5.1 Row Level Security (RLS) 設定

```sql
-- 啟用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的資料
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 用戶可以查看公開的遊戲統計
CREATE POLICY "Anyone can view game statistics" ON game_statistics
    FOR SELECT USING (true);

-- 用戶可以查看排行榜
CREATE POLICY "Anyone can view leaderboards" ON leaderboards
    FOR SELECT USING (true);
```

### 5.2 函數和觸發器

```sql
-- 自動更新用戶統計的函數
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_statistics (user_id, total_games_played, total_games_won, total_score, highest_score, average_score, total_play_time_seconds, last_game_at)
        VALUES (NEW.user_id, 1, 
                CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
                NEW.final_score,
                NEW.final_score,
                NEW.final_score,
                0,
                NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            total_games_played = user_statistics.total_games_played + 1,
            total_games_won = user_statistics.total_games_won + CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
            total_score = user_statistics.total_score + NEW.final_score,
            highest_score = GREATEST(user_statistics.highest_score, NEW.final_score),
            average_score = (user_statistics.total_score + NEW.final_score) / (user_statistics.total_games_played + 1),
            last_game_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 觸發器：當遊戲參與者資料更新時，自動更新用戶統計
CREATE TRIGGER trigger_update_user_statistics
    AFTER INSERT OR UPDATE ON game_participants
    FOR EACH ROW EXECUTE FUNCTION update_user_statistics();
```

---

## 📈 6. 資料遷移策略

### 6.1 階段性遷移

#### 階段 1: 基礎架構
- 建立資料庫表格和索引
- 設定 RLS 和基本權限
- 測試基本 CRUD 操作

#### 階段 2: 用戶管理
- 整合 Supabase Auth
- 遷移用戶資料（如果有的話）
- 實作用戶註冊和登入

#### 階段 3: 遊戲記錄
- 開始記錄遊戲會話
- 實作分數統計
- 建立排行榜系統

#### 階段 4: 社交功能
- 實作好友系統
- 聊天記錄持久化
- 成就系統

### 6.2 資料同步策略

- **即時資料**: 保留在記憶體中，確保遊戲效能
- **重要資料**: 即時寫入資料庫（用戶動作、遊戲結果）
- **統計資料**: 批次處理，定期更新
- **備份策略**: 利用 Supabase 的自動備份功能

---

## 🚀 7. 效能優化建議

### 7.1 查詢優化
- 使用適當的索引
- 實作分頁查詢
- 利用資料庫視圖 (Views)

### 7.2 快取策略
- 使用 Redis 快取熱門查詢
- 實作應用層快取
- 利用 Supabase 的內建快取

### 7.3 監控和維護
- 定期分析查詢效能
- 監控資料庫大小和成長
- 實作資料清理策略

---

## 📝 8. 注意事項

### 8.1 安全性
- 所有表格都啟用 RLS
- 敏感資料加密儲存
- 定期審查權限設定

### 8.2 效能
- 避免 N+1 查詢問題
- 使用適當的資料類型
- 定期維護索引

### 8.3 擴展性
- 設計支援水平擴展
- 考慮分片策略
- 預留擴展欄位
