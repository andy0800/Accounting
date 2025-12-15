import React from 'react';
import FarwaniyaDashboard from './FarwaniyaDashboard';

const FW1Dashboard: React.FC = () => (
  <FarwaniyaDashboard
    systemKey="farwaniya1"
    title="نظام محاسبة مكتب الفروانية الأول"
    basePath="/farwaniya1"
    createIncomePath="/farwaniya1/invoices/new?type=income"
    createSpendingPath="/farwaniya1/invoices/new?type=spending"
    invoicesPath="/farwaniya1/invoices"
    accountingPath="/farwaniya1/accounting"
  />
);

export default FW1Dashboard;

