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
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

interface RentalUnit {
  _id: string;
  unitType: string;
  unitNumber: string;
  address: string;
  rentAmount: number;
  status: string;
  currentContract?: {
    _id: string;
    referenceNumber: string;
    status: string;
    startDate: string;
  };
}

const RentalUnits: React.FC = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<RentalUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/rental-units');
      const fetchedUnits = Array.isArray(response.data) ? response.data : response.data?.units || [];
      setUnits(fetchedUnits);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب الوحدات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/exports/rental-units', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rental-units.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تصدير البيانات');
    }
  };

  const openDetails = async (unitId: string) => {
    try {
      setDetailsLoading(true);
      const response = await apiClient.get(`/api/rental-units/${unitId}/details`);
      setSelectedUnit(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في جلب تفاصيل الوحدة');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedUnit(null);
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
        <Typography variant="h4">الوحدات المؤجرة</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={handleExport}>
            تصدير Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/renting/units/new')}>
            إضافة وحدة
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
                <TableCell>رقم الوحدة</TableCell>
                <TableCell>نوع الوحدة</TableCell>
                <TableCell>العنوان</TableCell>
                <TableCell>الإيجار الشهري (د.ك)</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>العقد الحالي</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit._id}>
                  <TableCell>{unit.unitNumber}</TableCell>
                  <TableCell>{unit.unitType}</TableCell>
                  <TableCell>{unit.address}</TableCell>
                  <TableCell>{unit.rentAmount.toFixed(3)} د.ك</TableCell>
                  <TableCell>
                    <Chip
                      label={unit.status}
                      color={unit.status === 'نشط' ? 'success' : unit.status === 'متاح' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{unit.currentContract?.referenceNumber || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="text"
                      startIcon={<InfoIcon />}
                      onClick={() => openDetails(unit._id)}
                      disabled={detailsLoading && selectedUnit?.unit?._id === unit._id}
                    >
                      التفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedUnit)} onClose={closeDetails} maxWidth="md" fullWidth>
        <DialogTitle>تفاصيل الوحدة</DialogTitle>
        <DialogContent dividers>
          {selectedUnit?.unit ? (
            <Box>
              <Typography variant="h6">{selectedUnit.unit.unitNumber}</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {selectedUnit.unit.unitType} - {selectedUnit.unit.address}
              </Typography>
              <Chip label={`الإيجار: ${selectedUnit.unit.rentAmount} د.ك`} sx={{ mb: 2 }} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">العقد الحالي</Typography>
              {selectedUnit.contract ? (
                <Box sx={{ mt: 1 }}>
                  <Typography>رقم العقد: {selectedUnit.contract.referenceNumber}</Typography>
                  <Typography>
                    السكرتير: {selectedUnit.contract.rentalSecretaryId?.name}{' '}
                    {selectedUnit.contract.rentalSecretaryId?.phone && `(${selectedUnit.contract.rentalSecretaryId.phone})`}
                  </Typography>
                  <Typography>الحالة: {selectedUnit.contract.status}</Typography>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/renting/contracts/${selectedUnit.contract._id}`)}
                  >
                    فتح تفاصيل العقد
                  </Button>
                </Box>
              ) : (
                <Typography color="text.secondary">لا يوجد عقد نشط لهذه الوحدة</Typography>
              )}
            </Box>
          ) : (
            <Typography>لا توجد بيانات</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RentalUnits;

