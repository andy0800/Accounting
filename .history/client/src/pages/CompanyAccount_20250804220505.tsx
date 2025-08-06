import React from 'react';
import { Container, Typography } from '@mui/material';

const CompanyAccount: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        حساب الشركة
      </Typography>
      <Typography>حساب شركة فرصتكم - قيد التطوير</Typography>
    </Container>
  );
};

export default CompanyAccount; 