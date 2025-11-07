const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TrialContract = require('../models/TrialContract');
const Visa = require('../models/Visa');

const isValidAgreedAmount = (v) => v === 575 || v === 750;

async function validateLinkedSoldVisas(visaIds) {
	if (!Array.isArray(visaIds) || visaIds.length === 0) return [];
	const objectIds = visaIds
		.filter(Boolean)
		.map((id) => new mongoose.Types.ObjectId(id));
	const visas = await Visa.find({ _id: { $in: objectIds }, status: 'مباعة' })
		.select('name passportNumber visaNumber nationality');
	if (visas.length !== objectIds.length) {
		throw new Error('يجب أن تكون جميع التأشيرات المرتبطة في حالة مباعة');
	}
	return visas.map((v) => ({
		visaId: v._id,
		name: v.name,
		passportNumber: v.passportNumber,
		visaNumber: v.visaNumber,
		nationality: v.nationality
	}));
}

// List trial contracts with filters and pagination
router.get('/', async (req, res) => {
	try {
		const { search, status, page = 1, limit = 10 } = req.query;
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

		const query = {};
		if (status) query.status = status;
		if (search && search.trim()) {
			const s = search.trim();
			query.$or = [
				{ sponsorName: { $regex: s, $options: 'i' }},
				{ workerName: { $regex: s, $options: 'i' }},
				{ sponsorCivilId: { $regex: s, $options: 'i' }},
				{ workerPassportNo: { $regex: s, $options: 'i' }},
				{ contractNumber: { $regex: s, $options: 'i' }}
			];
		}

		const skip = (pageNum - 1) * limitNum;
		const [contracts, total] = await Promise.all([
			TrialContract.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
			TrialContract.countDocuments(query)
		]);

		res.json({
			contracts,
			pagination: {
				current: pageNum,
				total: Math.ceil(total / limitNum),
				totalItems: total
			}
		});
	} catch (error) {
		res.status(500).json({ message: 'خطأ في جلب عقود التجربة', error: error.message });
	}
});

// Get single
router.get('/:id', async (req, res) => {
	try {
		const contract = await TrialContract.findById(req.params.id);
		if (!contract) return res.status(404).json({ message: 'العقد غير موجود' });
		res.json(contract);
	} catch (error) {
		res.status(500).json({ message: 'خطأ في جلب العقد', error: error.message });
	}
});

// Create draft
router.post('/', async (req, res) => {
	try {
		const body = req.body;

		// Basic validations
		if (!isValidAgreedAmount(Number(body.agreedAmountKwd))) {
			return res.status(400).json({ message: 'المبلغ المتفق عليه يجب أن يكون 575 أو 750' });
		}

		// Validate linked visas are sold
		const snapshot = await validateLinkedSoldVisas(body.linkedVisaIds || []);

		const contract = new TrialContract({
			sponsorName: body.sponsorName,
			sponsorCivilId: body.sponsorCivilId,
			workerName: body.workerName,
			workerPassportNo: body.workerPassportNo,
			dateOfReceipt: new Date(body.dateOfReceipt),
			expiryDate: new Date(body.expiryDate),
			timeOfReceipt: body.timeOfReceipt,
			phoneNumber: body.phoneNumber,
			agreedAmountKwd: Number(body.agreedAmountKwd),
			salaryKwd: Number(body.salaryKwd),
			advancePaymentKwd: Number(body.advancePaymentKwd || 0),
			address: {
				area: body.address?.area,
				block: body.address?.block,
				street: body.address?.street,
				house: body.address?.house,
			},
			sponsorshipDurationMonths: body.sponsorshipDurationMonths ? Number(body.sponsorshipDurationMonths) : undefined,
			linkedVisaIds: (body.linkedVisaIds || []).filter(Boolean),
			linkedVisasSnapshot: snapshot,
			status: 'draft'
		});

		await contract.save();
		res.status(201).json({ message: 'تم إنشاء عقد التجربة (مسودة)', contract });
	} catch (error) {
		res.status(400).json({ message: error.message || 'فشل إنشاء عقد التجربة' });
	}
});

