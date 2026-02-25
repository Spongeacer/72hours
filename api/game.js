/**
 * 72Hours Vercel Serverless API - 完整版（调用真实AI）
 */

// 引入叙事引擎
const { NarrativeEngine } = require('../src/narrative/NarrativeEngine');
const { Game72Hours } = require('../src/Game72Hours');

// 游戏实例存储
const games = new Map();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const url = req.url || '';
  let body = {};
  if (req.body) {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      body = {};
    }
  }
  
  // 测试端点
  if (url.includes('/test')) {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    return res.json({ 
      success: true, 
      message: 'API is working',
      aiConfigured: !!apiKey,
      model: body.model || 'kimi'
    });
  }
  
  // 创建游戏
  if (url.includes('/create')) {
    try {
      const sessionId = Date.now().toString();
      const apiKey = process.env.SILICONFLOW_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ 
          success: false, 
          error: 'AI API Key 未配置' 
        });
      }
      
      // 创建真实游戏实例
      const game = new Game72Hours({ 
        aiInterface: apiKey
      });
      
      const init = game.init(body.identity || 'scholar');
      games.set(sessionId, game);
      
      return res.json({
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
    } catch (error) {
      console.error('创建游戏失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  // 执行回合 - 调用AI生成叙事
  if (url.includes('/turn')) {
    try {
      const game = games.get(body.sessionId);
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      // 执行回合（会调用AI生成）
      const turn = await game.executeTurn();
      
      return res.json({
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
    } catch (error) {
      console.error('执行回合失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  // 提交选择 - 调用AI生成结果
  if (url.includes('/choice')) {
    try {
      const game = games.get(body.sessionId);
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      // 执行选择（会调用AI生成结果）
      const result = await game.executeChoice(body.choiceId);
      
      return res.json({
        success: true,
        data: {
          result: {
            text: result.resultText
          },
          followUpNarrative: result.followUpNarrative || '故事继续发展...',
          stateChanges: result.stateChanges,
          player: {
            states: game.gameState.player.states,
            inventory: game.gameState.player.inventory.map(i => i.name)
          }
        }
      });
    } catch (error) {
      console.error('提交选择失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  // 默认响应
  return res.json({ 
    success: true, 
    message: '72Hours API - AI Mode',
    endpoints: ['/api/game/create', '/api/game/turn', '/api/game/choice', '/api/game/test']
  });
};
