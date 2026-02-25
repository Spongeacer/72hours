/**
 * 72Hours Game Server
 * 提供游戏API接口，连接 SiliconFlow
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Game72Hours } = require('./src/Game72Hours');
const { SiliconFlowAI } = require('./src/narrative/SiliconFlowAI');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 游戏实例存储
const games = new Map();

// 创建AI接口
function createAIInterface(apiKey, model = 'Pro/MiniMaxAI/MiniMax-M2.1') {
  return new SiliconFlowAI(apiKey, model);
}

// 根路径 - 返回游戏页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

/**
 * 72Hours Game Server
 * 提供游戏API接口，连接 SiliconFlow
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Game72Hours } = require('./src/Game72Hours');
const { SiliconFlowAI } = require('./src/narrative/SiliconFlowAI');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 从环境变量获取配置
const SERVER_API_KEY = process.env.SILICONFLOW_API_KEY;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'Pro/MiniMaxAI/MiniMax-M2.1';

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 游戏实例存储
const games = new Map();

// 创建AI接口
function createAIInterface(apiKey, model = DEFAULT_MODEL) {
  return new SiliconFlowAI(apiKey, model);
}

// 根路径 - 返回游戏页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// 创建新游戏
app.post('/api/game/create', async (req, res) => {
  try {
    const { identity = 'scholar', model = DEFAULT_MODEL } = req.body;
    
    // 优先使用服务器配置的 API Key，如果没有则要求客户端提供
    let apiKey = SERVER_API_KEY;
    if (!apiKey && req.body.apiKey) {
      apiKey = req.body.apiKey;
    }
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: '未配置 API Key',
        message: '服务器未配置 SILICONFLOW_API_KEY，请提供自己的 API Key'
      });
    }
    
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const aiInterface = createAIInterface(apiKey, model);
    
    const game = new Game72Hours({
      aiInterface,
      model,
      config: {
        MAX_TURNS: 72
      }
    });
    
    const initResult = game.init(identity);
    
    games.set(gameId, {
      game,
      aiInterface,
      startTime: Date.now(),
      lastActivity: Date.now()
    });
    
    res.json({
      gameId,
      player: initResult.player,
      bondedNPCs: initResult.bondedNPCs,
      opening: initResult.opening,
      state: game.getState()
    });
    
  } catch (error) {
    console.error('创建游戏失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 执行回合
app.post('/api/game/:gameId/turn', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { choice } = req.body;
    
    const gameSession = games.get(gameId);
    if (!gameSession) {
      return res.status(404).json({ error: '游戏不存在或已过期' });
    }
    
    const { game } = gameSession;
    gameSession.lastActivity = Date.now();
    
    let result;
    if (choice) {
      // 处理玩家选择
      result = await game.executeTurn(choice);
    } else {
      // 生成新回合
      result = await game.executeTurn();
    }
    
    res.json({
      ...result,
      state: game.getState()
    });
    
  } catch (error) {
    console.error('执行回合失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取游戏状态
app.get('/api/game/:gameId/state', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameSession = games.get(gameId);
    
    if (!gameSession) {
      return res.status(404).json({ error: '游戏不存在或已过期' });
    }
    
    res.json({
      state: gameSession.game.getState()
    });
    
  } catch (error) {
    console.error('获取状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取故事记录
app.get('/api/game/:gameId/story', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameSession = games.get(gameId);
    
    if (!gameSession) {
      return res.status(404).json({ error: '游戏不存在或已过期' });
    }
    
    const { game } = gameSession;
    const state = game.getState();
    
    res.json({
      story: game.getPlayerBiography(),
      history: state.history,
      turn: state.turn
    });
    
  } catch (error) {
    console.error('获取故事失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 清理过期游戏（每30分钟运行一次）
setInterval(() => {
  const now = Date.now();
  const EXPIRE_TIME = 2 * 60 * 60 * 1000; // 2小时
  
  for (const [gameId, session] of games) {
    if (now - session.lastActivity > EXPIRE_TIME) {
      console.log(`清理过期游戏: ${gameId}`);
      games.delete(gameId);
    }
  }
}, 30 * 60 * 1000);

// 启动服务器
app.listen(PORT, () => {
  console.log(`72Hours Server running on port ${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}`);
});

module.exports = app;
