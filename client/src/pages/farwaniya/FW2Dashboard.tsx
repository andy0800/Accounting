import React from 'react';
import FarwaniyaDashboard from './FarwaniyaDashboard';

const FW2Dashboard: React.FC = () => (
  <FarwaniyaDashboard
    systemKey="farwaniya2"
    title="نظام محاسبة مكتب الفروانية الثاني"
    basePath="/farwaniya2"
    createIncomePath="/farwaniya2/invoices/new?type=income"
    createSpendingPath="/farwaniya2/invoices/new?type=spending"
    invoicesPath="/farwaniya2/invoices"
    accountingPath="/farwaniya2/accounting"
  />
);

export default FW2Dashboard;

