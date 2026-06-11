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
  const { currentPage } = useNavigation();
  const { currentUser } = useApp();

  // Route security guard: Redirect to login if user isn't authenticated
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
