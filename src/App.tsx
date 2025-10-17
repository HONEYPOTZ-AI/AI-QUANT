
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { MarketDataProvider } from '@/components/MarketDataService';
import HomePage from '@/pages/HomePage';
import Dashboard from '@/pages/Dashboard';
import AuthSuccess from '@/pages/AuthSuccess';
import ResetPassword from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';
import CFDStrategyPage from '@/pages/CFDStrategyPage';
import AnomalyDetectionPage from '@/pages/AnomalyDetectionPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MarketDataProvider>
            <Router>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/anomaly-detection" element={<AnomalyDetectionPage />} />
                <Route path="/cfd-strategy" element={<CFDStrategyPage />} />
                <Route path="/onauthsuccess" element={<AuthSuccess />} />
                <Route path="/resetpassword" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </MarketDataProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>);

}

export default App;