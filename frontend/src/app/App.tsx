import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DensityProvider } from './context/DensityContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AsyncErrorBoundary } from './components/common/AsyncErrorBoundary';

const queryClient = new QueryClient();


const ThemedToaster = () => {
  const { theme } = useTheme();

  return <Toaster position="bottom-right" richColors theme={theme} />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DensityProvider>
          <AuthProvider>
            <AsyncErrorBoundary>
              <RouterProvider router={router} />
            </AsyncErrorBoundary>
            <ThemedToaster />
          </AuthProvider>
        </DensityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
