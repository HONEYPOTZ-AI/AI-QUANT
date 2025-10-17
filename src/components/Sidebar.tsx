
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Brain, 
  AlertTriangle, 
  Target, 
  Zap,
  Home,
  Settings,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const navigation = [
    { id: 'overview', label: 'Market Overview', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'analytics', label: 'AI Analytics', icon: <Brain className="h-5 w-5" /> },
    { id: 'alerts', label: 'Anomaly Alerts', icon: <AlertTriangle className="h-5 w-5" />, badge: '3' },
    { id: 'options', label: 'Options Data', icon: <Target className="h-5 w-5" /> },
  ];

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
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start text-left ${
                activeTab === item.id 
                  ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" 
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-400 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
            <User className="h-5 w-5 mr-3" />
            Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
            <Settings className="h-5 w-5 mr-3" />
            Settings
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
    </div>
  );
};

export default Sidebar;
