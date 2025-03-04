import BaseGame from '../BaseGame.js';
import difficultyMap from './difficulty.js';

class MinesweeperGame extends BaseGame {
	constructor(options = {}) {
		super();

		this.difficulty = options.difficulty || 'easy';
		this.setDimensions(options);
		this.board = Array.from({ length: this.rows }, () =>
			Array(this.cols).fill(0)
		);
		this.revealed = Array.from({ length: this.rows }, () =>
			Array(this.cols).fill(false)
		);
		this.flagged = Array.from({ length: this.rows }, () =>
			Array(this.cols).fill(false)
		);

		this.generateBoard();
		this.firstMove = true;
	}

	setDimensions(options = {}) {
		if (options.rows && options.cols && options.mines) {
			this.rows = options.rows;
			this.cols = options.cols;
			this.mines = options.mines;
			return;
		}

		if (!difficultyMap[this.difficulty]) {
			this.difficulty = 'easy';
		}
		this.rows = difficultyMap[this.difficulty].rows;
		this.cols = difficultyMap[this.difficulty].cols;
		this.mines = difficultyMap[this.difficulty].mines;
	}

	generateBoard() {
		let minesPlaced = 0;
		while (minesPlaced < this.mines) {
			const row = Math.floor(Math.random() * this.rows);
			const col = Math.floor(Math.random() * this.cols);

			if (this.board[row][col] === -1) continue;

			this.board[row][col] = -1;
			minesPlaced++;
		}

		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				if (this.board[row][col] === -1) continue;

				// count adjacent mines
				let count = 0;
				for (
					let r = Math.max(0, row - 1);
					r <= Math.min(row + 1, this.rows - 1);
					r++
				) {
					for (
						let c = Math.max(0, col - 1);
						c <= Math.min(col + 1, this.cols - 1);
						c++
					) {
						if (this.board[r][c] === -1) count++;
					}
				}

				this.board[row][col] = count;
			}
		}
	}

	ensureSafeFirstMove(row, col) {
		if (!this.firstMove) return;

		if (this.board[row][col] === -1 || this.board[row][col] > 0) {
			this.board = Array.from({ length: this.rows }, () =>
				Array(this.cols).fill(0)
			);

			// safe area around the first click
			const safeRow = row;
			const safeCol = col;

			let minesPlaced = 0;
			while (minesPlaced < this.mines) {
				const r = Math.floor(Math.random() * this.rows);
				const c = Math.floor(Math.random() * this.cols);

				if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
				if (this.board[r][c] === -1) continue;

				this.board[r][c] = -1;
				minesPlaced++;
			}

			for (let r = 0; r < this.rows; r++) {
				for (let c = 0; c < this.cols; c++) {
					if (this.board[r][c] === -1) continue;

					// count adjacent mines
					let count = 0;
					for (let dr = -1; dr <= 1; dr++) {
						for (let dc = -1; dc <= 1; dc++) {
							const nr = r + dr;
							const nc = c + dc;
							if (
								nr >= 0 &&
								nr < this.rows &&
								nc >= 0 &&
								nc < this.cols &&
								this.board[nr][nc] === -1
							) {
								count++;
							}
						}
					}

					this.board[r][c] = count;
				}
			}
		}

		this.firstMove = false;
	}

	makeMove(move) {
		const { row, col, action = 'reveal' } = move;

		if (!this.validateMove(move)) {
			return { valid: false, message: 'Invalid move' };
		}

		this.recordMove(move);

		if (action === 'reveal') {
			if (this.firstMove) {
				this.ensureSafeFirstMove(row, col);
			}

			if (this.board[row][col] === -1) {
				this.endGame('lost');
				return {
					valid: true,
					gameOver: true,
					status: 'lost',
					revealAll: true,
					message: 'Game over - you hit a mine!'
				};
			}

			this.revealCell(row, col);

			if (this.checkWinCondition()) {
				const score = this.calculateScore({
					baseScore: this.getBaseScore(),
					timeMultiplier: 2
				});

				this.endGame('won');

				return {
					valid: true,
					gameOver: true,
					status: 'won',
					score,
					message: 'Congratulations! You won!'
				};
			}

			return {
				valid: true,
				gameOver: false,
				updated: true
			};
		} else if (action === 'flag') {
			this.flagged[row][col] = !this.flagged[row][col];

			return {
				valid: true,
				gameOver: false,
				flagged: this.flagged[row][col],
				message: this.flagged[row][col] ? 'Flag placed' : 'Flag removed'
			};
		}

		return { valid: false, message: 'Unknown action' };
	}

	validateMove(move) {
		const { row, col, action } = move;

		if (this.status !== 'active') {
			return false;
		}

		if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
			return false;
		}

		if (!['reveal', 'flag'].includes(action)) {
			return false;
		}

		if (action === 'reveal') {
			if (this.revealed[row][col] || this.flagged[row][col]) {
				return false;
			}
		}

		if (action === 'flag' && this.revealed[row][col]) {
			return false;
		}

		return true;
	}

	revealCell(row, col) {
		if (
			row < 0 ||
			row >= this.rows ||
			col < 0 ||
			col >= this.cols ||
			this.revealed[row][col] ||
			this.flagged[row][col]
		) {
			return;
		}

		this.revealed[row][col] = true;

		if (this.board[row][col] === 0) {
			// Reveal adjacent cells
			for (
				let r = Math.max(0, row - 1);
				r <= Math.min(row + 1, this.rows - 1);
				r++
			) {
				for (
					let c = Math.max(0, col - 1);
					c <= Math.min(col + 1, this.cols - 1);
					c++
				) {
					if (r !== row || c !== col) {
						this.revealCell(r, c);
					}
				}
			}
		}
	}

	checkWinCondition() {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				if (this.board[row][col] !== -1 && !this.revealed[row][col]) {
					return false;
				}
			}
		}
		return true;
	}

	getBaseScore() {
		return difficultyMap[this.difficulty].baseScore;
	}

	calculateScore(params = {}) {
		const baseScore = params.baseScore || this.getBaseScore();
		const timeMultiplier = params.timeMultiplier || 2;
		const duration = this.getDuration();

		return Math.max(
			Math.floor(baseScore - duration * timeMultiplier),
			baseScore * 0.1
		);
	}

	getClientBoard() {
		const clientBoard = Array.from({ length: this.rows }, () =>
			Array(this.cols).fill(null)
		);

		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				if (this.revealed[row][col]) {
					clientBoard[row][col] = this.board[row][col];
				} else if (this.flagged[row][col]) {
					clientBoard[row][col] = 'F';
				}
			}
		}

		return clientBoard;
	}

	getBaseState() {
		return {
			status: this.status,
			difficulty: this.difficulty,
			rows: this.rows,
			cols: this.cols,
			mines: this.mines,
			revealed: this.revealed,
			flagged: this.flagged,
			startTime: this.startTime,
			endTime: this.endTime,
			duration: this.getDuration(),
			moveCount: this.moves.length
		};
	}

	getClientState() {
		return Object.assign(this.getBaseState(), {
			board: this.status !== 'active' ? this.board : this.getClientBoard()
		});
	}

	getFullState() {
		return Object.assign(this.getBaseState(), {
			board: this.board,
			moves: this.moves,
			firstMove: this.firstMove
		});
	}
}

export default MinesweeperGame;
