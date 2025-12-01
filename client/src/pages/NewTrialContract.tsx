import React, { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Grid,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	TextField,
	Typography,
	Alert,
	CircularProgress,
	Chip
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import { auth } from '../utils/auth';

interface SoldVisaOption {
	_id: string;
	name: string;
	visaNumber: string;
	passportNumber: string;
	nationality: string;
}

const NewTrialContract: React.FC = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
  const [soldVisas, setSoldVisas] = useState<SoldVisaOption[]>([]);

  const [form, setForm] = useState<any>({
		sponsorName: '',
		sponsorCivilId: '',
		workerName: '',
		workerPassportNo: '',
		dateOfReceipt: new Date().toISOString().split('T')[0],
		expiryDate: new Date().toISOString().split('T')[0],
		timeOfReceipt: '09:00',
		phoneNumber: '',
		agreedAmountKwd: 750,
		salaryKwd: 0,
		advancePaymentKwd: 0,
		address: { area: '', block: '', street: '', house: '' },
		sponsorshipDurationMonths: '',
		linkedVisaIds: [] as string[],
	});

	const balance = useMemo(() => {
		const a = Number(form.agreedAmountKwd) || 0;
		const adv = Number(form.advancePaymentKwd) || 0;
		return Math.max(0, a - adv);
	}, [form.agreedAmountKwd, form.advancePaymentKwd]);

	useEffect(() => {
		const loadSoldVisas = async () => {
			try {
				const resp = await apiClient.get('/api/visas', { params: { status: 'مباعة', page: 1, limit: 100 } });
				const list = Array.isArray(resp.data) ? resp.data : (resp.data?.visas || []);
				setSoldVisas(list.map((v: any) => ({ _id: v._id, name: v.name, visaNumber: v.visaNumber, passportNumber: v.passportNumber, nationality: v.nationality })));
			} catch (e) {
				console.warn('تعذر تحميل التأشيرات المباعة', e);
			}
		};
    loadSoldVisas();
	}, []);

	const handleChange = (field: string, value: any) => {
		setForm((prev: any) => ({ ...prev, [field]: value }));
	};

	const handleAddressChange = (field: string, value: any) => {
		setForm((prev: any) => ({ ...prev, address: { ...prev.address, [field]: value } }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			setLoading(true);
			const payload = {
				...form,
				agreedAmountKwd: Number(form.agreedAmountKwd),
				salaryKwd: Number(form.salaryKwd),
				advancePaymentKwd: Number(form.advancePaymentKwd || 0),
        linkedVisaIds: form.linkedVisaIds,
        secretaryUsername: auth.getUsername() || undefined,
			};
			const resp = await apiClient.post('/api/trial-contracts', payload);
			const id = resp.data?.contract?._id;
			setSuccess('تم إنشاء عقد التجربة (مسودة)');
			setTimeout(() => {
				navigate(`/trial-contracts/${id}`);
			}, 1000);
		} catch (err: any) {
			setError(err?.response?.data?.message || err?.message || 'فشل إنشاء العقد');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
			<Card>
				<CardContent>
					<Typography variant="h4" sx={{ mb: 3 }}>إنشاء عقد تجربة جديد</Typography>

					{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
					{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

					<Box component="form" onSubmit={handleSubmit}>
						<Grid container spacing={2}>
							{/* Sponsor */}
							<Grid item xs={12} md={6}>
								<TextField label="اسم الطرف الثاني (الكفيل)" fullWidth required value={form.sponsorName} onChange={(e) => handleChange('sponsorName', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField label="الرقم المدني" fullWidth required value={form.sponsorCivilId} onChange={(e) => handleChange('sponsorCivilId', e.target.value)} />
							</Grid>

							{/* Worker */}
							<Grid item xs={12} md={6}>
								<TextField label="اسم العاملة" fullWidth required value={form.workerName} onChange={(e) => handleChange('workerName', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField label="رقم جواز العاملة" fullWidth required value={form.workerPassportNo} onChange={(e) => handleChange('workerPassportNo', e.target.value)} />
							</Grid>

							{/* Dates & time */}
							<Grid item xs={12} md={4}>
								<TextField type="date" label="تاريخ الاستلام" InputLabelProps={{ shrink: true }} fullWidth required value={form.dateOfReceipt} onChange={(e) => handleChange('dateOfReceipt', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField type="date" label="تاريخ انتهاء العقد" InputLabelProps={{ shrink: true }} fullWidth required value={form.expiryDate} onChange={(e) => handleChange('expiryDate', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField type="time" label="الوقت" InputLabelProps={{ shrink: true }} fullWidth required value={form.timeOfReceipt} onChange={(e) => handleChange('timeOfReceipt', e.target.value)} />
							</Grid>

							{/* Contact */}
							<Grid item xs={12} md={6}>
								<TextField label="رقم الهاتف" fullWidth required value={form.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} />
							</Grid>

                          {/* Secretary (auto from logged-in user) */}
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="اسم السكرتير (من المستخدم الحالي)"
                              value={auth.getUsername() || ''}
                              InputProps={{ readOnly: true }}
                            />
                          </Grid>

							{/* Financials */}
							<Grid item xs={12} md={4}>
								<FormControl fullWidth>
									<InputLabel>المبلغ المتفق عليه (د.ك)</InputLabel>
									<Select label="المبلغ المتفق عليه (د.ك)" value={form.agreedAmountKwd} onChange={(e) => handleChange('agreedAmountKwd', e.target.value)}>
										<MenuItem value={750}>750</MenuItem>
										<MenuItem value={575}>575</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField type="number" label="الراتب (د.ك)" fullWidth required value={form.salaryKwd} onChange={(e) => handleChange('salaryKwd', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField type="number" label="الدفعة المقدمة (د.ك)" fullWidth value={form.advancePaymentKwd} onChange={(e) => handleChange('advancePaymentKwd', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={4}>
								<TextField label="المتبقي (د.ك)" fullWidth value={balance} InputProps={{ readOnly: true }} />
							</Grid>

							{/* Address */}
							<Grid item xs={12} md={3}>
								<TextField label="المنطقة" fullWidth required value={form.address.area} onChange={(e) => handleAddressChange('area', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField label="قطعة" fullWidth required value={form.address.block} onChange={(e) => handleAddressChange('block', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField label="الشارع" fullWidth required value={form.address.street} onChange={(e) => handleAddressChange('street', e.target.value)} />
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField label="المنزل" fullWidth required value={form.address.house} onChange={(e) => handleAddressChange('house', e.target.value)} />
							</Grid>

							{/* Clause 6 duration (optional) */}
							<Grid item xs={12} md={4}>
								<TextField type="number" label="عدد أشهر الكفالة (اختياري)" fullWidth value={form.sponsorshipDurationMonths} onChange={(e) => handleChange('sponsorshipDurationMonths', e.target.value)} />
							</Grid>

							{/* Link sold visas */}
							<Grid item xs={12} md={8}>
								<FormControl fullWidth>
									<InputLabel>ربط بتأشيرات مباعة</InputLabel>
									<Select
										multiple
										label="ربط بتأشيرات مباعة"
										value={form.linkedVisaIds}
										onChange={(e) => handleChange('linkedVisaIds', e.target.value)}
										renderValue={(selected) => (
											<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
												{(selected as string[]).map((id) => {
													const v = soldVisas.find(s => s._id === id);
													return <Chip key={id} label={`${v?.name || ''} (${v?.visaNumber || ''})`} />
												})}
											</Box>
										)}
									>
										{soldVisas.map(v => (
											<MenuItem key={v._id} value={v._id}>
												{v.name} - {v.visaNumber} - {v.passportNumber}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>

							<Grid item xs={12}>
								<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
									<Button variant="outlined" onClick={() => navigate('/trial-contracts')} disabled={loading}>إلغاء</Button>
									<Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />} disabled={loading}>
										{loading ? 'جاري الحفظ...' : 'حفظ كمسودة'}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</Box>
				</CardContent>
			</Card>
		</Container>
	);
};

export default NewTrialContract;


