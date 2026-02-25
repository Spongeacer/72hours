/**
 * 72Hours Vercel Serverless API
 */

const { Game72Hours } = require('./src/Game72Hours');

// 游戏实例存储（按session）- 注意：Vercel 是无状态的，实际生产环境需要数据库
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
  
  const url = req.url;
  const method = req.method;
  
  try {
    // 解析请求体
    const body = req.body || {};
    
    // 路由处理
    if (url === '/api/game/create' && method === 'POST') {
      const { identity, apiKey } = body;
      
      const game = new Game72Hours({ 
        aiInterface: apiKey || process.env.SILICONFLOW_API_KEY 
      });
      
      const init = game.init(identity || 'scholar');
      const sessionId = Date.now().toString();
      games.set(sessionId, game);
      
      res.status(200).json({
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
      return;
    }
    
    if (url === '/api/game/turn' && method === 'POST') {
      const { sessionId } = body;
      const game = games.get(sessionId);
      
      if (!game) {
        res.status(404).json({ success: false, error: '游戏不存在' });
        return;
      }
      
      const turn = await game.executeTurn();
      
      res.status(200).json({
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
      return;
    }
    
    if (url === '/api/game/choice' && method === 'POST') {
      const { sessionId, choiceId } = body;
      const game = games.get(sessionId);
      
      if (!game) {
        res.status(404).json({ success: false, error: '游戏不存在' });
        return;
      }
      
      const currentTurn = game.turnManager.currentContext;
      const choice = currentTurn?.choices?.find(c => c.id === choiceId);
      
      if (!choice) {
        res.status(400).json({ success: false, error: '无效的选择' });
        return;
      }
      
      const result = await game.executeChoice(choiceId);
      
      res.status(200).json({
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
      return;
    }
    
    if (url.startsWith('/api/game/npcs') && method === 'GET') {
      const sessionId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sessionId');
      const game = games.get(sessionId);
      
      if (!game) {
        res.status(404).json({ success: false, error: '游戏不存在' });
        return;
      }
      
      const npcs = game.gameState.npcs.map(n => ({
        id: n.id,
        name: n.name,
        isUnlocked: n.isUnlocked,
        knot: n.getKnotWith(game.gameState.player.id),
        states: n.states,
        obsession: n.obsession
      }));
      
      res.status(200).json({ success: true, data: { npcs } });
      return;
    }
    
    if (url.startsWith('/api/game/state') && method === 'GET') {
      const sessionId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sessionId');
      const game = games.get(sessionId);
      
      if (!game) {
        res.status(404).json({ success: false, error: '游戏不存在' });
        return;
      }
      
      res.status(200).json({
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
      return;
    }
    
    res.status(404).json({ success: false, error: 'API不存在' });
    
  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
