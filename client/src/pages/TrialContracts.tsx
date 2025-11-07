import React, { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	FormControl,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TextField,
	Typography,
	Chip,
	Tooltip
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

interface TrialContract {
	_id: string;
	contractNumber?: string;
	sponsorName: string;
	sponsorCivilId: string;
	workerName: string;
	workerPassportNo: string;
	agreedAmountKwd: number;
	advancePaymentKwd: number;
	balancePaymentKwd: number;
	dateOfReceipt: string;
	expiryDate: string;
	status: 'draft' | 'finalized';
	linkedVisaIds?: string[];
	createdAt: string;
}

const TrialContracts: React.FC = () => {
	const navigate = useNavigate();
	const [contracts, setContracts] = useState<TrialContract[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'الكل' | 'draft' | 'finalized'>('الكل');

	const fetchContracts = async () => {
		try {
			setLoading(true);
			const params: any = { page: 1, limit: 50 };
			if (search.trim()) params.search = search.trim();
			if (statusFilter !== 'الكل') params.status = statusFilter;
			const response = await apiClient.get('/api/trial-contracts', { params });
			const list = response.data?.contracts || [];
			setContracts(list);
		} catch (error) {
			console.error('خطأ في جلب عقود التجربة:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContracts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onApplyFilters = () => fetchContracts();

	const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-SA');
	const formatKwd = (n: number) => new Intl.NumberFormat('ar-KW', { style: 'currency', currency: 'KWD' }).format(n || 0);

	return (
		<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant="h4">عقود التجربة</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => navigate('/trial-contracts/new')}
					disabled={loading}
				>
					عقد تجربة جديد
				</Button>
			</Box>

			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
						<FilterIcon sx={{ mr: 1 }} />
						<Typography variant="h6">فلاتر</Typography>
					</Box>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label="بحث (اسم الكفيل/اسم العاملة/الرقم المدني/جواز/رقم العقد)"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								disabled={loading}
							/>
						</Grid>
						<Grid item xs={12} md={3}>
							<FormControl fullWidth>
								<InputLabel id="status-label">الحالة</InputLabel>
								<Select
									labelId="status-label"
									value={statusFilter}
									label="الحالة"
									onChange={(e) => setStatusFilter(e.target.value as any)}
									disabled={loading}
								>
									<MenuItem value="الكل">الكل</MenuItem>
									<MenuItem value="draft">مسودة</MenuItem>
									<MenuItem value="finalized">منجز</MenuItem>
								</Select>
							</FormControl>
						</Grid>
						<Grid item xs={12} md={3}>
							<Button variant="outlined" onClick={onApplyFilters} fullWidth disabled={loading}>تطبيق</Button>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						قائمة العقود ({contracts.length})
					</Typography>
					<TableContainer component={Paper}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>رقم العقد</TableCell>
									<TableCell>اسم الكفيل</TableCell>
									<TableCell>اسم العاملة</TableCell>
									<TableCell>تاريخ الاستلام</TableCell>
									<TableCell>تاريخ الانتهاء</TableCell>
									<TableCell>المبلغ</TableCell>
									<TableCell>الدفعة المقدمة</TableCell>
									<TableCell>المتبقي</TableCell>
									<TableCell>الحالة</TableCell>
									<TableCell>التأشيرات المرتبطة</TableCell>
									<TableCell>الإجراءات</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{contracts.map((c) => (
									<TableRow key={c._id}>
										<TableCell>{c.contractNumber || '-'}</TableCell>
										<TableCell>{c.sponsorName}</TableCell>
										<TableCell>{c.workerName}</TableCell>
										<TableCell>{formatDate(c.dateOfReceipt)}</TableCell>
										<TableCell>{formatDate(c.expiryDate)}</TableCell>
										<TableCell>{formatKwd(c.agreedAmountKwd)}</TableCell>
										<TableCell>{formatKwd(c.advancePaymentKwd)}</TableCell>
										<TableCell>
											<Typography color={c.balancePaymentKwd > 0 ? 'error' : 'success'}>
												{formatKwd(c.balancePaymentKwd)}
											</Typography>
										</TableCell>
										<TableCell>
											<Chip label={c.status === 'finalized' ? 'منجز' : 'مسودة'} color={c.status === 'finalized' ? 'success' : 'default'} size="small" />
										</TableCell>
										<TableCell>{c.linkedVisaIds?.length || 0}</TableCell>
										<TableCell>
											<Tooltip title="عرض/طباعة">
												<IconButton onClick={() => navigate(`/trial-contracts/${c._id}`)}>
													<ViewIcon />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>
		</Container>
	);
};

export default TrialContracts;


