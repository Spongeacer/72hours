/**
 * 72Hours Vercel Serverless API - 简化版
 */

// 简单的内存存储（Vercel 冷启动会清空）
const games = new Map();

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const url = req.url || '';
  const method = req.method;
  
  try {
    let body = {};
    if (req.body) {
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = {};
      }
    }
    
    // 测试端点
    if (url === '/api/game/test' || url === '/test') {
      return res.status(200).json({ 
        success: true, 
        message: 'API is working',
        time: new Date().toISOString()
      });
    }
    
    // 创建游戏 - 简化版
    if (url === '/api/game/create' || url === '/create') {
      const sessionId = Date.now().toString();
      
      // 模拟游戏数据
      const mockGame = {
        identity: body.identity || 'scholar',
        obsession: '寻找失落的古籍',
        turn: 1,
        player: {
          states: { fear: 20, aggression: 15, hunger: 10 }
        }
      };
      
      games.set(sessionId, mockGame);
      
      return res.status(200).json({
        success: true,
        sessionId,
        data: {
          identity: mockGame.identity,
          obsession: mockGame.obsession,
          bondedNPCs: [
            { id: 'npc1', name: '神秘商人', knot: 3 },
            { id: 'npc2', name: '老学者', knot: 5 }
          ],
          opening: '你站在古老的图书馆门前，空气中弥漫着陈旧纸张的气息。你的执念驱使你来寻找那本失落的古籍。'
        }
      });
    }
    
    // 执行回合
    if (url === '/api/game/turn' || url === '/turn') {
      const { sessionId } = body;
      const game = games.get(sessionId);
      
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      game.turn++;
      
      return res.status(200).json({
        success: true,
        data: {
          turn: game.turn,
          scene: { time: '黄昏', weather: '阴沉', pressure: 45, omega: 2 },
          narrative: '图书馆的大门缓缓打开，一个身影从阴影中走出...',
          choices: [
            { id: 1, text: '主动上前搭话' },
            { id: 2, text: '躲在暗处观察' },
            { id: 3, text: '从侧门潜入' }
          ],
          player: game.player
        }
      });
    }
    
    // 提交选择
    if (url === '/api/game/choice' || url === '/choice') {
      const { sessionId, choiceId } = body;
      const game = games.get(sessionId);
      
      if (!game) {
        return res.status(404).json({ success: false, error: '游戏不存在' });
      }
      
      const results = {
        1: '你走上前去，对方抬起头，露出意味深长的笑容...',
        2: '你隐藏在阴影中，看到对方手中拿着一本古老的书...',
        3: '你悄悄绕到侧门，发现门没有锁...'
      };
      
      return res.status(200).json({
        success: true,
        data: {
          result: { text: results[choiceId] || '你做出了选择...' },
          player: game.player
        }
      });
    }
    
    // 获取NPC
    if (url.startsWith('/api/game/npcs') || url.startsWith('/npcs')) {
      return res.status(200).json({
        success: true,
        data: {
          npcs: [
            { id: 'npc1', name: '神秘商人', isUnlocked: true, knot: 3 },
            { id: 'npc2', name: '老学者', isUnlocked: true, knot: 5 }
          ]
        }
      });
    }
    
    // 默认响应
    return res.status(200).json({ 
      success: true, 
      message: '72Hours API',
      endpoints: ['/api/game/create', '/api/game/turn', '/api/game/choice', '/api/game/npcs']
    });
    
  } catch (error) {
    console.error('API错误:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
