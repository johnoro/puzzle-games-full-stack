import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { User, AuthState } from '../types';
import authService from '../services/authService';
import { apiService } from '../services/api';

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	loading: false,
	error: null
};

type AuthAction =
	| { type: 'LOGIN_REQUEST' }
	| { type: 'LOGIN_SUCCESS'; payload: User }
	| { type: 'LOGIN_FAILURE'; payload: string }
	| { type: 'SIGNUP_REQUEST' }
	| { type: 'SIGNUP_SUCCESS'; payload: User }
	| { type: 'SIGNUP_FAILURE'; payload: string }
	| { type: 'LOGOUT' }
	| { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case 'LOGIN_REQUEST':
		case 'SIGNUP_REQUEST':
			return {
				...state,
				loading: true,
				error: null
			};
		case 'LOGIN_SUCCESS':
		case 'SIGNUP_SUCCESS':
			return {
				...state,
				user: action.payload,
				isAuthenticated: true,
				loading: false,
				error: null
			};
		case 'LOGIN_FAILURE':
		case 'SIGNUP_FAILURE':
			return {
				...state,
				loading: false,
				error: action.payload
			};
		case 'LOGOUT':
			return {
				...initialState
			};
		case 'CLEAR_ERROR':
			return {
				...state,
				error: null
			};
		default:
			return state;
	}
};

type AuthContextType = {
	state: AuthState;
	login: (email: string, password: string) => Promise<void>;
	signup: (username: string, email: string, password: string) => Promise<void>;
	logout: () => void;
	clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children
}) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	useEffect(() => {
		const initApp = async () => {
			try {
				await apiService.fetchCsrfToken();
			} catch (error) {
				console.error('Failed to initialize CSRF token:', error);
			}

			const user = authService.getCurrentUser();
			if (user) {
				dispatch({ type: 'LOGIN_SUCCESS', payload: user });
			}
		};

		initApp();
	}, []);

	const handleAuthError = (
		error: unknown,
		failureType: 'LOGIN_FAILURE' | 'SIGNUP_FAILURE'
	) => {
		const errorMessage =
			error instanceof Error
				? error.message
				: `${failureType === 'LOGIN_FAILURE' ? 'Login' : 'Signup'} failed`;
		dispatch({ type: failureType, payload: errorMessage });
	};

	const performAuthAction = async <T extends unknown[]>(
		requestType: 'LOGIN_REQUEST' | 'SIGNUP_REQUEST',
		failureType: 'LOGIN_FAILURE' | 'SIGNUP_FAILURE',
		authMethod: (...args: T) => Promise<User>,
		...args: T
	) => {
		dispatch({ type: requestType });

		try {
			const user = await authMethod(...args);
			dispatch({
				type:
					requestType === 'LOGIN_REQUEST' ? 'LOGIN_SUCCESS' : 'SIGNUP_SUCCESS',
				payload: user
			});
		} catch (error) {
			handleAuthError(error, failureType);
		}
	};

	const login = async (email: string, password: string) => {
		await performAuthAction(
			'LOGIN_REQUEST',
			'LOGIN_FAILURE',
			authService.login.bind(authService),
			email,
			password
		);
	};

	const signup = async (username: string, email: string, password: string) => {
		await performAuthAction(
			'SIGNUP_REQUEST',
			'SIGNUP_FAILURE',
			authService.register.bind(authService),
			username,
			email,
			password
		);
	};

	const logout = () => {
		authService.logout();
		dispatch({ type: 'LOGOUT' });
	};

	const clearError = () => {
		dispatch({ type: 'CLEAR_ERROR' });
	};

	return (
		<AuthContext.Provider value={{ state, login, signup, logout, clearError }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}

	return context;
};
