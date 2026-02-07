
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  HelpCircle,
  Menu,
  PieChart,
  TestTube,
  BookOpen } from
'lucide-react';
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
  const [open, setOpen] = React.useState(false);

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
  { id: 'iron-condor', label: 'Iron Condor', icon: <Target className="h-5 w-5" /> },
  { id: 'api', label: 'API Integration', icon: <Database className="h-5 w-5" /> },
  { id: 'settings', label: 'IBRK Settings', icon: <Settings className="h-5 w-5" /> },
  { id: 'api-test', label: 'API Test', icon: <TestTube className="h-5 w-5" /> }];


  const externalLinks = [
  { path: '/anomaly-detection', label: 'Anomaly Detection', icon: <AlertTriangle className="h-5 w-5" /> },
  { path: '/cfd-strategy', label: 'CFD Strategy', icon: <TrendingUp className="h-5 w-5" /> },
  { path: '/blog', label: 'Blog', icon: <BookOpen className="h-5 w-5" /> }];

  const optionsDataLinks = [
  { path: '/options-greeks', label: 'Options Greeks', icon: <PieChart className="h-5 w-5" /> },
  { path: '/spx-options', label: 'SPX Options', icon: <TrendingUp className="h-5 w-5" /> }];


  const SidebarContent = () =>
  <>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">AI QUANT</h1>
            <p className="text-xs text-slate-400">v1.0.0 MVP</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <div className="space-y-1 sm:space-y-2">
          {navigation.map((item) =>
        <Button
          key={item.id}
          variant={activeTab === item.id ? "secondary" : "ghost"}
          className={`w-full justify-start text-left min-h-[44px] ${
          activeTab === item.id ?
          "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30" :
          "text-slate-300 hover:text-white hover:bg-slate-700"}`
          }
          onClick={() => {
            if (item.id === 'api-test') {
              navigate('/api-test');
            } else if (item.id === 'iron-condor') {
              navigate('/iron-condor');
            } else {
              setActiveTab(item.id);
            }
            setOpen(false);
          }}>

              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  {item.icon}
                  <span className="text-sm sm:text-base">{item.label}</span>
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
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2 px-2 sm:px-3">Trading Tools</p>
          <div className="space-y-1 sm:space-y-2">
            {externalLinks.map((link) =>
          <Link key={link.path} to={link.path} onClick={() => setOpen(false)}>
                <Button
              variant="ghost"
              className="w-full justify-start text-left text-slate-300 hover:text-white hover:bg-slate-700 min-h-[44px]"
              data-tour={link.path === '/cfd-strategy' ? 'sidebar-cfd' : link.path === '/anomaly-detection' ? 'sidebar-anomaly' : undefined}>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {link.icon}
                    <span className="text-sm sm:text-base">{link.label}</span>
                  </div>
                </Button>
              </Link>
          )}
          </div>
        </div>

        {/* Options Data Section */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-2 px-2 sm:px-3">Options Data</p>
          <div className="space-y-1 sm:space-y-2">
            {optionsDataLinks.map((link) =>
          <Link key={link.path} to={link.path} onClick={() => setOpen(false)}>
                <Button
              variant="ghost"
              className="w-full justify-start text-left text-slate-300 hover:text-white hover:bg-slate-700 min-h-[44px]">

                  <div className="flex items-center gap-2 sm:gap-3">
                    {link.icon}
                    <span className="text-sm sm:text-base">{link.label}</span>
                  </div>
                </Button>
              </Link>
          )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-700">
        <button
        onClick={onStartTour}
        data-tour="help-button"
        className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 mb-2 min-h-[44px]"
        title="Start Interactive Tour">

          <HelpCircle className="w-5 h-5" />
          <span className="font-medium text-sm sm:text-base">Help & Tour</span>
        </button>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700 min-h-[44px]">
            <User className="h-5 w-5 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Profile</span>
          </Button>
        </div>
        <div className="mt-3 sm:mt-4 p-3 bg-slate-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">System Status</span>
          </div>
          <div className="text-xs text-slate-400">
            All systems operational
          </div>
        </div>
      </div>
    </>;


  return (
    <>
      {/* Mobile Hamburger Menu */}
      <div className="lg:hidden fixed top-10 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">AI QUANT</h1>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 bg-slate-800 border-slate-700">
              <div className="flex flex-col h-full">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-slate-800 border-r border-slate-700 flex-col">
        <SidebarContent />
      </div>
    </>);

};

export default Sidebar;