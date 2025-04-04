import Minesweeper from '../../model/games/Minesweeper.js';
import Score from '../../model/Score.js';
import Game from '../../model/Game.js';
import difficultyMap from '../../util/games/minesweeper/difficulty.js';

export const startGame = async (req, res) => {
	try {
		const { difficulty } = req.body;
		const userId = req.user.userId;

		if (!difficultyMap[difficulty]) difficulty = 'easy';
		const { rows, cols, mines } = difficultyMap[difficulty];

		const game = new Minesweeper({
			userId,
			difficulty,
			board: [],
			revealed: Array.from({ length: rows }, () => Array(cols).fill(false))
		});

		game.generateBoard(rows, cols, mines);

		await game.save();

		res.status(201).json({
			success: true,
			gameId: game._id,
			rows,
			cols,
			mines,
			revealed: game.revealed,
			flagged: game.flagged,
			status: game.status,
			difficulty
		});
	} catch (error) {
		console.error('Error starting minesweeper game:', error);
		res.status(500).json({
			success: false,
			message: 'Could not start game'
		});
	}
};

const isValidMove = (game, row, col) => {
	return (
		row >= 0 &&
		row < game.board.length &&
		col >= 0 &&
		col < game.board[0].length
	);
};
export const submitMove = async (req, res) => {
	try {
		const { gameId, row, col, action = 'reveal' } = req.body;
		const userId = req.user.userId;

		const game = await Minesweeper.findOne({
			_id: gameId,
			userId,
			status: 'active'
		});

		if (!game) {
			return res.status(404).json({
				success: false,
				message: 'Game not found or already completed'
			});
		}

		const rows = game.board.length;
		const cols = game.board[0]?.length || 0;

		let mines = 0;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				if (game.board[r][c] === -1) {
					mines++;
				}
			}
		}

		if (!isValidMove(game, row, col)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid move coordinates'
			});
		}

		if (action === 'reveal') {
			if (game.revealed[row][col]) {
				return res.status(400).json({
					success: false,
					message: 'Cell already revealed'
				});
			}

			if (game.flagged[row][col]) {
				return res.status(400).json({
					success: false,
					message: 'Cannot reveal flagged cell. Remove flag first.'
				});
			}

			game.addMove(row, col, 'reveal');

			if (game.board[row][col] === -1) {
				game.status = 'lost';
				game.completedAt = new Date();
				await game.save();

				return res.status(200).json({
					success: true,
					message: 'Game over - you hit a mine!',
					gameId: game._id,
					status: 'lost',
					difficulty: game.difficulty,
					rows,
					cols,
					mines,
					revealed: game.revealed,
					flagged: game.flagged,
					revealedBoard: game.board,
					startedAt: game.startedAt,
					completedAt: game.completedAt
				});
			}

			revealCell(game, row, col);

			const isGameWon = checkWinCondition(game);
			if (isGameWon) {
				game.status = 'won';
				game.completedAt = new Date();

				const gameTime = (game.completedAt - game.startedAt) / 1000; // seconds
				let baseScore = 0;

				if (difficultyMap[game.difficulty]) {
					baseScore = difficultyMap[game.difficulty].baseScore;
				} else {
					baseScore = difficultyMap.easy.baseScore;
				}

				const score = Math.max(
					Math.floor(baseScore - gameTime * 2),
					baseScore * 0.1
				);

				await saveScore(userId, 'minesweeper', score);
				await game.save();

				return res.status(200).json({
					success: true,
					message: 'Congratulations! You won!',
					gameId: game._id,
					status: 'won',
					difficulty: game.difficulty,
					rows,
					cols,
					mines,
					revealed: game.revealed,
					flagged: game.flagged,
					score,
					gameTime,
					startedAt: game.startedAt,
					completedAt: game.completedAt
				});
			}

			await game.save();
			return res.status(200).json({
				success: true,
				gameId: game._id,
				difficulty: game.difficulty,
				rows,
				cols,
				mines,
				revealed: game.revealed,
				flagged: game.flagged,
				status: game.status,
				startedAt: game.startedAt,
				clientBoard: game.getClientBoard()
			});
		} else if (action === 'flag') {
			if (game.revealed[row][col]) {
				return res.status(400).json({
					success: false,
					message: 'Cannot flag a revealed cell'
				});
			}

			const flagToggled = game.toggleFlag(row, col);
			if (!flagToggled) {
				return res.status(400).json({
					success: false,
					message: 'Could not toggle flag'
				});
			}

			await game.save();
			return res.status(200).json({
				success: true,
				message: game.flagged[row][col]
					? `Flag placed at position (${row}, ${col})`
					: `Flag removed from position (${row}, ${col})`,
				gameId: game._id,
				difficulty: game.difficulty,
				rows,
				cols,
				mines,
				revealed: game.revealed,
				flagged: game.flagged,
				status: game.status,
				startedAt: game.startedAt,
				clientBoard: game.getClientBoard()
			});
		} else if (action === 'chord') {
			if (!game.revealed[row][col]) {
				return res.status(400).json({
					success: false,
					message: 'Cannot chord an unrevealed cell'
				});
			}

			const adjacentMines = game.board[row][col];

			if (adjacentMines <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Can only chord on cells with adjacent mines'
				});
			}

			let adjacentFlags = 0;
			const adjacentUnrevealedCells = [];

			// check adjacent cells
			for (
				let r = Math.max(0, row - 1);
				r <= Math.min(row + 1, rows - 1);
				r++
			) {
				for (
					let c = Math.max(0, col - 1);
					c <= Math.min(col + 1, cols - 1);
					c++
				) {
					if (r === row && c === col) continue; // skip self

					if (game.flagged[r][c]) {
						adjacentFlags++;
					} else if (!game.revealed[r][c]) {
						adjacentUnrevealedCells.push({ r, c });
					}
				}
			}

			if (adjacentFlags !== adjacentMines) {
				return res.status(400).json({
					success: false,
					message: `Cannot chord: need ${adjacentMines} flags, but ${adjacentFlags} are placed`
				});
			}

			game.addMove(row, col, 'chord');

			let hitMine = false;
			for (const { r, c } of adjacentUnrevealedCells) {
				revealCell(game, r, c);

				if (game.board[r][c] === -1 && game.revealed[r][c]) {
					hitMine = true;
					game.status = 'lost';
					game.completedAt = new Date();
				}
			}

			if (hitMine) {
				await game.save();
				return res.status(200).json({
					success: true,
					message: 'Game over - chord hit a mine!',
					gameId: game._id,
					status: 'lost',
					difficulty: game.difficulty,
					rows,
					cols,
					mines,
					revealed: game.revealed,
					flagged: game.flagged,
					revealedBoard: game.board,
					startedAt: game.startedAt,
					completedAt: game.completedAt
				});
			}

			const isGameWon = checkWinCondition(game);
			if (isGameWon) {
				game.status = 'won';
				game.completedAt = new Date();

				const gameTime = (game.completedAt - game.startedAt) / 1000; // seconds
				let baseScore = 0;

				if (difficultyMap[game.difficulty]) {
					baseScore = difficultyMap[game.difficulty].baseScore;
				} else {
					baseScore = difficultyMap.easy.baseScore;
				}

				const score = Math.max(
					Math.floor(baseScore - gameTime * 2),
					baseScore * 0.1
				);

				await saveScore(userId, 'minesweeper', score);
				await game.save();

				return res.status(200).json({
					success: true,
					message: 'Congratulations! You won!',
					gameId: game._id,
					status: 'won',
					difficulty: game.difficulty,
					rows,
					cols,
					mines,
					revealed: game.revealed,
					flagged: game.flagged,
					score,
					gameTime,
					startedAt: game.startedAt,
					completedAt: game.completedAt,
					revealedBoard: game.board
				});
			}

			await game.save();
			return res.status(200).json({
				success: true,
				message: 'Chord action successful',
				gameId: game._id,
				difficulty: game.difficulty,
				rows,
				cols,
				mines,
				revealed: game.revealed,
				flagged: game.flagged,
				status: game.status,
				startedAt: game.startedAt,
				clientBoard: game.getClientBoard()
			});
		} else {
			return res.status(400).json({
				success: false,
				message: 'Invalid action'
			});
		}
	} catch (error) {
		console.error('Error submitting minesweeper move:', error);
		res.status(500).json({
			success: false,
			message: 'Could not process move'
		});
	}
};

