import React from 'react';
import { Container, Typography } from '@mui/material';

const NewVisa: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        تأشيرة جديدة
      </Typography>
      <Typography>نموذج إنشاء تأشيرة جديدة - قيد التطوير</Typography>
    </Container>
  );
};

export default NewVisa; 