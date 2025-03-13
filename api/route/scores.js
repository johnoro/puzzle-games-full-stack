import express from 'express';
import auth from '../middleware/security/auth.js';
import { postScores, getPersonalScores } from '../controller/scores.js';

const router = express.Router();

router.post('/', auth, postScores);
router.get('/personal', auth, getPersonalScores);

export default router;
