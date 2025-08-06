import React from 'react';
import { Container, Typography } from '@mui/material';

const Accounts: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        الحسابات
      </Typography>
      <Typography>إدارة الحسابات - قيد التطوير</Typography>
    </Container>
  );
};

export default Accounts; 