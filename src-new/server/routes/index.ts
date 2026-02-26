/**
 * API 路由定义 - 遵循 RESTful 规范
 * 
 * 规范:
 * - 使用名词复数表示资源
 * - HTTP 方法表示操作: GET(读取), POST(创建), PUT(更新), DELETE(删除)
 * - 状态码: 200(成功), 201(创建成功), 400(请求错误), 404(不存在), 500(服务器错误)
 * - 响应格式统一: { success, data, error, meta }
 */

import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import { SaveController } from '../controllers/SaveController';
import { ConfigController } from '../controllers/ConfigController';
import { validateRequest } from '../middleware/validateRequest';
import { gameSchemas } from '../schemas/gameSchemas';

const router = Router();
const gameController = new GameController();
const saveController = new SaveController();
const configController = new ConfigController();

// ==================== 配置 ====================

/**
 * GET /api/config
 * 获取服务器配置
 */
router.get('/config', configController.getConfig);

// ==================== 游戏 ====================

/**
 * POST /api/games
 * 创建新游戏
 * Body: { identity, model, apiKey? }
 */
router.post(
  '/games',
  validateRequest(gameSchemas.createGame),
  gameController.createGame
);

/**
 * GET /api/games/:gameId
 * 获取游戏信息
 */
router.get(
  '/games/:gameId',
  validateRequest(gameSchemas.gameId),
  gameController.getGame
);

/**
 * GET /api/games/:gameId/state
 * 获取游戏状态
 */
router.get(
  '/games/:gameId/state',
  validateRequest(gameSchemas.gameId),
  gameController.getGameState
);

/**
 * POST /api/games/:gameId/turns
 * 执行回合
 * Body: { choice? }
 */
router.post(
  '/games/:gameId/turns',
  validateRequest(gameSchemas.executeTurn),
  gameController.executeTurn
);

/**
 * GET /api/games/:gameId/history
 * 获取游戏历史
 */
router.get(
  '/games/:gameId/history',
  validateRequest(gameSchemas.gameId),
  gameController.getHistory
);

/**
 * DELETE /api/games/:gameId
 * 结束游戏
 */
router.delete(
  '/games/:gameId',
  validateRequest(gameSchemas.gameId),
  gameController.endGame
);

// ==================== 存档 ====================

/**
 * GET /api/games/:gameId/saves
 * 获取存档列表
 */
router.get(
  '/games/:gameId/saves',
  validateRequest(gameSchemas.gameId),
  saveController.getSaves
);

/**
 * POST /api/games/:gameId/saves
 * 创建存档
 * Body: { name? }
 */
router.post(
  '/games/:gameId/saves',
  validateRequest(gameSchemas.createSave),
  saveController.createSave
);

/**
 * GET /api/games/:gameId/saves/:saveId
 * 获取存档详情
 */
router.get(
  '/games/:gameId/saves/:saveId',
  validateRequest(gameSchemas.saveId),
  saveController.getSave
);

/**
 * POST /api/games/:gameId/saves/:saveId/load
 * 读取存档
 */
router.post(
  '/games/:gameId/saves/:saveId/load',
  validateRequest(gameSchemas.saveId),
  saveController.loadSave
);

/**
 * DELETE /api/games/:gameId/saves/:saveId
 * 删除存档
 */
router.delete(
  '/games/:gameId/saves/:saveId',
  validateRequest(gameSchemas.saveId),
  saveController.deleteSave
);

/**
 * POST /api/games/:gameId/saves/import
 * 导入存档
 * Body: { saveData }
 */
router.post(
  '/games/:gameId/saves/import',
  validateRequest(gameSchemas.importSave),
  saveController.importSave
);

/**
 * GET /api/games/:gameId/saves/:saveId/export
 * 导出存档
 */
router.get(
  '/games/:gameId/saves/:saveId/export',
  validateRequest(gameSchemas.saveId),
  saveController.exportSave
);

export default router;
