export interface User {
	_id: string;
	username: string;
	email: string;
}

export interface AuthState {
	user: User | null;
	loading: boolean;
	error: string | null;
	isAuthenticated: boolean;
}

export interface Game {
	_id?: string;
	id?: string;
	name: string;
	description: string;
	thumbnail?: string;
	route?: string;
	difficulties?: string[];
}

export interface GameMetadata {
	id?: string;
	name: string;
	description: string;
	rules?: string;
	difficulties: string[];
}

export interface CellType {
	row: number;
	col: number;
	isMine: boolean;
	isRevealed: boolean;
	isFlagged: boolean;
	neighborMines: number;
}

export interface MinesweeperGameState {
	gameId: string;
	board: CellType[][];
	difficulty: string;
	status: 'playing' | 'won' | 'lost';
	startTime: string;
	endTime: string | null;
	score: number | null;
	minesRemaining: number;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}
