import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import dayjs from 'dayjs';
import Avatar from '../components/Avatar';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  UserPlus, 
  LogOut, 
  Menu, 
  Bell, 
  ChevronLeft, 
  FileSpreadsheet,
  WifiOff,
  History,
  X
} from 'lucide-react';

export const DashboardLayout = ({ children, title = 'Dashboard' }) => {
  const { currentUser, logout, isOnline, users = [] } = useApp();
  const { currentPage, navigateTo } = useNavigation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Track dismissed birthday notifications, persistent by date
  const [dismissedBirthdays, setDismissedBirthdays] = useState(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    try {
      const stored = localStorage.getItem(`dismissed_birthdays_${todayStr}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDismissBirthday = (userId) => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const updated = [...dismissedBirthdays, userId];
    setDismissedBirthdays(updated);
    try {
      localStorage.setItem(`dismissed_birthdays_${todayStr}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save dismissed birthdays to localStorage:', e);
    }
  };

  // Compute birthdays happening today
  const birthdaysToday = useMemo(() => {
    const todayStr = dayjs().format('MM-DD');
    return users.filter(user => {
      if (!user.dob) return false;
      if (dismissedBirthdays.includes(user.id)) return false;
      return dayjs(user.dob).format('MM-DD') === todayStr;
    });
  }, [users, dismissedBirthdays]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { name: 'Register Yuvak', icon: UserPlus, page: 'register' },
    { name: 'Mark Attendance', icon: ClipboardCheck, page: 'mark' },
    { name: 'Attendance History', icon: History, page: 'history' },
    { name: 'Yuvak List', icon: Users, page: 'users' },
    { name: 'Reports', icon: FileSpreadsheet, page: 'report' }
  ];

  const mobileNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { name: 'Register', icon: UserPlus, page: 'register' },
    { name: 'Attendance', icon: ClipboardCheck, page: 'mark' },
    { name: 'Yuvaks', icon: Users, page: 'users' },
    { name: 'History', icon: History, page: 'history' }
  ];

  const drawerItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { name: 'Register', icon: UserPlus, page: 'register' },
    { name: 'Attendance', icon: ClipboardCheck, page: 'mark' },
    { name: 'Yuvaks', icon: Users, page: 'users' },
    { name: 'History', icon: History, page: 'history' },
    { name: 'Reports', icon: FileSpreadsheet, page: 'report' }
  ];

  const handleLogout = () => {
    logout();
    navigateTo('login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row relative pb-20 md:pb-0">
      
      {/* 1. Sidebar Navigation (Desktop View) */}
      <aside 
        className="hidden md:flex flex-col bg-white border-r border-slate-100 sticky top-0 h-screen w-64 flex-shrink-0"
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center border-b border-slate-50 px-4">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 bg-white border border-slate-150 shadow-xs flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-full w-full object-cover scale-[1.12]" 
              />
            </div>
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
                    ? 'bg-orange-50 text-brand-orange-600 shadow-xs shadow-brand-orange-100/50' 
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
          <div className="p-4 border-t border-slate-100 flex items-center bg-slate-50/50 space-x-3">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-650 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-white text-xs font-bold text-center py-2 px-4 flex items-center justify-center space-x-2 z-50">
            <WifiOff className="h-4 w-4 animate-bounce" />
            <span>No Internet Connection. You are offline. Dynamic data changes will sync upon reconnection.</span>
          </div>
        )}

        {/* Top Header / Profile Bar */}
        <header className="h-16 bg-white/95 border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            {/* Mobile Drawer Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            
            {/* Mobile Brand Logo & Text */}
            <div className="flex md:hidden items-center space-x-2">
              <div className="h-8.5 w-8.5 rounded-full overflow-hidden bg-white border border-slate-150 shadow-xs flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="h-full w-full object-cover scale-[1.12]" 
                />
              </div>
              <span className="text-base font-extrabold text-[#2C1F16] font-serif tracking-wide">SNYM</span>
            </div>

            {/* Desktop Page Title */}
            <h2 className="hidden md:block text-xl font-bold text-[#2C1F16] font-serif tracking-tight">{title}</h2>
          </div>

          {/* Right Header: Global User Profile and Logout */}
          <div className="flex items-center space-x-4">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer outline-none"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {birthdaysToday.length > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-orange-500 ring-2 ring-white flex items-center justify-center text-[8px] text-white font-bold leading-none">
                    {birthdaysToday.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <>
                  {/* Backdrop to close dropdown on outer click */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2.5 w-72 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.1)] p-4 z-50 flex flex-col page-enter">
                    <div className="px-2 py-1 text-left min-w-0">
                      <p className="text-xs font-bold text-slate-800">Notifications</p>
                    </div>
                    
                    {/* Divider */}
                    <div className="border-t border-slate-150/60 w-full my-2" />
                    
                    {/* Notifications List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {birthdaysToday.length > 0 ? (
                        birthdaysToday.map(user => {
                          const waText = encodeURIComponent(`Jay Swaminarayan ${user.firstName}! Wish you a very Happy Birthday! 🙏🎂`);
                          const waUrl = `https://wa.me/${user.mobile.startsWith('+') ? user.mobile : '91' + user.mobile}?text=${waText}`;
                          
                          return (
                            <div key={user.id} className="group relative flex items-start space-x-2.5 p-2 pr-7 rounded-xl hover:bg-slate-50/70 transition-colors text-left">
                              <span className="text-base select-none mt-0.5">🎂</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-slate-700 leading-normal">
                                  Today is <span className="font-bold text-[#FF7A3C]">{user.firstName} {user.lastName}</span>'s birthday! Wish them a happy birthday.
                                </p>
                                <a 
                                  href={waUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-[10px] font-bold text-emerald-600 hover:text-emerald-700 mt-1.5 transition-colors"
                                >
                                  💬 Wish on WhatsApp
                                </a>
                              </div>
                              <button 
                                onClick={() => handleDismissBirthday(user.id)}
                                className="absolute right-1.5 top-1.5 p-1 rounded-lg text-slate-350 hover:text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Dismiss"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          No notifications today 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Detail and Sign Out Action */}
            {currentUser && (
              <div className="relative">
                {/* Trigger Button (Avatar and User Name) */}
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-all cursor-pointer select-none outline-none"
                  title="User Profile"
                >
                  <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
                  <div className="hidden lg:flex flex-col text-left min-w-0 pr-1">
                    <span className="text-xs font-bold text-slate-700 truncate">{currentUser.name}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <>
                    {/* Invisible backdrop overlay to close dropdown on outer click */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.1)] p-3.5 z-50 flex flex-col page-enter">
                      {/* Name & Login ID details */}
                      <div className="px-2 py-1 text-left min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{currentUser.email}</p>
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t border-slate-150/60 w-full my-2.5" />
                      
                      {/* Sign Out option below */}
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-2 p-2 rounded-xl text-slate-500 hover:text-red-650 hover:bg-red-50/50 active:scale-[0.98] transition-all cursor-pointer text-xs font-bold text-left outline-none"
                      >
                        <LogOut className="h-4.5 w-4.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* 3. Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 4. Fixed Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E0D8]/60 flex justify-around items-end pb-1.5 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          
          if (item.page === 'mark') {
            return (
              <button
                key={item.name}
                onClick={() => navigateTo(item.page)}
                className="flex flex-col items-center justify-end w-16 h-full pb-0.5 relative transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#FF8850] to-[#FF6820] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(255,104,32,0.3)] absolute -top-5.5 active:scale-95 transition-all">
                  <ClipboardCheck className="h-5.5 w-5.5" />
                </div>
                <span className={`text-[10px] font-bold mt-1 tracking-tight truncate ${isActive ? 'text-[#FF7A3C]' : 'text-[#8C8276]'}`}>
                  {item.name}
                </span>
              </button>
            );
          }
          
          return (
            <button
              key={item.name}
              onClick={() => navigateTo(item.page)}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors cursor-pointer ${isActive ? 'text-[#FF7A3C]' : 'text-[#8C8276]'}`}
            >
              <Icon className={`h-5.5 w-5.5 ${isActive ? 'scale-110 text-[#FF7A3C]' : 'text-[#8C8276]'} transition-transform`} />
              <span className="text-[10px] font-bold mt-1 tracking-tight truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* 5. Mobile Drawer Menu Overlay */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-[#2C1F16]/20 z-40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Drawer Panel */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-[#F2ECE4]/30 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-[#F2ECE4]/65 mb-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-white border border-[#E5E0D8] shadow-xs flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-full w-full object-cover scale-[1.12]" 
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-bold text-[#2C1F16] font-serif leading-tight">Sarvoday Nagar</span>
              <span className="text-[11px] text-[#8C8276] font-semibold leading-none mt-0.5">Yuvak Mandal</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 rounded-full border border-[#FFBCA0] bg-white flex items-center justify-center text-[#FF7A3C] hover:bg-orange-50/50 active:scale-90 transition-all shadow-xs cursor-pointer flex-shrink-0 outline-none"
            title="Close Menu"
          >
            <X className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto pr-1">
          {drawerItems.map((item) => {
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
                  w-full flex items-center rounded-full py-3 px-5 text-sm transition-all duration-250 cursor-pointer outline-none active:scale-[0.98]
                  ${isActive 
                    ? 'bg-[#FF7A3C] text-white font-bold shadow-[0_4px_12px_rgba(255,122,60,0.25)]' 
                    : 'text-[#5C5248] hover:bg-[#FAF9F6] hover:text-[#2C1F16] font-medium'}
                `}
              >
                <Icon className="h-5 w-5 mr-3.5 text-current flex-shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {currentUser && (
          <div className="px-5 py-4 border-t border-[#F2ECE4]/60 flex items-center justify-between flex-shrink-0 bg-[#FFFBF9]">
            <div className="flex items-center space-x-2.5">
              <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