// Update draft
router.put('/:id', async (req, res) => {
	try {
		const contract = await TrialContract.findById(req.params.id);
		if (!contract) return res.status(404).json({ message: 'العقد غير موجود' });
		if (contract.status !== 'draft') return res.status(400).json({ message: 'لا يمكن تعديل عقد مُنجز' });

		const body = req.body;
		if (body.agreedAmountKwd !== undefined && !isValidAgreedAmount(Number(body.agreedAmountKwd))) {
			return res.status(400).json({ message: 'المبلغ المتفق عليه يجب أن يكون 575 أو 750' });
		}

		// If linked visas provided, validate and refresh snapshot
		let snapshot = contract.linkedVisasSnapshot || [];
		if (Array.isArray(body.linkedVisaIds)) {
			snapshot = await validateLinkedSoldVisas(body.linkedVisaIds);
			contract.linkedVisaIds = body.linkedVisaIds.filter(Boolean);
			contract.linkedVisasSnapshot = snapshot;
		}

		// Update fields if provided
		const fields = [
			'sponsorName','sponsorCivilId','workerName','workerPassportNo','dateOfReceipt','expiryDate','timeOfReceipt','phoneNumber',
			'agreedAmountKwd','salaryKwd','advancePaymentKwd','sponsorshipDurationMonths'
		];
		for (const f of fields) {
			if (body[f] !== undefined) {
				contract[f] = ['dateOfReceipt','expiryDate'].includes(f) ? new Date(body[f]) : body[f];
			}
		}
		if (body.address) {
			contract.address = {
				area: body.address.area ?? contract.address?.area,
				block: body.address.block ?? contract.address?.block,
				street: body.address.street ?? contract.address?.street,
				house: body.address.house ?? contract.address?.house,
			};
		}

		await contract.save();
		res.json({ message: 'تم تحديث عقد التجربة (مسودة)', contract });
	} catch (error) {
		res.status(400).json({ message: error.message || 'فشل تحديث عقد التجربة' });
	}
});

// Finalize contract (freeze & number)
router.patch('/:id/finalize', async (req, res) => {
	try {
		const contract = await TrialContract.findById(req.params.id);
		if (!contract) return res.status(404).json({ message: 'العقد غير موجود' });
		if (contract.status !== 'draft') return res.status(400).json({ message: 'تم الانتهاء من العقد مسبقاً' });

		// Ensure all required fields exist
		const required = [
			'sponsorName','sponsorCivilId','workerName','workerPassportNo','dateOfReceipt','expiryDate','timeOfReceipt','phoneNumber',
			'agreedAmountKwd','salaryKwd','address.area','address.block','address.street','address.house'
		];
		const hasAll = required.every((key) => {
			const parts = key.split('.');
			let cur = contract;
			for (const p of parts) cur = cur?.[p];
			return cur !== undefined && cur !== null && cur !== '';
		});
		if (!hasAll) return res.status(400).json({ message: 'بعض الحقول الإلزامية مفقودة قبل الإنهاء' });

		// Refresh snapshot to ensure integrity
		const snapshot = await validateLinkedSoldVisas(contract.linkedVisaIds || []);
		contract.linkedVisasSnapshot = snapshot;

		// Generate sequential contract number per year: TC-YYYY-####
		const now = new Date();
		const year = now.getFullYear();
		const count = await TrialContract.countDocuments({ contractNumber: { $regex: `^TC-${year}-` } });
		const seq = String(count + 1).padStart(4, '0');
		contract.contractNumber = `TC-${year}-${seq}`;
		contract.status = 'finalized';

		await contract.save();
		res.json({ message: 'تم إنهاء عقد التجربة', contract });
	} catch (error) {
		// Possible duplicate contractNumber edge case
		res.status(400).json({ message: error.message || 'فشل إنهاء عقد التجربة' });
	}
});

module.exports = router;


