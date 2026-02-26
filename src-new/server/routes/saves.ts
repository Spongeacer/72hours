import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { createSuccessResponse, createErrorResponse } from '../types/api';

const router = Router({ mergeParams: true });

// 存档存储（生产环境应使用数据库）
const saves = new Map<string, any>();

// 获取存档列表
router.get('/', (req, res) => {
  const { gameId } = req.params;
  const gameSaves = Array.from(saves.values())
    .filter((s: any) => s.gameId === gameId)
    .sort((a: any, b: any) => b.timestamp - a.timestamp);
  
  res.json(createSuccessResponse(gameSaves));
});

// 创建存档
const createSaveSchema = z.object({
  name: z.string().optional()
});

router.post('/', validateRequest({ body: createSaveSchema }), (req, res) => {
  const { gameId } = req.params;
  const { name } = req.body;
  
  // 获取游戏状态（这里简化处理，实际应从games获取）
  const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const saveData = {
    id: saveId,
    gameId,
    name: name || `存档 ${new Date().toLocaleString('zh-CN')}`,
    timestamp: Date.now(),
    turn: 1, // 应从实际游戏状态获取
    datetime: new Date().toISOString(),
    pressure: 10,
    omega: 1.0
  };
  
  saves.set(saveId, saveData);
  
  res.status(201).json(createSuccessResponse(saveData));
});

// 读取存档
router.post('/:saveId/load', (req, res) => {
  const { saveId } = req.params;
  const save = saves.get(saveId);
  
  if (!save) {
    return res.status(404).json(createErrorResponse(
      'SAVE_NOT_FOUND',
      '存档不存在'
    ));
  }
  
  res.json(createSuccessResponse({
    turn: save.turn,
    datetime: save.datetime,
    pressure: save.pressure,
    omega: save.omega
  }));
});

// 删除存档
router.delete('/:saveId', (req, res) => {
  const { saveId } = req.params;
  
  if (!saves.has(saveId)) {
    return res.status(404).json(createErrorResponse(
      'SAVE_NOT_FOUND',
      '存档不存在'
    ));
  }
  
  saves.delete(saveId);
  res.json(createSuccessResponse(null));
});

export default router;
