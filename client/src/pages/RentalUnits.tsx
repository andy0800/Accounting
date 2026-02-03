import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';

type RentalStatus = 'متاح' | 'نشط' | 'منتهي' | 'صيانة';

interface RentalUnit {
  _id: string;
  unitType: string;
  unitNumber: string;
  address: string;
  rentAmount: number;
  status: RentalStatus | string;
  notes?: string;
  createdAt?: string;
  currentContract?: {
    _id: string;
    referenceNumber: string;
    status: string;
    startDate: string;
  } | null;
}

interface RentalUnitCounts {
  total: number;
  byStatus: Record<string, number>;
}

interface RentalUnitPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

interface RentalUnitDetails {
  unit: RentalUnit & {
    attachments?: Array<{ name: string; filePath: string }>;
  };
  contract: {
    _id: string;
    referenceNumber: string;
    status: string;
    startDate: string;
    durationMonths: number;
    rentalSecretaryId?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  } | null;
}

const STATUS_OPTIONS: Array<{ label: string; value: 'all' | RentalStatus }> = [
  { label: 'الكل', value: 'all' },
  { label: 'متاح', value: 'متاح' },
  { label: 'نشط', value: 'نشط' },
  { label: 'منتهي', value: 'منتهي' },
  { label: 'صيانة', value: 'صيانة' },
];

const INITIAL_PAGINATION: RentalUnitPagination = {
  page: 1,
  limit: 10,
  total: 0,
  pages: 1,
  hasMore: false,
};

const formatCurrency = (value: number) =>
  Intl.NumberFormat('en-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value || 0);

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

const statusColorMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  متاح: 'primary',
  نشط: 'success',
  منتهي: 'warning',
  صيانة: 'default',
};

const aggregateCounts = (list: RentalUnit[]): RentalUnitCounts => {
  const counts: RentalUnitCounts = { total: list.length, byStatus: {} };
  list.forEach((unit) => {
    const key = unit.status || 'غير محدد';
    counts.byStatus[key] = (counts.byStatus[key] || 0) + 1;
  });
  return counts;
};

const normalizeResponse = (
  data: any,
  fallbackLimit: number,
  requestedPage: number
): {
  units: RentalUnit[];
  counts: RentalUnitCounts;
  pagination: RentalUnitPagination;
  sort: string;
} => {
  if (Array.isArray(data)) {
    const counts = aggregateCounts(data);
    return {
      units: data,
      counts,
      pagination: {
        page: 1,
        limit: data.length || fallbackLimit,
        total: counts.total,
        pages: data.length && fallbackLimit ? Math.max(1, Math.ceil(counts.total / fallbackLimit)) : 1,
        hasMore: false,
      },
      sort: '-createdAt',
    };
  }

  const units: RentalUnit[] = Array.isArray(data?.units) ? data.units : [];
  const counts: RentalUnitCounts = {
    total: typeof data?.counts?.total === 'number' ? data.counts.total : units.length,
    byStatus: data?.counts?.byStatus ?? aggregateCounts(units).byStatus,
  };

  const responseLimit = typeof data?.pagination?.limit === 'number' ? data.pagination.limit : fallbackLimit;
  const total = counts.total;
  const pages = responseLimit > 0 ? Math.max(1, Math.ceil(total / responseLimit)) : 1;
  const page =
    typeof data?.pagination?.page === 'number'
      ? data.pagination.page
      : Math.min(Math.max(1, requestedPage), pages);

  return {
    units,
    counts,
    pagination: {
      page,
      limit: responseLimit,
      total,
      pages,
      hasMore: data?.pagination?.hasMore ?? page < pages,
    },
    sort: typeof data?.sort === 'string' ? data.sort : '-createdAt',
  };
};

