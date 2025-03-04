import MinesweeperGame from './minesweeper/Game.js';

class GameFactory {
	static createGame(gameType, options = {}) {
		switch (gameType.toLowerCase()) {
			case 'minesweeper':
				return new MinesweeperGame(options);
			default:
				throw new Error(`Unsupported game type: ${gameType}`);
		}
	}

	static getAvailableGames() {
		return [
			{
				id: 'minesweeper',
				name: 'Minesweeper',
				description: 'Clear a minefield without detonating any mines',
				difficulties: ['easy', 'medium', 'hard']
			}
		];
	}

	static isGameSupported(gameType) {
		const supportedGames = GameFactory.getAvailableGames().map(game => game.id);
		return supportedGames.includes(gameType.toLowerCase());
	}
}

export default GameFactory;
