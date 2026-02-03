import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import apiClient from '../config/axios';

interface AccountingEntry {
  contractId: string;
  referenceNumber: string;
  unit?: { unitNumber: string };
  secretary?: { name: string };
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
}

interface AccountingSummary {
  expected: number;
  paid: number;
  partiallyPaid: number;
  unpaid: number;
  overdue: number;
}

interface AccountingResponse {
  month: string;
  summary: AccountingSummary;
  breakdown: AccountingEntry[];
}

const RentalAccounting: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<AccountingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/fursatkum/rental-accounting', { params: { month: selectedMonth } });
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/fursatkum/exports/rental-accounting', {
        params: { month: selectedMonth },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rental-accounting-${selectedMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تصدير البيانات');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        محاسبة التأجير
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            label="الشهر"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md="auto">
          <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={handleExport}>
            تصدير Excel
          </Button>
        </Grid>
      </Grid>

      {loading || !data ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">المتوقع</Typography>
                  <Typography variant="h5">{data.summary.expected.toFixed(3)} د.ك</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">المدفوع</Typography>
                  <Typography variant="h5">{data.summary.paid.toFixed(3)} د.ك</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">جزئي</Typography>
                  <Typography variant="h5">{data.summary.partiallyPaid.toFixed(3)} د.ك</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">غير مدفوع</Typography>
                  <Typography variant="h5">{data.summary.unpaid.toFixed(3)} د.ك</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">متأخر</Typography>
                  <Typography variant="h5">{data.summary.overdue.toFixed(3)} د.ك</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent sx={{ p: 0 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الوحدة</TableCell>
                    <TableCell>السكرتير</TableCell>
                    <TableCell>المستحق</TableCell>
                    <TableCell>المدفوع</TableCell>
                    <TableCell>المتبقي</TableCell>
                    <TableCell>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.breakdown.map((row) => (
                    <TableRow key={row.contractId}>
                      <TableCell>{row.unit?.unitNumber}</TableCell>
                      <TableCell>{row.secretary?.name}</TableCell>
                      <TableCell>{row.dueAmount.toFixed(3)}</TableCell>
                      <TableCell>{row.paidAmount.toFixed(3)}</TableCell>
                      <TableCell>{row.remainingAmount.toFixed(3)}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default RentalAccounting;

