import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
} from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import apiClient from '../../config/axios';

interface Invoice {
  _id: string;
  referenceNumber: string;
  type: 'income' | 'spending';
  ledger: 'cash' | 'bank';
  name: string;
  value: number;
  date: string;
  deleteReason?: string;
  deletedAt?: string;
  deletedBy?: { username: string };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const typeLabels: Record<string, string> = { income: 'فاتورة دخل', spending: 'إيصال صرف' };
const ledgerLabels: Record<string, string> = { bank: 'حساب بنكي', cash: 'صندوق نقدي' };

const FursatkumDeletedInvoices: React.FC = () => {
  const [data, setData] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/fursatkum/deleted', { params: { page } });
      setData(response.data.invoices || []);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب الفواتير المحذوفة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/fursatkum/deleted', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fursatkum-deleted-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('خطأ في تصدير الفواتير المحذوفة');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          الفواتير المحذوفة
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            تصدير Excel
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            تحديث
          </Button>
        </Box>
      </Box>

      {error && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>المرجع</TableCell>
                      <TableCell>النوع</TableCell>
                      <TableCell>الدفة</TableCell>
                      <TableCell>القيمة</TableCell>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>السبب</TableCell>
                      <TableCell>الحذف بواسطة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          لا توجد فواتير محذوفة
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((inv) => (
                        <TableRow key={inv._id} hover>
                          <TableCell>{inv.referenceNumber}</TableCell>
                          <TableCell>{typeLabels[inv.type]}</TableCell>
                          <TableCell>{ledgerLabels[inv.ledger]}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{inv.value.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك</TableCell>
                          <TableCell>{new Date(inv.date).toLocaleDateString('ar-KW')}</TableCell>
                          <TableCell>{inv.deleteReason || '-'}</TableCell>
                          <TableCell>{inv.deletedBy?.username || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {pagination && pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={pagination.pages}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FursatkumDeletedInvoices;