export const getGameState = async (req, res) => {
	try {
		const { gameId } = req.params;
		const userId = req.user.userId;

		const game = await Minesweeper.findOne({
			_id: gameId,
			userId
		});

		if (!game) {
			return res.status(404).json({
				success: false,
				message: 'Game not found'
			});
		}

		const rows = game.board.length;
		const cols = game.board[0]?.length || 0;

		let mines = 0;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				if (game.board[r][c] === -1) {
					mines++;
				}
			}
		}

		const returnData = {
			success: true,
			gameId: game._id,
			rows: rows,
			cols: cols,
			mines: mines,
			revealed: game.revealed,
			flagged: game.flagged,
			status: game.status,
			startedAt: game.startedAt,
			difficulty: game.difficulty
		};

		if (game.status === 'active') {
			returnData.clientBoard = game.getClientBoard();
		} else {
			returnData.board = game.board;
			returnData.completedAt = game.completedAt;
		}

		return res.status(200).json(returnData);
	} catch (error) {
		console.error('Error getting game state:', error);
		res.status(500).json({
			success: false,
			message: 'Could not get game state'
		});
	}
};

function revealCell(game, row, col) {
	if (
		!isValidMove(game, row, col) ||
		game.revealed[row][col] ||
		game.flagged[row][col]
	) {
		return;
	}

	game.revealed[row][col] = true;

	if (game.board[row][col] === 0) {
		// reveal neighbors
		for (let dr = -1; dr <= 1; dr++) {
			for (let dc = -1; dc <= 1; dc++) {
				if (dr === 0 && dc === 0) continue; // skip current cell
				revealCell(game, row + dr, col + dc);
			}
		}
	}
}

function checkWinCondition(game) {
	return game.getRemainingCells() === 0;
}

async function saveScore(userId, gameName, score) {
	try {
		let game = await Game.findOne({ name: gameName });
		if (!game) {
			// might want to throw an error here instead
			game = await Game.create({ name: gameName });
		}

		await Score.create({
			userId,
			gameId: game._id,
			score
		});
	} catch (error) {
		console.error('Error saving score:', error);
	}
}
