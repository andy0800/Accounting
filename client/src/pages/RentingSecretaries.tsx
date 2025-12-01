import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AddIcon from '@mui/icons-material/Add';
import apiClient from '../config/axios';

interface RentalSecretary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: string;
  documents?: { name: string }[];
  createdAt: string;
}

const RentingSecretaries: React.FC = () => {
  const navigate = useNavigate();
  const [secretaries, setSecretaries] = useState<RentalSecretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecretaries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/renting-secretaries');
      setSecretaries(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب سكرتارية التأجير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecretaries();
  }, []);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/rental-secretaries', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rental-secretaries.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تصدير البيانات');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          سكرتارية التأجير
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={handleExport}>
            تصدير Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/renting/secretaries/new')}>
            إضافة سكرتير
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الاسم</TableCell>
                <TableCell>الهاتف</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>المستندات</TableCell>
                <TableCell>تاريخ الإنشاء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {secretaries.map((sec) => (
                <TableRow key={sec._id} hover>
                  <TableCell>{sec.name}</TableCell>
                  <TableCell>{sec.phone}</TableCell>
                  <TableCell>{sec.email || '-'}</TableCell>
                  <TableCell>{sec.address || '-'}</TableCell>
                  <TableCell>
                    <Chip color={sec.status === 'نشط' ? 'success' : 'default'} label={sec.status} size="small" />
                  </TableCell>
                  <TableCell>{sec.documents?.length || 0}</TableCell>
                  <TableCell>{new Date(sec.createdAt).toLocaleDateString('ar-KW')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RentingSecretaries;

