import express from 'express';
const router = express.Router();

import {
	startGame,
	submitMove,
	getGameState
} from '../../controller/games/minesweeper.js';
import authMiddleware from '../../middleware/security/auth.js';

router.use(authMiddleware);

router.post('/start', startGame);
router.post('/move', submitMove);
router.get('/:gameId', getGameState);

export default router;
