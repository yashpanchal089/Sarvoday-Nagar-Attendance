import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  // Load state from localStorage on startup, defaulting to 'login' or 'dashboard' based on session presence
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('smym_current_page');
    return savedPage || 'login';
  });

  const [activeUserId, setActiveUserId] = useState(() => {
    return localStorage.getItem('smym_active_user_id') || null;
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('smym_current_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (activeUserId) {
      localStorage.setItem('smym_active_user_id', activeUserId);
    } else {
      localStorage.removeItem('smym_active_user_id');
    }
  }, [activeUserId]);

  const navigateTo = (page, userId = null) => {
    setCurrentPage(page);
    setActiveUserId(userId);
    // Smooth scroll to top on page switches
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider value={{ currentPage, activeUserId, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};
