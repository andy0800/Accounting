import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Pagination,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';

interface DeletedInvoice {
  _id: string;
  referenceNumber: string;
  type: 'income' | 'spending';
  name: string;
  value: number;
  date: string;
  details?: string;
  createdBy?: { username: string };
  deletedBy?: { username: string };
  deletedAt: string;
  createdAt: string;
}

const HSDeletedInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<DeletedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDeleted = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/home-service/deleted', {
        params: { page: page.toString(), limit: '20' },
      });
      setInvoices(response.data.invoices);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب الفواتير المحذوفة');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/home-service/deleted', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `home-service-deleted-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('خطأ في تصدير الفواتير المحذوفة');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        رجوع
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          الفواتير المحذوفة (للمراجعة)
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          تصدير Excel
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        هذا القسم للمراجعة فقط. لا يمكن استعادة الفواتير المحذوفة.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>المرجع</TableCell>
                  <TableCell>النوع</TableCell>
                  <TableCell>الاسم</TableCell>
                  <TableCell>القيمة</TableCell>
                  <TableCell>تاريخ الفاتورة</TableCell>
                  <TableCell>التفاصيل</TableCell>
                  <TableCell>أنشأها</TableCell>
                  <TableCell>حذفها</TableCell>
                  <TableCell>تاريخ الحذف</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      لا توجد فواتير محذوفة
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow
                      key={invoice._id}
                      sx={{
                        opacity: 0.7,
                        textDecoration: 'line-through',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight="bold" sx={{ textDecoration: 'none' }}>
                          {invoice.referenceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.type === 'income' ? 'دخل' : 'صرف'}
                          color={invoice.type === 'income' ? 'success' : 'error'}
                          size="small"
                          sx={{ textDecoration: 'none' }}
                        />
                      </TableCell>
                      <TableCell>{invoice.name}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textDecoration: 'none' }}>
                        {invoice.value.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.date).toLocaleDateString('ar-KW')}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {invoice.details || '-'}
                      </TableCell>
                      <TableCell>{invoice.createdBy?.username || '-'}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 'bold', textDecoration: 'none' }}>
                        {invoice.deletedBy?.username || '-'}
                      </TableCell>
                      <TableCell sx={{ textDecoration: 'none' }}>
                        {new Date(invoice.deletedAt).toLocaleString('ar-KW')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default HSDeletedInvoices;

