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
  Home as HomeIcon,
  Business as BusinessIcon,
  Apartment as ApartmentIcon,
  Description,
  Assessment,
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
    { text: 'نظام التأجير', icon: <HomeIcon />, path: '/renting', section: 'renting', roles: ['admin'] },
    { text: 'سكرتارية التأجير', icon: <BusinessIcon />, path: '/renting/secretaries', section: 'renting', roles: ['admin'] },
    { text: 'الوحدات المؤجرة', icon: <ApartmentIcon />, path: '/renting/units', section: 'renting', roles: ['admin'] },
    { text: 'عقود التأجير', icon: <Description />, path: '/renting/contracts', section: 'renting', roles: ['admin','secretary'] },
    { text: 'العقود المنتهية', icon: <Description />, path: '/renting/terminated', section: 'renting', roles: ['admin'] },
    { text: 'التقارير', icon: <Assessment />, path: '/renting/reports', section: 'renting', roles: ['admin'] },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          نظام التأشيرات
        </Typography>
      </Toolbar>
      <Divider />
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
      <List>
        <ListItem sx={{ py: 1 }}>
          <ListItemText 
            primary="نظام التأجير" 
            primaryTypographyProps={{ 
              variant: 'subtitle2', 
              color: 'primary.main',
              fontWeight: 'bold',
              sx: { textAlign: 'center' }
            }} 
          />
        </ListItem>
        {rentingMenuItems.filter(mi => !role || mi.roles?.includes(role)).map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{ pl: 3 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
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
            نظام إدارة التأشيرات والمحاسبة
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