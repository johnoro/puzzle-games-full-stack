import mongoose from 'mongoose';

const LeaderboardSchema = new mongoose.Schema({
	game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
	scores: [
		{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			score: {
				type: Number
			}
		}
	],
	updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Leaderboard', LeaderboardSchema);
