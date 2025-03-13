import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';

import './index.css';

import Games from './pages/Games.tsx';
import PersonalScores from './pages/PersonalScores.tsx';
import MinesweeperGame from './pages/MinesweeperGame.tsx';
import Auth from './pages/Auth.tsx';

import Layout from './components/Layout.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';

import { AuthProvider } from './context/AuthContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<Layout>
					<Routes>
						<Route
							path='/'
							element={<App />}
						/>
						<Route
							path='/games'
							element={<Games />}
						/>
						<Route
							path='/scores'
							element={
								<ProtectedRoute>
									<PersonalScores />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/games/minesweeper'
							element={
								<ProtectedRoute>
									<MinesweeperGame />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/login'
							element={<Auth />}
						/>
						<Route
							path='/signup'
							element={<Auth isSignUp={true} />}
						/>
					</Routes>
				</Layout>
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>
);
