import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PolygonAPITestPanel from '@/components/PolygonAPITestPanel';
import PolygonIntegrationStatus from '@/components/PolygonIntegrationStatus';
import DebuggingGuide from '@/components/DebuggingGuide';
import SPXPriceHeader from '@/components/SPXPriceHeader';
import MarketOverview from '@/components/MarketOverview';
import RealTimeChart from '@/components/RealTimeChart';
import EnvVerification from '@/components/EnvVerification';
import { Activity, BarChart3, TestTube } from 'lucide-react';

export default function APITestPage() {
  const [activeTab, setActiveTab] = useState('status');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 pt-14 md:pt-16 lg:pt-18">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="h-8 w-8 text-blue-600" />
            API Integration Testing
          </h1>
          <p className="text-muted-foreground">
            Real-time testing and verification of Polygon.io API integration
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Live Status</TabsTrigger>
            <TabsTrigger value="verification">Full Verification</TabsTrigger>
            <TabsTrigger value="spx">SPX Data</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            {/* Environment Configuration Verification */}
            <EnvVerification />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PolygonIntegrationStatus />
              <DebuggingGuide />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                  <CardDescription>Test individual components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setActiveTab('spx')}
                    variant="outline"
                    className="w-full justify-start">

                    <Activity className="h-4 w-4 mr-2" />
                    View SPX Real-time Data
                  </Button>
                  <Button
                    onClick={() => setActiveTab('market')}
                    variant="outline"
                    className="w-full justify-start">

                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Market Overview
                  </Button>
                  <Button
                    onClick={() => setActiveTab('verification')}
                    variant="outline"
                    className="w-full justify-start">

                    <TestTube className="h-4 w-4 mr-2" />
                    Run Full Verification
                  </Button>
                </CardContent>
              </Card>

              <Card>
              <CardHeader>
                <CardTitle>Console Output</CardTitle>
                <CardDescription>
                  Open browser developer tools (F12) to see detailed API logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div>✅ Check console for real-time logs</div>
                  <div>🔄 API calls are logged with timestamps</div>
                  <div>💾 Cache hits/misses are tracked</div>
                  <div>⚠️  Errors are logged with details</div>
                </div>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <PolygonAPITestPanel />
          </TabsContent>

          <TabsContent value="spx" className="space-y-6">
            <SPXPriceHeader />
            <RealTimeChart symbol="SPX" />
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <MarketOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}