import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Container, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import apiClient from '../config/axios';
import { auth } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const resp = await apiClient.post('/api/auth/login', { username, password });
      auth.login(resp.data.token, resp.data.role, resp.data.username);
      // Redirect based on role
      if (resp.data.role === 'secretary') {
        navigate('/trial-contracts');
      } else {
        navigate('/');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>تسجيل الدخول</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
            />
            <TextField
              fullWidth
              type="password"
              label="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" fullWidth startIcon={loading ? <CircularProgress size={20} /> : null} disabled={loading}>
              {loading ? 'جاري الدخول...' : 'دخول'}
            </Button>
          </Box>
          {/* Removed visible default credentials for security */}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;


