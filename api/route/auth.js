import express from 'express';
const router = express.Router();

import { register, login } from '../controller/auth.js';
import csrf from 'host-csrf';

router.post('/register', register);
router.post('/login', login);

router.get('/csrf-token', (req, res) => {
	const token = csrf.token(req, res);
	return res.status(200).json({ csrfToken: token });
});

export default router;
