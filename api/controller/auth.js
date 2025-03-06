import User from '../model/User.js';

export const register = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		const existingUser = await User.findOne({ $or: [{ username }, { email }] });
		if (existingUser) {
			return res
				.status(400)
				.json({ success: false, message: 'User already exists' });
		}

		const user = await User.create({ username, email, password });
		const token = user.createJwt();
		res
			.status(201)
			.json({ success: true, user: { name: user.username }, token });
	} catch (err) {
		console.error('Error during registration:', err);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const login = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		const user = await User.findOne({ $or: [{ username }, { email }] });
		if (!user) return res.status(400).json({ message: 'Invalid credentials' });

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(400).json({
				message: 'Invalid credentials'
			});
		}

		const token = user.createJwt();
		res.json({ success: true, user: { name: user.username }, token });
	} catch (err) {
		console.error('Error during login:', err);
		res.status(500).json({ message: 'Server error' });
	}
};
