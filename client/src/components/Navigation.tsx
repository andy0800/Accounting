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