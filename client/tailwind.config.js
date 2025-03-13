/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			animation: {
				reveal: 'reveal 0.3s ease-in-out',
				'fade-in': 'fadeIn 0.3s ease-in-out'
			},
			keyframes: {
				reveal: {
					'0%': { transform: 'scale(1.1)', opacity: '0.7' },
					'50%': { transform: 'scale(0.9)', opacity: '0.9' },
					'100%': { transform: 'scale(0.95)', opacity: '1' }
				},
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(-10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			backgroundImage: {
				'pattern-dots':
					'radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)'
			},
			backgroundSize: {
				'dot-sm': '8px 8px'
			}
		}
	},
	plugins: []
};
