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
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import apiClient from '../config/axios';

interface RentalContract {
  _id: string;
  referenceNumber: string;
  unitId?: {
    _id: string;
    unitNumber: string;
    unitType: string;
  };
  rentalSecretaryId?: {
    _id: string;
    name: string;
  };
  rentAmount: number;
  startDate: string;
  durationMonths: number;
  dueDay: number;
  status: string;
}

const RentalContracts: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/rental-contracts');
      setContracts(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب العقود');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/rental-contracts', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rental-contracts.xlsx');
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
        <Typography variant="h4">عقود التأجير</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={handleExport}>
            تصدير Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/renting/contracts/new')}>
            عقد جديد
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
                <TableCell>رقم المرجع</TableCell>
                <TableCell>الوحدة</TableCell>
                <TableCell>السكرتير</TableCell>
                <TableCell>الإيجار الشهري</TableCell>
                <TableCell>تاريخ البدء</TableCell>
                <TableCell>المدة (شهر)</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract._id}>
                  <TableCell>{contract.referenceNumber}</TableCell>
                  <TableCell>{contract.unitId?.unitNumber || '-'}</TableCell>
                  <TableCell>{contract.rentalSecretaryId?.name || '-'}</TableCell>
                  <TableCell>{contract.rentAmount.toFixed(3)} د.ك</TableCell>
                  <TableCell>{new Date(contract.startDate).toLocaleDateString('ar-KW')}</TableCell>
                  <TableCell>{contract.durationMonths}</TableCell>
                  <TableCell>
                    <Chip color={contract.status === 'نشط' ? 'success' : 'default'} label={contract.status} size="small" />
                  </TableCell>
                  <TableCell>
                    <Button variant="text" onClick={() => navigate(`/renting/contracts/${contract._id}`)}>
                      التفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RentalContracts;

