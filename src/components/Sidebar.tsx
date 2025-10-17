
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart3,
  Brain,
  AlertTriangle,
  Target,
  Zap,
  Home,
  Settings,
  User,
  Database,
  LogOut,
  TrendingUp,
  HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStartTour?: () => void;
}

const Sidebar = ({ activeTab, setActiveTab, onStartTour }: SidebarProps) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':return 'bg-red-100 text-red-800';
      case 'trader':return 'bg-blue-100 text-blue-800';
      case 'analyst':return 'bg-green-100 text-green-800';
      default:return 'bg-gray-100 text-gray-800';
    }
  };

  const navigation = [
  { id: 'overview', label: 'Market Overview', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'analytics', label: 'AI Analytics', icon: <Brain className="h-5 w-5" /> },
  { id: 'alerts', label: 'Anomaly Alerts', icon: <AlertTriangle className="h-5 w-5" />, badge: '3' },
  { id: 'options', label: 'Options Data', icon: <Target className="h-5 w-5" /> },
  { id: 'api', label: 'API Integration', icon: <Database className="h-5 w-5" /> },
  { id: 'settings', label: 'IBRK Settings', icon: <Settings className="h-5 w-5" /> }];

  const externalLinks = [
  { path: '/anomaly-detection', label: 'Anomaly Detection', icon: <AlertTriangle className="h-5 w-5" /> },
  { path: '/cfd-strategy', label: 'CFD Strategy', icon: <TrendingUp className="h-5 w-5" /> }];


  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI QUANT</h1>
            <p className="text-xs text-slate-400">v1.0.0 MVP</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) =>
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={`w-full justify-start text-left ${
            activeTab === item.id ?
            "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" :
            "text-slate-300 hover:text-white hover:bg-slate-700"}`
            }
            onClick={() => setActiveTab(item.id)}>

              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge &&
              <Badge variant="destructive" className="bg-red-500/20 text-red-400 text-xs">
                    {item.badge}
                  </Badge>
              }
              </div>
            </Button>
          )}
        </div>

        {/* External Links Section */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2 px-3">Trading Tools</p>
          <div className="space-y-2">
            {externalLinks.map((link) =>
            <Link key={link.path} to={link.path}>
                <Button
                variant="ghost"
                className="w-full justify-start text-left text-slate-300 hover:text-white hover:bg-slate-700"
                data-tour={link.path === '/cfd-strategy' ? 'sidebar-cfd' : link.path === '/anomaly-detection' ? 'sidebar-anomaly' : undefined}>

                  <div className="flex items-center gap-3">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onStartTour}
          data-tour="help-button"
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 mb-2"
          title="Start Interactive Tour"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">Help & Tour</span>
        </button>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
            <User className="h-5 w-5 mr-3" />
            Profile
          </Button>
        </div>
        <div className="mt-4 p-3 bg-slate-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">System Status</span>
          </div>
          <div className="text-xs text-slate-400">
            All systems operational
          </div>
        </div>
      </div>
    </div>);

};

export default Sidebar;