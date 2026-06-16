import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserRegistration from './pages/UserRegistration';
import UserList from './pages/UserList';
import AttendanceMarking from './pages/AttendanceMarking';
import AttendanceHistory from './pages/AttendanceHistory';
import UserProfile from './pages/UserProfile';
import MonthlyReport from './pages/MonthlyReport';

function AppContent() {
  const { currentPage, navigateTo } = useNavigation();
  const { currentUser, dbLoading } = useApp();

  // Handle auto-routing and guards after authentication loads
  React.useEffect(() => {
    if (!dbLoading) {
      if (!currentUser && currentPage !== 'login') {
        navigateTo('login');
      } else if (currentUser && currentPage === 'login') {
        navigateTo('dashboard');
      }
    }
  }, [currentUser, dbLoading, currentPage, navigateTo]);

  // Show a professional loading splash screen while restoring session on startup
  if (dbLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] p-6 text-center">
        <div className="h-20 w-20 rounded-full overflow-hidden border border-slate-150 shadow-md mb-4 flex items-center justify-center bg-white animate-pulse">
          <img 
            src="/logo.png" 
            alt="Sarvoday Logo" 
            className="h-full w-full object-cover scale-[1.12]" 
          />
        </div>
        <h3 className="text-sm font-bold text-slate-700 tracking-tight">Sarvoday Yuvak Mandal</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 animate-pulse">
          Loading system &amp; restoring session...
        </p>
      </div>
    );
  }

  const isLoginPage = currentPage === 'login';
  
  if (!currentUser && !isLoginPage) {
    return <Login />;
  }

  return (
    <div className="page-enter">
      {(() => {
        switch (currentPage) {
          case 'login':
            return <Login />;
          case 'dashboard':
            return <Dashboard />;
          case 'register':
            return <UserRegistration />;
          case 'users':
            return <UserList />;
          case 'mark':
            return <AttendanceMarking />;
          case 'history':
            return <AttendanceHistory />;
          case 'report':
            return <MonthlyReport />;
          case 'profile':
            return <UserProfile />;
          default:
            return <Login />;
        }
      })()}
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AppProvider>
  );
}

export default App;
