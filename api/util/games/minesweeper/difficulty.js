const difficultyMap = {
	easy: { rows: 9, cols: 9, mines: 10, baseScore: 1000 },
	medium: { rows: 16, cols: 16, mines: 40, baseScore: 3000 },
	hard: { rows: 30, cols: 16, mines: 99, baseScore: 5000 }
};

export default difficultyMap;
