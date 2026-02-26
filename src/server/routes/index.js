const { Router } = require('express');
const configRouter = require('./config');
const gamesRouter = require('./games');
const savesRouter = require('./saves');

const router = Router();

// 配置路由
router.use('/config', configRouter);

// 游戏路由
router.use('/games', gamesRouter);

// 存档路由（嵌套在游戏路由下）
router.use('/games/:gameId/saves', savesRouter);

module.exports = router;
