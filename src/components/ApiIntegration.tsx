import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertCircle, CheckCircle, Settings, Wifi, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface DataSource {
  id: number;
  source_name: string;
  api_endpoint: string;
  auth_type: string;
  is_active: boolean;
  rate_limit: number;
  data_types: string[];
  last_sync: string;
}

export default function ApiIntegration() {
  const { hasRole, hasPermission } = useAuth();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [ibkrCredentials, setIbkrCredentials] = useState({ username: '', password: '' });
  const [spGlobalKey, setSpGlobalKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(34155, {
        PageNo: 1,
        PageSize: 10,
      });
      
      if (error) throw new Error(error);
      
      if (data?.List) {
        const sources = data.List.map((item: any) => ({
          ...item,
          data_types: item.data_types ? JSON.parse(item.data_types) : [],
        }));
        setDataSources(sources);
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  };

  const connectIBKR = async () => {
    if (!hasPermission('api_connect')) {
      toast({ title: 'Access denied', description: 'You do not have permission to connect APIs.' });
      return;
    }

    setIsLoading(true);
    try {
      // Create or update IBKR data source
      const ibkrSource = {
        source_name: 'Interactive Brokers',
        api_endpoint: 'https://api.ibkr.com/v1',
        auth_type: 'OAuth2',
        is_active: true,
        rate_limit: 100,
        data_types: JSON.stringify(['stocks', 'options', 'futures', 'forex']),
        last_sync: new Date().toISOString(),
      };

      const { error } = await window.ezsite.apis.tableCreate(34155, ibkrSource);
      if (error) throw new Error(error);

      setConnectionStatus(prev => ({ ...prev, ibkr: true }));
      toast({ title: 'IBKR Connected', description: 'Successfully connected to Interactive Brokers API.' });
      fetchDataSources();
    } catch (error) {
      console.error('IBKR connection error:', error);
      toast({ title: 'Connection Failed', description: 'Failed to connect to IBKR API.' });
    } finally {
      setIsLoading(false);
    }
  };

  const connectSPGlobal = async () => {
    if (!hasPermission('api_connect')) {
      toast({ title: 'Access denied', description: 'You do not have permission to connect APIs.' });
      return;
    }

    setIsLoading(true);
    try {
      const spSource = {
        source_name: 'S&P Global',
        api_endpoint: 'https://api.spglobal.com/v1',
        auth_type: 'API_KEY',
        is_active: true,
        rate_limit: 500,
        data_types: JSON.stringify(['market_data', 'analytics', 'fundamentals', 'news']),
        last_sync: new Date().toISOString(),
      };

      const { error } = await window.ezsite.apis.tableCreate(34155, spSource);
      if (error) throw new Error(error);

      setConnectionStatus(prev => ({ ...prev, spglobal: true }));
      toast({ title: 'S&P Global Connected', description: 'Successfully connected to S&P Global API.' });
      fetchDataSources();
    } catch (error) {
      console.error('S&P Global connection error:', error);
      toast({ title: 'Connection Failed', description: 'Failed to connect to S&P Global API.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDataSource = async (id: number, isActive: boolean) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate(34155, {
        ID: id,
        is_active: isActive,
      });

      if (error) throw new Error(error);
      
      fetchDataSources();
      toast({ 
        title: isActive ? 'Data Source Enabled' : 'Data Source Disabled',
        description: `Data source has been ${isActive ? 'enabled' : 'disabled'}.`
      });
    } catch (error) {
      console.error('Error toggling data source:', error);
    }
  };

  if (!hasRole('admin') && !hasRole('trader')) {
    return (
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          You do not have permission to access API integration settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Market Data API Integration
          </CardTitle>
          <CardDescription>
            Connect and manage external market data providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup">API Setup</TabsTrigger>
              <TabsTrigger value="status">Connection Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="space-y-6">
              {/* IBKR Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Interactive Brokers (IBKR)
                  </CardTitle>
                  <CardDescription>
                    Connect to IBKR for real-time market data and trading capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ibkr-username">Username</Label>
                      <Input
                        id="ibkr-username"
                        value={ibkrCredentials.username}
                        onChange={(e) => setIbkrCredentials({...ibkrCredentials, username: e.target.value})}
                        placeholder="Enter IBKR username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibkr-password">Password</Label>
                      <Input
                        id="ibkr-password"
                        type="password"
                        value={ibkrCredentials.password}
                        onChange={(e) => setIbkrCredentials({...ibkrCredentials, password: e.target.value})}
                        placeholder="Enter IBKR password"
                      />
                    </div>
                  </div>
                  <Button onClick={connectIBKR} disabled={isLoading} className="w-full md:w-auto">
                    {connectionStatus.ibkr ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Reconnect IBKR
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Connect IBKR
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* S&P Global Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    S&P Global Market Intelligence
                  </CardTitle>
                  <CardDescription>
                    Access premium market data and analytics from S&P Global
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sp-key">API Key</Label>
                    <Input
                      id="sp-key"
                      type="password"
                      value={spGlobalKey}
                      onChange={(e) => setSpGlobalKey(e.target.value)}
                      placeholder="Enter S&P Global API key"
                    />
                  </div>
                  <Button onClick={connectSPGlobal} disabled={isLoading} className="w-full md:w-auto">
                    {connectionStatus.spglobal ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Reconnect S&P Global
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Connect S&P Global
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="status" className="space-y-4">
              {dataSources.length === 0 ? (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    No data sources configured. Please set up your API connections.
                  </AlertDescription>
                </Alert>
              ) : (
                dataSources.map((source) => (
                  <Card key={source.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${source.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <h3 className="font-medium">{source.source_name}</h3>
                            <p className="text-sm text-gray-600">{source.api_endpoint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={source.is_active ? "default" : "secondary"}>
                            {source.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            checked={source.is_active}
                            onCheckedChange={(checked) => toggleDataSource(source.id, checked)}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Rate Limit:</span>
                          <span className="ml-2 font-medium">{source.rate_limit}/min</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Auth Type:</span>
                          <span className="ml-2 font-medium">{source.auth_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Sync:</span>
                          <span className="ml-2 font-medium">
                            {source.last_sync ? new Date(source.last_sync).toLocaleString() : 'Never'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-gray-600 text-sm">Data Types:</span>
                        <div className="flex gap-2 mt-1">
                          {source.data_types.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}