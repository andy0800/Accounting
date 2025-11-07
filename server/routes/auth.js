const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

// Helper: sign JWT
function signToken(payload) {
	const secret = process.env.JWT_SECRET || 'dev_secret';
	return jwt.sign(payload, secret, { expiresIn: '12h' });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور مطلوبة' });
		}

		// Hardcoded admin
		if (username.toLowerCase() === 'admin' && password === 'Aa@09876') {
			const token = signToken({ sub: 'admin', role: 'admin', username: 'admin' });
			return res.json({ token, role: 'admin', username: 'admin' });
		}

		// DB users (e.g., secretaries or additional admins)
		const user = await User.findOne({ username: username.toLowerCase() });
		if (!user) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });

		const token = signToken({ sub: user._id.toString(), role: user.role, username: user.username });
		res.json({ token, role: user.role, username: user.username });
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
});

module.exports = router;


