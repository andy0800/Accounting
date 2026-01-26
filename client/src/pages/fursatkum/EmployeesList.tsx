import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/axios';

interface EmployeeRow {
  _id: string;
  name: string;
  monthlySalary: number;
  status: 'active' | 'inactive';
}

interface LoanRow {
  _id: string;
  employeeId: string | { _id: string; username: string };
  remainingAmount: number;
  status: 'active' | 'paid' | 'cancelled';
}

interface SalaryRow {
  _id: string;
  employeeId: string | { _id: string; username: string };
  grossSalary: number;
  netPaid: number;
  date: string;
}

const EmployeesList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [salaries, setSalaries] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employeesResp, loansResp, salariesResp] = await Promise.all([
        apiClient.get('/api/fursatkum/employees', { params: { status: 'active', limit: 500 } }),
        apiClient.get('/api/fursatkum/employee-loans', { params: { status: 'active', limit: 500 } }),
        apiClient.get('/api/fursatkum/salaries', { params: { limit: 500 } }),
      ]);
      setEmployees(employeesResp.data?.employees || []);
      setLoans(loansResp.data?.loans || []);
      setSalaries(salariesResp.data?.salaries || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطأ في جلب بيانات الموظفين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loanTotalsByEmployee = useMemo(() => {
    const totals = new Map<string, number>();
    loans.forEach((loan) => {
      const id = typeof loan.employeeId === 'string' ? loan.employeeId : loan.employeeId._id;
      totals.set(id, (totals.get(id) || 0) + (loan.remainingAmount || 0));
    });
    return totals;
  }, [loans]);

  const latestSalaryByEmployee = useMemo(() => {
    const latest = new Map<string, SalaryRow>();
    salaries.forEach((salary) => {
      const id = typeof salary.employeeId === 'string' ? salary.employeeId : salary.employeeId._id;
      const current = latest.get(id);
      if (!current || new Date(salary.date).getTime() > new Date(current.date).getTime()) {
        latest.set(id, salary);
      }
    });
    return latest;
  }, [salaries]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          موظفو فرصتكم
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
            تحديث
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/fursatkum/employees/new')}>
            موظف جديد
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

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الموظف</TableCell>
                      <TableCell>الراتب الشهري</TableCell>
                    <TableCell>آخر راتب</TableCell>
                    <TableCell>القرض المستحق</TableCell>
                    <TableCell>إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        لا يوجد موظفون
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => {
                      const loanTotal = loanTotalsByEmployee.get(emp._id) || 0;
                      const latestSalary = latestSalaryByEmployee.get(emp._id);
                      return (
                        <TableRow key={emp._id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                          <TableCell>
                            {emp.monthlySalary.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                          </TableCell>
                          <TableCell>
                            {latestSalary
                              ? `${latestSalary.grossSalary.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك`
                              : '-'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {loanTotal.toLocaleString('en-US', { minimumFractionDigits: 3 })} د.ك
                          </TableCell>
                          <TableCell>
                            <Grid container spacing={1}>
                              <Grid item>
                                <Button size="small" onClick={() => navigate(`/fursatkum/employees/${emp._id}`)}>
                                  التفاصيل
                                </Button>
                              </Grid>
                              <Grid item>
                                <Button
                                  size="small"
                                  onClick={() => navigate(`/fursatkum/loans/new?employeeId=${emp._id}`)}
                                >
                                  قرض
                                </Button>
                              </Grid>
                              <Grid item>
                                <Button
                                  size="small"
                                  onClick={() => navigate(`/fursatkum/salaries/process?employeeId=${emp._id}`)}
                                >
                                  راتب
                                </Button>
                              </Grid>
                            </Grid>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeesList;

