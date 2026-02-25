/**
 * 72Hours Vercel Serverless API
 */

const games = new Map();

module.exports = (req, res) => {
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
  
  // Test endpoint
  if (url.includes('/test')) {
    return res.json({ success: true, message: 'API is working' });
  }
  
  // Create game
  if (url.includes('/create')) {
    const sessionId = Date.now().toString();
    const model = body.model || 'kimi';
    
    games.set(sessionId, {
      identity: body.identity || 'scholar',
      model: model,
      turn: 1,
      player: { states: { fear: 20, aggression: 15, hunger: 10 } }
    });
    
    return res.json({
      success: true,
      sessionId,
      data: {
        identity: body.identity || 'scholar',
        obsession: '寻找失落的古籍',
        bondedNPCs: [
          { id: 'npc1', name: '神秘商人', knot: 3 },
          { id: 'npc2', name: '老学者', knot: 5 }
        ],
        opening: '你站在古老的图书馆门前，空气中弥漫着陈旧纸张的气息。你的执念驱使你来寻找那本失落的古籍。'
      }
    });
  }
  
  // Execute turn
  if (url.includes('/turn')) {
    const game = games.get(body.sessionId);
    if (!game) {
      return res.status(404).json({ success: false, error: '游戏不存在' });
    }
    
    game.turn++;
    
    return res.json({
      success: true,
      data: {
        turn: game.turn,
        scene: { time: '黄昏', weather: '阴沉', pressure: 45, omega: 2 },
        narrative: `第 ${game.turn} 回合：图书馆的大门缓缓打开，一个身影从阴影中走出...（使用模型: ${game.model}）`,
        choices: [
          { id: 1, text: '主动上前搭话' },
          { id: 2, text: '躲在暗处观察' },
          { id: 3, text: '从侧门潜入' }
        ],
        player: game.player
      }
    });
  }
  
  // Submit choice
  if (url.includes('/choice')) {
    const game = games.get(body.sessionId);
    if (!game) {
      return res.status(404).json({ success: false, error: '游戏不存在' });
    }
    
    const results = {
      1: '你走上前去，对方抬起头，露出意味深长的笑容...',
      2: '你隐藏在阴影中，看到对方手中拿着一本古老的书...',
      3: '你悄悄绕到侧门，发现门没有锁...'
    };
    
    return res.json({
      success: true,
      data: {
        result: { text: results[body.choiceId] || '你做出了选择...' },
        player: game.player
      }
    });
  }
  
  // Default
  return res.json({ success: true, message: '72Hours API', url: url });
};
