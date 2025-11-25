// src/App.tsx

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './layout/AppLayout';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './Helper/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;