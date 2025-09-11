import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarMonth as CalendarMonthIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ReportData {
  totalContracts: number;
  activeContracts: number;
  terminatedContracts: number;
  totalRevenue: number;
  totalOutstanding: number;
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
    outstanding: number;
    contracts: number;
  }>;
  secretaryBreakdown: Array<{
    secretaryName: string;
    totalRent: number;
    paidAmount: number;
    outstandingAmount: number;
    contracts: number;
  }>;
  unitTypeBreakdown: Array<{
    unitType: string;
    count: number;
    totalRent: number;
    occupancyRate: number;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RentingReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState(0);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const getPeriodOptions = () => {
    switch (reportType) {
      case 'monthly':
        return [
          { value: '01', label: 'يناير' },
          { value: '02', label: 'فبراير' },
          { value: '03', label: 'مارس' },
          { value: '04', label: 'أبريل' },
          { value: '05', label: 'مايو' },
          { value: '06', label: 'يونيو' },
          { value: '07', label: 'يوليو' },
          { value: '08', label: 'أغسطس' },
          { value: '09', label: 'سبتمبر' },
          { value: '10', label: 'أكتوبر' },
          { value: '11', label: 'نوفمبر' },
          { value: '12', label: 'ديسمبر' }
        ];
      case 'quarterly':
        return [
          { value: 'Q1', label: 'الربع الأول (يناير - مارس)' },
          { value: 'Q2', label: 'الربع الثاني (أبريل - يونيو)' },
          { value: 'Q3', label: 'الربع الثالث (يوليو - سبتمبر)' },
          { value: 'Q4', label: 'الربع الرابع (أكتوبر - ديسمبر)' }
        ];
      case 'annual':
        return years.map(year => ({ value: year.toString(), label: year.toString() }));
      default:
        return [];
    }
  };

  useEffect(() => {
    const options = getPeriodOptions();
    if (options.length > 0 && !selectedPeriod) {
      if (reportType === 'monthly') {
        setSelectedPeriod((new Date().getMonth() + 1).toString().padStart(2, '0'));
      } else if (reportType === 'quarterly') {
        const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
        setSelectedPeriod(`Q${currentQuarter}`);
      } else {
        setSelectedPeriod(currentYear.toString());
      }
    }
  }, [reportType, selectedPeriod, currentYear]);

  const generateReport = async () => {
    if (!selectedPeriod) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/renting-reports/${reportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: selectedPeriod,
          year: selectedYear
        })
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء التقرير');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD'
    }).format(amount);
  };

  const downloadReport = (format: 'pdf' | 'excel') => {
    // Implementation for downloading reports
    console.log(`Downloading ${reportType} report in ${format} format`);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          تقارير نظام التأجير
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/renting')}
        >
          رجوع للوحة المعلومات
        </Button>
      </Box>

      {/* Report Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>نوع التقرير</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'monthly' | 'quarterly' | 'annual')}
                  label="نوع التقرير"
                >
                  <MenuItem value="monthly">تقرير شهري</MenuItem>
                  <MenuItem value="quarterly">تقرير ربع سنوي</MenuItem>
                  <MenuItem value="annual">تقرير سنوي</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>الفترة</InputLabel>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  label="الفترة"
                >
                  {getPeriodOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {reportType === 'monthly' && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>السنة</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    label="السنة"
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading || !selectedPeriod}
                startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
                fullWidth
              >
                {loading ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Report Actions */}
      {reportData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                إجراءات التقرير
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="تحميل PDF">
                  <IconButton onClick={() => downloadReport('pdf')} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="تحميل Excel">
                  <IconButton onClick={() => downloadReport('excel')} color="success">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="طباعة">
                  <IconButton onClick={printReport} color="info">
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {reportData && (
        <Card>
          <CardContent>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 40, mr: 2 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {reportData.totalContracts}
                        </Typography>
                        <Typography variant="body2">
                          إجمالي العقود
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {reportData.activeContracts}
                        </Typography>
                        <Typography variant="body2">
                          العقود النشطة
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountBalanceIcon sx={{ fontSize: 40, mr: 2 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(reportData.totalRevenue)}
                        </Typography>
                        <Typography variant="body2">
                          إجمالي الإيرادات
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingDownIcon sx={{ fontSize: 40, mr: 2 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(reportData.totalOutstanding)}
                        </Typography>
                        <Typography variant="body2">
                          المبالغ المستحقة
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs for Detailed Reports */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
                <Tab label="التحليل الشهري" />
                <Tab label="تحليل السكرتيرات" />
                <Tab label="تحليل أنواع الوحدات" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                التحليل الشهري للإيرادات والعقود
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>الشهر</TableCell>
                      <TableCell>الإيرادات</TableCell>
                      <TableCell>المبالغ المستحقة</TableCell>
                      <TableCell>عدد العقود</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.monthlyBreakdown.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                          {formatCurrency(month.revenue)}
                        </TableCell>
                        <TableCell sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                          {formatCurrency(month.outstanding)}
                        </TableCell>
                        <TableCell>{month.contracts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                تحليل السكرتيرات والإيجارات
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>اسم السكرتير</TableCell>
                      <TableCell>إجمالي الإيجار</TableCell>
                      <TableCell>المبلغ المدفوع</TableCell>
                      <TableCell>المبلغ المستحق</TableCell>
                      <TableCell>عدد العقود</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.secretaryBreakdown.map((secretary, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{secretary.secretaryName}</TableCell>
                        <TableCell>{formatCurrency(secretary.totalRent)}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>
                          {formatCurrency(secretary.paidAmount)}
                        </TableCell>
                        <TableCell sx={{ color: 'warning.main' }}>
                          {formatCurrency(secretary.outstandingAmount)}
                        </TableCell>
                        <TableCell>{secretary.contracts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                تحليل أنواع الوحدات ومعدل الإشغال
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>نوع الوحدة</TableCell>
                      <TableCell>العدد</TableCell>
                      <TableCell>إجمالي الإيجار</TableCell>
                      <TableCell>معدل الإشغال</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.unitTypeBreakdown.map((unitType, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{unitType.unitType}</TableCell>
                        <TableCell>{unitType.count}</TableCell>
                        <TableCell>{formatCurrency(unitType.totalRent)}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${unitType.occupancyRate}%`}
                            color={unitType.occupancyRate >= 80 ? 'success' : unitType.occupancyRate >= 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RentingReports;
