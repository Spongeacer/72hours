/**
 * 72Hours Vercel Serverless API
 */

const { Game72Hours } = require('../src/Game72Hours');

// 游戏实例存储（按session）- 注意：Vercel 是无状态的
const games = new Map();

// API路由处理
module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 解析 URL
  const urlParts = req.url.replace('/api/game', '').split('/').filter(Boolean);
  const action = urlParts[0] || '';
  const method = req.method;
  
  try {
    // 解析请求体
    let body = {};
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
    
    // 路由处理
    if (action === 'create' && method === 'POST') {
      const { identity, apiKey } = body;
      
      const game = new Game72Hours({ 
        aiInterface: apiKey || process.env.SILICONFLOW_API_KEY 
      });
      
      const init = game.init(identity || 'scholar');
      const sessionId = Date.now().toString();
      games.set(sessionId, game);
      
      return res.status(200).json({
        success: true,
        sessionId,
        data: {
          identity: init.player.identity,
          obsession: init.player.obsession,
          bondedNPCs: init.bondedNPCs.map(n => ({
            id: n.id,
            name: n.name,
            knot: n.getKnotWith(init.player.id)
          })),
          opening: init.opening
        }
      });
    }
    
    if (action === 'turn' && method === 'POST') {
      const { sessionId } = body;
      const game = games.get(sessionId);
      
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      const turn = await game.executeTurn();
      
      return res.status(200).json({
        success: true,
        data: {
          turn: turn.turn,
          scene: turn.context.scene,
          spotlight: turn.context.spotlight,
          event: turn.context.event,
          narrative: turn.narrative,
          choices: turn.choices,
          player: {
            states: game.gameState.player.states,
            inventory: game.gameState.player.inventory.map(i => i.name)
          }
        }
      });
    }
    
    if (action === 'choice' && method === 'POST') {
      const { sessionId, choiceId } = body;
      const game = games.get(sessionId);
      
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      const currentTurn = game.turnManager.currentContext;
      const choice = currentTurn?.choices?.find(c => c.id === choiceId);
      
      if (!choice) {
        return res.status(400).json({ success: false, error: '无效的选择' });
      }
      
      const result = await game.executeChoice(choiceId);
      
      return res.status(200).json({
        success: true,
        data: {
          result: {
            text: result.resultText,
            stateChanges: result.stateChanges
          },
          player: {
            states: game.gameState.player.states,
            inventory: game.gameState.player.inventory.map(i => i.name)
          }
        }
      });
    }
    
    if (action === 'npcs' && method === 'GET') {
      const sessionId = req.query?.sessionId;
      const game = games.get(sessionId);
      
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      const npcs = game.gameState.npcs.map(n => ({
        id: n.id,
        name: n.name,
        isUnlocked: n.isUnlocked,
        knot: n.getKnotWith(game.gameState.player.id),
        states: n.states,
        obsession: n.obsession
      }));
      
      return res.status(200).json({ success: true, data: { npcs } });
    }
    
    if (action === 'state' && method === 'GET') {
      const sessionId = req.query?.sessionId;
      const game = games.get(sessionId);
      
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          turn: game.gameState.turn,
          pressure: game.gameState.pressure,
          omega: game.gameState.omega,
          weather: game.gameState.weather,
          player: {
            states: game.gameState.player.states,
            inventory: game.gameState.player.inventory.map(i => i.name)
          }
        }
      });
    }
    
    return res.status(404).json({ success: false, error: 'API不存在: ' + action });
    
  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
