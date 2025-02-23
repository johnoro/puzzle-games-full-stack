import Leaderboard from '../model/Leaderboard.js';

export const getLeaderboard = async (req, res) => {
	try {
		const leaderboard = await Leaderboard.findOne({
			gameId: req.params.id
		}).populate('scores.user', 'username');
		if (!leaderboard) {
			return res.status(404).json({ message: 'Leaderboard not found' });
		}

		res.json(leaderboard);
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
