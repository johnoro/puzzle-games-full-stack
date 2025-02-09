import express from 'express';

import rateLimiter from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import xssClean from './middleware/security/xss.js';
import mongoSanitize from './middleware/security/mongoSanitize.js';

import cookieParser from 'cookie-parser';
import csrf from 'host-csrf';

import authMiddleware from './middleware/security/auth.js';
import notFound from './middleware/notFound.js';
import errorHandlerMiddleware from './middleware/errorHandler.js';

import connectDatabase from './util/db/connect.js';
import updateLeaderboards from './util/db/updateLeaderboards.js';

const app = express();

app.use(
	rateLimiter({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100 // max requests, per IP, per amount of time above
	}),
	helmet(),
	hpp(),
	express.urlencoded({ extended: true }),
	xssClean(),
	mongoSanitize()
);

if (app.get('env') === 'development') {
	process.loadEnvFile('./.env');
} else {
	app.use(cors());
}

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
	sessionParams.cookie.secure = true;
	csrfOptions.development_mode = false;
}

app.use(cookieParser(process.env.COOKIE_KEY));
const csrfMiddleware = csrf(csrfOptions);
// TODO: implement csrf protection
// (pass to client, add any extra obfuscation as deemed necessary)

// TODO: use routes

app.use(notFound(), errorHandlerMiddleware());

const port = process.env.PORT || 5000;
const start = async () => {
	try {
		await connectDatabase(process.env.MONGO_URI);
		app.listen(port, err => {
			if (err) {
				console.error(`Could not start server on port ${port}.`);
				throw err;
			}
			console.log(`Server listening on port ${port}.`);
			if (app.get('env') === 'development') {
				console.log(`Access at: http://localhost:${port}`);
			}
			// Updates LB every (ms * sec * min) 60 minutes
			setInterval(updateLeaderboards, 1000 * 60 * 60);
		});
	} catch (error) {
		console.log(error);
	}
};
start();
