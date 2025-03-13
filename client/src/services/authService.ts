import { apiService } from './api';
import { User } from '../types';

interface LoginResponse {
	success: boolean;
	user?: User;
	token?: string;
	error?: string;
}

interface RegisterResponse {
	success: boolean;
	user?: User;
	token?: string;
	error?: string;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const authService = {
	async login(email: string, password: string): Promise<User> {
		const response = await apiService.post<LoginResponse>('/auth/login', {
			email,
			password
		});

		if (response.success && response.user && response.token) {
			localStorage.setItem(TOKEN_KEY, response.token);
			localStorage.setItem(USER_KEY, JSON.stringify(response.user));
			return response.user;
		} else {
			throw new Error(response.error || 'Login failed');
		}
	},

	async register(
		username: string,
		email: string,
		password: string
	): Promise<User> {
		const response = await apiService.post<RegisterResponse>('/auth/register', {
			username,
			email,
			password
		});

		if (response.success && response.user && response.token) {
			localStorage.setItem(TOKEN_KEY, response.token);
			localStorage.setItem(USER_KEY, JSON.stringify(response.user));
			return response.user;
		} else {
			throw new Error(response.error || 'Registration failed');
		}
	},

	logout(): void {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
	},

	getCurrentUser(): User | null {
		const userStr = localStorage.getItem(USER_KEY);
		if (userStr) {
			try {
				return JSON.parse(userStr) as User;
			} catch (error) {
				return null;
			}
		}
		return null;
	},

	isAuthenticated(): boolean {
		return !!localStorage.getItem(TOKEN_KEY);
	},

	getToken(): string | null {
		return localStorage.getItem(TOKEN_KEY);
	}
};

export default authService;
