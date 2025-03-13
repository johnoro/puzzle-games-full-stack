import { apiService } from './api';
import { authService } from './authService';

export interface GameScore {
	id: string;
	game: {
		name: string;
	};
	score: number;
	date: string;
}

export interface PersonalBest {
	game: {
		name: string;
	};
	score: number;
	date: string;
}

export interface PersonalScoresResponse {
	success: boolean;
	scores?: GameScore[];
	personalBests?: PersonalBest[];
	message?: string;
}

export interface ApiResponse {
	success: boolean;
	message?: string;
}

const getAuthHeader = () => ({
	headers: {
		Authorization: `Bearer ${authService.getToken()}`
	}
});

export const scoreService = {
	async getPersonalScores(gameName?: string): Promise<PersonalScoresResponse> {
		try {
			const url = gameName
				? `/scores/personal?gameName=${gameName}`
				: '/scores/personal';

			return await apiService.get<PersonalScoresResponse>(url, getAuthHeader());
		} catch (error) {
			return {
				success: false,
				message: 'Failed to fetch personal scores'
			};
		}
	},

	async submitScore(gameName: string, score: number): Promise<ApiResponse> {
		try {
			await apiService.post('/scores', { gameName, score }, getAuthHeader());

			return { success: true };
		} catch (error) {
			return {
				success: false,
				message: 'Failed to submit score'
			};
		}
	}
};

export default scoreService;
