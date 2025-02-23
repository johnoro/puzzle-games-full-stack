import express from 'express';
const router = express.Router();

import { getLeaderboard } from '../controller/leaderboards.js';

router.get('/:id', getLeaderboard);

export default router;