const RentalUnits: React.FC = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<RentalUnit[]>([]);
  const [counts, setCounts] = useState<RentalUnitCounts>({ total: 0, byStatus: {} });
  const [pagination, setPagination] = useState<RentalUnitPagination>(INITIAL_PAGINATION);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'all' | RentalStatus>('all');
  const [sort, setSort] = useState('-createdAt');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<RentalUnitDetails | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: page + 1,
        limit: rowsPerPage,
        sort,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      console.log('🔍 Fetching rental units with params:', params);
      const response = await apiClient.get('/api/fursatkum/rental-units', { params });
      console.log('📦 Raw API response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
      console.log('📦 Response data keys:', response.data ? Object.keys(response.data) : 'null/undefined');
      
      const data = response.data;
      const normalized = normalizeResponse(data, rowsPerPage, params.page);
      
      console.log('✅ Normalized response:', normalized);
      console.log('✅ Units count:', normalized.units.length);
      console.log('✅ First unit:', normalized.units[0]);

      // Debug: Store raw response for inspection
      setDebugInfo({
        rawResponse: data,
        normalized,
        unitsCount: normalized.units.length,
        responseType: Array.isArray(data) ? 'array' : typeof data,
        responseKeys: data ? Object.keys(data) : [],
      });

      setUnits(normalized.units);
      setCounts(normalized.counts);
      setPagination(normalized.pagination);

      const zeroIndexPage = Math.max(0, normalized.pagination.page - 1);
      setPage((prev) => (prev === zeroIndexPage ? prev : zeroIndexPage));
    } catch (err: any) {
      console.error('❌ Error fetching rental units:', err);
      console.error('❌ Error response:', err?.response);
      console.error('❌ Error data:', err?.response?.data);
      const errorMessage = err?.response?.data?.message || err?.message || 'فشل في جلب الوحدات';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sort, statusFilter, search]);

  useEffect(() => {
    console.log('🚀 RentalUnits component mounted, fetching units...');
    fetchUnits();
  }, [fetchUnits]);
  
  useEffect(() => {
    console.log('📊 Units state updated:', units.length, 'units');
    console.log('📊 Counts:', counts);
    console.log('📊 Pagination:', pagination);
  }, [units, counts, pagination]);

  const handleStatusSelect = (value: 'all' | RentalStatus) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handleSortClick = (column: string) => {
    setPage(0);
    setSort((prev) => {
      const normalized = prev.replace('-', '');
      if (normalized === column) {
        return prev.startsWith('-') ? column : `-${column}`;
      }
      return column;
    });
  };

  const currentSort = useMemo(() => {
    const direction = sort.startsWith('-') ? 'desc' : 'asc';
    const column = sort.replace('-', '');
    return { column, direction };
  }, [sort]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/api/fursatkum/exports/rental-units', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'rental-units.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل في تصدير البيانات');
    }
  };

  const handleRefresh = () => {
    fetchUnits();
  };

  const openDetails = async (unitId: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const response = await apiClient.get(`/api/fursatkum/rental-units/${unitId}/details`);
      setDetailsData(response.data);
    } catch (err: any) {
      setDetailsError(err?.response?.data?.message || 'فشل في جلب تفاصيل الوحدة');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsData(null);
    setDetailsError(null);
  };

  const summaryCards = [
    { label: 'إجمالي الوحدات', value: counts.total.toLocaleString('en-US') },
    { label: 'الوحدات المتاحة', value: (counts.byStatus?.['متاح'] ?? 0).toLocaleString('en-US') },
    { label: 'الوحدات النشطة', value: (counts.byStatus?.['نشط'] ?? 0).toLocaleString('en-US') },
    { label: 'الوحدات المنتهية', value: (counts.byStatus?.['منتهي'] ?? 0).toLocaleString('en-US') },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            إدارة وحدات التأجير
          </Typography>
          <Typography color="text.secondary">
            تتبع جميع الوحدات، حالات العقود، والمدفوعات المرتبطة بكل وحدة
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="تصدير الوحدات إلى ملف Excel">
            <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={handleExport}>
              تصدير Excel
            </Button>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/fursatkum/renting/units/new')}>
            إضافة وحدة
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              إعادة المحاولة
            </Button>
          }
        >
          <Typography variant="body1" fontWeight="bold">
            خطأ في جلب البيانات
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            تحقق من اتصال الإنترنت وحالة المصادقة
          </Typography>
        </Alert>
      )}

      {/* Debug Info - Remove after fixing */}
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="caption" component="div">
            <strong>Debug Info:</strong><br />
            Response Type: {debugInfo.responseType}<br />
            Response Keys: {debugInfo.responseKeys.join(', ') || 'none'}<br />
            Units Count: {debugInfo.unitsCount}<br />
            Current Units State: {units.length}<br />
            <details style={{ marginTop: '8px' }}>
              <summary>Raw Response (click to expand)</summary>
              <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(debugInfo.rawResponse, null, 2)}
              </pre>
            </details>
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {card.label}
                </Typography>
                <Typography variant="h5">{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(0);
              }}
              placeholder="ابحث برقم الوحدة، العنوان، أو نوع الوحدة"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {STATUS_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  icon={<FilterListIcon />}
                  label={`${option.label} (${option.value === 'all' ? counts.total : counts.byStatus?.[option.value] ?? 0})`}
                  color={statusFilter === option.value ? 'primary' : 'default'}
                  variant={statusFilter === option.value ? 'filled' : 'outlined'}
                  onClick={() => handleStatusSelect(option.value)}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="تحديث القائمة">
                <span>
                  <IconButton color="primary" onClick={handleRefresh} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['unitNumber', 'unitType', 'address', 'rentAmount', 'status', 'createdAt'].map((column) => {
                  const labels: Record<string, string> = {
                    unitNumber: 'رقم الوحدة',
                    unitType: 'نوع الوحدة',
                    address: 'العنوان',
                    rentAmount: 'الإيجار الشهري (د.ك)',
                    status: 'الحالة',
                    createdAt: 'تاريخ الإنشاء',
                  };
                  const sortable = column !== 'address';
                  const isActive = currentSort.column === column;
                  const direction = currentSort.direction === 'desc' ? 'desc' : 'asc';
                  return (
                    <TableCell key={column}>
                      {sortable ? (
                        <TableSortLabel
                          active={isActive}
                          direction={isActive ? direction : 'asc'}
                          onClick={() => handleSortClick(column)}
                        >
                          {labels[column]}
                        </TableSortLabel>
                      ) : (
                        labels[column]
                      )}
                    </TableCell>
                  );
                })}
                <TableCell>العقد الحالي</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && units.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        لا توجد وحدات مطابقة
                      </Typography>
                      <Typography color="text.secondary">
                        جرّب تعديل المرشحات أو إضافة وحدة جديدة
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {units.map((unit) => (
                <TableRow hover key={unit._id}>
                  <TableCell>{unit.unitNumber}</TableCell>
                  <TableCell>{unit.unitType}</TableCell>
                  <TableCell>{unit.address}</TableCell>
                  <TableCell>{`${formatCurrency(unit.rentAmount)} د.ك`}</TableCell>
                  <TableCell>
                    <Chip
                      label={unit.status}
                      color={statusColorMap[unit.status] ?? 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(unit.createdAt)}</TableCell>
                  <TableCell>{unit.currentContract?.referenceNumber || '-'}</TableCell>
                  <TableCell align="center">
                    <Button variant="text" startIcon={<InfoIcon />} onClick={() => openDetails(unit._id)}>
                      التفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={pagination.total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="الصفوف في الصفحة"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
        />
      </Card>

      <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="md" fullWidth>
        <DialogTitle>تفاصيل الوحدة</DialogTitle>
        <DialogContent dividers>
          {detailsLoading && (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {detailsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {detailsError}
            </Alert>
          )}

          {!detailsLoading && detailsData?.unit && (
            <Box>
              <Typography variant="h6">{detailsData.unit.unitNumber}</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {detailsData.unit.unitType} - {detailsData.unit.address}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label={`الإيجار: ${formatCurrency(detailsData.unit.rentAmount)} د.ك`} />
                <Chip label={`الحالة: ${detailsData.unit.status}`} />
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                العقد الحالي
              </Typography>

              {detailsData.contract ? (
                <Box>
                  <Typography>رقم العقد: {detailsData.contract.referenceNumber}</Typography>
                  <Typography>الحالة: {detailsData.contract.status}</Typography>
                  <Typography>بداية العقد: {formatDate(detailsData.contract.startDate)}</Typography>
                  <Typography>
                    مدة العقد: {detailsData.contract.durationMonths} شهر / السكرتير:{' '}
                    {detailsData.contract.rentalSecretaryId?.name || '-'}
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      closeDetails();
                      navigate(`/fursatkum/renting/contracts/${detailsData.contract?._id}`);
                    }}
                  >
                    فتح تفاصيل العقد
                  </Button>
                </Box>
              ) : (
                <Typography color="text.secondary">لا يوجد عقد نشط لهذه الوحدة</Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RentalUnits;

