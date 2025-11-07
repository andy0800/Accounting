import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Container,
	Divider,
	Grid,
	Typography,
	Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Print as PrintIcon, CheckCircle as FinalizeIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import apiClient from '../config/axios';

interface TrialContract {
	_id: string;
	contractNumber?: string;
	referenceNumber?: string;
	status: 'draft' | 'finalized';
	createdAt?: string;
	sponsorName: string;
	sponsorCivilId: string;
	workerName: string;
	workerPassportNo: string;
	dateOfReceipt: string;
	expiryDate: string;
	timeOfReceipt: string;
	phoneNumber: string;
	agreedAmountKwd: number;
	salaryKwd: number;
	advancePaymentKwd: number;
	balancePaymentKwd: number;
	address: { area: string; block: string; street: string; house: string };
	sponsorshipDurationMonths?: number;
	linkedVisasSnapshot?: Array<{ visaId: string; name: string; passportNumber: string; visaNumber: string; nationality: string }>
}

const TrialContractDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [contract, setContract] = useState<TrialContract | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const printRef = useRef<HTMLDivElement>(null);

	const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('ar-SA') : '';
	const formatKwd = (n?: number) => new Intl.NumberFormat('ar-KW', { style: 'currency', currency: 'KWD' }).format(n || 0);

	const load = async () => {
		try {
			setLoading(true);
			const resp = await apiClient.get(`/api/trial-contracts/${id}`);
			setContract(resp.data);
		} catch (e: any) {
			setError(e?.response?.data?.message || 'فشل في جلب بيانات العقد');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

	const handleFinalize = async () => {
		try {
			setLoading(true);
			await apiClient.patch(`/api/trial-contracts/${contract?._id}/finalize`);
			await load();
		} catch (e: any) {
			setError(e?.response?.data?.message || 'فشل إنهاء العقد');
		} finally {
			setLoading(false);
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const TermsArabic = () => (
		<Box sx={{ mt: 2 }}>
			<Typography variant="h6" sx={{ mb: 1 }}>عقد تسليم عاملة منزلية للتجربة</Typography>
			<Typography>حرر هذا العقد بين كل من الطرف الأول (المكتب) والطرف الثاني (الكفيل).</Typography>
			<ol style={{ paddingRight: 18 }}>
				<li>تكون مدة التجربة 4 أيام فقط ويحسب اليوم 7 د.ك، وفي اليوم الخامس يكون عن كل يوم 20 د.ك.</li>
				<li>يقوم الطرف الثاني بدفع مبلغ تأمين قدره 200 د.ك للطرف الأول.</li>
				<li>يتعهد الطرف الثاني بإعادة العاملة إلى المكتب خلال فترة لا تتجاوز أربعة أيام، أو تحويلها إلى كفالته على ألا تتجاوز مدة التحويل يومين بعد فترة التجربة.</li>
				<li>في حال تأخر الطرف الثاني عن إتمام إجراءات نقل الإقامة بعد يومين من تسلمه البطاقة المدنية للكفيل السابق، يلتزم بدفع 20 د.ك عن كل يوم تأخير، ويتحمل جميع الالتزامات القانونية والغرامات.</li>
				<li>يتم استرجاع مبلغ التأمين خلال أسبوعين من تاريخ تسليم العاملة إلى المكتب خلال فترة الكفالة.</li>
				<li>الكفالة المتفق عليها إن وجدت (عدد الأشهر {contract?.sponsorshipDurationMonths || '____'})، وفي حال تغيب العاملة أو السفر يتم إرجاع مبلغ 750 د.ك للطرف الثاني.</li>
			</ol>
		</Box>
	);

	const TermsEnglish = () => (
		<Box sx={{ mt: 2 }}>
			<Typography variant="h6" sx={{ mb: 1 }}>CONTRACT FOR HANDOVER OF FEMALE DOMESTIC WORKER</Typography>
			<Typography>This contract is between PARTY 1 (OFFICE) and PARTY 2 (THE SPONSOR).</Typography>
			<ol style={{ paddingLeft: 18 }}>
				<li>The probation period shall be 4 days only at 7 KWD per day; from the fifth day onwards, 20 KWD per day.</li>
				<li>The Second Party shall pay a security deposit of 200 KWD to the First Party.</li>
				<li>The Second Party undertakes to return the worker within four days or transfer her sponsorship within two days after the probation period.</li>
				<li>If delayed in completing residency transfer after two days from receiving the previous sponsor’s Civil ID, the Second Party pays 20 KWD per day of delay and bears all legal obligations and fines.</li>
				<li>The deposit shall be refunded within two weeks from the date the worker is returned to the office during the sponsorship period.</li>
				<li>If sponsorship is agreed (duration: {contract?.sponsorshipDurationMonths || '____'} months), in case of absence/refusal/travel, 750 KWD shall be refunded to the Second Party.</li>
			</ol>
		</Box>
	);

	if (loading) {
		return (
			<Box display="flex" alignItems="center" justifyContent="center" minHeight="300px">
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return <Alert severity="error">{error}</Alert>;
	}

	if (!contract) {
		return <Alert severity="warning">العقد غير موجود</Alert>;
	}

	return (
		<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
			<Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Button startIcon={<BackIcon />} variant="outlined" onClick={() => navigate('/trial-contracts')}>عودة</Button>
				<Box>
					<Button sx={{ mr: 1 }} startIcon={<PrintIcon />} variant="contained" color="secondary" onClick={handlePrint}>طباعة</Button>
					{contract.status === 'draft' && (
						<Button startIcon={<FinalizeIcon />} variant="contained" color="success" onClick={handleFinalize} disabled={loading}>
							إنهاء العقد
						</Button>
					)}
				</Box>
			</Box>

			<Card>
				<CardContent>
					<Typography variant="h5" sx={{ mb: 1 }}>عقد تسليم عاملة منزلية للتجربة</Typography>
					<Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
						Contract for Handover of Female Domestic Worker
					</Typography>
					<Divider sx={{ mb: 2 }} />

					{/* Print styles */}
					<style>{`
					@media print {
					  body * { visibility: hidden; }
					  #print-area, #print-area * { visibility: visible; }
					  #print-area { position: absolute; left: 0; top: 0; width: 210mm; padding: 12mm; }
					}
					`}</style>

					<div id="print-area" ref={printRef}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
							<Box>
								<Typography variant="h6">مرجع: {contract.referenceNumber || '—'}</Typography>
								<Typography variant="body2">رقم العقد: {contract.contractNumber || 'مسودة'}</Typography>
							</Box>
							<Typography variant="body2">التاريخ: {formatDate(contract.createdAt as any)}</Typography>
						</Box>

						{/* Fillable details bilingual grid */}
						<Grid container spacing={1}>
							<Grid item xs={12} md={6}>
								<Typography>اسم الطرف الثاني (Name of the Sponsor): {contract.sponsorName}</Typography>
							</Grid>
							<Grid item xs={12} md={6}>
								<Typography>الرقم المدني (Civil ID No.): {contract.sponsorCivilId}</Typography>
							</Grid>

							<Grid item xs={12} md={6}>
								<Typography>اسم العاملة (Name of the Female worker): {contract.workerName}</Typography>
							</Grid>
							<Grid item xs={12} md={6}>
								<Typography>رقم الجواز (Passport No.): {contract.workerPassportNo}</Typography>
							</Grid>

							<Grid item xs={12} md={6}>
								<Typography>تاريخ استلام العاملة (Date of Receipt): {formatDate(contract.dateOfReceipt)}</Typography>
							</Grid>
							<Grid item xs={12} md={6}>
								<Typography>تاريخ انتهاء العقد (Expiry of Contract): {formatDate(contract.expiryDate)}</Typography>
							</Grid>

							<Grid item xs={12} md={6}>
								<Typography>الوقت (Time): {contract.timeOfReceipt}</Typography>
							</Grid>
							<Grid item xs={12} md={6}>
								<Typography>هاتف (Tel Number): {contract.phoneNumber}</Typography>
							</Grid>

							<Grid item xs={12} md={6}>
								<Typography>المبلغ المتفق عليه (KD): {formatKwd(contract.agreedAmountKwd)}</Typography>
							</Grid>
							<Grid item xs={12} md={6}>
								<Typography>الراتب (Salary KD): {formatKwd(contract.salaryKwd)}</Typography>
							</Grid>

							<Grid item xs={12} md={6}>
								<Typography>الدفعة المقدمة (Advance Payment): {formatKwd(contract.advancePaymentKwd)}</Typography>
							</Grid>
							<Grid item xs={12} md={6}>
								<Typography>المتبقي (Balance Payment): {formatKwd(contract.balancePaymentKwd)}</Typography>
							</Grid>

							<Grid item xs={12}>
								<Typography>
									العنوان (Address): المنطقة {contract.address?.area}, قطعة {contract.address?.block}, الشارع {contract.address?.street}, المنزل {contract.address?.house}
								</Typography>
							</Grid>
						</Grid>

						<Divider sx={{ my: 2 }} />

						{/* Fixed terms bilingual: side by side on desktop */}
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<TermsEnglish />
							</Grid>
							<Grid item xs={12} md={6}>
								<TermsArabic />
							</Grid>
						</Grid>

						<Divider sx={{ my: 2 }} />

						{/* Acknowledgment and signatures */}
						<Box sx={{ mt: 1 }}>
							<Typography sx={{ mb: 1 }}>أنا الموقع أدناه أوافق على جميع الشروط والأحكام أعلاه.</Typography>
							<Typography sx={{ mb: 2 }}>I undersigned agree to all the terms and conditions above.</Typography>

							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<Typography>اسم الطرف الثاني (Name of the Sponsor): {contract.sponsorName}</Typography>
									<Typography>الرقم المدني (Civil ID No.): {contract.sponsorCivilId}</Typography>
									<Box sx={{ borderTop: '1px solid #999', mt: 6 }} />
									<Typography sx={{ mt: 1 }}>توقيع الطرف الثاني (Signature Party 2): ____________</Typography>
								</Grid>
								<Grid item xs={12} md={6}>
									<Typography>اسم العاملة (Name of the worker): {contract.workerName}</Typography>
									<Typography>رقم الجواز (Passport No.): {contract.workerPassportNo}</Typography>
									<Box sx={{ borderTop: '1px solid #999', mt: 6 }} />
									<Typography sx={{ mt: 1 }}>توقيع العاملة (Signature of the worker): ____________</Typography>
								</Grid>
							</Grid>
						</Box>

						{/* Linked visas snapshot */}
						{(contract.linkedVisasSnapshot?.length || 0) > 0 && (
							<Box sx={{ mt: 3 }}>
								<Typography variant="h6" sx={{ mb: 1 }}>التأشيرات المرتبطة</Typography>
								{contract.linkedVisasSnapshot?.map((v) => (
									<Typography key={v.visaId} variant="body2">
										- {v.name} | Visa #{v.visaNumber} | Passport {v.passportNumber} | {v.nationality}
									</Typography>
								))}
							</Box>
						)}
					</div>
				</CardContent>
			</Card>
		</Container>
	);
};

export default TrialContractDetail;


