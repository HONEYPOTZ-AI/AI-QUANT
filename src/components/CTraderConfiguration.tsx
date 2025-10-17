import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Settings2, Save, Power, PowerOff, Eye, EyeOff, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

const CTRADER_SETTINGS_TABLE_ID = 51256;

interface CTraderSettings {
  id?: number;
  client_id: string;
  client_secret: string;
  is_connected: boolean;
  last_connection_time?: string;
}

const CTraderConfiguration = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CTraderSettings>({
    client_id: '18001_d63gVTSSDt3Axw3DCoT3FpQwy60ySNc1LRtRed7Z3SBXv6qmG2',
    client_secret: '7P1GUL6X41TO37StUtlTIEyEtxvDtLZmqIYAimyahYrCvU5GVX',
    is_connected: false,
    last_connection_time: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [showSecret, setShowSecret] = useState(false);
  const [hasLoadedSecret, setHasLoadedSecret] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [secretModified, setSecretModified] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (window as any).ezsite.apis.tablePage(CTRADER_SETTINGS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: []
      });

      if (error) throw error;

      if (data?.List && data.List.length > 0) {
        const loadedSettings = data.List[0];
        
        // Secret fields return empty string when called from frontend
        // This is expected behavior for Secret component type
        const hasSecret = loadedSettings.client_secret !== '';
        setHasLoadedSecret(hasSecret);
        
        setSettings({
          id: loadedSettings.id,
          client_id: loadedSettings.client_id || '18001_d63gVTSSDt3Axw3DCoT3FpQwy60ySNc1LRtRed7Z3SBXv6qmG2',
          client_secret: hasSecret ? loadedSettings.client_secret : '7P1GUL6X41TO37StUtlTIEyEtxvDtLZmqIYAimyahYrCvU5GVX',
          is_connected: loadedSettings.is_connected || false,
          last_connection_time: loadedSettings.last_connection_time || ''
        });
        setConnectionStatus(loadedSettings.is_connected ? 'connected' : 'disconnected');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cTrader settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.client_id) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a Client ID',
        variant: 'destructive'
      });
      return;
    }

    if (!settings.client_secret) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a Client Secret',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const settingsData = {
        client_id: settings.client_id,
        client_secret: settings.client_secret,
        is_connected: settings.is_connected,
        last_connection_time: settings.last_connection_time || null
      };

      let error;
      if (settings.id) {
        const result = await (window as any).ezsite.apis.tableUpdate(CTRADER_SETTINGS_TABLE_ID, {
          id: settings.id,
          ...settingsData
        });
        error = result.error;
      } else {
        const result = await (window as any).ezsite.apis.tableCreate(CTRADER_SETTINGS_TABLE_ID, settingsData);
        error = result.error;
      }

      if (error) throw error;

      // Show success state
      setSaveSuccess(true);
      setSecretModified(false);
      setHasLoadedSecret(true);
      
      toast({
        title: '✓ Settings Saved Successfully',
        description: 'Your cTrader credentials have been securely stored and encrypted.',
        duration: 5000,
      });

      // Reset success indicator after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save cTrader settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!settings.client_id || !settings.client_secret) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both Client ID and Client Secret first',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Call cTrader connection manager
      const connectResult = await (window as any).ezsite.apis.run('ctraderConnectionManager', {
        action: 'connect',
        clientId: settings.client_id,
        clientSecret: settings.client_secret
      });

      if (connectResult.error) throw new Error(connectResult.error);

      const currentTime = new Date().toISOString();
      setConnectionStatus('connected');

      // Update status in database
      const updatedSettings = {
        ...settings,
        is_connected: true,
        last_connection_time: currentTime
      };

      if (settings.id) {
        await (window as any).ezsite.apis.tableUpdate(CTRADER_SETTINGS_TABLE_ID, {
          id: settings.id,
          is_connected: true,
          last_connection_time: currentTime
        });
      }

      setSettings(updatedSettings);

      toast({
        title: 'Success',
        description: 'Successfully connected to cTrader'
      });
    } catch (error) {
      console.error('Error connecting to cTrader:', error);
      setConnectionStatus('disconnected');

      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Unable to connect to cTrader. Please check your settings.',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);

    try {
      // Call cTrader connection manager to disconnect
      const disconnectResult = await (window as any).ezsite.apis.run('ctraderConnectionManager', {
        action: 'disconnect',
        clientId: settings.client_id
      });

      if (disconnectResult.error) throw new Error(disconnectResult.error);

      setConnectionStatus('disconnected');

      // Update status in database
      if (settings.id) {
        await (window as any).ezsite.apis.tableUpdate(CTRADER_SETTINGS_TABLE_ID, {
          id: settings.id,
          is_connected: false
        });
      }

      setSettings((prev) => ({ ...prev, is_connected: false }));

      toast({
        title: 'Success',
        description: 'Disconnected from cTrader'
      });
    } catch (error) {
      console.error('Error disconnecting from cTrader:', error);

      toast({
        title: 'Disconnection Failed',
        description: error instanceof Error ? error.message : 'Unable to disconnect from cTrader.',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const formatLastConnectionTime = (timeString?: string) => {
    if (!timeString) return 'Never';
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const handleSecretChange = (value: string) => {
    setSettings({ ...settings, client_secret: value });
    setSecretModified(true);
  };

  const handleTestConnection = async () => {
    if (!settings.id) {
      toast({
        title: 'Please Save First',
        description: 'Save your credentials before testing the connection.',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Get user info to pass userId
      const { data: userInfo, error: userError } = await (window as any).ezsite.apis.getUserInfo();
      
      if (userError || !userInfo) {
        throw new Error('Failed to get user information. Please log in again.');
      }

      const result = await (window as any).ezsite.apis.run({
        path: '__easysite_nodejs__/ctraderConnectionTester.js',
        param: [userInfo.ID]
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const testData = result.data;
      setTestResult(testData);

      if (testData.success) {
        toast({
          title: '✓ Connection Test Successful',
          description: `Connected to cTrader API. Found ${testData.details.accountCount} account(s).`,
          duration: 5000
        });
        
        // Update connection status
        setConnectionStatus('connected');
        await loadSettings();
      } else {
        toast({
          title: 'Connection Test Failed',
          description: testData.errors[0] || 'Unable to connect to cTrader API',
          variant: 'destructive',
          duration: 7000
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      
      setTestResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });

      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Failed to test connection',
        variant: 'destructive',
        duration: 7000
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-500" />
              cTrader API Configuration
            </CardTitle>
            <CardDescription>Configure your cTrader API connection</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {saveSuccess && (
          <Alert className="bg-green-500/10 border-green-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400 flex items-center gap-2">
              <span>✓ Credentials saved and encrypted successfully!</span>
              <ShieldCheck className="h-4 w-4" />
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'connected' && !saveSuccess && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              Successfully connected to cTrader API
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id" className="text-slate-200">
              Client ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="client_id"
              type="text"
              placeholder="Enter your cTrader Client ID"
              value={settings.client_id}
              onChange={(e) => setSettings({ ...settings, client_id: e.target.value })}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400">
              Your cTrader OAuth Client ID
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_secret" className="text-slate-200 flex items-center gap-2">
              Client Secret <span className="text-red-500">*</span>
              {hasLoadedSecret && !secretModified && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="client_secret"
                type={showSecret ? "text" : "password"}
                placeholder={hasLoadedSecret && !secretModified ? "••••••••••••••••••••" : "Enter your cTrader Client Secret"}
                value={settings.client_secret}
                onChange={(e) => handleSecretChange(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
              <span>
                Your cTrader OAuth Client Secret is stored with end-to-end encryption. 
                {!showSecret && " Masked with "}
                {!showSecret && <span className="text-slate-300 font-mono">••••</span>}
                {!showSecret && " for security."}
              </span>
            </div>
            {hasLoadedSecret && !secretModified && (
              <p className="text-xs text-blue-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Secret is currently masked. Enter new value to update.
              </p>
            )}
          </div>

          {settings.last_connection_time && (
            <div className="space-y-2">
              <Label className="text-slate-200">Last Connection Time</Label>
              <div className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-300 text-sm">
                {formatLastConnectionTime(settings.last_connection_time)}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || !settings.id}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {connectionStatus === 'connected' ? (
            <Button
              onClick={handleDisconnect}
              disabled={isConnecting}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !settings.client_id || !settings.client_secret}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-900/20"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving || !settings.client_id || !settings.client_secret}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <Alert className={`${testResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} animate-in fade-in slide-in-from-top-2 duration-300`}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={testResult.success ? 'text-green-300' : 'text-red-300'}>
              <div className="space-y-2">
                <div className="font-semibold">
                  {testResult.success ? '✓ Connection Test Successful' : '✗ Connection Test Failed'}
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Credentials:</span>
                    {testResult.details.credentialsFound ? (
                      <span className="text-green-400">✓ Found</span>
                    ) : (
                      <span className="text-red-400">✗ Not Found</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Authentication:</span>
                    <span className={testResult.authenticated ? 'text-green-400' : 'text-red-400'}>
                      {testResult.authenticated ? '✓' : '✗'} {testResult.details.authenticationStatus}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">API Connection:</span>
                    <span className={testResult.connected ? 'text-green-400' : 'text-red-400'}>
                      {testResult.connected ? '✓' : '✗'} {testResult.details.connectionStatus}
                    </span>
                  </div>

                  {testResult.connected && testResult.details.accountCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Accounts Found:</span>
                      <span className="text-blue-400">{testResult.details.accountCount}</span>
                    </div>
                  )}
                </div>

                {testResult.errors && testResult.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-500/20">
                    <div className="font-medium text-xs mb-1">Error Details:</div>
                    {testResult.errors.map((error: string, index: number) => (
                      <div key={index} className="text-xs text-red-300 ml-2">
                        • {error}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-slate-400 mt-2">
                  Tested at: {new Date(testResult.timestamp).toLocaleString()}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300 text-sm">
            Ensure you have registered your application with cTrader and obtained a valid Client ID and Client Secret.
            Your credentials are stored securely with industry-standard encryption.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CTraderConfiguration;