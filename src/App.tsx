
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { MarketDataProvider } from '@/components/MarketDataService';
import EconomicNewsTicker from '@/components/EconomicNewsTicker';
import AlertNotification from '@/components/AlertNotification';
import HomePage from '@/pages/HomePage';
import Dashboard from '@/pages/Dashboard';
import AuthSuccess from '@/pages/AuthSuccess';
import ResetPassword from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';
import CFDStrategyPage from '@/pages/CFDStrategyPage';
import AnomalyDetectionPage from '@/pages/AnomalyDetectionPage';
import OptionsGreeksPage from '@/pages/OptionsGreeksPage';
import SPXOptionsPage from '@/pages/SPXOptionsPage';
import APITestPage from '@/pages/APITestPage';
import IronCondorPage from '@/pages/IronCondorPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MarketDataProvider>
            <Router>
              {/* Economic News Ticker - Fixed at top of all pages */}
              <EconomicNewsTicker />
              
              {/* Alert Notification System */}
              <AlertNotification />
              
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/anomaly-detection" element={<AnomalyDetectionPage />} />
                <Route path="/cfd-strategy" element={<CFDStrategyPage />} />
                <Route path="/options-greeks" element={<OptionsGreeksPage />} />
                <Route path="/spx-options" element={<SPXOptionsPage />} />
                <Route path="/api-test" element={<APITestPage />} />
                <Route path="/iron-condor" element={<IronCondorPage />} />
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