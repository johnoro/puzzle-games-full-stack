import Game from '../model/Game.js';
import GameFactory from '../util/games/GameFactory.js';

export const getAvailableGames = async (req, res) => {
	try {
		const games = GameFactory.getAvailableGames();

		res.status(200).json({
			success: true,
			games
		});
	} catch (error) {
		console.error('Error getting available games:', error);
		res.status(500).json({
			success: false,
			message: 'Could not retrieve available games'
		});
	}
};

export const checkGameExists = async (req, res) => {
	try {
		const { gameType } = req.params;

		if (!gameType) {
			return res.status(400).json({
				success: false,
				message: 'Game type is required'
			});
		}

		const exists = GameFactory.isGameSupported(gameType);

		res.status(200).json({
			success: true,
			exists
		});
	} catch (error) {
		console.error('Error checking game existence:', error);
		res.status(500).json({
			success: false,
			message: 'Could not check if game exists'
		});
	}
};

export const getGameMetadata = async (req, res) => {
	try {
		const { gameType } = req.params;

		if (!gameType) {
			return res.status(400).json({
				success: false,
				message: 'Game type is required'
			});
		}

		if (!GameFactory.isGameSupported(gameType)) {
			return res.status(404).json({
				success: false,
				message: `Game type '${gameType}' does not exist`
			});
		}

		let game = await Game.findOne({ name: gameType.toLowerCase() });

		if (!game) {
			game = await Game.create({ name: gameType.toLowerCase() });
		}

		const gameDetails = GameFactory.getAvailableGames().find(
			g => g.id === gameType.toLowerCase()
		);

		res.status(200).json({
			success: true,
			game: {
				id: game._id,
				name: game.name,
				...gameDetails
			}
		});
	} catch (error) {
		console.error('Error getting game metadata:', error);
		res.status(500).json({
			success: false,
			message: 'Could not retrieve game metadata'
		});
	}
};

export const getUserGameStats = async (req, res) => {
	try {
		const { gameType } = req.params;
		const userId = req.user.id;

		if (!gameType) {
			return res.status(400).json({
				success: false,
				message: 'Game type is required'
			});
		}

		const stats = await Game.aggregate([
			{
				$match: {
					userId,
					gameType
				}
			}
		]);

		res.status(200).json({
			success: true,
			stats: {
				gamesPlayed: stats.length,
				gamesWon: stats.filter(game => game.status === 'won').length,
				gamesLost: stats.filter(game => game.status === 'lost').length,
				winRate: gamesWon / gamesPlayed,
				averageScore:
					stats.reduce((sum, game) => sum + game.score, 0) / gamesPlayed,
				highScore: Math.max(...stats.map(game => game.score))
			}
		});
	} catch (error) {
		console.error('Error getting user game stats:', error);
		res.status(500).json({
			success: false,
			message: 'Could not retrieve user game stats'
		});
	}
};
