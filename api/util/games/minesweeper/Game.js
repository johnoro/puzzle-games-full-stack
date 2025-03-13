import BaseGame from '../BaseGame.js';
import difficultyMap from './difficulty.js';

class MinesweeperGame extends BaseGame {
	constructor(options = {}) {
		super();

		this.difficulty = options.difficulty || 'easy';
		this.setDimensions(options);
		this.board = this.createEmptyBoard(0);
		this.revealed = this.createEmptyBoard(false);
		this.flagged = this.createEmptyBoard(false);

		this.generateBoard();
		this.firstMove = true;
	}

	createEmptyBoard(defaultValue) {
		return Array.from({ length: this.rows }, () =>
			Array(this.cols).fill(defaultValue)
		);
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

		const { rows, cols, mines } = difficultyMap[this.difficulty];
		this.rows = rows;
		this.cols = cols;
		this.mines = mines;
	}

	generateBoard() {
		this.placeMines();
		this.calculateNeighborMines();
	}

	placeMines() {
		let minesPlaced = 0;
		while (minesPlaced < this.mines) {
			const row = Math.floor(Math.random() * this.rows);
			const col = Math.floor(Math.random() * this.cols);

			if (this.board[row][col] === -1) continue;

			this.board[row][col] = -1;
			minesPlaced++;
		}
	}

	calculateNeighborMines() {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				if (this.board[row][col] === -1) continue;
				this.board[row][col] = this.countAdjacentMines(row, col);
			}
		}
	}

	countAdjacentMines(row, col) {
		let count = 0;
		this.forEachAdjacentCell(row, col, (r, c) => {
			if (this.board[r][c] === -1) count++;
		});
		return count;
	}

	forEachAdjacentCell(row, col, callback) {
		const rowStart = Math.max(0, row - 1);
		const rowEnd = Math.min(row + 1, this.rows - 1);
		const colStart = Math.max(0, col - 1);
		const colEnd = Math.min(col + 1, this.cols - 1);

		for (let r = rowStart; r <= rowEnd; r++) {
			for (let c = colStart; c <= colEnd; c++) {
				if (r !== row || c !== col) {
					callback(r, c);
				}
			}
		}
	}

	isInSafeArea(r, c, safeRow, safeCol) {
		return Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;
	}

	ensureSafeFirstMove(row, col) {
		if (!this.firstMove) return;

		if (this.board[row][col] === -1 || this.board[row][col] > 0) {
			this.board = this.createEmptyBoard(0);

			const safeRow = row;
			const safeCol = col;

			let minesPlaced = 0;
			while (minesPlaced < this.mines) {
				const r = Math.floor(Math.random() * this.rows);
				const c = Math.floor(Math.random() * this.cols);

				if (this.isInSafeArea(r, c, safeRow, safeCol)) continue;
				if (this.board[r][c] === -1) continue;

				this.board[r][c] = -1;
				minesPlaced++;
			}

			this.calculateNeighborMines();
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
			return this.handleRevealAction(row, col);
		} else if (action === 'flag') {
			return this.handleFlagAction(row, col);
		}

		return { valid: false, message: 'Unknown action' };
	}

	handleRevealAction(row, col) {
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
	}

	handleFlagAction(row, col) {
		this.flagged[row][col] = !this.flagged[row][col];

		return {
			valid: true,
			gameOver: false,
			flagged: this.flagged[row][col],
			message: this.flagged[row][col] ? 'Flag placed' : 'Flag removed'
		};
	}

	validateMove(move) {
		const { row, col, action } = move;

		if (this.status !== 'active') {
			return false;
		}

		if (!this.isValidCell(row, col)) {
			return false;
		}

		if (!['reveal', 'flag'].includes(action)) {
			return false;
		}

		if (
			action === 'reveal' &&
			(this.revealed[row][col] || this.flagged[row][col])
		) {
			return false;
		}

		if (action === 'flag' && this.revealed[row][col]) {
			return false;
		}

		return true;
	}

	isValidCell(row, col) {
		return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
	}

	revealCell(row, col) {
		if (
			!this.isValidCell(row, col) ||
			this.revealed[row][col] ||
			this.flagged[row][col]
		) {
			return;
		}

		this.revealed[row][col] = true;

		if (this.board[row][col] === 0) {
			this.forEachAdjacentCell(row, col, (r, c) => {
				this.revealCell(r, c);
			});
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

	// Game state methods
	getClientBoard() {
		const clientBoard = this.createEmptyBoard(null);

		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				if (this.flagged[row][col]) {
					clientBoard[row][col] = '🚩';
				} else if (!this.revealed[row][col]) {
					clientBoard[row][col] = null;
				} else if (this.board[row][col] === -1) {
					clientBoard[row][col] = '💣';
				} else {
					clientBoard[row][col] =
						this.board[row][col] === 0 ? null : this.board[row][col];
				}
			}
		}

		return clientBoard;
	}

	getGameData() {
		const revealedBoard = this.status !== 'active' ? this.board : null;
		const clientBoard = this.getClientBoard();

		return {
			rows: this.rows,
			cols: this.cols,
			mines: this.mines,
			revealed: this.revealed,
			flagged: this.flagged,
			revealedBoard,
			clientBoard,
			...this.getBaseGameData()
		};
	}

	getBaseScore() {
		const difficultyMultiplier = {
			easy: 1,
			medium: 2,
			hard: 3,
			expert: 5
		};

		return (
			this.rows *
			this.cols *
			(this.mines / (this.rows * this.cols)) *
			100 *
			(difficultyMultiplier[this.difficulty] || 1)
		);
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
