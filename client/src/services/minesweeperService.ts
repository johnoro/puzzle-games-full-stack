import { apiService } from './api';
import { authService } from './authService';
import { MinesweeperGameState, CellType } from '../types';

interface MinesweeperBackendResponse {
	success: boolean;
	gameId?: string;
	rows?: number;
	cols?: number;
	mines?: number;
	revealed?: boolean[][];
	flagged?: boolean[][];
	status?: string;
	difficulty?: string;
	error?: string;
	message?: string;
	score?: number;
	gameTime?: number;
	revealedBoard?: number[][];
	clientBoard?: (number | string | null)[][];
	startedAt?: string;
	completedAt?: string;
}

export const minesweeperService = {
	async startGame(
		difficulty: string = 'medium'
	): Promise<MinesweeperGameState> {
		try {
			const response = await this.makeRequest<MinesweeperBackendResponse>(
				'post',
				'/games/minesweeper/start',
				{ difficulty }
			);

			if (!response.success) {
				throw new Error(response.error || 'Failed to start game');
			}

			const rows = response.rows || 0;
			const cols = response.cols || 0;

			if (rows <= 0 || cols <= 0) {
				throw new Error('Invalid board dimensions received from server');
			}

			const board = transformBackendBoardToClientFormat(
				rows,
				cols,
				response.revealed,
				response.flagged,
				response.revealedBoard,
				response.clientBoard
			);

			return this.createGameState(
				response,
				board,
				response.gameId || `${difficulty}-${Date.now()}`
			);
		} catch (error) {
			throw error;
		}
	},

	async submitMove(
		gameId: string,
		row: number,
		col: number,
		action: 'reveal' | 'flag' | 'unflag' | 'chord'
	): Promise<MinesweeperGameState> {
		try {
			const response = await this.makeRequest<MinesweeperBackendResponse>(
				'post',
				'/games/minesweeper/move',
				{ gameId, row, col, action }
			);

			if (!response.success) {
				const errorMessage = this.getErrorMessage(response, action);
				throw new Error(errorMessage);
			}

			if (this.shouldFetchFullState(response, action)) {
				return this.getGameState(gameId);
			}

			const dimensions = this.getBoardDimensions(response);
			if (!dimensions) {
				return this.getGameState(gameId);
			}

			const { rows, cols } = dimensions;
			let clickedMineCoords = null;

			if (action === 'reveal' && response.status === 'lost') {
				clickedMineCoords = { row, col };
				this.forceRevealClickedMine(response, row, col);
			}

			const board = transformBackendBoardToClientFormat(
				rows,
				cols,
				response.revealed,
				response.flagged,
				response.revealedBoard,
				response.clientBoard,
				clickedMineCoords
			);

			return this.createGameState(response, board, gameId);
		} catch (error) {
			throw error;
		}
	},

	async getGameState(gameId: string): Promise<MinesweeperGameState> {
		try {
			const response = await this.makeRequest<MinesweeperBackendResponse>(
				'get',
				`/games/minesweeper/${gameId}`
			);

			if (!response.success) {
				throw new Error(response.error || 'Failed to get game state');
			}

			const rows = response.rows ?? 0;
			const cols = response.cols ?? 0;

			if (!rows || !cols) {
				throw new Error('Invalid game dimensions');
			}

			const revealed =
				response.revealed || Array(rows).fill(Array(cols).fill(false));
			const flagged =
				response.flagged || Array(rows).fill(Array(cols).fill(false));

			const board = transformBackendBoardToClientFormat(
				rows,
				cols,
				revealed,
				flagged,
				response.revealedBoard,
				response.clientBoard
			);

			return this.createGameState(response, board, gameId);
		} catch (error) {
			throw error;
		}
	},

	async makeRequest<T>(
		method: 'get' | 'post',
		endpoint: string,
		data?: any
	): Promise<T> {
		const config = {
			headers: {
				Authorization: `Bearer ${authService.getToken()}`
			}
		};

		if (method === 'get') {
			return apiService.get<T>(endpoint, config);
		}
		return apiService.post<T>(endpoint, data, config);
	},

	createGameState(
		response: MinesweeperBackendResponse,
		board: CellType[][],
		gameId: string
	): MinesweeperGameState {
		return {
			gameId,
			difficulty: response.difficulty || 'medium',
			status: mapGameStatus(response.status || 'active'),
			startTime: response.startedAt || new Date().toISOString(),
			endTime:
				response.status !== 'active'
					? response.completedAt || new Date().toISOString()
					: null,
			score: response.score || null,
			minesRemaining: response.mines || 0,
			board
		};
	},

	getBoardDimensions(
		response: MinesweeperBackendResponse
	): { rows: number; cols: number } | null {
		let rows = response.rows || 0;
		let cols = response.cols || 0;

		if (rows && cols) {
			return { rows, cols };
		}

		if (
			response.revealed &&
			Array.isArray(response.revealed) &&
			response.revealed.length > 0
		) {
			rows = response.revealed.length;
			cols = response.revealed[0].length;
			return { rows, cols };
		}

		return null;
	},

	shouldFetchFullState(
		response: MinesweeperBackendResponse,
		action: string
	): boolean {
		if (!response.revealed || !response.flagged) {
			return true;
		}

		return (
			action === 'flag' && !response.clientBoard && !response.revealedBoard
		);
	},

	forceRevealClickedMine(
		response: MinesweeperBackendResponse,
		row: number,
		col: number
	): void {
		if (
			response.revealed &&
			row < response.revealed.length &&
			col < response.revealed[0].length
		) {
			response.revealed[row][col] = true;
		}
	},

	getErrorMessage(
		response: MinesweeperBackendResponse,
		action: string
	): string {
		if (action === 'chord' && response.message) {
			return response.message;
		}
		return response.error || 'Failed to submit move';
	}
};

