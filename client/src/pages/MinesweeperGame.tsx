import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MinesweeperBoard from '../components/games/minesweeper/MinesweeperBoard';
import minesweeperService from '../services/minesweeperService';
import { CellType, MinesweeperGameState } from '../types';
import scoreService from '../services/scoreService';
import { authService } from '../services/authService';
import { getBoardDimensions as getBoardDimensionsUtil } from '../utils/minesweeper';

const useQuery = () => {
	return new URLSearchParams(useLocation().search);
};

const MinesweeperGame: React.FC = () => {
	const query = useQuery();
	const gameId = query.get('id');
	const navigate = useNavigate();

	const [game, setGame] = useState<MinesweeperGameState | null>(null);
	const [board, setBoard] = useState<CellType[][]>([]);
	const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>(
		'playing'
	);
	const [score, setScore] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [initializing, setInitializing] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [flagsCount, setFlagsCount] = useState(0);
	const [minesCount, setMinesCount] = useState(0);
	const [gameTime, setGameTime] = useState<number | null>(null);

	const [currentDifficulty, setCurrentDifficulty] = useState<string>('medium');

	const [errorToast, setErrorToast] = useState<string | null>(null);

	const gameAreaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (errorToast) {
			const timer = setTimeout(() => {
				setErrorToast(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [errorToast]);

	// MM:SS
	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
			.toString()
			.padStart(2, '0')}`;
	};

	const calculateGameTime = (startTime: string, endTime: string): number => {
		const start = new Date(startTime).getTime();
		const end = new Date(endTime).getTime();
		return Math.floor((end - start) / 1000); // seconds
	};

	const showError = (message: string, isTemporary = true) => {
		if (isTemporary) {
			setErrorToast(message);
		} else {
			setError(message);
		}
	};

	const createBoardFromGame = useCallback((gameData: MinesweeperGameState) => {
		if (
			!gameData.board ||
			!Array.isArray(gameData.board) ||
			gameData.board.length === 0
		) {
			return [];
		}

		return gameData.board;
	}, []);

	const countFlags = (boardData: CellType[][]): number => {
		if (!boardData || boardData.length === 0) return 0;

		return boardData.reduce(
			(count, row) => count + row.filter(cell => cell.isFlagged).length,
			0
		);
	};

	const updateGameState = (gameData: MinesweeperGameState) => {
		setGame(gameData);
		setBoard(gameData.board);
		setGameStatus(gameData.status);
		setMinesCount(gameData.minesRemaining || 0);

		if (gameData.status !== 'playing') {
			if (gameData.startTime && gameData.endTime) {
				const time = calculateGameTime(gameData.startTime, gameData.endTime);
				setGameTime(time);
			}
		}

		const flags = countFlags(gameData.board);
		setFlagsCount(flags);

		if (gameData.status === 'won' && gameData.score) {
			setScore(gameData.score);
			submitGameScore(gameData.score);
		}
	};

	const handleMoveResponse = async (
		action: 'reveal' | 'flag' | 'unflag' | 'chord',
		row: number,
		col: number
	) => {
		if (!game || gameStatus !== 'playing' || loading) return;

		try {
			setLoading(true);

			const response = await minesweeperService.submitMove(
				game.gameId,
				row,
				col,
				action
			);

			updateGameState(response);
		} catch (err) {
			console.error(`Failed to ${action} at (${row}, ${col}).`);
		} finally {
			setLoading(false);
		}
	};

	const startOrLoadGame = useCallback(
		async (difficulty: string = 'medium') => {
			try {
				setLoading(true);
				setInitializing(true);
				setError(null);

				setGameTime(null);
				setScore(null);
				setCurrentDifficulty(difficulty);

				let gameData: MinesweeperGameState;

				if (gameId) {
					try {
						gameData = await minesweeperService.getGameState(gameId);
					} catch (err: any) {
						if (err.message && err.message.includes('404')) {
							gameData = await minesweeperService.startGame(difficulty);
							navigate(`/games/minesweeper?id=${gameData.gameId}`, {
								replace: true
							});
						} else {
							throw err;
						}
					}
				} else {
					gameData = await minesweeperService.startGame(difficulty);
					navigate(`/games/minesweeper?id=${gameData.gameId}`, {
						replace: true
					});
				}

				if (
					!gameData.board ||
					!Array.isArray(gameData.board) ||
					gameData.board.length === 0
				) {
					gameData = await minesweeperService.startGame(difficulty);
					navigate(`/games/minesweeper?id=${gameData.gameId}`, {
						replace: true
					});
				}

				setGame(gameData);
				setGameStatus(gameData.status);
				setMinesCount(gameData.minesRemaining || 0);

				const newBoard = createBoardFromGame(gameData);

				if (newBoard.length === 0) {
					throw new Error(
						'Failed to create game board. Please try again with a different difficulty.'
					);
				}

				setBoard(newBoard);
				setFlagsCount(countFlags(newBoard));

				if (gameData.status === 'won' && gameData.score) {
					setScore(gameData.score);

					if (gameData.startTime && gameData.endTime) {
						const time = calculateGameTime(
							gameData.startTime,
							gameData.endTime
						);
						setGameTime(time);
					}
				}
			} catch (err) {
				showError('Failed to start or load the game. Please try again.', false);
			} finally {
				setLoading(false);
				setInitializing(false);
			}
		},
		[gameId, navigate, createBoardFromGame]
	);

	useEffect(() => {
		startOrLoadGame();
	}, [startOrLoadGame]);

	useEffect(() => {
		if (game && game.difficulty) {
			setCurrentDifficulty(game.difficulty);
		}
	}, [game]);

	const handleCellClick = async (row: number, col: number) => {
		handleMoveResponse('reveal', row, col);
	};

	const handleCellRightClick = async (row: number, col: number) => {
		handleMoveResponse('flag', row, col);
	};

	const handleChordClick = async (row: number, col: number) => {
		handleMoveResponse('chord', row, col);
	};

	const handleNewGame = async (difficulty: string = currentDifficulty) => {
		if (loading) return;

		try {
			const gameData = await minesweeperService.startGame(difficulty);
			navigate(`/games/minesweeper?id=${gameData.gameId}`, { replace: true });
			updateGameState(gameData);
			setGameTime(null);
		} catch (err) {
			showError('Failed to start a new game. Please try again.', false);
		}
	};

	const submitGameScore = async (gameScore: number) => {
		if (!authService.isAuthenticated()) {
			return;
		}

		try {
			const result = await scoreService.submitScore('minesweeper', gameScore);
			if (!result.success && result.message) {
				showError(result.message);
			}
		} catch (err) {
			showError('Failed to submit your score to the leaderboard.');
		}
	};

	useEffect(() => {
		const handleContextMenu = (e: MouseEvent) => {
			if (gameAreaRef.current && e.target instanceof Node) {
				if (gameAreaRef.current.contains(e.target)) {
					e.preventDefault();
					return false;
				}
			}
		};

		document.addEventListener('contextmenu', handleContextMenu, true);

		return () => {
			document.removeEventListener('contextmenu', handleContextMenu, true);
		};
	}, []);

	const getBoardDimensions = () => {
		if (!board || board.length === 0) return { height: 0, width: 0 };

		const rows = board.length;
		const cols = rows > 0 ? board[0].length : 0;

		const { boardHeight, boardWidth } = getBoardDimensionsUtil(rows, cols);

		return { height: boardHeight, width: boardWidth };
	};

	return (
		<div
			className='flex flex-col items-center justify-center p-4'
			ref={gameAreaRef}>
			<h1 className='text-2xl font-bold mb-4 text-black'>Minesweeper</h1>

			{errorToast && (
				<div className='bg-red-500 text-white rounded-lg p-3 mb-4 fixed top-4 right-4 z-50 shadow-lg transition-opacity duration-300'>
					{errorToast}
				</div>
			)}

			<div className='bg-white shadow-lg rounded-lg p-4 w-full max-w-lg'>
				{error ? (
					<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
						<p>{error}</p>
						<button
							onClick={() => startOrLoadGame()}
							className='mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors'>
							Try Again
						</button>
					</div>
				) : (
					<>
						<div className='flex justify-between items-center mb-4'>
							<div className='flex items-center space-x-3'>
								<div className='bg-black text-white px-3 py-1 rounded-md text-sm font-semibold'>
									🚩 {flagsCount}/{minesCount}
								</div>
							</div>

							<div className='flex items-center space-x-2'>
								<select
									value={currentDifficulty}
									onChange={e => handleNewGame(e.target.value)}
									className='px-2 py-1 bg-black text-white rounded border border-gray-600'>
									<option value='easy'>Easy</option>
									<option value='medium'>Medium</option>
									<option value='hard'>Hard</option>
								</select>
								<button
									onClick={() => handleNewGame(currentDifficulty)}
									disabled={loading}
									className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50'>
									New Game
								</button>
							</div>
						</div>

						{initializing ? (
							<div className='text-center py-8'>
								<div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
								<p className='mt-2'>Starting Game...</p>
							</div>
						) : (
							<>
								{gameStatus !== 'playing' && (
									<div
										className={`mb-4 p-3 rounded-md text-center ${
											gameStatus === 'won'
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800'
										}`}>
										<h3 className='font-bold text-lg'>
											{gameStatus === 'won' ? 'You Won!' : 'Game Over!'}
										</h3>
										{gameStatus === 'won' && (
											<>
												{score !== null && (
													<p className='mt-1'>
														Your Score:{' '}
														<span className='font-bold'>{score}</span>
													</p>
												)}
												{gameTime !== null && (
													<p className='mt-1'>
														Time:{' '}
														<span className='font-bold'>
															{formatTime(gameTime)}
														</span>
													</p>
												)}
											</>
										)}
										<button
											onClick={() => handleNewGame()}
											className={`mt-2 px-4 py-2 text-white rounded ${
												gameStatus === 'won'
													? 'bg-green-500 hover:bg-green-600'
													: 'bg-red-500 hover:bg-red-600'
											}`}>
											Play Again
										</button>
									</div>
								)}

								<div className='relative'>
									<div
										className='flex justify-center'
										style={
											board.length
												? { minHeight: `${getBoardDimensions().height}px` }
												: {}
										}>
										{loading && (
											<div className='absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10'>
												<div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
											</div>
										)}

										<div className={loading ? 'opacity-30' : ''}>
											<MinesweeperBoard
												board={board}
												onCellClick={handleCellClick}
												onCellRightClick={handleCellRightClick}
												onChordClick={handleChordClick}
												disabled={gameStatus !== 'playing' || loading}
											/>
										</div>
									</div>
								</div>
							</>
						)}
					</>
				)}
			</div>

			<div className='mt-6 bg-white shadow rounded-lg p-4 w-full max-w-lg'>
				<h2 className='text-xl font-bold mb-2 text-black'>How to Play</h2>
				<ul className='list-disc list-inside space-y-2 text-black'>
					<li>Left-click to reveal a cell</li>
					<li>Right-click to place or remove a flag</li>
					<li>
						Left-click + right-click simultaneously on a revealed numbered cell
						to reveal all adjacent cells (if enough flags are placed)
					</li>
					<li>Reveal all cells without hitting a mine to win the game</li>
				</ul>
			</div>
		</div>
	);
};

export default MinesweeperGame;
