import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  InputAdornment,
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
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import apiClient from '../../config/axios';

interface Invoice {
  _id: string;
  referenceNumber: string;
  type: 'income' | 'spending';
  name: string;
  value: number;
  date: string;
  details?: string;
  document?: { name: string; filePath: string };
  status: 'active' | 'deleted';
  isEdited: boolean;
  editHistory: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    editedAt: string;
    editedBy?: { username: string };
  }>;
  createdBy?: { username: string };
  deletedBy?: { username: string };
  deletedAt?: string;
  createdAt: string;
}

const HSInvoiceDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialEditMode = searchParams.get('edit') === 'true';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(initialEditMode);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    date: '',
    details: '',
  });
  const [newDocument, setNewDocument] = useState<File | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [fundingCredit, setFundingCredit] = useState<number>(0);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const [invoiceRes, dashboardRes] = await Promise.all([
        apiClient.get(`/api/home-service/invoices/${id}`),
        apiClient.get('/api/home-service/dashboard'),
      ]);
      const inv = invoiceRes.data;
      setInvoice(inv);
      setFormData({
        name: inv.name,
        value: inv.value.toString(),
        date: inv.date.split('T')[0],
        details: inv.details || '',
      });
      setFundingCredit(dashboardRes.data.fundingCredit);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب الفاتورة');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!invoice) return;
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('اسم الفاتورة مطلوب');
      return;
    }
    const newValue = parseFloat(formData.value);
    if (isNaN(newValue) || newValue <= 0) {
      setError('قيمة الفاتورة غير صالحة');
      return;
    }

    // Check funding credit for spending increase
    if (invoice.type === 'spending' && newValue > invoice.value) {
      const difference = newValue - invoice.value;
      if (difference > fundingCredit) {
        setError(`رصيد التمويل غير كافٍ للزيادة. المتاح: ${fundingCredit.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك`);
        return;
      }
    }

    try {
      setSaving(true);
      
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('value', formData.value);
      submitData.append('date', formData.date);
      submitData.append('details', formData.details);
      if (newDocument) submitData.append('document', newDocument);

      await apiClient.put(`/api/home-service/invoices/${id}`, submitData);
      setEditMode(false);
      setNewDocument(null);
      fetchInvoice();
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في تحديث الفاتورة');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await apiClient.delete(`/api/home-service/invoices/${id}`);
      navigate('/home-service/invoices');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في حذف الفاتورة');
    } finally {
      setSaving(false);
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">الفاتورة غير موجودة</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          رجوع
        </Button>
      </Box>
    );
  }

  const fieldLabels: Record<string, string> = {
    name: 'الاسم',
    value: 'القيمة',
    date: 'التاريخ',
    details: 'التفاصيل',
    document: 'المستند',
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        رجوع
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {invoice.referenceNumber}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={invoice.type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}
                  color={invoice.type === 'income' ? 'success' : 'error'}
                />
                {invoice.isEdited && (
                  <Chip label="تم التعديل" color="warning" />
                )}
                {invoice.status === 'deleted' && (
                  <Chip label="محذوف" color="default" />
                )}
              </Box>
            </Box>
            {invoice.status === 'active' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!editMode ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(true)}
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialog(true)}
                    >
                      حذف
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outlined" onClick={() => { setEditMode(false); fetchInvoice(); }}>
                      إلغاء
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      حفظ
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {editMode && invoice.type === 'spending' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              رصيد التمويل المتاح: <strong>{fundingCredit.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك</strong>
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="الاسم"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!editMode}
              fullWidth
            />

            <TextField
              label="القيمة"
              type="number"
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              disabled={!editMode}
              fullWidth
              inputProps={{ min: 0.001, step: 0.001 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">د.ك</InputAdornment>,
              }}
            />

            <TextField
              label="التاريخ"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              disabled={!editMode}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="التفاصيل"
              value={formData.details}
              onChange={(e) => handleChange('details', e.target.value)}
              disabled={!editMode}
              multiline
              rows={3}
              fullWidth
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>المستند</Typography>
              {invoice.document ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={invoice.document.name} />
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    href={`${process.env.REACT_APP_API_URL || ''}/uploads/home-service/${invoice.document.filePath}`}
                    target="_blank"
                  >
                    تحميل
                  </Button>
                </Box>
              ) : (
                <Typography color="textSecondary">لا يوجد مستند</Typography>
              )}
              {editMode && (
                <Box sx={{ mt: 1 }}>
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                    {newDocument ? newDocument.name : 'رفع مستند جديد'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                  </Button>
                  {newDocument && (
                    <Button size="small" color="error" onClick={() => setNewDocument(null)} sx={{ ml: 1 }}>
                      إزالة
                    </Button>
                  )}
                </Box>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2">معلومات إضافية</Typography>
              <Typography variant="body2" color="textSecondary">
                أنشأها: {invoice.createdBy?.username || '-'} | 
                تاريخ الإنشاء: {new Date(invoice.createdAt).toLocaleString('ar-KW')}
              </Typography>
              {invoice.status === 'deleted' && (
                <Typography variant="body2" color="error">
                  حذفها: {invoice.deletedBy?.username || '-'} | 
                  تاريخ الحذف: {invoice.deletedAt ? new Date(invoice.deletedAt).toLocaleString('ar-KW') : '-'}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Edit History */}
      {invoice.editHistory && invoice.editHistory.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              سجل التعديلات
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الحقل</TableCell>
                    <TableCell>القيمة القديمة</TableCell>
                    <TableCell>القيمة الجديدة</TableCell>
                    <TableCell>التاريخ</TableCell>
                    <TableCell>بواسطة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.editHistory.map((edit, index) => (
                    <TableRow key={index}>
                      <TableCell>{fieldLabels[edit.field] || edit.field}</TableCell>
                      <TableCell>{String(edit.oldValue)}</TableCell>
                      <TableCell>{String(edit.newValue)}</TableCell>
                      <TableCell>{new Date(edit.editedAt).toLocaleString('ar-KW')}</TableCell>
                      <TableCell>{edit.editedBy?.username || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف الفاتورة "{invoice.name}"؟
            <br />
            <strong>سيتم عكس المبلغ تلقائياً وتسجيل الفاتورة في قسم المحذوفات.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={handleDelete} color="error" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HSInvoiceDetails;

