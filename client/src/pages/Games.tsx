import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import gameService from '../services/gameService';
import { Game } from '../types';
import capitalize from '../utils/capitalize';

interface ExtendedGame extends Game {
	difficulties: string[];
}

const GameCard: React.FC<{ game: ExtendedGame }> = ({ game }) => {
	const getGameRoute = () => {
		if (
			game.id === 'minesweeper' ||
			game.name.toLowerCase() === 'minesweeper'
		) {
			return '/games/minesweeper';
		}
		return `/games/${game.route || game.id || game.name.toLowerCase()}`;
	};

	return (
		<div className='bg-white shadow-md rounded-lg overflow-hidden transition-transform hover:scale-105'>
			<div className='p-6'>
				<h3 className='text-xl font-bold text-gray-800 mb-2'>{game.name}</h3>
				<p className='text-gray-600 mb-4'>{game.description}</p>

				<div className='mb-4'>
					<p className='text-sm font-medium text-gray-700 mb-1'>
						Difficulty Levels:
					</p>
					<div className='flex flex-wrap gap-2'>
						{game.difficulties.map(difficulty => (
							<span
								key={difficulty}
								className={`px-2 py-1 text-xs font-medium rounded-full ${
									difficulty === 'easy'
										? 'bg-green-100 text-green-800'
										: difficulty === 'medium'
										? 'bg-yellow-100 text-yellow-800'
										: 'bg-red-100 text-red-800'
								}`}>
								{capitalize(difficulty)}
							</span>
						))}
					</div>
				</div>

				<Link
					to={getGameRoute()}
					className='block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded'>
					Play Now
				</Link>
			</div>
		</div>
	);
};

const Games: React.FC = () => {
	const [games, setGames] = useState<ExtendedGame[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchGames = async () => {
			try {
				setLoading(true);
				const response = await gameService.getAvailableGames();

				const gamesWithDifficulties = await Promise.all(
					response.map(async game => {
						try {
							const metadata = await gameService.getGameMetadata(
								game.id ?? game.route ?? ''
							);
							return {
								...game,
								difficulties: metadata.difficulties || [
									'easy',
									'medium',
									'hard'
								]
							} as ExtendedGame;
						} catch (error) {
							console.error(`Error fetching metadata for ${game.name}:`, error);
							return {
								...game,
								difficulties: ['easy', 'medium', 'hard']
							} as ExtendedGame;
						}
					})
				);

				setGames(gamesWithDifficulties);
				setError(null);
			} catch (err) {
				setError('Failed to load games. Please try again later.');
				console.error('Error fetching games:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchGames();
	}, []);

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
				<p>{error}</p>
			</div>
		);
	}

	if (games.length === 0) {
		return (
			<div className='text-center p-8'>
				<h2 className='text-2xl font-bold text-gray-800 mb-4'>
					No Games Available
				</h2>
				<p className='text-gray-600'>Check back soon for new games!</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className='text-3xl font-bold text-gray-800 mb-8'>Available Games</h1>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{games.map(game => (
					<GameCard
						key={game._id}
						game={game}
					/>
				))}
			</div>
		</div>
	);
};

export default Games;
