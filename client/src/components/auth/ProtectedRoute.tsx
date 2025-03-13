import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
	children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { state } = useAuth();

	if (state.loading) {
		return (
			<div className='flex items-center justify-center h-screen'>
				<div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
			</div>
		);
	}

	if (!state.isAuthenticated) {
		return (
			<Navigate
				to='/login'
				replace
			/>
		);
	}

	return <>{children}</>;
};

export default ProtectedRoute;
