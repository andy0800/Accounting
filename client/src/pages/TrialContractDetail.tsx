import React, { useEffect, useRef, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Container,
	Divider,
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
	secretary?: string;
	secretarySnapshot?: { name?: string; code?: string; phone?: string };
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

	const load = React.useCallback(async () => {
		try {
			setLoading(true);
			const resp = await apiClient.get(`/api/trial-contracts/${id}`);
			setContract(resp.data);
		} catch (e: any) {
			setError(e?.response?.data?.message || 'فشل في جلب بيانات العقد');
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

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

          {/* Print + on-screen styles for the contract document */}
          <style>{`
          .print-root {
            font-family: 'Inter', 'Cairo', 'Roboto', Arial, sans-serif;
            color: #222;
            line-height: 1.4;
          }
          .header {
            display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 2px solid #111; padding-bottom: 8mm; margin-bottom: 6mm;
          }
          .title-ar { font-weight: 700; font-size: 18pt; font-family: 'Cairo', 'Roboto', sans-serif; }
          .title-en { font-weight: 700; font-size: 14pt; font-family: 'Inter', 'Roboto', sans-serif; color: #444; }
          .meta { font-size: 11pt; color: #333; }
          .meta .label { color: #666; }
          .section-title { font-weight: 700; font-size: 12.5pt; margin: 10mm 0 4mm; }
          .bilingual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
          .lang-box { border: 1px solid #ddd; padding: 6mm; border-radius: 6px; background: #fff; }
          .lang-ar { direction: rtl; text-align: right; font-family: 'Cairo', 'Roboto', sans-serif; }
          .lang-en { direction: ltr; text-align: left; font-family: 'Inter', 'Roboto', sans-serif; }
          .row { display: grid; grid-template-columns: 1.2fr 1.8fr; align-items: end; gap: 6mm; margin-bottom: 4mm; }
          .label { color: #555; font-size: 11pt; }
          .fill { border-bottom: 1px dotted #777; min-height: 18px; font-size: 11.5pt; padding-bottom: 2px; }
          .terms { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: 8mm; }
          .sig-box { height: 24mm; border-top: 2px solid #222; margin-top: 10mm; }
          .muted { color: #666; }
          .small { font-size: 10pt; }
          @page { size: A4; margin: 12mm; }
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 210mm; padding: 0; }
            .no-print { display: none !important; }
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          `}</style>

          <div id="print-area" ref={printRef} className="print-root">
            <div className="header">
              <div>
                <div className="title-ar">عقد تسليم عاملة منزلية للتجربة</div>
                <div className="title-en">CONTRACT FOR HANDOVER OF FEMALE DOMESTIC WORKER</div>
              </div>
              <div className="meta">
                <div><span className="label">مرجع:</span> {contract.referenceNumber || '—'}</div>
                <div><span className="label">رقم العقد:</span> {contract.contractNumber || 'مسودة'}</div>
                <div><span className="label">التاريخ:</span> {formatDate(contract.createdAt as any)}</div>
              </div>
            </div>

            {/* Bilingual fillable details */}
            <div className="bilingual-grid">
              <div className="lang-box lang-ar">
                <div className="section-title">البيانات</div>
                <div className="row"><div className="label">اسم السكرتير/السكرتيرة</div><div className="fill">{contract.secretarySnapshot?.name || '—'}{contract.secretarySnapshot?.code ? ` (${contract.secretarySnapshot.code})` : ''}</div></div>
                {contract.secretarySnapshot?.phone && (<div className="row"><div className="label">هاتف السكرتير</div><div className="fill">{contract.secretarySnapshot.phone}</div></div>)}
                <div className="row"><div className="label">اسم الطرف الثاني</div><div className="fill">{contract.sponsorName}</div></div>
                <div className="row"><div className="label">الرقم المدني</div><div className="fill">{contract.sponsorCivilId}</div></div>
                <div className="row"><div className="label">اسم العاملة</div><div className="fill">{contract.workerName}</div></div>
                <div className="row"><div className="label">رقم الجواز</div><div className="fill">{contract.workerPassportNo}</div></div>
                <div className="row"><div className="label">تاريخ استلام العاملة</div><div className="fill">{formatDate(contract.dateOfReceipt)}</div></div>
                <div className="row"><div className="label">تاريخ انتهاء العقد</div><div className="fill">{formatDate(contract.expiryDate)}</div></div>
                <div className="row"><div className="label">الوقت</div><div className="fill">{contract.timeOfReceipt}</div></div>
                <div className="row"><div className="label">هاتف</div><div className="fill">{contract.phoneNumber}</div></div>
                <div className="row"><div className="label">المبلغ المتفق عليه (د.ك)</div><div className="fill">{formatKwd(contract.agreedAmountKwd)}</div></div>
                <div className="row"><div className="label">الراتب (د.ك)</div><div className="fill">{formatKwd(contract.salaryKwd)}</div></div>
                <div className="row"><div className="label">الدفعة المقدمة</div><div className="fill">{formatKwd(contract.advancePaymentKwd)}</div></div>
                <div className="row"><div className="label">العنوان</div><div className="fill">المنطقة {contract.address?.area}, قطعة {contract.address?.block}, الشارع {contract.address?.street}, المنزل {contract.address?.house}</div></div>
              </div>
              <div className="lang-box lang-en">
                <div className="section-title">Details</div>
                <div className="row"><div className="label">Secretary Name</div><div className="fill">{contract.secretarySnapshot?.name || '—'}{contract.secretarySnapshot?.code ? ` (${contract.secretarySnapshot.code})` : ''}</div></div>
                {contract.secretarySnapshot?.phone && (<div className="row"><div className="label">Secretary Phone</div><div className="fill">{contract.secretarySnapshot.phone}</div></div>)}
                <div className="row"><div className="label">Name of the Sponsor</div><div className="fill">{contract.sponsorName}</div></div>
                <div className="row"><div className="label">Civil ID No.</div><div className="fill">{contract.sponsorCivilId}</div></div>
                <div className="row"><div className="label">Name of the Female Worker</div><div className="fill">{contract.workerName}</div></div>
                <div className="row"><div className="label">Passport No.</div><div className="fill">{contract.workerPassportNo}</div></div>
                <div className="row"><div className="label">Date of Receipt</div><div className="fill">{formatDate(contract.dateOfReceipt)}</div></div>
                <div className="row"><div className="label">Expiry of Contract</div><div className="fill">{formatDate(contract.expiryDate)}</div></div>
                <div className="row"><div className="label">Time</div><div className="fill">{contract.timeOfReceipt}</div></div>
                <div className="row"><div className="label">Tel Number</div><div className="fill">{contract.phoneNumber}</div></div>
                <div className="row"><div className="label">Agreed Amount (KWD)</div><div className="fill">{formatKwd(contract.agreedAmountKwd)}</div></div>
                <div className="row"><div className="label">Salary (KWD)</div><div className="fill">{formatKwd(contract.salaryKwd)}</div></div>
                <div className="row"><div className="label">Advance Payment (KWD)</div><div className="fill">{formatKwd(contract.advancePaymentKwd)}</div></div>
                <div className="row"><div className="label">Address</div><div className="fill">Area {contract.address?.area}, Block {contract.address?.block}, Street {contract.address?.street}, House {contract.address?.house}</div></div>
              </div>
            </div>

            {/* Fixed terms bilingual */}
            <div className="section-title">الشروط والأحكام / Terms & Conditions</div>
            <div className="terms">
              <div className="lang-en"><TermsEnglish /></div>
              <div className="lang-ar"><TermsArabic /></div>
            </div>

            {/* Acknowledgment and signatures */}
            <div className="section-title">التوقيعات / Signatures</div>
            <div className="signatures">
              <div className="lang-ar">
                <div className="row"><div className="label">اسم الطرف الثاني</div><div className="fill"></div></div>
                <div className="row"><div className="label">الرقم المدني</div><div className="fill"></div></div>
                <div className="sig-box"></div>
                <div className="small muted">توقيع الطرف الثاني (الكفيل)</div>
              </div>
              <div className="lang-en">
                <div className="row"><div className="label">Name of the Worker</div><div className="fill"></div></div>
                <div className="row"><div className="label">Passport No.</div><div className="fill"></div></div>
                <div className="sig-box"></div>
                <div className="small muted">Signature of the worker</div>
              </div>
            </div>

            {(contract.linkedVisasSnapshot?.length || 0) > 0 && (
              <div style={{ marginTop: '10mm' }}>
                <div className="section-title">التأشيرات المرتبطة / Linked Visas</div>
                {contract.linkedVisasSnapshot?.map((v) => (
                  <div key={v.visaId} className="small">- {v.name} | Visa #{v.visaNumber} | Passport {v.passportNumber} | {v.nationality}</div>
                ))}
              </div>
            )}
          </div>
				</CardContent>
			</Card>
		</Container>
	);
};

export default TrialContractDetail;


