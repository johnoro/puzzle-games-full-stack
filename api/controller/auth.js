import User from '../model/User.js';

export const register = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		const existingUser = await User.findOne({ $or: [{ username }, { email }] });
		if (existingUser) {
			return res.status(500).json({ message: 'Server error' });
		}

		const user = await User.create({ username, email, password });
		const token = user.createJwt();
		res.status(201).json({ user: { name: user.name }, token });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		if (!user) return res.status(400).json({ message: 'Invalid credentials' });

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch)
			return res.status(400).json({ message: 'Invalid credentials' });

		const token = jwt.sign(
			{ id: user._id, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		);
		res.json({ token });
	} catch (err) {
		res.status(500).json({ message: 'Server error' });
	}
};
