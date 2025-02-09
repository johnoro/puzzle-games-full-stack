import Game from '../model/Game.js';
import Score from '../model/Score.js';

export const postScores = async (req, res) => {
	try {
		const { gameId, score } = req.body;
		if (!gameId || typeof score !== 'number') {
			return res.status(400).json({ message: 'Missing fields' });
		}

		const game = await Game.findById(gameId);
		if (!game) {
			return res.status(404).json({ message: 'Game not found' });
		}

		const newScore = await Score.create({
			user: req.user.id,
			game: gameId,
			score
		});
		res.status(201).json({ score });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
