import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Settings2, Save, Power, PowerOff } from 'lucide-react';

const CTRADER_SETTINGS_TABLE_ID = 51256;

interface CTraderSettings {
  id?: number;
  client_id: string;
  connection_status: string;
  last_connection_time?: string;
}

const CTraderConfiguration = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CTraderSettings>({
    client_id: '18001_d63gVTSSDt3Axw3DCoT3FpQwy60ySNc1LRtRed7Z3SBXv6qmG2',
    connection_status: 'disconnected',
    last_connection_time: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

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
        setSettings({
          id: loadedSettings.id,
          client_id: loadedSettings.client_id || '18001_d63gVTSSDt3Axw3DCoT3FpQwy60ySNc1LRtRed7Z3SBXv6qmG2',
          connection_status: loadedSettings.connection_status || 'disconnected',
          last_connection_time: loadedSettings.last_connection_time || ''
        });
        setConnectionStatus(loadedSettings.connection_status === 'connected' ? 'connected' : 'disconnected');
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

    setIsSaving(true);
    try {
      const settingsData = {
        client_id: settings.client_id,
        connection_status: settings.connection_status,
        last_connection_time: settings.last_connection_time,
        updated_at: new Date().toISOString()
      };

      let error;
      if (settings.id) {
        const result = await (window as any).ezsite.apis.tableUpdate(CTRADER_SETTINGS_TABLE_ID, {
          id: settings.id,
          ...settingsData
        });
        error = result.error;
      } else {
        const result = await (window as any).ezsite.apis.tableCreate(CTRADER_SETTINGS_TABLE_ID, {
          ...settingsData,
          created_at: new Date().toISOString()
        });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'cTrader settings saved successfully'
      });

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
    if (!settings.client_id) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a Client ID first',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Call cTrader authentication handler
      const authResult = await (window as any).ezsite.apis.run('ctraderAuthHandler', {
        clientId: settings.client_id
      });

      if (authResult.error) throw new Error(authResult.error);

      // Call cTrader connection manager
      const connectResult = await (window as any).ezsite.apis.run('ctraderConnectionManager', {
        action: 'connect',
        clientId: settings.client_id
      });

      if (connectResult.error) throw new Error(connectResult.error);

      const currentTime = new Date().toISOString();
      setConnectionStatus('connected');

      // Update status in database
      const updatedSettings = {
        ...settings,
        connection_status: 'connected',
        last_connection_time: currentTime
      };

      if (settings.id) {
        await (window as any).ezsite.apis.tableUpdate(CTRADER_SETTINGS_TABLE_ID, {
          id: settings.id,
          connection_status: 'connected',
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
          connection_status: 'disconnected'
        });
      }

      setSettings((prev) => ({ ...prev, connection_status: 'disconnected' }));

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
        {connectionStatus === 'connected' && (
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

          {settings.last_connection_time && (
            <div className="space-y-2">
              <Label className="text-slate-200">Last Connection Time</Label>
              <div className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-300 text-sm">
                {formatLastConnectionTime(settings.last_connection_time)}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
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
              disabled={isConnecting || !settings.client_id}
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
            disabled={isSaving || !settings.client_id}
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

        <Alert className="bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300 text-sm">
            Ensure you have registered your application with cTrader and obtained a valid Client ID.
            Your credentials are stored securely and encrypted.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CTraderConfiguration;
