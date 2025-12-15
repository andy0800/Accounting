import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Button,
  Pagination,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';

interface Invoice {
  _id: string;
  referenceNumber: string;
  type: 'income' | 'spending';
  name: string;
  value: number;
  date: string;
  details?: string;
  createdBy?: { username: string };
  deletedBy?: { username: string };
  deletedAt?: string;
}

interface Props {
  systemKey: 'farwaniya1' | 'farwaniya2';
  title: string;
  basePath: string;
}

const FarwaniyaDeletedInvoicesBase: React.FC<Props> = ({ systemKey, title, basePath }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: page.toString(), limit: '20' };
      const res = await apiClient.get(`/api/${systemKey}/deleted`, { params });
      setInvoices(res.data.invoices);
      setTotalPages(res.data.pagination.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب الفواتير المحذوفة');
    } finally {
      setLoading(false);
    }
  }, [page, systemKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">{title}</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate(`${basePath}/invoices`)}>
          عودة للفواتير
        </Button>
      </Box>

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
                  <TableCell>التاريخ</TableCell>
                  <TableCell>أنشأها</TableCell>
                  <TableCell>حذفها</TableCell>
                  <TableCell>تاريخ الحذف</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      لا توجد فواتير محذوفة
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice._id} hover>
                      <TableCell>{invoice.referenceNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.type === 'income' ? 'دخل' : 'صرف'}
                          color={invoice.type === 'income' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{invoice.name}</TableCell>
                      <TableCell>{invoice.value.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString('ar-KW')}</TableCell>
                      <TableCell>{invoice.createdBy?.username || '-'}</TableCell>
                      <TableCell>{invoice.deletedBy?.username || '-'}</TableCell>
                      <TableCell>{invoice.deletedAt ? new Date(invoice.deletedAt).toLocaleString('ar-KW') : '-'}</TableCell>
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

export default FarwaniyaDeletedInvoicesBase;

