/**
 * 72Hours Game Server
 * 提供游戏API接口，连接 SiliconFlow
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Game72Hours } = require('./src/Game72Hours');
const { SiliconFlowAI } = require('./src/narrative/SiliconFlowAI');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: '请求过于频繁，请稍后再试'
    },
    data: null
  }
});

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(limiter); // 应用限流
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
 * API 文档: API.md
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

// 统一响应格式
function successResponse(data) {
  return { success: true, data, error: null };
}

function errorResponse(code, message) {
  return { success: false, data: null, error: { code, message } };
}

// 验证游戏数据完整性
function validateGameData(data) {
  if (!data) return { valid: false, error: '数据为空' };
  if (!data.narrative) return { valid: false, error: '缺少 narrative' };
  if (!data.choices || !Array.isArray(data.choices)) return { valid: false, error: '缺少 choices' };
  if (data.choices.length === 0) return { valid: false, error: 'choices 为空' };
  
  // 验证每个选择都有 id 和 text
  for (let i = 0; i < data.choices.length; i++) {
    const choice = data.choices[i];
    if (!choice.id) return { valid: false, error: `选择 ${i} 缺少 id` };
    if (!choice.text) return { valid: false, error: `选择 ${i} 缺少 text` };
  }
  
  return { valid: true };
}

// 根路径 - 返回游戏页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// 获取服务器配置状态（用于前端判断是否显示 API Key 输入）
app.get('/api/config', (req, res) => {
  res.json(successResponse({
    hasApiKey: !!SERVER_API_KEY,
    defaultModel: DEFAULT_MODEL
  }));
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
      return res.status(400).json(
        errorResponse('MISSING_API_KEY', '服务器未配置 SILICONFLOW_API_KEY，请提供自己的 API Key')
      );
    }
    
    // 验证 identity
    const validIdentities = ['scholar', 'landlord', 'soldier', 'cultist'];
    if (!validIdentities.includes(identity)) {
      return res.status(400).json(
        errorResponse('INVALID_IDENTITY', `无效的身份类型: ${identity}`)
      );
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
    
    res.json(successResponse({
      gameId,
      player: initResult.player,
      bondedNPCs: initResult.bondedNPCs,
      opening: initResult.opening,
      state: game.getState()
    }));
    
  } catch (error) {
    console.error('创建游戏失败:', error);
    res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
  }
});

// 执行回合
app.post('/api/game/:gameId/turn', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { choice } = req.body;
    
    const gameSession = games.get(gameId);
    if (!gameSession) {
      return res.status(404).json(
        errorResponse('GAME_NOT_FOUND', '游戏不存在或已过期')
      );
    }
    
    const { game } = gameSession;
    gameSession.lastActivity = Date.now();
    
    // 检查游戏是否已结束
    const currentState = game.getState();
    if (currentState.isGameOver || currentState.turn >= 72) {
      return res.status(400).json(
        errorResponse('GAME_ALREADY_OVER', '游戏已结束')
      );
    }
    
    let result;
    if (choice) {
      // 验证选择
      if (!choice.id) {
        return res.status(400).json(
          errorResponse('INVALID_CHOICE', '选择缺少 id')
        );
      }
      
      // 处理玩家选择
      result = await game.executeTurn(choice);
    } else {
      // 生成新回合
      result = await game.executeTurn();
      
      // 验证返回数据完整性
      const validation = validateGameData(result);
      if (!validation.valid) {
        console.error('数据验证失败:', validation.error, result);
        return res.status(500).json(
          errorResponse('AI_GENERATION_FAILED', `AI 生成失败: ${validation.error}`)
        );
      }
    }
    
    res.json(successResponse({
      ...result,
      state: game.getState()
    }));
    
  } catch (error) {
    console.error('执行回合失败:', error);
    res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
  }
});

// 获取游戏状态
app.get('/api/game/:gameId/state', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameSession = games.get(gameId);
    
    if (!gameSession) {
      return res.status(404).json(
        errorResponse('GAME_NOT_FOUND', '游戏不存在或已过期')
      );
    }
    
    res.json(successResponse({
      state: gameSession.game.getState()
    }));
    
  } catch (error) {
    console.error('获取状态失败:', error);
    res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
  }
});

// 获取故事记录
app.get('/api/game/:gameId/story', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameSession = games.get(gameId);
    
    if (!gameSession) {
      return res.status(404).json(
        errorResponse('GAME_NOT_FOUND', '游戏不存在或已过期')
      );
    }
    
    const { game } = gameSession;
    const state = game.getState();
    
    res.json(successResponse({
      story: game.getPlayerBiography(),
      history: state.history,
      turn: state.turn
    }));
    
  } catch (error) {
    console.error('获取故事失败:', error);
    res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
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
