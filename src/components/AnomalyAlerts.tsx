
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, Volume2, Bell, X, ExternalLink } from 'lucide-react';
import { useMarketData } from './MarketDataService';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: 'price' | 'volume' | 'volatility' | 'pattern';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: Date;
  symbol: string;
  confidence: number;
  dismissed: boolean;
}

const AnomalyAlerts = () => {
  const { marketData, isLoading } = useMarketData();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const detectAnomalies = async () => {
    if (!marketData || Object.keys(marketData).length === 0) return;

    setIsAnalyzing(true);
    try {
      const { data: result, error } = await window.ezsite.apis.run({
        path: "anomalyDetection",
        param: [marketData, 0.7, 50] // sensitivity = 0.7, lookbackPeriod = 50
      });

      if (error) throw new Error(error);

      setAlerts(result.alerts || []);

      if (result.alerts?.length > 0) {
        toast({
          title: "Anomalies Detected",
          description: `Found ${result.alerts.length} market anomalies`
        });
      }
    } catch (error) {
      console.error('Anomaly detection error:', error);
      toast({
        title: "Detection Error",
        description: "Failed to analyze market anomalies",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    detectAnomalies();
  }, [marketData]);

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
    prev.map((alert) =>
    alert.id === alertId ? { ...alert, dismissed: true } : alert
    )
    );
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'price':
        return <TrendingUp className="h-5 w-5" />;
      case 'volume':
        return <Volume2 className="h-5 w-5" />;
      case 'volatility':
        return <AlertTriangle className="h-5 w-5" />;
      case 'pattern':
        return <Bell className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'low':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const activeAlerts = alerts.filter((alert) => !alert.dismissed);
  const dismissedAlerts = alerts.filter((alert) => alert.dismissed);

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="anomaly-alerts">
      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-red-400">
                  {activeAlerts.filter((a) => a.severity === 'high').length}
                </div>
                <div className="text-xs sm:text-sm text-red-400">High Severity</div>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {activeAlerts.filter((a) => a.severity === 'medium').length}
                </div>
                <div className="text-sm text-orange-400">Medium Severity</div>
              </div>
              <Bell className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {activeAlerts.filter((a) => a.severity === 'low').length}
                </div>
                <div className="text-sm text-yellow-400">Low Severity</div>
              </div>
              <Volume2 className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  {alerts.length}
                </div>
                <div className="text-sm text-slate-400">Total Today</div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Active Anomaly Alerts
              </CardTitle>
              <CardDescription>AI-detected market anomalies requiring attention</CardDescription>
            </div>
            <Link to="/anomaly-detection">
              <Button variant="outline" size="sm" className="gap-2">
                View All
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAlerts.length === 0 ?
            <div className="text-center py-8 text-slate-400">
                <Bell className="h-12 w-12 mx-auto mb-4" />
                <p>No active alerts at this time</p>
              </div> :

            activeAlerts.map((alert) =>
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} bg-slate-900/50`}>

                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{alert.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {alert.symbol}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.timestamp.toLocaleTimeString()}
                          </div>
                          <div>Confidence: {alert.confidence}%</div>
                        </div>
                      </div>
                    </div>
                    <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="text-slate-400 hover:text-white">

                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            )
            }
          </div>
        </CardContent>
      </Card>

      {/* Dismissed Alerts */}
      {dismissedAlerts.length > 0 &&
      <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <X className="h-5 w-5 text-slate-500" />
              Recently Dismissed
            </CardTitle>
            <CardDescription>Previously active alerts that have been dismissed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dismissedAlerts.map((alert) =>
            <div
              key={alert.id}
              className="p-3 rounded-lg bg-slate-900/30 border border-slate-700 opacity-60">

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <h4 className="font-medium text-slate-400">{alert.title}</h4>
                        <p className="text-sm text-slate-500">{alert.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
            )}
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default AnomalyAlerts;