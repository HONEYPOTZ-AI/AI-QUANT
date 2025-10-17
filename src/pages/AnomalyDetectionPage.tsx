import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/components/MarketDataService';
import {
  AlertTriangle,
  TrendingUp,
  Volume2,
  Activity,
  Bell,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Info,
  Home,
  Download,
  Eye } from
'lucide-react';

interface Anomaly {
  id: string;
  symbol: string;
  type: 'price_spike' | 'volume_spike' | 'rapid_price_change' | 'unusual_trend_pattern' | 'price_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  confidence: number;
  data: any;
  recommendations?: string[];
}

const AnomalyDetectionPage = () => {
  const { data: marketData, isConnected, loading } = useMarketData();
  const { toast } = useToast();

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [filteredAnomalies, setFilteredAnomalies] = useState<Anomaly[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'confidence'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected anomaly for details
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  // Run anomaly detection
  const detectAnomalies = async () => {
    if (!marketData || Object.keys(marketData).length === 0) {
      toast({
        title: "No Data Available",
        description: "Please wait for market data to load",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: result, error } = await window.ezsite.apis.run({
        path: 'anomalyDetection',
        param: [marketData, 0.7, 50]
      });

      if (error) throw new Error(error);

      // Transform alerts to anomaly format
      const transformedAnomalies: Anomaly[] = (result.alerts || []).map((alert: any) => ({
        id: alert.id || `anomaly_${Date.now()}_${Math.random()}`,
        symbol: alert.symbol,
        type: alert.type,
        severity: alert.severity,
        title: alert.message,
        description: alert.message,
        timestamp: alert.timestamp,
        confidence: Math.floor(Math.random() * 30 + 70), // Mock confidence
        data: alert.data,
        recommendations: alert.recommendations
      }));

      setAnomalies(transformedAnomalies);

      toast({
        title: "Analysis Complete",
        description: `Found ${transformedAnomalies.length} anomalies`
      });
    } catch (error: any) {
      console.error('Anomaly detection error:', error);
      toast({
        title: "Detection Error",
        description: error.message || "Failed to analyze market anomalies",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-detect on data load
  useEffect(() => {
    if (marketData && Object.keys(marketData).length > 0 && !isAnalyzing) {
      detectAnomalies();
    }
  }, [marketData]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...anomalies];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((a) =>
      a.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'severity') {
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      } else if (sortBy === 'confidence') {
        comparison = a.confidence - b.confidence;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredAnomalies(filtered);
  }, [anomalies, searchTerm, severityFilter, typeFilter, sortBy, sortOrder]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':return 'text-red-600 bg-red-100 border-red-300';
      case 'high':return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'medium':return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low':return 'text-blue-600 bg-blue-100 border-blue-300';
      default:return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_spike':return <TrendingUp className="h-4 w-4" />;
      case 'volume_spike':return <Volume2 className="h-4 w-4" />;
      case 'rapid_price_change':return <Activity className="h-4 w-4" />;
      case 'unusual_trend_pattern':return <Target className="h-4 w-4" />;
      case 'price_gap':return <AlertTriangle className="h-4 w-4" />;
      default:return <Bell className="h-4 w-4" />;
    }
  };

  const formatTypeLabel = (type: string) => {
    return type.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const stats = {
    total: anomalies.length,
    critical: anomalies.filter((a) => a.severity === 'critical').length,
    high: anomalies.filter((a) => a.severity === 'high').length,
    medium: anomalies.filter((a) => a.severity === 'medium').length,
    low: anomalies.filter((a) => a.severity === 'low').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Anomaly Detection</h1>
                <p className="text-sm text-slate-600">AI-powered market anomaly analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
              <Button onClick={detectAnomalies} disabled={isAnalyzing || loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bell className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">High</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Medium</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
                </div>
                <Volume2 className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Low</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.low}</p>
                </div>
                <Info className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Anomaly List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Detected Anomalies
                </CardTitle>
                <CardDescription>
                  Real-time market anomalies detected by AI algorithms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search anomalies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10" />

                  </div>
                  
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="price_spike">Price Spike</SelectItem>
                      <SelectItem value="volume_spike">Volume Spike</SelectItem>
                      <SelectItem value="rapid_price_change">Rapid Change</SelectItem>
                      <SelectItem value="unusual_trend_pattern">Trend Pattern</SelectItem>
                      <SelectItem value="price_gap">Price Gap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (sortBy === 'timestamp') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('timestamp');
                        setSortOrder('desc');
                      }
                    }}>

                    <Clock className="h-3 w-3 mr-1" />
                    Time
                    {sortBy === 'timestamp' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (sortBy === 'severity') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('severity');
                        setSortOrder('desc');
                      }
                    }}>

                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Severity
                    {sortBy === 'severity' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (sortBy === 'confidence') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('confidence');
                        setSortOrder('desc');
                      }
                    }}>

                    <Target className="h-3 w-3 mr-1" />
                    Confidence
                    {sortBy === 'confidence' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />)}
                  </Button>
                </div>

                {/* Anomaly List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {loading || isAnalyzing ?
                  <div className="space-y-3">
                      {[1, 2, 3].map((i) =>
                    <Skeleton key={i} className="h-24 w-full" />
                    )}
                    </div> :
                  filteredAnomalies.length === 0 ?
                  <div className="text-center py-12">
                      <Bell className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">No anomalies detected</p>
                      <p className="text-sm text-slate-400">Market conditions are normal</p>
                    </div> :

                  filteredAnomalies.map((anomaly) =>
                  <div
                    key={anomaly.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedAnomaly?.id === anomaly.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`
                    }
                    onClick={() => setSelectedAnomaly(anomaly)}>

                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                            {getTypeIcon(anomaly.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {anomaly.symbol}
                                </Badge>
                                <Badge variant="secondary" className={`text-xs ${getSeverityColor(anomaly.severity)}`}>
                                  {anomaly.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                {new Date(anomaly.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <p className="text-sm font-medium text-slate-900 mb-1">
                              {formatTypeLabel(anomaly.type)}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {anomaly.description}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Confidence: {anomaly.confidence}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  )
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Details
                </CardTitle>
                <CardDescription>
                  {selectedAnomaly ? 'Anomaly information and recommendations' : 'Select an anomaly to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAnomaly ?
                <div className="space-y-4">
                    {/* Basic Info */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Overview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Symbol:</span>
                          <span className="font-mono font-semibold">{selectedAnomaly.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Type:</span>
                          <span>{formatTypeLabel(selectedAnomaly.type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Severity:</span>
                          <Badge className={getSeverityColor(selectedAnomaly.severity)}>
                            {selectedAnomaly.severity}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Confidence:</span>
                          <span>{selectedAnomaly.confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Detected:</span>
                          <span>{new Date(selectedAnomaly.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Description</h4>
                      <p className="text-sm text-slate-700">{selectedAnomaly.description}</p>
                    </div>

                    {/* Data Details */}
                    {selectedAnomaly.data &&
                  <div>
                        <h4 className="font-semibold text-sm mb-2">Technical Data</h4>
                        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                          {Object.entries(selectedAnomaly.data).map(([key, value]) =>
                      <div key={key} className="flex justify-between">
                              <span className="text-slate-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="font-mono">{String(value)}</span>
                            </div>
                      )}
                        </div>
                      </div>
                  }

                    {/* Recommendations */}
                    {selectedAnomaly.recommendations && selectedAnomaly.recommendations.length > 0 &&
                  <div>
                        <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Suggested Actions</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc list-inside space-y-1 text-xs mt-2">
                              {selectedAnomaly.recommendations.map((rec, idx) =>
                          <li key={idx}>{rec}</li>
                          )}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                  }
                  </div> :

                <div className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 text-sm">Select an anomaly from the list to view detailed information</p>
                  </div>
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>);

};

export default AnomalyDetectionPage;