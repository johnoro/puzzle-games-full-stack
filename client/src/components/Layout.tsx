import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
	children: ReactNode;
}

interface NavLinkProps {
	to: string;
	children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	const { state, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/');
	};

	const NavLink = ({ to, children }: NavLinkProps) => (
		<Link
			to={to}
			className='bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors'>
			{children}
		</Link>
	);

	return (
		<div className='min-h-screen bg-gray-100'>
			<nav className='bg-blue-600 text-white shadow-md'>
				<div className='container mx-auto px-4 py-3 flex justify-between items-center'>
					<Link
						to='/'
						className='text-xl bg-black font-bold text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors'>
						🎉APGD🎉
					</Link>
					<div className='space-x-4'>
						<NavLink to='/'>Home</NavLink>
						<NavLink to='/games'>Games</NavLink>

						{state.isAuthenticated ? (
							<>
								<NavLink to='/scores'>Scores</NavLink>
								<button
									onClick={handleLogout}
									className='bg-black text-white px-3 py-1 rounded hover:bg-gray-800 transition-colors'>
									Logout
								</button>
							</>
						) : (
							<NavLink to='/login'>Login</NavLink>
						)}
					</div>
				</div>
			</nav>
			<main className='container mx-auto px-4 py-8'>{children}</main>
			<footer className='bg-gray-800 text-white py-6'>
				<div className='container mx-auto px-4 text-center'>
					<p>
						© {new Date().getFullYear()} A Puzzle Game Demo. No rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
