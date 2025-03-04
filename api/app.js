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
import updateLeaderboards from './util/db/updateLeaderboards.js';

// Import routes
import authRoutes from './route/auth.js';
import leaderboardRoutes from './route/leaderboards.js';
import scoreRoutes from './route/scores.js';
import gamesRoutes from './route/games.js';

// Import game routes
import minesweeperRoutes from './route/games/minesweeper.js';

const app = express();
const server = http.createServer(app);

const corsOptions = {
	origin: '*'
};
if (app.get('env') === 'development') {
	process.loadEnvFile('./.env');
} else {
	corsOptions.origin = process.env.FRONTEND_URL || 'http://localhost:3000';
	corsOptions.credentials = true;
}

const io = new Server(server, {
	cors: corsOptions
});

// Security middleware
app.use(
	rateLimiter({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100 // max requests, per IP, per amount of time above
	}),
	helmet(),
	hpp(),
	express.json(), // Parse JSON bodies
	express.urlencoded({ extended: true }),
	xssClean(),
	mongoSanitize(),
	cors(corsOptions)
);

const csrfOptions = {
	protected_operations: ['POST, PUT, PATCH, DELETE'],
	protected_content_types: [
		'application/json',
		'application/x-www-form-urlencoded'
	],
	development_mode: true
};

if (app.get('env') === 'production') {
	app.set('trust proxy', 1);
	// TODO: Fix missing variable
	// sessionParams.cookie.secure = true;
	csrfOptions.development_mode = false;
}

app.use(cookieParser(process.env.COOKIE_KEY));
const csrfMiddleware = csrf(csrfOptions);
// Apply CSRF protection
app.use(csrfMiddleware);

// Health check route - no auth required
app.get('/api/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/games', gamesRoutes);

// Game routes - all under /api/games/[game-name]
app.use('/api/games/minesweeper', minesweeperRoutes);

// Handle 404s and errors
app.use(notFound);
app.use(errorHandlerMiddleware);

// Socket.io connections
io.on('connection', socket => {
	socket.on('startGame', userId => {
		socket.join(userId);
	});

	// Real-time game events
	socket.on('gameUpdate', (gameId, data) => {
		socket.to(gameId).emit('gameUpdated', data);
	});

	// Leaderboard updates
	socket.on('leaderboardUpdate', () => {
		io.emit('leaderboardUpdated');
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

			// Update leaderboards periodically - once per hour
			setInterval(updateLeaderboards, 1000 * 60 * 60);
		});
	} catch (error) {
		console.log(error);
	}
};
start();
