import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Box,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Secretary {
  _id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  totalEarnings: number;
  totalDebt: number;
  activeVisas: number;
  completedVisas: number;
}

const Secretaries: React.FC = () => {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSecretary, setNewSecretary] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSecretaries();
  }, []);

  const fetchSecretaries = async () => {
    try {
      const response = await axios.get('/api/secretaries');
      setSecretaries(response.data);
    } catch (error) {
      console.error('خطأ في جلب السكرتارية:', error);
    }
  };

  const handleAddSecretary = async () => {
    try {
      await axios.post('/api/secretaries', newSecretary);
      setOpenDialog(false);
      setNewSecretary({ name: '', email: '', phone: '' });
      fetchSecretaries();
    } catch (error) {
      console.error('خطأ في إضافة السكرتير:', error);
    }
  };

  const handleViewSecretary = (id: string) => {
    navigate(`/secretary/${id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          إدارة السكرتارية
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: 2, px: 3 }}
        >
          إضافة سكرتير جديد
        </Button>
      </Box>

      <Grid container spacing={3}>
        {secretaries.map((secretary) => (
          <Grid item xs={12} md={6} lg={4} key={secretary._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" component="h2">
                    {secretary.name}
                  </Typography>
                  <Chip 
                    label={secretary.code} 
                    size="small" 
                    color="primary" 
                    sx={{ mr: 'auto' }}
                  />
                </Box>
                
                <Typography color="text.secondary" gutterBottom>
                  {secretary.email}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {secretary.phone}
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      الأرباح الإجمالية
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {secretary.totalEarnings.toLocaleString()} ريال
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      الديون
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {secretary.totalDebt.toLocaleString()} ريال
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    التأشيرات النشطة: {secretary.activeVisas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    التأشيرات المكتملة: {secretary.completedVisas}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewSecretary(secretary._id)}
                    fullWidth
                  >
                    عرض التفاصيل
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة سكرتير جديد</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="الاسم"
            fullWidth
            variant="outlined"
            value={newSecretary.name}
            onChange={(e) => setNewSecretary({ ...newSecretary, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="البريد الإلكتروني"
            type="email"
            fullWidth
            variant="outlined"
            value={newSecretary.email}
            onChange={(e) => setNewSecretary({ ...newSecretary, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="رقم الهاتف"
            fullWidth
            variant="outlined"
            value={newSecretary.phone}
            onChange={(e) => setNewSecretary({ ...newSecretary, phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button onClick={handleAddSecretary} variant="contained">إضافة</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Secretaries; 