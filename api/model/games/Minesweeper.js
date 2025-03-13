import mongoose from 'mongoose';

const MinesweeperSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	board: { type: [[Number]], required: true },
	revealed: { type: [[Boolean]], required: true },
	flagged: { type: [[Boolean]], default: [] },
	difficulty: {
		type: String,
		enum: ['easy', 'medium', 'hard'],
		default: 'medium'
	},
	startedAt: { type: Date, default: Date.now },
	completedAt: { type: Date },
	status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' },
	moves: [
		{
			row: Number,
			col: Number,
			action: { type: String, enum: ['reveal', 'flag', 'unflag', 'chord'] },
			timestamp: { type: Date, default: Date.now }
		}
	]
});

MinesweeperSchema.methods.generateBoard = function (rows, cols, mines) {
	const board = Array.from({ length: rows }, () => Array(cols).fill(0));
	this.flagged = Array.from({ length: rows }, () => Array(cols).fill(false));

	for (let i = 0; i < mines; i++) {
		let placed = false;
		while (!placed) {
			const row = Math.floor(Math.random() * rows);
			const col = Math.floor(Math.random() * cols);
			if (board[row][col] !== -1) {
				board[row][col] = -1;
				placed = true;
			}
		}
	}

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (board[r][c] === -1) continue;

			let count = 0;
			for (let dr = -1; dr <= 1; dr++) {
				for (let dc = -1; dc <= 1; dc++) {
					const nr = r + dr;
					const nc = c + dc;
					if (
						nr >= 0 &&
						nr < rows &&
						nc >= 0 &&
						nc < cols &&
						board[nr][nc] === -1
					) {
						count++;
					}
				}
			}
			board[r][c] = count;
		}
	}

	this.board = board;
};

MinesweeperSchema.methods.addMove = function (row, col, action) {
	this.moves.push({
		row,
		col,
		action,
		timestamp: new Date()
	});
};

MinesweeperSchema.methods.toggleFlag = function (row, col) {
	if (!this.flagged[row][col] && !this.revealed[row][col]) {
		this.flagged[row][col] = true;
		this.addMove(row, col, 'flag');
		return true;
	} else if (this.flagged[row][col]) {
		this.flagged[row][col] = false;
		this.addMove(row, col, 'unflag');
		return true;
	}
	return false;
};

MinesweeperSchema.methods.getRemainingCells = function () {
	let count = 0;
	for (let row = 0; row < this.board.length; row++) {
		for (let col = 0; col < this.board[0].length; col++) {
			if (this.board[row][col] !== -1 && !this.revealed[row][col]) {
				count++;
			}
		}
	}
	return count;
};

MinesweeperSchema.methods.getClientBoard = function () {
	const clientBoard = Array.from({ length: this.board.length }, () =>
		Array(this.board[0].length).fill(null)
	);

	for (let row = 0; row < this.board.length; row++) {
		for (let col = 0; col < this.board[0].length; col++) {
			if (this.revealed[row][col]) {
				clientBoard[row][col] = this.board[row][col];
			} else if (this.flagged[row][col]) {
				clientBoard[row][col] = 'F';
			}
		}
	}

	return clientBoard;
};

export default mongoose.model('Minesweeper', MinesweeperSchema);
