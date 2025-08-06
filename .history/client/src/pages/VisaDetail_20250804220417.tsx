import React from 'react';
import { Container, Typography } from '@mui/material';

const VisaDetail: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        تفاصيل التأشيرة
      </Typography>
      <Typography>تفاصيل التأشيرة - قيد التطوير</Typography>
    </Container>
  );
};

export default VisaDetail; 