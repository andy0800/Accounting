const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Auth middleware
function requireAuth(req, res, next) {
	const hdr = req.headers.authorization || '';
	const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
	if (!token) return res.status(401).json({ message: 'غير مصرح' });
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
		req.user = payload;
		next();
	} catch (e) {
		return res.status(401).json({ message: 'جلسة غير صالحة' });
	}
}

function requireAdmin(req, res, next) {
	if (req.user?.role !== 'admin') return res.status(403).json({ message: 'صلاحيات غير كافية' });
	next();
}

// List users (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
	const users = await User.find().select('username role createdAt');
	res.json({ users });
});

// Create user (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
	try {
		const { username, password, role } = req.body;
		if (!username || !password || !role) return res.status(400).json({ message: 'حقول مفقودة' });
		const allowedRoles = ['admin', 'secretary', 'home_service_user', 'farwaniya1_user', 'farwaniya2_user'];
		if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'دور غير صالح' });
		const exists = await User.findOne({ username: username.toLowerCase() });
		if (exists) return res.status(400).json({ message: 'اسم المستخدم مستخدم بالفعل' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = new User({ username: username.toLowerCase(), passwordHash, role });
		await user.save();
		res.status(201).json({ username: user.username, role: user.role });
	} catch (e) {
		res.status(400).json({ message: e.message });
	}
});

module.exports = router;


