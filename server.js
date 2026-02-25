/**
 * 72Hours 后端服务器
 * 提供API接口供前端调用
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Game72Hours } = require('./src/Game72Hours');

// 游戏实例存储（按session）
const games = new Map();

// API路由
const routes = {
  // 创建新游戏
  'POST /api/game/create': async (req, res) => {
    const { identity, apiKey } = req.body;
    
    try {
      const game = new Game72Hours({ 
        aiInterface: apiKey || process.env.SILICONFLOW_API_KEY 
      });
      
      const init = game.init(identity || 'scholar');
      const sessionId = Date.now().toString();
      games.set(sessionId, game);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
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
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  },

  // 执行回合（生成叙事和选择）
  'POST /api/game/turn': async (req, res) => {
    const { sessionId } = req.body;
    const game = games.get(sessionId);
    
    if (!game) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '游戏不存在' }));
      return;
    }
    
    try {
      const turn = await game.executeTurn();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
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
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  },

  // 提交选择
  'POST /api/game/choice': async (req, res) => {
    const { sessionId, choiceId } = req.body;
    const game = games.get(sessionId);
    
    if (!game) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '游戏不存在' }));
      return;
    }
    
    try {
      // 获取当前回合的选择
      const currentTurn = game.turnManager.currentContext;
      const choice = currentTurn?.choices?.find(c => c.id === choiceId);
      
      if (!choice) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '无效的选择' }));
        return;
      }
      
      const result = await game.executeTurn(choice);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          result: result.result,
          stateDelta: result.result?.stateDelta,
          knotDelta: result.result?.knotDelta,
          gameOver: result.gameOver,
          player: {
            states: game.gameState.player.states
          }
        }
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  },

  // 获取NPC列表
  'GET /api/game/npcs': async (req, res, query) => {
    const { sessionId } = query;
    const game = games.get(sessionId);
    
    if (!game) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '游戏不存在' }));
      return;
    }
    
    try {
      const npcs = game.gameState.npcs.map(n => ({
        id: n.id,
        name: n.name,
        isUnlocked: n.isUnlocked,
        isElite: n.isElite,
        isBonded: n.isBonded,
        knot: n.getKnotWith(game.gameState.player.id),
        traits: n.traits,
        obsession: n.obsession,
        states: n.states
      }));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { npcs } }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  },

  // 获取游戏状态
  'GET /api/game/state': async (req, res, query) => {
    const { sessionId } = query;
    const game = games.get(sessionId);
    
    if (!game) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '游戏不存在' }));
      return;
    }
    
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          turn: game.gameState.turn,
          pressure: game.gameState.pressure,
          omega: game.gameState.omega,
          weather: game.gameState.weather,
          datetime: game.gameState.datetime,
          player: {
            identity: game.gameState.player.identity.name,
            obsession: game.gameState.player.obsession,
            states: game.gameState.player.states,
            inventory: game.gameState.player.inventory.map(i => i.name)
          }
        }
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  }
};

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 解析查询参数
function parseQuery(url) {
  const query = {};
  const idx = url.indexOf('?');
  if (idx !== -1) {
    const params = url.slice(idx + 1).split('&');
    params.forEach(param => {
      const [key, value] = param.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  return query;
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = req.url;
  const method = req.method;
  
  // 静态文件服务
  if (url === '/' || url.startsWith('/index.html')) {
    const filePath = path.join(__dirname, 'public', 'index.html');
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
  }
  
  // API路由
  const routeKey = `${method} ${url.split('?')[0]}`;
  const handler = routes[routeKey];
  
  if (handler) {
    try {
      req.body = await parseBody(req);
      const query = parseQuery(url);
      await handler(req, res, query);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'API不存在' }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`72Hours 服务器运行在 http://localhost:${PORT}`);
  console.log('API端点:');
  console.log('  POST /api/game/create - 创建游戏');
  console.log('  POST /api/game/turn   - 执行回合');
  console.log('  POST /api/game/choice - 提交选择');
  console.log('  GET  /api/game/npcs   - 获取NPC列表');
  console.log('  GET  /api/game/state  - 获取游戏状态');
});

module.exports = { server };
