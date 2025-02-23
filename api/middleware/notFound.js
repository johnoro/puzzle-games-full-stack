export default (req, res) => {
	res.status(404).json({ message: `That page (${req.url}) was not found.` });
};
