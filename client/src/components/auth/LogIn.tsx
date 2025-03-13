import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

const LogIn: React.FC = () => {
	const { login, state, clearError } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [formError, setFormError] = useState<string | null>(null);

	const validateForm = (): boolean => {
		clearError();
		setFormError(null);

		if (!email || !password) {
			setFormError('Email and password are required');
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		await login(email, password);
	};

	return (
		<div className='w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md'>
			<h2 className='text-2xl font-bold mb-6 text-center'>Log In</h2>

			{(formError || state.error) && (
				<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
					{formError || state.error}
				</div>
			)}

			<form
				onSubmit={handleSubmit}
				className='space-y-4'>
				<div>
					<label
						htmlFor='email'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Email
					</label>
					<input
						id='email'
						type='email'
						value={email}
						onChange={e => setEmail(e.target.value)}
						className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						disabled={state.loading}
					/>
				</div>

				<div>
					<label
						htmlFor='password'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Password
					</label>
					<input
						id='password'
						type='password'
						value={password}
						onChange={e => setPassword(e.target.value)}
						className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						disabled={state.loading}
					/>
				</div>

				<button
					type='submit'
					disabled={state.loading}
					className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'>
					{state.loading ? 'Logging in...' : 'Log In'}
				</button>
			</form>
		</div>
	);
};

export default LogIn;
