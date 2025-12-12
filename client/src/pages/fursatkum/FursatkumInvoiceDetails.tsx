import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../config/axios';

interface Invoice {
  _id: string;
  referenceNumber: string;
  type: 'income' | 'spending';
  ledger: 'cash' | 'bank';
  bankReference?: string;
  name: string;
  value: number;
  date: string;
  details?: string;
  status: 'active' | 'deleted';
  isEdited?: boolean;
  editHistory?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
    editedAt: string;
    editedBy?: { username: string };
  }>;
  deleteReason?: string;
  document?: { name: string; filePath: string };
}

const ledgerLabels: Record<string, string> = { bank: 'حساب بنكي', cash: 'صندوق نقدي' };
const typeLabels: Record<string, string> = { income: 'فاتورة دخل', spending: 'إيصال صرف' };

const FursatkumInvoiceDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState({ name: '', value: '', date: '', details: '', bankReference: '', reason: '' });
  const [working, setWorking] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/fursatkum/invoices/${id}`);
      setInvoice(response.data);
      setForm({
        name: response.data.name,
        value: response.data.value?.toString() || '',
        date: response.data.date ? response.data.date.split('T')[0] : '',
        details: response.data.details || '',
        bankReference: response.data.bankReference || '',
        reason: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!form.reason) {
      setError('سبب التعديل مطلوب');
      return;
    }
    try {
      setWorking(true);
      setError(null);
      await apiClient.put(
        `/api/fursatkum/invoices/${id}`,
        {
          name: form.name,
          value: form.value,
          date: form.date,
          details: form.details,
          bankReference: invoice?.ledger === 'bank' ? form.bankReference : undefined,
          reason: form.reason,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setEditDialog(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في تحديث الفاتورة');
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!form.reason) {
      setError('سبب الحذف مطلوب');
      return;
    }
    try {
      setWorking(true);
      setError(null);
      await apiClient.delete(`/api/fursatkum/invoices/${id}`, {
        data: { reason: form.reason },
      });
      navigate('/fursatkum/deleted');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في حذف الفاتورة');
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          فاتورة {invoice.referenceNumber}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => setEditDialog(true)} disabled={invoice.status === 'deleted'}>
            تعديل
          </Button>
          <Button variant="outlined" color="error" onClick={() => setDeleteDialog(true)} disabled={invoice.status === 'deleted'}>
            حذف
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

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">النوع</Typography>
              <Typography>{typeLabels[invoice.type]}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">الدفة</Typography>
              <Typography>{ledgerLabels[invoice.ledger]}</Typography>
            </Grid>
            {invoice.ledger === 'bank' && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2">المرجع البنكي</Typography>
                <Typography>{invoice.bankReference || '-'}</Typography>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">الحالة</Typography>
              <Chip label={invoice.status === 'active' ? 'نشط' : 'محذوف'} color={invoice.status === 'active' ? 'success' : 'error'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">القيمة</Typography>
              <Typography fontWeight="bold">{invoice.value.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">التاريخ</Typography>
              <Typography>{new Date(invoice.date).toLocaleDateString('ar-KW')}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">الاسم</Typography>
              <Typography>{invoice.name}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">التفاصيل</Typography>
              <Typography>{invoice.details || '-'}</Typography>
            </Grid>
            {invoice.document && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">المستند</Typography>
                <Button
                  component="a"
                  href={`/uploads/fursatkum/${invoice.document.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {invoice.document.name}
                </Button>
              </Grid>
            )}
            {invoice.deleteReason && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">سبب الحذف</Typography>
                <Typography color="error">{invoice.deleteReason}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {invoice.editHistory && invoice.editHistory.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              سجل التعديلات
            </Typography>
            {invoice.editHistory.map((edit, idx) => (
              <Box key={idx} sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
                <Typography variant="subtitle2">الحقل: {edit.field}</Typography>
                <Typography variant="body2">السابق: {String(edit.oldValue)}</Typography>
                <Typography variant="body2">الجديد: {String(edit.newValue)}</Typography>
                <Typography variant="body2">السبب: {edit.reason}</Typography>
                <Typography variant="caption">
                  في {new Date(edit.editedAt).toLocaleString('ar-KW')} بواسطة {edit.editedBy?.username || 'غير معروف'}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>تعديل الفاتورة</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="الاسم"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="القيمة"
                type="number"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                inputProps={{ min: 0.001, step: 0.001 }}
              />
            </Grid>
            {invoice.ledger === 'bank' && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="المرجع البنكي"
                  value={form.bankReference}
                  onChange={(e) => setForm((p) => ({ ...p, bankReference: e.target.value }))}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="date"
                label="التاريخ"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="التفاصيل"
                value={form.details}
                onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="سبب التعديل (إلزامي)"
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} disabled={working}>
            إلغاء
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={working} startIcon={working ? <CircularProgress size={20} /> : undefined}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>حذف الفاتورة</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>سيتم عكس الأرصدة المرتبطة بهذه الفاتورة.</Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="سبب الحذف (إلزامي)"
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} disabled={working}>
            إلغاء
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={working} startIcon={working ? <CircularProgress size={20} /> : undefined}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FursatkumInvoiceDetails;


