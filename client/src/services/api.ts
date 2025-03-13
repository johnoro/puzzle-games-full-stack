import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
	baseURL: `${API_URL}/api`,
	headers: {
		'Content-Type': 'application/json'
	},
	withCredentials: true
});

let csrfToken: string | null = null;

const fetchCsrfToken = async (): Promise<string> => {
	try {
		if (csrfToken) return csrfToken;

		const response = await api.get('/auth/csrf-token');
		const newToken = response.data.csrfToken;
		if (!newToken) {
			throw new Error('No CSRF token received from server');
		}
		csrfToken = newToken;
		return newToken;
	} catch (error) {
		console.error('Failed to fetch CSRF token:', error);
		throw error;
	}
};

api.interceptors.request.use(
	async config => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		if (
			config.method &&
			['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())
		) {
			try {
				const token = await fetchCsrfToken();
				config.headers['csrf-token'] = token;

				if (config.data && typeof config.data === 'object') {
					config.data = { ...config.data, _csrf: token };
				} else if (!config.data) {
					config.data = { _csrf: token };
				}
			} catch (err) {
				console.error('Error adding CSRF token to request:', err);
			}
		}

		return config;
	},
	error => Promise.reject(error)
);

api.interceptors.response.use(
	response => response,
	error => Promise.reject(error)
);

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export const apiService = {
	fetchCsrfToken,
	refreshCsrfToken: async (): Promise<string> => {
		csrfToken = null;
		return fetchCsrfToken();
	},

	async request<T>(
		method: HttpMethod,
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<T> {
		try {
			let response: AxiosResponse<T>;

			switch (method) {
				case 'get':
				case 'delete':
					response = await api[method](url, config);
					break;
				case 'post':
				case 'put':
					response = await api[method](url, data, config);
					break;
				default:
					throw new Error(`Unsupported HTTP method: ${method}`);
			}

			return response.data;
		} catch (error) {
			throw error;
		}
	},

	async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>('get', url, undefined, config);
	},

	async post<T>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<T> {
		return this.request<T>('post', url, data, config);
	},

	async put<T>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<T> {
		return this.request<T>('put', url, data, config);
	},

	async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		return this.request<T>('delete', url, undefined, config);
	}
};

export default api;
