import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/store';
import { SocketProvider } from '@/context/SocketContext';
import { ToastContainer, ErrorBoundary } from '@/components/common';
import { router } from '@/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <SocketProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </SocketProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
