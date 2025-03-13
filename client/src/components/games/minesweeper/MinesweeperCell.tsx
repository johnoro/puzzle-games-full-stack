import React, { useState, useEffect } from 'react';
import { CellType } from '../../../types';

interface MinesweeperCellProps {
	cell: CellType;
	onCellClick: (row: number, col: number) => void;
	onCellRightClick: (row: number, col: number) => void;
	onChordClick?: (row: number, col: number) => void;
}

const CELL_COLORS = [
	'',
	'text-blue-700',
	'text-green-700',
	'text-red-700',
	'text-purple-800',
	'text-yellow-800',
	'text-cyan-800',
	'text-orange-800',
	'text-black'
];

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

const MinesweeperCell: React.FC<MinesweeperCellProps> = ({
	cell,
	onCellClick,
	onCellRightClick,
	onChordClick
}) => {
	const [leftButtonDown, setLeftButtonDown] = useState(false);
	const [rightButtonDown, setRightButtonDown] = useState(false);

	const isChordable = () =>
		cell.isRevealed && cell.neighborMines > 0 && onChordClick;

	const tryChordClick = () => {
		if (isChordable() && onChordClick) {
			onChordClick(cell.row, cell.col);
			return true;
		}
		return false;
	};

	const resetMouseState = () => {
		setLeftButtonDown(false);
		setRightButtonDown(false);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();

		if (e.button === LEFT_BUTTON) {
			setLeftButtonDown(true);

			if (rightButtonDown && tryChordClick()) {
				resetMouseState();
			}
		} else if (e.button === RIGHT_BUTTON) {
			setRightButtonDown(true);

			if (leftButtonDown && tryChordClick()) {
				resetMouseState();
			}
		}
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!leftButtonDown) {
			if (!cell.isRevealed) {
				onCellRightClick(cell.row, cell.col);
			}
		}
		return false;
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		e.preventDefault();

		if (e.button === 0) {
			if (rightButtonDown && tryChordClick()) {
			} else if (!cell.isRevealed && !cell.isFlagged) {
				onCellClick(cell.row, cell.col);
			}
			setLeftButtonDown(false);
		} else if (e.button === RIGHT_BUTTON) {
			if (leftButtonDown && tryChordClick()) {
			}
			setRightButtonDown(false);
		}
	};

	useEffect(() => {
		const handleGlobalMouseUp = () => {
			resetMouseState();
		};

		window.addEventListener('mouseup', handleGlobalMouseUp);

		return () => {
			window.removeEventListener('mouseup', handleGlobalMouseUp);
			resetMouseState();
		};
	}, []);

	const getCellContent = () => {
		if (cell.isFlagged) return '🚩';
		if (!cell.isRevealed) return '';
		if (cell.isMine) return '💣';
		return cell.neighborMines === 0 ? '' : cell.neighborMines;
	};

	const getCellStyles = () => {
		const styles = {
			bgColor: 'bg-blue-200 hover:bg-blue-300',
			textColor: '',
			border: 'border-blue-400',
			elevation: 'shadow',
			animation: '',
			chordHighlight: '',
			emptyCellStyle: '',
			fontWeight: '',
			cursor:
				'cursor-pointer shadow hover:shadow-md active:shadow-inner hover:scale-105 active:scale-95'
		};

		if (!cell.isRevealed) {
			if (cell.isFlagged) {
				styles.bgColor = 'bg-blue-300 hover:bg-blue-400';
				styles.cursor =
					'cursor-pointer shadow hover:shadow-md active:shadow-inner hover:opacity-80 active:scale-95';
			}
			return styles;
		}

		styles.animation = 'transform transition-all duration-200 scale-95';

		if (cell.isMine) {
			styles.bgColor = 'bg-red-500';
			return styles;
		}

		styles.bgColor = cell.neighborMines > 0 ? 'bg-white' : 'bg-gray-50';
		styles.border =
			cell.neighborMines === 0 ? 'border-gray-200' : 'border-gray-300';
		styles.elevation = cell.neighborMines === 0 ? 'shadow-inner' : '';
		styles.cursor =
			cell.neighborMines > 0
				? 'cursor-pointer animate-reveal'
				: 'cursor-default animate-reveal';

		if (cell.neighborMines === 0) {
			styles.emptyCellStyle = 'bg-pattern-dots bg-dot-sm';
		} else {
			styles.textColor = CELL_COLORS[cell.neighborMines] || 'text-black';
			styles.fontWeight = 'font-bold';
			styles.chordHighlight = 'hover:ring-2 hover:ring-blue-300';
		}

		return styles;
	};

	const {
		bgColor,
		textColor,
		border,
		elevation,
		animation,
		chordHighlight,
		emptyCellStyle,
		fontWeight,
		cursor
	} = getCellStyles();

	const cellStyle =
		cell.isRevealed && cell.neighborMines === 0
			? {
					boxShadow: 'inset 0 0 3px rgba(0, 0, 0, 0.2)',
					borderStyle: 'solid',
					background:
						'repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02) 4px, rgba(0, 0, 0, 0.01) 4px, rgba(0, 0, 0, 0.01) 8px)'
			  }
			: {};

	const getAriaLabel = () => {
		let label = `Cell at row ${cell.row}, column ${cell.col}`;
		if (cell.isFlagged) label += ', flagged';
		if (cell.isRevealed && cell.neighborMines > 0) {
			label += `, has ${cell.neighborMines} neighboring mines`;
		}
		return label;
	};

	return (
		<button
			className={`
				w-9 h-9 flex items-center justify-center 
				border-2 font-bold text-lg
				transition-all duration-300 ease-in-out
				${bgColor}
				${textColor}
				${border}
				${animation}
				${fontWeight}
				${chordHighlight}
				${emptyCellStyle}
				${elevation}
				${cursor}
			`}
			style={cellStyle}
			onMouseDown={handleMouseDown}
			onMouseUp={handleMouseUp}
			onContextMenu={handleContextMenu}
			onMouseLeave={resetMouseState}
			aria-label={getAriaLabel()}>
			{getCellContent()}
		</button>
	);
};

export default MinesweeperCell;
