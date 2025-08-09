
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@unocss/reset/tailwind.css'
import 'uno.css'
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext/ThemeProvider';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster position="top-right" toastOptions={{ success: { duration: 1500 } }} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>,
);
