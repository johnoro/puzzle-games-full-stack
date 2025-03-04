class BaseGame {
	constructor() {
		this.startTime = new Date();
		this.endTime = null;
		this.status = 'active';
		this.moves = [];
	}

	recordMove(move, timestamp = new Date()) {
		this.moves.push({
			...move,
			timestamp
		});
		return this.moves.length;
	}

	endGame(status) {
		this.status = status;
		this.endTime = new Date();

		return {
			status: this.status,
			duration: this.getDuration(),
			moveCount: this.moves.length
		};
	}

	getDuration() {
		const end = this.endTime || new Date();
		return (end - this.startTime) / 1000;
	}

	calculateScore(params) {
		// specific games should override
		const { baseScore = 1000, timeMultiplier = 1 } = params;
		const duration = this.getDuration();

		return Math.max(Math.floor(baseScore - duration * timeMultiplier), 100);
	}

	validateMove(move) {
		return true;
	}

	getFullState() {
		return {
			status: this.status,
			startTime: this.startTime,
			endTime: this.endTime,
			moveCount: this.moves.length,
			duration: this.getDuration()
		};
	}

	getClientState() {
		return {
			status: this.status,
			startTime: this.startTime,
			endTime: this.endTime,
			moveCount: this.moves.length,
			duration: this.getDuration()
		};
	}
}

export default BaseGame;
