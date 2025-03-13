import { apiService } from './api';
import { Game, GameMetadata } from '../types';

interface ApiGame {
	id?: string;
	_id?: string;
	name: string;
	description: string;
	route?: string;
	difficulties?: string[];
}

interface GamesResponse {
	success: boolean;
	games?: ApiGame[];
	error?: string;
}

interface GameMetadataResponse {
	success: boolean;
	game?: GameMetadata;
	error?: string;
}

interface UserStatsResponse {
	success: boolean;
	stats?: any;
	error?: string;
}

export const gameService = {
	async getAvailableGames(): Promise<Game[]> {
		const response = await apiService.get<GamesResponse>('/games');

		if (response.success && response.games) {
			return response.games.map(game => ({
				_id: game._id || game.id || game.name,
				route: game.route || game.id || game.name.toLowerCase(),
				name: game.name,
				description: game.description
			}));
		} else {
			throw new Error(response.error || 'Failed to fetch games');
		}
	},

	async getGameMetadata(gameType: string): Promise<GameMetadata> {
		const response = await apiService.get<GameMetadataResponse>(
			`/games/metadata/${gameType}`
		);

		if (response.success && response.game) {
			return response.game;
		} else {
			throw new Error(response.error || 'Failed to fetch game metadata');
		}
	},

	async getUserStats(gameType: string): Promise<any> {
		const response = await apiService.get<UserStatsResponse>(
			`/games/stats/${gameType}`
		);

		if (response.success && response.stats) {
			return response.stats;
		} else {
			throw new Error(response.error || 'Failed to fetch user stats');
		}
	}
};

export default gameService;
