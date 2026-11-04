import { BrowserRouter } from 'react-router-dom';
import { ThemeProviderWrapper } from './contexts/ThemeContext/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext/AuthProvider';
import { SchoolProvider } from './contexts/SchoolContext/SchoolProvider';
import { NotificationProvider } from './contexts/NotificationContext/NotificationProvider';
import DocumentTitleManager from './components/common/DocumentTitleManager';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProviderWrapper>
        <AuthProvider>
          <SchoolProvider>
            <NotificationProvider>
              <DocumentTitleManager />
              <AppRoutes />
            </NotificationProvider>
          </SchoolProvider>
        </AuthProvider>
      </ThemeProviderWrapper>
    </BrowserRouter>
  );
}

export default App;
