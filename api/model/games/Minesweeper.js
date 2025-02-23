import mongoose from 'mongoose';

// inherit from Game?
const MinesweeperSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	board: { type: [[Number]], required: true }, // Stores the generated board (0 = empty, -1 = mine)
	revealed: { type: [[Boolean]], required: true }, // Tracks revealed cells
	startedAt: { type: Date, default: Date.now },
	completedAt: { type: Date },
	status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' }
});

export default mongoose.model('Minesweeper', MinesweeperSchema);
