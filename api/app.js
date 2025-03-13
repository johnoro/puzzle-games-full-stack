import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

import rateLimiter from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import xssClean from './middleware/security/xss.js';
import mongoSanitize from './middleware/security/mongoSanitize.js';

import cookieParser from 'cookie-parser';
import csrf from 'host-csrf';

import notFound from './middleware/notFound.js';
import errorHandlerMiddleware from './middleware/errorHandler.js';

import connectDatabase from './util/db/connect.js';

import authRoutes from './route/auth.js';
import scoreRoutes from './route/scores.js';
import gamesRoutes from './route/games.js';

import minesweeperRoutes from './route/games/minesweeper.js';

const app = express();
const server = http.createServer(app);

const corsOptions = {
	origin: 'http://localhost:5173',
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization', 'csrf-token']
};

if (app.get('env') === 'development') {
	process.loadEnvFile('./.env');
} else {
	corsOptions.origin = process.env.FRONTEND_URL;
}

const io = new Server(server, {
	cors: corsOptions
});

app.use(cors(corsOptions));

app.use(
	rateLimiter({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 1000 // max requests, per IP, per amount of time above
	}),
	helmet(),
	hpp(),
	express.json(),
	express.urlencoded({ extended: true }),
	xssClean(),
	mongoSanitize()
);

const csrfOptions = {
	protected_operations: ['POST', 'PUT', 'PATCH', 'DELETE'],
	protected_content_types: [
		'application/json',
		'application/x-www-form-urlencoded'
	],
	development_mode: app.get('env') !== 'production',
	cookieParams: {
		sameSite: 'strict',
		secure: app.get('env') === 'production',
		path: '/',
		maxAge: 24 * 60 * 60 * 1000 // 24 hours
	}
};

if (app.get('env') === 'production') {
	app.set('trust proxy', 1);
	csrfOptions.development_mode = false;
}

app.use(cookieParser(process.env.COOKIE_KEY));
const csrfMiddleware = csrf(csrfOptions);
app.use(csrfMiddleware);

const apiRouter = express.Router();
app.use('/api', apiRouter);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/scores', scoreRoutes);
apiRouter.use('/games', gamesRoutes);
apiRouter.use('/games/minesweeper', minesweeperRoutes);

app.use(notFound);
app.use(errorHandlerMiddleware);

io.on('connection', socket => {
	socket.on('startGame', userId => {
		socket.join(userId);
	});

	socket.on('gameUpdate', (gameId, data) => {
		socket.to(gameId).emit('gameUpdated', data);
	});
});

const port = process.env.PORT || 5000;
const start = async () => {
	try {
		await connectDatabase(process.env.MONGO_URI);
		server.listen(port, err => {
			if (err) {
				console.error(`Could not start server on port ${port}.`);
				throw err;
			}
			if (app.get('env') === 'development') {
				console.log(`Server listening on port ${port}.`);
				console.log(`Access at: http://localhost:${port}`);
			}
		});
	} catch (error) {
		console.error(error);
	}
};
start();
