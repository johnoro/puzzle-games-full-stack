import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import LogIn from '../components/auth/LogIn';
import SignUp from '../components/auth/SignUp';
import { useAuth } from '../context/AuthContext';

interface AuthProps {
	isSignUp?: boolean;
}

const Auth: React.FC<AuthProps> = ({ isSignUp = false }) => {
	const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
		isSignUp ? 'signup' : 'login'
	);
	const { state } = useAuth();

	if (state.isAuthenticated) {
		return (
			<Navigate
				to='/games'
				replace
			/>
		);
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50'>
			<div className='w-full max-w-md mx-auto'>
				<div className='flex mb-4'>
					<button
						className={`w-1/2 py-2 font-medium text-center ${
							activeTab === 'login'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500 hover:text-gray-700'
						}`}
						onClick={() => setActiveTab('login')}>
						Log In
					</button>
					<button
						className={`w-1/2 py-2 font-medium text-center ${
							activeTab === 'signup'
								? 'text-blue-600 border-b-2 border-blue-600'
								: 'text-gray-500 hover:text-gray-700'
						}`}
						onClick={() => setActiveTab('signup')}>
						Sign Up
					</button>
				</div>

				{activeTab === 'login' ? <LogIn /> : <SignUp />}
			</div>
		</div>
	);
};

export default Auth;
