
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart3, Brain, Shield, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const features = [
  {
    icon: <Brain className="h-8 w-8 text-blue-500" />,
    title: "AI-Powered Analytics",
    description: "Advanced machine learning models for SPX forecasting and anomaly detection"
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-green-500" />,
    title: "Real-Time Market Data",
    description: "Live IBKR and S&P price feeds with millisecond precision"
  },
  {
    icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
    title: "Anomaly Detection",
    description: "Detect unusual market patterns and pricing anomalies instantly"
  },
  {
    icon: <Shield className="h-8 w-8 text-purple-500" />,
    title: "Secure TEE Deployment",
    description: "Trusted execution environments across Azure, AWS, and GCP"
  }];

  const stats = [
  { label: "Data Points Analyzed", value: "10M+", trend: "+15%" },
  { label: "Prediction Accuracy", value: "87.3%", trend: "+2.1%" },
  { label: "Active Strategies", value: "142", trend: "+8" },
  { label: "Alerts Triggered", value: "3,249", trend: "+12%" }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI QUANT</h1>
                <p className="text-xs text-slate-400">Powered by Machine Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-500/20 text-green-400">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live Market Data
              </Badge>
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Launch Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full mb-6 border border-blue-500/20">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Real-Time SPX Analytics</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            AI-Powered
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}Financial{" "}
            </span>
            Intelligence
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Advanced machine learning analytics for SPX index and options trading. 
            Real-time predictions, anomaly detection, and quantitative insights for professional traders.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3">
                Access Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3">
              View Documentation
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) =>
          <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm mb-2">{stat.label}</div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-xs">
                  {stat.trend}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) =>
          <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-slate-400 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-lg mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 AI QUANT. Advanced financial analytics powered by machine learning.</p>
            <p className="text-sm mt-2">Deployed on secure TEE infrastructure across Azure, AWS, and GCP.</p>
          </div>
        </div>
      </footer>
    </div>);

};

export default HomePage;