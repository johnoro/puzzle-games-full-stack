import React, { useState, useEffect } from 'react';
import { Game } from '../types';
import scoreService, {
	GameScore,
	PersonalBest
} from '../services/scoreService';
import { useAuth } from '../context/AuthContext';
import gameService from '../services/gameService';

const PersonalScores: React.FC = () => {
	const { state } = useAuth();
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [games, setGames] = useState<Game[]>([]);
	const [selectedGame, setSelectedGame] = useState<string>('all');
	const [scores, setScores] = useState<GameScore[]>([]);
	const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);

	useEffect(() => {
		const fetchGames = async () => {
			try {
				const gamesData = await gameService.getAvailableGames();
				setGames(gamesData);
			} catch (err) {
				console.error('Error fetching games:', err);
				setError('Failed to load games. Please try again later.');
			}
		};

		fetchGames();
	}, []);

	useEffect(() => {
		const fetchPersonalScores = async () => {
			setLoading(true);
			setError(null);

			try {
				const gameName = selectedGame === 'all' ? undefined : selectedGame;
				const response = await scoreService.getPersonalScores(gameName);

				if (response.success) {
					setScores(response.scores || []);
					setPersonalBests(response.personalBests || []);
				} else {
					setError(response.message || 'Failed to load scores');
				}
			} catch (err) {
				console.error('Error loading personal scores:', err);
				setError('An error occurred while loading your scores');
			} finally {
				setLoading(false);
			}
		};

		if (state.isAuthenticated) {
			fetchPersonalScores();
		}
	}, [selectedGame, state.isAuthenticated]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
	};

	if (!state.isAuthenticated) {
		return (
			<div className='max-w-4xl mx-auto p-6'>
				<h1 className='text-3xl font-bold text-gray-800 mb-6'>
					Personal Scores
				</h1>
				<div className='bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4'>
					<p>Please log in to view your personal scores.</p>
				</div>
			</div>
		);
	}

	return (
		<div className='max-w-4xl mx-auto p-6'>
			<h1 className='text-3xl font-bold text-gray-800 mb-6'>Personal Scores</h1>

			<div className='mb-6'>
				<label
					htmlFor='game-filter'
					className='block text-sm font-medium text-gray-700 mb-2'>
					Filter by game:
				</label>
				<select
					id='game-filter'
					value={selectedGame}
					onChange={e => setSelectedGame(e.target.value)}
					className='w-full md:w-auto text-gray-700 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'>
					<option value='all'>All games</option>
					{games.map(game => (
						<option
							key={game._id}
							value={game.name.toLowerCase()}>
							{game.name}
						</option>
					))}
				</select>
			</div>

			<div className='mb-8'>
				<h2 className='text-2xl font-bold text-gray-700 mb-4'>
					Personal Bests
				</h2>

				{loading ? (
					<div className='flex justify-center p-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
					</div>
				) : error ? (
					<div className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4'>
						<p>{error}</p>
					</div>
				) : personalBests.length === 0 ? (
					<div className='bg-gray-100 text-gray-700 p-4 rounded-md'>
						<p>
							No personal bests recorded yet. Play some games to set records!
						</p>
					</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden'>
							<thead className='bg-gray-50'>
								<tr>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Game
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Best Score
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Date
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{personalBests.map((best, index) => (
									<tr
										key={index}
										className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
											{best.game.name}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{best.score}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{formatDate(best.date)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div>
				<h2 className='text-2xl font-bold text-gray-700 mb-4'>Recent Scores</h2>

				{loading ? (
					<div className='flex justify-center p-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
					</div>
				) : error ? (
					<div className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4'>
						<p>{error}</p>
					</div>
				) : scores.length === 0 ? (
					<div className='bg-gray-100 text-gray-700 p-4 rounded-md'>
						<p>No scores recorded yet. Play some games first!</p>
					</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden'>
							<thead className='bg-gray-50'>
								<tr>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Game
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Score
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Date
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{scores.map(score => (
									<tr
										key={score.id}
										className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
											{score.game.name}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{score.score}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{formatDate(score.date)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default PersonalScores;
