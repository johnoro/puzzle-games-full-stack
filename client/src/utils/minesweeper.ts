const width = 9;
const height = 9;
const cellSize = width * 2 + height * 2;
const padding = 32;

export const getBoardDimensions = (rows: number, cols: number) => {
	return {
		boardHeight: rows * cellSize + padding,
		boardWidth: cols * cellSize + padding
	};
};
