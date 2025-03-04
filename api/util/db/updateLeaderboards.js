import Game from '../../model/Game.js';
import Score from '../../model/Score.js';
import Leaderboard from '../../model/Leaderboard.js';

const updateLeaderboards = async () => {
	const games = await Game.find();
	for (const game of games) {
		const scores = await Score.find({ game: game._id })
			.sort({ score: -1 })
			.limit(10);
		await Leaderboard.findOneAndUpdate(
			{ game: game._id },
			{ scores, updatedAt: new Date() },
			{ upsert: true }
		);
	}
};

export default updateLeaderboards;
