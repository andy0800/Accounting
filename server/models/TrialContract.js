const mongoose = require('mongoose');

const linkedVisaSnapshotSchema = new mongoose.Schema({
	visaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visa', required: true },
	name: { type: String, required: true },
	passportNumber: { type: String, required: true },
	visaNumber: { type: String, required: true },
	nationality: { type: String, required: true }
}, { _id: false });

const addressSchema = new mongoose.Schema({
	area: { type: String, required: [true, 'المنطقة مطلوبة'] },
	block: { type: String, required: [true, 'القطعة مطلوبة'] },
	street: { type: String, required: [true, 'الشارع مطلوب'] },
	house: { type: String, required: [true, 'رقم المنزل مطلوب'] }
}, { _id: false });

const trialContractSchema = new mongoose.Schema({
	// Parties
	sponsorName: { type: String, required: [true, 'اسم الطرف الثاني مطلوب'], trim: true },
	sponsorCivilId: { type: String, required: [true, 'الرقم المدني للطرف الثاني مطلوب'], trim: true },
	workerName: { type: String, required: [true, 'اسم العاملة مطلوب'], trim: true },
	workerPassportNo: { type: String, required: [true, 'رقم جواز العاملة مطلوب'], trim: true },

	// Dates & time
	dateOfReceipt: { type: Date, required: [true, 'تاريخ استلام العاملة مطلوب'] },
	expiryDate: { type: Date, required: [true, 'تاريخ انتهاء العقد مطلوب'] },
	timeOfReceipt: { type: String, required: [true, 'وقت الاستلام مطلوب'] }, // HH:mm

	// Contact
	phoneNumber: { type: String, required: [true, 'رقم الهاتف مطلوب'], trim: true },

	// Financials
	agreedAmountKwd: { type: Number, enum: [575, 750], required: [true, 'المبلغ المتفق عليه مطلوب'] },
	salaryKwd: { type: Number, required: [true, 'الراتب مطلوب'], min: 0 },
	advancePaymentKwd: { type: Number, default: 0, min: 0 },
	balancePaymentKwd: { type: Number, default: 0, min: 0 }, // computed

	// Address
	address: { type: addressSchema, required: true },

	// Clause 6 duration (optional)
	sponsorshipDurationMonths: { type: Number, min: 0 },

	// Links to visas
	linkedVisaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visa' }],
	linkedVisasSnapshot: [linkedVisaSnapshotSchema],

	// Status & numbering
	status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },
	contractNumber: { type: String, unique: true, sparse: true }, // set on finalize

	// Timestamps
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

trialContractSchema.pre('save', function(next) {
	this.updatedAt = Date.now();
	// compute balance if possible
	if (typeof this.agreedAmountKwd === 'number' && typeof this.advancePaymentKwd === 'number') {
		const balance = this.agreedAmountKwd - this.advancePaymentKwd;
		this.balancePaymentKwd = balance >= 0 ? balance : 0;
	}
	next();
});

// Indexes for search & listing
trialContractSchema.index({ sponsorCivilId: 1 });
trialContractSchema.index({ workerPassportNo: 1 });
trialContractSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TrialContract', trialContractSchema);


