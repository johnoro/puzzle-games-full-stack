import React from 'react';
import MinesweeperCell from './MinesweeperCell';
import { CellType } from '../../../types';
import { getBoardDimensions } from '../../../utils/minesweeper';

interface MinesweeperBoardProps {
	board: CellType[][];
	onCellClick: (row: number, col: number) => void;
	onCellRightClick: (row: number, col: number) => void;
	onChordClick?: (row: number, col: number) => void;
	disabled?: boolean;
}

const MinesweeperBoard: React.FC<MinesweeperBoardProps> = ({
	board,
	onCellClick,
	onCellRightClick,
	onChordClick,
	disabled = false
}) => {
	const handleCellClick = (row: number, col: number) => {
		if (!disabled) {
			onCellClick(row, col);
		}
	};

	const handleCellRightClick = (row: number, col: number) => {
		if (!disabled) {
			onCellRightClick(row, col);
		}
	};

	const handleChordClick = (row: number, col: number) => {
		if (!disabled && onChordClick) {
			onChordClick(row, col);
		}
	};

	const preventContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		return false;
	};

	const rows = board.length;
	const cols = rows > 0 ? board[0].length : 0;

	const { boardHeight, boardWidth } = getBoardDimensions(rows, cols);

	return (
		<div
			className={`bg-gray-100 p-4 rounded-lg shadow-md inline-block ${
				disabled ? 'opacity-90' : ''
			}`}
			style={{
				minHeight: `${boardHeight}px`,
				minWidth: `${boardWidth}px`
			}}
			onContextMenu={preventContextMenu}>
			<div
				className='grid gap-0'
				onContextMenu={preventContextMenu}>
				{board.map((row, rowIndex) => (
					<div
						key={rowIndex}
						className='flex'
						onContextMenu={preventContextMenu}>
						{row.map(cell => (
							<MinesweeperCell
								key={`${cell.row}-${cell.col}`}
								cell={cell}
								onCellClick={handleCellClick}
								onCellRightClick={handleCellRightClick}
								onChordClick={handleChordClick}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default MinesweeperBoard;