function transformBackendBoardToClientFormat(
	rows: number,
	cols: number,
	revealed: boolean[][] | undefined,
	flagged: boolean[][] | undefined,
	revealedBoard?: number[][] | undefined,
	clientBoard?: (number | string | null)[][] | undefined,
	clickedMineCoords?: { row: number; col: number } | null
): CellType[][] {
	revealed = validateBoardData(revealed, rows, cols, false);
	flagged = validateBoardData(flagged, rows, cols, false);

	try {
		const board = Array.from({ length: rows }, (_, r) =>
			Array.from({ length: cols }, (_, c) => {
				const cellData = getCellData(r, c, revealedBoard, clientBoard);
				const isRevealed = getRevealedState(
					r,
					c,
					revealed,
					cellData.isMine,
					clickedMineCoords
				);
				const isFlagged =
					r < flagged.length && c < flagged[r].length ? flagged[r][c] : false;

				return {
					row: r,
					col: c,
					...cellData,
					isRevealed,
					isFlagged
				};
			})
		);

		return board;
	} catch (error) {
		return [];
	}
}

function validateBoardData(
	data: boolean[][] | undefined,
	rows: number,
	cols: number,
	defaultValue: boolean
): boolean[][] {
	if (!data || !Array.isArray(data) || data.length === 0) {
		return Array.from({ length: rows }, () => Array(cols).fill(defaultValue));
	}

	if (data.length !== rows || data[0].length !== cols) {
		const newData = Array.from({ length: rows }, () =>
			Array(cols).fill(defaultValue)
		);

		for (let r = 0; r < Math.min(rows, data.length); r++) {
			for (let c = 0; c < Math.min(cols, data[r].length); c++) {
				newData[r][c] = data[r][c];
			}
		}
		return newData;
	}

	return data;
}

function getCellData(
	r: number,
	c: number,
	revealedBoard?: number[][] | undefined,
	clientBoard?: (number | string | null)[][] | undefined
): { isMine: boolean; neighborMines: number } {
	if (
		revealedBoard &&
		r < revealedBoard.length &&
		c < revealedBoard[r].length
	) {
		const isMine = revealedBoard[r][c] === -1;
		return {
			isMine,
			neighborMines: isMine ? 0 : revealedBoard[r][c]
		};
	}

	if (clientBoard && r < clientBoard.length && c < clientBoard[r].length) {
		const cellValue = clientBoard[r][c];
		const isMine = cellValue === 'M' || cellValue === '💣';
		let neighborMines = 0;

		if (typeof cellValue === 'number') {
			neighborMines = cellValue;
		} else if (typeof cellValue === 'string' && !isNaN(Number(cellValue))) {
			neighborMines = Number(cellValue);
		}

		return { isMine, neighborMines };
	}

	return { isMine: false, neighborMines: 0 };
}

function getRevealedState(
	r: number,
	c: number,
	revealed: boolean[][],
	isMine: boolean,
	clickedMineCoords?: { row: number; col: number } | null
): boolean {
	const isRevealed =
		r < revealed.length && c < revealed[r].length ? revealed[r][c] : false;

	if (
		isMine &&
		clickedMineCoords &&
		r === clickedMineCoords.row &&
		c === clickedMineCoords.col
	) {
		return true;
	}

	return isRevealed;
}

function mapGameStatus(backendStatus: string): 'playing' | 'won' | 'lost' {
	const statusMap: Record<string, 'playing' | 'won' | 'lost'> = {
		active: 'playing',
		won: 'won',
		lost: 'lost'
	};

	return statusMap[backendStatus] || 'playing';
}

export default minesweeperService;
