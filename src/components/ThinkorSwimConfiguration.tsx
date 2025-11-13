import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Settings2, Save, Wifi, WifiOff, Eye, EyeOff, ShieldCheck, ExternalLink } from 'lucide-react';

const THINKORSWIM_SETTINGS_TABLE_ID = 58031;

interface ThinkorSwimSettings {
  id?: number;
  user_id?: number;
  api_key: string;
  client_id: string;
  redirect_uri: string;
  refresh_token: string;
  access_token: string;
  token_expiry?: string;
  account_id: string;
  is_active: boolean;
  create_time?: string;
  update_time?: string;
}

const ThinkorSwimConfiguration = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ThinkorSwimSettings>({
    api_key: '',
    client_id: '',
    redirect_uri: `${window.location.origin}/oauth/thinkorswim/callback`,
    refresh_token: '',
    access_token: '',
    account_id: '',
    is_active: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [hasLoadedApiKey, setHasLoadedApiKey] = useState(false);
  const [hasLoadedRefreshToken, setHasLoadedRefreshToken] = useState(false);
  const [hasLoadedAccessToken, setHasLoadedAccessToken] = useState(false);
  const [apiKeyModified, setApiKeyModified] = useState(false);
  const [refreshTokenModified, setRefreshTokenModified] = useState(false);
  const [accessTokenModified, setAccessTokenModified] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data: userInfo, error: userError } = await (window as any).ezsite.apis.getUserInfo();
      if (userError || !userInfo) {
        throw new Error('Failed to get user information. Please log in again.');
      }

      const { data, error } = await (window as any).ezsite.apis.tablePage(THINKORSWIM_SETTINGS_TABLE_ID, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: userInfo.ID
          }
        ]
      });

      if (error) throw error;

      if (data?.List && data.List.length > 0) {
        const loadedSettings = data.List[0];

        // Secret fields return empty string when called from frontend
        const hasApiKey = loadedSettings.api_key !== '';
        const hasRefreshToken = loadedSettings.refresh_token !== '';
        const hasAccessToken = loadedSettings.access_token !== '';
        setHasLoadedApiKey(hasApiKey);
        setHasLoadedRefreshToken(hasRefreshToken);
        setHasLoadedAccessToken(hasAccessToken);

        setSettings({
          id: loadedSettings.id,
          user_id: loadedSettings.user_id,
          api_key: hasApiKey ? loadedSettings.api_key : '',
          client_id: loadedSettings.client_id || '',
          redirect_uri: loadedSettings.redirect_uri || `${window.location.origin}/oauth/thinkorswim/callback`,
          refresh_token: hasRefreshToken ? loadedSettings.refresh_token : '',
          access_token: hasAccessToken ? loadedSettings.access_token : '',
          token_expiry: loadedSettings.token_expiry || '',
          account_id: loadedSettings.account_id || '',
          is_active: loadedSettings.is_active || false,
          create_time: loadedSettings.create_time,
          update_time: loadedSettings.update_time
        });
        setConnectionStatus(loadedSettings.is_active ? 'connected' : 'disconnected');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ThinkorSwim settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.api_key) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an API Key',
        variant: 'destructive'
      });
      return;
    }

    if (!settings.client_id) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a Client ID',
        variant: 'destructive'
      });
      return;
    }

    if (!settings.redirect_uri) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a Redirect URI',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { data: userInfo, error: userError } = await (window as any).ezsite.apis.getUserInfo();
      if (userError || !userInfo) {
        throw new Error('Failed to get user information. Please log in again.');
      }

      const settingsData = {
        user_id: userInfo.ID,
        api_key: settings.api_key,
        client_id: settings.client_id,
        redirect_uri: settings.redirect_uri,
        refresh_token: settings.refresh_token || '',
        access_token: settings.access_token || '',
        token_expiry: settings.token_expiry || null,
        account_id: settings.account_id || '',
        is_active: settings.is_active,
        update_time: new Date().toISOString()
      };

      let error;
      if (settings.id) {
        const result = await (window as any).ezsite.apis.tableUpdate(THINKORSWIM_SETTINGS_TABLE_ID, {
          id: settings.id,
          ...settingsData
        });
        error = result.error;
      } else {
        const result = await (window as any).ezsite.apis.tableCreate(THINKORSWIM_SETTINGS_TABLE_ID, {
          ...settingsData,
          create_time: new Date().toISOString()
        });
        error = result.error;
      }

      if (error) throw error;

      setSaveSuccess(true);
      setApiKeyModified(false);
      setRefreshTokenModified(false);
      setAccessTokenModified(false);
      setHasLoadedApiKey(true);
      setHasLoadedRefreshToken(true);
      setHasLoadedAccessToken(true);

      toast({
        title: '✓ Settings Saved Successfully',
        description: 'Your ThinkorSwim credentials have been securely stored and encrypted.',
        duration: 5000
      });

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save ThinkorSwim settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitiateOAuth = async () => {
    if (!settings.api_key || !settings.client_id || !settings.redirect_uri) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in API Key, Client ID, and Redirect URI first',
        variant: 'destructive'
      });
      return;
    }

    if (!settings.id) {
      toast({
        title: 'Please Save First',
        description: 'Save your credentials before initiating OAuth flow',
        variant: 'destructive'
      });
      return;
    }

    setIsAuthenticating(true);

    try {
      const result = await (window as any).ezsite.apis.run({
        path: '__easysite_nodejs__/thinkorswimAuthHandler.js',
        param: [{
          action: 'getAuthUrl',
          clientId: settings.client_id,
          redirectUri: settings.redirect_uri
        }]
      });

      if (result.error) throw new Error(result.error);

      const authUrl = result.data;
      
      toast({
        title: 'Redirecting to ThinkorSwim',
        description: 'You will be redirected to TD Ameritrade login page...',
        duration: 3000
      });

      // Open OAuth flow in new window
      setTimeout(() => {
        window.open(authUrl, '_blank', 'width=600,height=700');
      }, 500);

    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast({
        title: 'OAuth Initiation Failed',
        description: error instanceof Error ? error.message : 'Failed to start OAuth flow',
        variant: 'destructive'
      });
    } finally {
      setIsAuthenticating(false);
    }
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
    setConnectionStatus('testing');
    setTestResult(null);

    try {
      const { data: userInfo, error: userError } = await (window as any).ezsite.apis.getUserInfo();
      if (userError || !userInfo) {
        throw new Error('Failed to get user information. Please log in again.');
      }

      const result = await (window as any).ezsite.apis.run({
        path: '__easysite_nodejs__/thinkorswimConnectionTester.js',
        param: [userInfo.ID]
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const testData = result.data;
      setTestResult(testData);

      if (testData.success) {
        setConnectionStatus('connected');
        toast({
          title: '✓ Connection Test Successful',
          description: `Connected to ThinkorSwim API. Account: ${testData.details.accountId || 'N/A'}`,
          duration: 5000
        });

        // Update connection status in database
        if (settings.id) {
          await (window as any).ezsite.apis.tableUpdate(THINKORSWIM_SETTINGS_TABLE_ID, {
            id: settings.id,
            is_active: true,
            update_time: new Date().toISOString()
          });
          setSettings(prev => ({ ...prev, is_active: true }));
        }
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: 'Connection Test Failed',
          description: testData.errors[0] || 'Unable to connect to ThinkorSwim API',
          variant: 'destructive',
          duration: 7000
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setConnectionStatus('disconnected');

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
      case 'testing':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Testing...
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

  const formatTokenExpiry = (expiryString?: string) => {
    if (!expiryString) return 'Not set';
    try {
      const date = new Date(expiryString);
      const now = new Date();
      const isExpired = date < now;
      return (
        <span className={isExpired ? 'text-red-400' : 'text-green-400'}>
          {date.toLocaleString()} {isExpired ? '(Expired)' : '(Valid)'}
        </span>
      );
    } catch {
      return 'Invalid date';
    }
  };

  const handleApiKeyChange = (value: string) => {
    setSettings({ ...settings, api_key: value, client_id: value });
    setApiKeyModified(true);
  };

  const handleRefreshTokenChange = (value: string) => {
    setSettings({ ...settings, refresh_token: value });
    setRefreshTokenModified(true);
  };

  const handleAccessTokenChange = (value: string) => {
    setSettings({ ...settings, access_token: value });
    setAccessTokenModified(true);
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
              ThinkorSwim API Configuration
            </CardTitle>
            <CardDescription>Configure your TD Ameritrade ThinkorSwim API connection</CardDescription>
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
              Successfully connected to ThinkorSwim API
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key" className="text-slate-200 flex items-center gap-2">
              API Key (Consumer Key) <span className="text-red-500">*</span>
              {hasLoadedApiKey && !apiKeyModified && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? "text" : "password"}
                placeholder={hasLoadedApiKey && !apiKeyModified ? "••••••••••••••••••••" : "Enter your ThinkorSwim API Key"}
                value={settings.api_key}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
              <span>
                Your Consumer Key from TD Ameritrade Developer Portal, stored with end-to-end encryption
              </span>
            </div>
            {hasLoadedApiKey && !apiKeyModified && (
              <p className="text-xs text-blue-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                API Key is currently masked. Enter new value to update.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id" className="text-slate-200">
              Client ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="client_id"
              type="text"
              placeholder="Enter your Client ID"
              value={settings.client_id}
              onChange={(e) => setSettings({ ...settings, client_id: e.target.value })}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400">
              Usually the same as your API Key (Consumer Key)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirect_uri" className="text-slate-200">
              Redirect URI <span className="text-red-500">*</span>
            </Label>
            <Input
              id="redirect_uri"
              type="text"
              placeholder="Enter your OAuth Redirect URI"
              value={settings.redirect_uri}
              onChange={(e) => setSettings({ ...settings, redirect_uri: e.target.value })}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400">
              OAuth callback URL registered with TD Ameritrade (must match exactly)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refresh_token" className="text-slate-200 flex items-center gap-2">
              Refresh Token
              {hasLoadedRefreshToken && !refreshTokenModified && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="refresh_token"
                type={showRefreshToken ? "text" : "password"}
                placeholder={hasLoadedRefreshToken && !refreshTokenModified ? "••••••••••••••••••••" : "Obtained via OAuth flow"}
                value={settings.refresh_token}
                onChange={(e) => handleRefreshTokenChange(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowRefreshToken(!showRefreshToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showRefreshToken ? "Hide token" : "Show token"}
              >
                {showRefreshToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
              <span>Obtained automatically through OAuth flow</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token" className="text-slate-200 flex items-center gap-2">
              Access Token
              {hasLoadedAccessToken && !accessTokenModified && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </Label>
            <div className="relative">
              <Input
                id="access_token"
                type={showAccessToken ? "text" : "password"}
                placeholder={hasLoadedAccessToken && !accessTokenModified ? "••••••••••••••••••••" : "Obtained via OAuth flow"}
                value={settings.access_token}
                onChange={(e) => handleAccessTokenChange(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showAccessToken ? "Hide token" : "Show token"}
              >
                {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
              <span>Current access token for API authentication</span>
            </div>
          </div>

          {settings.token_expiry && (
            <div className="space-y-2">
              <Label className="text-slate-200">Token Expiry</Label>
              <div className="bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-slate-300 text-sm">
                {formatTokenExpiry(settings.token_expiry)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="account_id" className="text-slate-200">
              Account ID
            </Label>
            <Input
              id="account_id"
              type="text"
              placeholder="Your ThinkorSwim account ID (optional)"
              value={settings.account_id}
              onChange={(e) => setSettings({ ...settings, account_id: e.target.value })}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400">
              ThinkorSwim trading account identifier (automatically retrieved if left blank)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <Button
            onClick={handleInitiateOAuth}
            disabled={isAuthenticating || !settings.api_key || !settings.client_id || !settings.redirect_uri}
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-900/20 w-full sm:w-auto"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Start OAuth Flow
              </>
            )}
          </Button>

          <Button
            onClick={handleTestConnection}
            disabled={isTesting || !settings.id}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-900/20 w-full sm:w-auto"
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

          <Button
            onClick={handleSave}
            disabled={isSaving || !settings.api_key || !settings.client_id || !settings.redirect_uri}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
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

                  {testResult.connected && testResult.details.accountId && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Account ID:</span>
                      <span className="text-blue-400">{testResult.details.accountId}</span>
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
            Register your application at the TD Ameritrade Developer Portal to obtain your API credentials.
            Complete the OAuth flow to get access and refresh tokens. Your credentials are stored securely with industry-standard encryption.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ThinkorSwimConfiguration;
