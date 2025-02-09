import jwt from 'jsonwebtoken';

export default async (req, res, next) => {
	const { authorization } = req.headers;
	if (!authorization?.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Unauthorized' });
	}

	const token = authorization.split(' ')[1];
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { userId: payload.userId, name: payload.name };
		next();
	} catch (err) {
		res.status(401).json({ message: 'Invalid token' });
	}
};
