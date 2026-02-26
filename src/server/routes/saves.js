const { Router } = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validateRequest');
const { createSuccessResponse, createErrorResponse } = require('../middleware/errorHandler');

const router = Router({ mergeParams: true });

// 存档存储
const saves = new Map();

// 获取存档列表
router.get('/', (req, res) => {
  const { gameId } = req.params;
  const gameSaves = Array.from(saves.values())
    .filter(s => s.gameId === gameId)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  res.json(createSuccessResponse(gameSaves));
});

// 创建存档
const createSaveSchema = z.object({
  name: z.string().optional()
});

router.post('/', validateRequest({ body: createSaveSchema }), (req, res) => {
  const { gameId } = req.params;
  const { name } = req.body;
  
  const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const saveData = {
    id: saveId,
    gameId,
    name: name || `存档 ${new Date().toLocaleString('zh-CN')}`,
    timestamp: Date.now(),
    turn: 1,
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
    return res.status(404).json(createErrorResponse('SAVE_NOT_FOUND', '存档不存在'));
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
    return res.status(404).json(createErrorResponse('SAVE_NOT_FOUND', '存档不存在'));
  }
  
  saves.delete(saveId);
  res.json(createSuccessResponse(null));
});

module.exports = router;
