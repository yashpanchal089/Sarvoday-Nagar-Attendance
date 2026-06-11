import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import Avatar from '../components/Avatar';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  UserPlus, 
  History, 
  LogOut, 
  Menu, 
  Bell, 
  ChevronLeft, 
  User,
  Settings,
  FileSpreadsheet
} from 'lucide-react';

export const DashboardLayout = ({ children, title = 'Dashboard' }) => {
  const { currentUser, logout, stats } = useApp();
  const { currentPage, navigateTo } = useNavigation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { name: 'Register Yuvak', icon: UserPlus, page: 'register' },
    { name: 'Mark Attendance', icon: ClipboardCheck, page: 'mark' },
    { name: 'Yuvak List', icon: Users, page: 'users' },
    { name: 'Attendance History', icon: History, page: 'history' },
    { name: 'Monthly Report', icon: FileSpreadsheet, page: 'report' }
  ];

  const handleLogout = () => {
    logout();
    navigateTo('login');
  };

  const handleProfileClick = (userId) => {
    // Redirect to active admin's profile or general settings (we can map to user profile)
    setIsProfileDropdownOpen(false);
    navigateTo('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative pb-16 md:pb-0">
      
      {/* 1. Sidebar Navigation (Desktop View, Permanently Expanded) */}
      <aside 
        className="hidden md:flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ease-in-out z-30 md:sticky md:top-0 md:h-screen w-64"
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center border-b border-slate-50 px-4 justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 flex-shrink-0 object-contain rounded-lg" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 tracking-tight uppercase truncate">Sarvoday</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider -mt-1">Yuvak Mandal</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.name}
                onClick={() => navigateTo(item.page)}
                className={`
                  w-full flex items-center rounded-xl p-3 text-sm font-medium transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? 'bg-brand-orange-50 text-brand-orange-600 shadow-xs shadow-brand-orange-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                title={item.name}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 mr-3 ${isActive ? 'text-brand-orange-500' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Admin details) */}
        {currentUser && (
          <div className="p-4 border-t border-slate-50 flex items-center bg-slate-50/50 space-x-3">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </aside>

      {/* 2. Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header / Profile Bar */}
        <header className="h-16 bg-white/95 border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
          </div>

          {/* Right Header: Notification & Admin profile dropdown */}
          <div className="flex items-center space-x-4">
            
            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-orange-500 ring-2 ring-white" />
            </button>

            {/* Profile Dropdown */}
            {currentUser && (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
                  <span className="hidden sm:inline-block text-xs font-semibold text-slate-700">{currentUser.name}</span>
                </button>

                {/* Dropdown Card */}
                {isProfileDropdownOpen && (
                  <>
                    {/* Click backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-lg z-20 page-enter">
                      <div className="px-3 py-2 border-b border-slate-50">
                        <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                        <p className="text-[10px] mt-1 font-semibold text-brand-orange-600 bg-brand-orange-50 inline-block px-1.5 py-0.5 rounded">
                          {currentUser.role}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            navigateTo('dashboard');
                          }}
                          className="w-full flex items-center px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <User className="h-4 w-4 mr-2.5 text-slate-400" />
                          Dashboard Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-2.5 text-red-400" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* 3. Main Scrollable Page Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation (Visible only on Mobile screens < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex justify-around items-center z-30 shadow-lg">
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.name}
              onClick={() => navigateTo(item.page)}
              className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${isActive ? 'text-brand-orange-600' : 'text-slate-400'}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium mt-1">{item.name.split(' ')[0]}</span>
            </button>
          );
        })}
        {/* Extra option for mobile: History */}
        <button
          onClick={() => navigateTo('history')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${currentPage === 'history' ? 'text-brand-orange-600' : 'text-slate-400'}`}
        >
          <History className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-1">History</span>
        </button>
      </nav>

      {/* 5. Mobile Drawer Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/25 z-40 backdrop-blur-xs" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col p-4 shadow-xl page-enter">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain rounded-lg" />
                <span className="text-sm font-bold text-slate-800">Sarvoday Mandal</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.page;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigateTo(item.page);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center rounded-xl p-3 text-sm font-medium transition-all duration-200 cursor-pointer
                      ${isActive 
                        ? 'bg-brand-orange-50 text-brand-orange-600' 
                        : 'text-slate-600 hover:bg-slate-50'}
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3 text-current" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {currentUser && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
