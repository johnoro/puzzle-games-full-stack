import { Link } from 'react-router-dom';

const GameCard = ({
	emoji,
	title,
	description,
	link,
	linkText
}: {
	emoji: string;
	title: string;
	description: string;
	link: string;
	linkText: string;
}) => {
	let divClassName =
		'bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow';
	if (link === 'tba') {
		divClassName += ' opacity-50';
	}

	return (
		<div className={divClassName}>
			<div className='h-48 bg-gray-200 flex items-center justify-center'>
				<span className='text-5xl'>{emoji}</span>
			</div>
			<div className='p-6'>
				<h3 className='text-xl font-semibold mb-2'>{title}</h3>
				<p className='text-gray-600 mb-4'>{description}</p>
				{link === 'tba' ? (
					<span className='text-gray-500 font-medium'>{linkText}</span>
				) : (
					<Link
						to={`/games/${link}`}
						className='text-blue-600 hover:text-blue-800 font-medium'>
						{linkText}
					</Link>
				)}
			</div>
		</div>
	);
};

export default GameCard;
