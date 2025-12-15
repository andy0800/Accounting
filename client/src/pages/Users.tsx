import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Container, Grid, TextField, Typography, Alert, MenuItem, CircularProgress } from '@mui/material';
import apiClient from '../config/axios';

interface UserRow { username: string; role: 'admin' | 'secretary' | 'home_service_user' | 'farwaniya1_user' | 'farwaniya2_user'; }

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'secretary' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get('/api/users');
      setUsers(resp.data?.users || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    try {
      setCreating(true);
      await apiClient.post('/api/users', form);
      setSuccess('تم إنشاء المستخدم');
      setForm({ username: '', password: '', role: 'secretary' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل إنشاء المستخدم');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>إدارة المستخدمين</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>إنشاء مستخدم جديد</Typography>
          <Box component="form" onSubmit={handleCreate}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="اسم المستخدم" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="password" label="كلمة المرور" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label="الدور" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRow['role'] })}>
                  <MenuItem value="secretary">سكرتير (Secretary)</MenuItem>
                  <MenuItem value="admin">مسؤول (Admin)</MenuItem>
                  <MenuItem value="home_service_user">مستخدم خدمات منزلية (Home Service)</MenuItem>
                  <MenuItem value="farwaniya1_user">مستخدم مكتب الفروانية الأول</MenuItem>
                  <MenuItem value="farwaniya2_user">مستخدم مكتب الفروانية الثاني</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button type="submit" variant="contained" startIcon={creating ? <CircularProgress size={20} /> : null} disabled={creating}>
                    {creating ? 'جاري الإنشاء...' : 'إنشاء'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>المستخدمون</Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {users.map((u) => {
                const roleLabels: Record<string, string> = {
                  admin: 'مسؤول',
                  secretary: 'سكرتير',
                  home_service_user: 'مستخدم خدمات منزلية',
                  farwaniya1_user: 'مستخدم مكتب الفروانية الأول',
                  farwaniya2_user: 'مستخدم مكتب الفروانية الثاني',
                };
                return (
                  <li key={u.username}>
                    <Typography variant="body2">{u.username} — {roleLabels[u.role] || u.role}</Typography>
                  </li>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Users;


