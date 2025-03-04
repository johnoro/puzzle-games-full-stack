import express from 'express';
const router = express.Router();

import {
	getAvailableGames,
	checkGameExists,
	getGameMetadata,
	getUserGameStats
} from '../controller/games.js';

import authMiddleware from '../middleware/security/auth.js';

router.get('/', getAvailableGames);
router.get('/check/:gameType', checkGameExists);
router.get('/metadata/:gameType', getGameMetadata);

router.get('/stats/:gameType', authMiddleware, getUserGameStats);

export default router;
