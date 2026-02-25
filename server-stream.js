/**
 * 72Hours 流式后端服务器
 * 支持 Server-Sent Events (SSE) 流式输出
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Game72HoursStream } = require('./src/Game72HoursStream');

// 游戏实例存储
const games = new Map();

// SSE 响应头
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*'
};

// 发送 SSE 数据
function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// API路由
const routes = {
  // 创建新游戏
  'POST /api/game/create': async (req, res) => {
    const { identity, apiKey, traits } = req.body;
    
    try {
      const game = new Game72HoursStream({ 
        aiInterface: apiKey || process.env.SILICONFLOW_API_KEY 
      });
      
      const init = await game.init(identity || 'scholar', traits);
      const sessionId = Date.now().toString();
      games.set(sessionId, game);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        sessionId,
        data: {
          identity: init.player.identity,
          characterInfo: init.characterInfo,
          obsession: init.player.obsession,
          traits: init.player.traits,
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

  // 执行回合 - 流式输出
  'POST /api/game/turn/stream': async (req, res) => {
    const { sessionId } = req.body;
    const game = games.get(sessionId);
    
    if (!game) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '游戏不存在' }));
      return;
    }
    
    // 设置 SSE 头
    res.writeHead(200, SSE_HEADERS);
    
    try {
      // 发送开始事件
      sendSSE(res, { type: 'start', turn: game.gameState.turn + 1 });
      
      // 流式执行回合
      await game.executeTurnStream((chunk, fullText, stage) => {
        if (stage === 'choices_start') {
          sendSSE(res, { type: 'narrative_complete', narrative: fullText });
        } else if (stage === 'choices_generating') {
          // 选择生成中，可选发送进度
        } else if (stage === true) {
          // 完成
        } else {
          // 叙事生成中
          sendSSE(res, { type: 'chunk', text: chunk, fullText });
        }
      });
      
      // 获取完整结果
      const turn = game.turnManager.currentContext;
      
      // 发送完成事件
      sendSSE(res, { 
        type: 'complete', 
        data: {
          turn: turn.turn,
          scene: turn.scene,
          spotlight: turn.spotlight,
          event: turn.event,
          narrative: turn.narrative,
          choices: turn.choices,
          player: {
            states: game.gameState.player.states,
            inventory: game.gameState.player.inventory.map(i => i.name)
          }
        }
      });
      
      res.end();
    } catch (error) {
      sendSSE(res, { type: 'error', error: error.message });
      res.end();
    }
  },

  // 提交选择 - 流式输出
  'POST /api/game/choice/stream': async (req, res) => {
    const { sessionId, choiceId } = req.body;
    const game = games.get(sessionId);
    
    if (!game) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '游戏不存在' }));
      return;
    }
    
    res.writeHead(200, SSE_HEADERS);
    
    try {
      sendSSE(res, { type: 'start', choiceId });
      
      const result = await game.executeChoiceStream(choiceId, (chunk, fullText, stage) => {
        if (stage === 'followup_start') {
          sendSSE(res, { type: 'result_complete', result: fullText });
        } else if (stage === 'followup_generating') {
          // 后续叙事生成中
        } else if (stage === true) {
          // 完成
        } else {
          // 结果生成中
          sendSSE(res, { type: 'chunk', text: chunk, fullText });
        }
      });
      
      if (result.error) {
        sendSSE(res, { type: 'error', error: result.error });
        res.end();
        return;
      }
      
      sendSSE(res, { 
        type: 'complete', 
        data: {
          result: result.result,
          followUpNarrative: result.followUpNarrative,
          stateChanges: result.stateChanges,
          player: result.player ? {
            states: result.player.states,
            inventory: result.player.inventory ? result.player.inventory.map(i => i.name) : []
          } : null
        }
      });
      
      res.end();
    } catch (error) {
      sendSSE(res, { type: 'error', error: error.message });
      res.end();
    }
  },

  // 非流式端点（保持兼容）
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

  'POST /api/game/choice': async (req, res) => {
    const { sessionId, choiceId } = req.body;
    const game = games.get(sessionId);
    
    if (!game) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '游戏不存在' }));
      return;
    }
    
    try {
      const result = await game.executeChoice(choiceId);
      
      if (result.error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: result.error }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          result: result.result,
          followUpNarrative: result.followUpNarrative,
          stateChanges: result.stateChanges,
          player: result.player
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
  if (url === '/' || url === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index-new.html');
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
  
  // 游戏页面
  if (url === '/game.html') {
    const filePath = path.join(__dirname, 'public', 'game.html');
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
  console.log(`72Hours 流式服务器运行在 http://localhost:${PORT}`);
  console.log('API端点:');
  console.log('  POST /api/game/create       - 创建游戏');
  console.log('  POST /api/game/turn/stream  - 执行回合（流式）');
  console.log('  POST /api/game/choice/stream- 提交选择（流式）');
  console.log('  POST /api/game/turn         - 执行回合（非流式）');
  console.log('  POST /api/game/choice       - 提交选择（非流式）');
  console.log('  GET  /api/game/npcs         - 获取NPC列表');
  console.log('  GET  /api/game/state        - 获取游戏状态');
});

module.exports = { server };
