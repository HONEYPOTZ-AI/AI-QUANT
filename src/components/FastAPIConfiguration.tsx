import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Settings2, Save, TestTube, Server } from 'lucide-react';

const FastAPIConfiguration = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    host: 'localhost',
    port: '8000',
    isEnabled: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing' | 'unknown'>('unknown');
  const [serviceInfo, setServiceInfo] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    if (!settings.host || !settings.port) {
      toast({
        title: 'Validation Error',
        description: 'Please enter host and port',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);
    setConnectionStatus('testing');

    try {
      const result = await window.ezsite.apis.run({
        path: 'fastapiConnectionManager',
        methodName: 'testPythonServiceConnection',
        param: [settings.host, parseInt(settings.port)]
      });

      if (result.error) throw new Error(result.error);

      setConnectionStatus('connected');
      setServiceInfo(result.data.serviceInfo);

      toast({
        title: 'Success',
        description: `Connected to Python service v${result.data.serviceInfo?.version || 'unknown'}`
      });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      setServiceInfo(null);

      toast({
        title: 'Connection Failed',
        description: error.message || 'Unable to connect to Python FastAPI service',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!settings.host || !settings.port) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save settings to local storage or database
      localStorage.setItem('fastapi_settings', JSON.stringify(settings));

      toast({
        title: 'Success',
        description: 'Python service settings saved successfully'
      });

      // Test connection after saving
      await testConnection();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
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

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Python FastAPI Service
            </CardTitle>
            <CardDescription>Configure connection to Python analytics service</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {connectionStatus === 'connected' && serviceInfo &&
        <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              <div className="space-y-1">
                <div>Connected to {serviceInfo.service}</div>
                <div className="text-xs">Version: {serviceInfo.version}</div>
                {serviceInfo.features &&
              <div className="text-xs">
                    Features: {serviceInfo.features.join(', ')}
                  </div>
              }
              </div>
            </AlertDescription>
          </Alert>
        }

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host" className="text-slate-200">
                Host <span className="text-red-500">*</span>
              </Label>
              <Input
                id="host"
                type="text"
                placeholder="localhost"
                value={settings.host}
                onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />

            </div>

            <div className="space-y-2">
              <Label htmlFor="port" className="text-slate-200">
                Port <span className="text-red-500">*</span>
              </Label>
              <Input
                id="port"
                type="text"
                placeholder="8000"
                value={settings.port}
                onChange={(e) => setSettings({ ...settings, port: e.target.value })}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500" />

            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div className="text-sm text-slate-300 font-medium mb-1">Service URL</div>
            <div className="text-xs text-slate-400 font-mono">
              http://{settings.host}:{settings.port}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={testConnection}
            disabled={isTesting || !settings.host || !settings.port}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700 bg-blue-600 w-full sm:w-auto">

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
            disabled={isSaving || !settings.host || !settings.port}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">

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
            <div className="space-y-2">
              <div>Ensure the Python FastAPI service is running on the specified host and port.</div>
              <div className="text-xs">
                To start the service: <code className="bg-slate-900 px-2 py-0.5 rounded">cd python_service && python -m uvicorn main:app --host {settings.host} --port {settings.port}</code>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>);

};

export default FastAPIConfiguration;