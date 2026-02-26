import { Router } from 'express';
import configRouter from './config';
import gamesRouter from './games';
import savesRouter from './saves';

const router = Router();

router.use('/config', configRouter);
router.use('/games', gamesRouter);
router.use('/games/:gameId/saves', savesRouter);

export default router;
