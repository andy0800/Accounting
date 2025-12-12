import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Description as VisaIcon,
  AccountBalance as AccountIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  Description,
  Home as HomeIcon,
  Business as BusinessIcon,
  Apartment as ApartmentIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  Delete as DeleteIcon,
  HomeWork as HomeWorkIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import CacheClearButton from './CacheClearButton';
import { auth } from '../utils/auth';

const drawerWidth = 280;

const Navigation: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const role = auth.getRole();

  const menuItems = [
    { text: 'لوحة التحكم', icon: <DashboardIcon />, path: '/', section: 'main', roles: ['admin'] },
    { text: 'السكرتارية', icon: <PeopleIcon />, path: '/secretaries', section: 'visa', roles: ['admin'] },
    { text: 'التأشيرات', icon: <VisaIcon />, path: '/visas', section: 'visa', roles: ['admin'] },
    { text: 'الحسابات', icon: <AccountIcon />, path: '/accounts', section: 'visa', roles: ['admin'] },
    { text: 'تأشيرة جديدة', icon: <AddIcon />, path: '/visas/new', section: 'visa', roles: ['admin'] },
    { text: 'عقود التجربة', icon: <Description />, path: '/trial-contracts', section: 'visa', roles: ['admin','secretary'] },
    { text: 'عقد تجربة جديد', icon: <AddIcon />, path: '/trial-contracts/new', section: 'visa', roles: ['admin','secretary'] },
    { text: 'المستخدمون', icon: <PeopleIcon />, path: '/users', section: 'admin', roles: ['admin'] },
  ];

  const rentingMenuItems = [
    { text: 'لوحة التأجير', icon: <HomeIcon />, path: '/renting', roles: ['admin'] },
    { text: 'سكرتارية التأجير', icon: <BusinessIcon />, path: '/renting/secretaries', roles: ['admin'] },
    { text: 'وحدة جديدة', icon: <AddIcon />, path: '/renting/units/new', roles: ['admin'] },
    { text: 'الوحدات', icon: <ApartmentIcon />, path: '/renting/units', roles: ['admin'] },
    { text: 'عقد تأجير جديد', icon: <AddIcon />, path: '/renting/contracts/new', roles: ['admin'] },
    { text: 'عقود التأجير', icon: <Description />, path: '/renting/contracts', roles: ['admin'] },
    { text: 'إدارة الدفعات', icon: <AssessmentIcon />, path: '/renting/management', roles: ['admin'] },
    { text: 'محاسبة التأجير', icon: <AccountIcon />, path: '/renting/accounting', roles: ['admin'] },
  ];

  const homeServiceMenuItems = [
    { text: 'لوحة التحكم', icon: <DashboardIcon />, path: '/home-service', roles: ['admin', 'home_service_user'] },
    { text: 'الفواتير', icon: <ReceiptIcon />, path: '/home-service/invoices', roles: ['admin', 'home_service_user'] },
    { text: 'فاتورة دخل جديدة', icon: <AddIcon />, path: '/home-service/invoices/new?type=income', roles: ['admin', 'home_service_user'] },
    { text: 'إيصال صرف جديد', icon: <AddIcon />, path: '/home-service/invoices/new?type=spending', roles: ['admin', 'home_service_user'] },
    { text: 'المحذوفات', icon: <DeleteIcon />, path: '/home-service/deleted', roles: ['admin', 'home_service_user'] },
    { text: 'المحاسبة', icon: <AccountIcon />, path: '/home-service/accounting', roles: ['admin', 'home_service_user'] },
  ];

  const fursatkumMenuItems = [
    { text: 'لوحة فرصتكم', icon: <DashboardIcon />, path: '/fursatkum', roles: ['admin'] },
    { text: 'فواتير فرصتكم', icon: <ReceiptIcon />, path: '/fursatkum/invoices', roles: ['admin'] },
    { text: 'فاتورة دخل جديدة', icon: <AddIcon />, path: '/fursatkum/invoices/new?type=income', roles: ['admin'] },
    { text: 'إيصال صرف جديد', icon: <AddIcon />, path: '/fursatkum/invoices/new?type=spending', roles: ['admin'] },
    { text: 'المحذوفات', icon: <DeleteIcon />, path: '/fursatkum/deleted', roles: ['admin'] },
    { text: 'محاسبة فرصتكم', icon: <WalletIcon />, path: '/fursatkum/accounting', roles: ['admin'] },
  ];

  const systemOptions = [
    { value: 'visa', label: 'نظام التأشيرات', path: '/' },
    { value: 'renting', label: 'نظام التأجير', path: '/renting' },
    { value: 'home', label: 'نظام محاسبة الخدمات المنزلية', path: '/home-service' },
    { value: 'fursatkum', label: 'نظام محاسبة فرصتكم', path: '/fursatkum' },
  ];

  const getSystemFromPath = (pathname: string) => {
    if (pathname.startsWith('/renting')) return 'renting';
    if (pathname.startsWith('/home-service')) return 'home';
    if (pathname.startsWith('/fursatkum')) return 'fursatkum';
    return 'visa';
  };

  const selectedSystem = role === 'admin' ? getSystemFromPath(location.pathname) : null;

  const handleSystemChange = (value: string) => {
    const target = systemOptions.find((opt) => opt.value === value);
    if (target) {
      handleNavigation(target.path);
    }
  };

  const getMenuBySystem = (system: string) => {
    switch (system) {
      case 'renting':
        return rentingMenuItems;
      case 'home':
        return homeServiceMenuItems;
      case 'fursatkum':
        return fursatkumMenuItems;
      case 'visa':
      default:
        return menuItems;
    }
  };


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Determine what title to show based on role
  const getSystemTitle = () => {
    if (role === 'home_service_user') {
      return 'نظام محاسبة الخدمات المنزلية';
    }
    if (role === 'admin') {
      const currentLabel = selectedSystem ? systemOptions.find((opt) => opt.value === selectedSystem)?.label : null;
      return currentLabel || 'اختر النظام';
    }
    return 'نظام التأشيرات';
  };

  // For home_service_user, only show home service menu
  const isHomeServiceOnly = role === 'home_service_user';

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontSize: isHomeServiceOnly ? '0.95rem' : '1.25rem' }}>
          {getSystemTitle()}
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Admin: system selector + filtered menus; Non-admin: keep existing visibility */}
      {role === 'admin' ? (
        <>
          <Box sx={{ px: 2, pb: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="system-select-label">اختر النظام</InputLabel>
              <TextField
                select
                label="اختر النظام"
                value={selectedSystem || 'visa'}
                onChange={(e) => handleSystemChange(e.target.value)}
                fullWidth
                size="small"
              >
                {systemOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
          </Box>
          <Divider />
          <List>
            {getMenuBySystem(selectedSystem || 'visa')
              .filter(mi => !role || mi.roles?.includes(role))
              .map((item) => (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  selected={
                    location.pathname === item.path ||
                    location.pathname + location.search === item.path
                  }
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
          </List>
          <Divider />
        </>
      ) : (
        <>
          {/* Main menu items - hidden for home_service_user */}
          {!isHomeServiceOnly && (
            <>
              <List>
                {menuItems.filter(mi => !role || mi.roles?.includes(role)).map((item) => (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => handleNavigation(item.path)}
                    selected={location.pathname === item.path}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
              <Divider />
            </>
          )}
          
          {/* Renting menu items - hidden for home_service_user */}
          {!isHomeServiceOnly && (
            <>
              <List>
                <ListItemText
                  primary="نظام التأجير"
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    sx: { textAlign: 'center' },
                  }}
                />
                {rentingMenuItems.filter(mi => !role || mi.roles?.includes(role)).map((item) => (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => handleNavigation(item.path)}
                    selected={location.pathname === item.path}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
              <Divider />
            </>
          )}
          
          {/* Home Service menu items - shown for admin and home_service_user */}
          {(role === 'admin' || role === 'home_service_user') && (
            <>
              <List>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <HomeWorkIcon fontSize="small" color="success" />
                      <span>نظام محاسبة الخدمات المنزلية</span>
                    </Box>
                  }
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    color: 'success.main',
                    fontWeight: 'bold',
                    sx: { textAlign: 'center' },
                  }}
                />
                {homeServiceMenuItems.filter(mi => !role || mi.roles?.includes(role)).map((item) => (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => handleNavigation(item.path)}
                    selected={location.pathname === item.path || location.pathname + location.search === item.path}
                  >
                    <ListItemIcon sx={{ color: 'success.main' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
              <Divider />
            </>
          )}

          {/* Fursatkum Accounting System - admin only */}
          {role === 'admin' && (
            <>
              <List>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <WalletIcon fontSize="small" color="primary" />
                      <span>نظام محاسبة فرصتكم</span>
                    </Box>
                  }
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    sx: { textAlign: 'center' },
                  }}
                />
                {fursatkumMenuItems.filter(mi => !role || mi.roles?.includes(role)).map((item) => (
                  <ListItem
                    button
                    key={item.text}
                    onClick={() => handleNavigation(item.path)}
                    selected={location.pathname === item.path || location.pathname + location.search === item.path}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItem>
                ))}
              </List>
              <Divider />
            </>
          )}
        </>
      )}
      
      <List>
        <ListItem sx={{ px: 2, py: 1 }}>
          <CacheClearButton />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="فتح القائمة"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {isHomeServiceOnly ? 'نظام محاسبة الخدمات المنزلية' : 'نظام إدارة التأشيرات والمحاسبة'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Toolbar />
    </>
  );
};

export default Navigation; 