import Game from '../model/Game.js';
import Score from '../model/Score.js';

export const postScores = async (req, res) => {
	try {
		const { gameName, score } = req.body;
		if (!gameName || typeof score !== 'number') {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields: gameName and score'
			});
		}

		// Only accept game names (not ObjectIds)
		if (/^[0-9a-fA-F]{24}$/.test(gameName)) {
			return res.status(400).json({
				success: false,
				message:
					'Invalid gameName: ObjectIds are not accepted. Please use game name instead.'
			});
		}

		// Find the game by name
		const game = await Game.findOne({ name: gameName.toLowerCase() });
		if (!game) {
			return res.status(404).json({
				success: false,
				message: 'Game not found'
			});
		}

		// Use req.user.userId instead of req.user.id
		if (!req.user || !req.user.userId) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		const newScore = await Score.create({
			userId: req.user.userId, // Use userId from the req.user object
			gameId: game._id, // Convert game name to ObjectId internally
			score
		});

		res.status(201).json({
			success: true,
			score
		});
	} catch (err) {
		console.error('Error posting score:', err);
		res.status(500).json({
			success: false,
			message: 'Server error'
		});
	}
};

// Get user's personal scores
export const getPersonalScores = async (req, res) => {
	try {
		// Get user ID from the authenticated user - use userId, not id
		if (!req.user || !req.user.userId) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required'
			});
		}

		const userId = req.user.userId;

		// Get game filter if provided
		const { gameName } = req.query;

		// Create query
		const query = { userId }; // Use userId here

		// If gameName is provided, find the corresponding game
		if (gameName) {
			// Reject if ObjectId format is passed - we want to enforce game name usage
			if (/^[0-9a-fA-F]{24}$/.test(gameName)) {
				return res.status(400).json({
					success: false,
					message:
						'Invalid parameter: ObjectIds are not accepted. Please use game name instead.'
				});
			}

			// Find the game by name
			const game = await Game.findOne({ name: gameName.toLowerCase() });

			if (game) {
				// Use the game's ObjectId for the database query
				query.gameId = game._id;
			} else {
				// If game doesn't exist, return empty results
				return res.json({
					success: true,
					scores: [],
					personalBests: []
				});
			}
		}

		// Find scores for the user, sorted by score (descending) and date (descending)
		const scores = await Score.find(query)
			.sort({ score: -1, createdAt: -1 })
			.populate('gameId', 'name') // Get the game name
			.limit(100); // Limit to last 100 scores

		// For each game, calculate personal best
		const games = await Game.find();
		const personalBests = [];

		for (const game of games) {
			const bestScore = await Score.findOne({
				userId, // Use userId here too
				gameId: game._id
			})
				.sort({ score: -1 })
				.select('score createdAt');

			if (bestScore) {
				personalBests.push({
					game: {
						name: game.name // Only return game name, not ID
					},
					score: bestScore.score,
					date: bestScore.createdAt
				});
			}
		}

		return res.json({
			success: true,
			scores: scores.map(score => ({
				id: score._id,
				game: {
					name: score.gameId.name // Only return game name, not ID
				},
				score: score.score,
				date: score.createdAt
			})),
			personalBests
		});
	} catch (err) {
		console.error('Error getting personal scores:', err);
		return res.status(500).json({
			success: false,
			message: 'Failed to retrieve personal scores'
		});
	}
};
