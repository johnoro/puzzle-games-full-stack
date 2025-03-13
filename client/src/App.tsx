import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GameCard from './components/GameCard';

function App() {
	const { state } = useAuth();

	return (
		<div className='min-h-screen flex flex-col'>
			<div className='flex-grow'>
				<section className='bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20'>
					<div className='container mx-auto text-center px-4'>
						<h1 className='text-4xl md:text-6xl font-bold mb-6 flex flex-col items-center'>
							<span>Welcome to</span>
							<span className='text-5xl'>🎉 A Puzzle Game Demo 🎉</span>
						</h1>
						<p className='text-xl md:text-2xl mb-10'>
							Challenge your mind, solve puzzles, and enjoy the demo!
						</p>
						<div className='flex flex-col sm:flex-row justify-center gap-4'>
							<Link
								to='/games'
								className='bg-white text-blue-700 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg shadow-md transition-colors'>
								Explore Games
							</Link>
							{!state.isAuthenticated && (
								<Link
									to='/login'
									className='bg-transparent hover:bg-blue-700 text-white border border-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors'>
									Sign In
								</Link>
							)}
						</div>
					</div>
				</section>

				<section className='py-16 bg-gray-50'>
					<div className='container mx-auto px-4'>
						<h2 className='text-3xl font-bold text-center mb-12'>
							Featured Games
						</h2>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
							<GameCard
								emoji='💣'
								title='Minesweeper'
								description='Clear mines without clicking any bombs. Right click to flag, left click to reveal a cell, and click both simultaneously on a revealed cell to reveal solved cells through your already flagged cells.'
								link='minesweeper'
								linkText='Play Now →'
							/>

							<GameCard
								emoji='🚧'
								title='N/A'
								description='Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero, cumque. Officiis, sint.'
								link='tba'
								linkText='Coming Soon'
							/>

							<GameCard
								emoji='🚧'
								title='N/A'
								description='Placeat quibusdam aut nesciunt, dignissimos
										magnam perspiciatis aliquid pariatur ullam in corporis,
										possimus aspernatur nemo autem fugit blanditiis.'
								link='tba'
								linkText='Coming Soon'
							/>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default App;
