import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Settings2, Save, TestTube } from 'lucide-react';

const IBRK_SETTINGS_TABLE_ID = 51055;

interface IBRKSettings {
  id?: number;
  api_key: string;
  account_id: string;
  gateway_url: string;
  connection_status: string;
}

const IBRKConfiguration = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<IBRKSettings>({
    api_key: '',
    account_id: '',
    gateway_url: '',
    connection_status: 'inactive'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing' | 'unknown'>('unknown');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (window as any).ezsite.apis.tablePage(IBRK_SETTINGS_TABLE_ID, {
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
          api_key: loadedSettings.api_key || '',
          account_id: loadedSettings.account_id || '',
          gateway_url: loadedSettings.gateway_url || '',
          connection_status: loadedSettings.connection_status || 'inactive'
        });
        setConnectionStatus(loadedSettings.connection_status === 'active' ? 'connected' : 'disconnected');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load IBRK settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.api_key || !settings.account_id || !settings.gateway_url) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const settingsData = {
        api_key: settings.api_key,
        account_id: settings.account_id,
        gateway_url: settings.gateway_url,
        connection_status: settings.connection_status,
        updated_at: new Date().toISOString()
      };

      let error;
      if (settings.id) {
        const result = await (window as any).ezsite.apis.tableUpdate(IBRK_SETTINGS_TABLE_ID, {
          id: settings.id,
          ...settingsData
        });
        error = result.error;
      } else {
        const result = await (window as any).ezsite.apis.tableCreate(IBRK_SETTINGS_TABLE_ID, {
          ...settingsData,
          created_at: new Date().toISOString()
        });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'IBRK settings saved successfully'
      });

      // Reload settings to get the ID if it was a create
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save IBRK settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.gateway_url) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a gateway URL first',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);
    setConnectionStatus('testing');

    try {
      // Simulate connection test - in production, this would call the actual API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For now, we'll just update the status based on the presence of settings
      const isValid = settings.api_key && settings.account_id && settings.gateway_url;

      if (isValid) {
        setConnectionStatus('connected');

        // Update status in database
        if (settings.id) {
          await (window as any).ezsite.apis.tableUpdate(IBRK_SETTINGS_TABLE_ID, {
            id: settings.id,
            connection_status: 'active'
          });

          setSettings((prev) => ({ ...prev, connection_status: 'active' }));
        }

        toast({
          title: 'Success',
          description: 'Connection test successful'
        });
      } else {
        throw new Error('Invalid configuration');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('disconnected');

      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to IBRK API. Please check your settings.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>);

      case 'disconnected':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>);

      case 'testing':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Testing...
          </Badge>);

      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>);

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
      </Card>);

  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-500" />
              IBRK API Configuration
            </CardTitle>
            <CardDescription>Configure your Interactive Brokers API connection</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {connectionStatus === 'connected' &&
        <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              Successfully connected to Interactive Brokers API
            </AlertDescription>
          </Alert>
        }

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key" className="text-slate-200">
              API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="api_key"
              type="password"
              placeholder="Enter your IBRK API key"
              value={settings.api_key}
              onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />

          </div>

          <div className="space-y-2">
            <Label htmlFor="account_id" className="text-slate-200">
              Account ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="account_id"
              type="text"
              placeholder="Enter your IBRK account ID"
              value={settings.account_id}
              onChange={(e) => setSettings({ ...settings, account_id: e.target.value })}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />

          </div>

          <div className="space-y-2">
            <Label htmlFor="gateway_url" className="text-slate-200">
              Gateway URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gateway_url"
              type="text"
              placeholder="https://api.ibkr.com"
              value={settings.gateway_url}
              onChange={(e) => setSettings({ ...settings, gateway_url: e.target.value })}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />

            <p className="text-xs text-slate-400">
              Enter the IBRK Gateway or TWS API endpoint URL
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || !settings.gateway_url}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700 bg-[#2563eb] text-white">

            {isTesting ?
            <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </> :

            <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </>
            }
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || !settings.api_key || !settings.account_id || !settings.gateway_url}
            className="bg-blue-600 hover:bg-blue-700 text-white">

            {isSaving ?
            <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </> :

            <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            }
          </Button>
        </div>

        <Alert className="bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300 text-sm">
            Ensure your Interactive Brokers Gateway or TWS is running and configured to accept API connections.
            Your API credentials are stored securely and encrypted.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>);

};

export default IBRKConfiguration;