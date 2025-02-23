import express from 'express';
const router = express.Router();

import { postScores } from '../controller/scores.js';

router.post('/scores', postScores);

export default router;
