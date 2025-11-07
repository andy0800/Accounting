import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

// إعداد الخط العربي
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const RouterComponent = (process.env.REACT_APP_ROUTER_MODE === 'hash') ? HashRouter : BrowserRouter;

root.render(
  <React.StrictMode>
    <RouterComponent>
      <CssBaseline />
      <App />
    </RouterComponent>
  </React.StrictMode>
);

// Register Service Worker for caching and offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
} 