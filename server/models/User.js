const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true, lowercase: true, trim: true },
	passwordHash: { type: String, required: true },
	role: { type: String, enum: ['admin', 'secretary', 'home_service_user', 'farwaniya1_user', 'farwaniya2_user'], required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ username: 1 }, { unique: true });

userSchema.pre('save', function(next) {
	this.updatedAt = Date.now();
	next();
});

module.exports = mongoose.model('User', userSchema);


