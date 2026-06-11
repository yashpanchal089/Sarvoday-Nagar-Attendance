import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { initialUsers, initialActivities, generateMockAttendanceHistory } from '../utils/mockData';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Try loading from localStorage first, otherwise fallback to mock data
  // Also clear old mock keys automatically if mock user 'u1' is detected
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('smym_users');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && parsed.some(u => u.id === 'u1')) {
        localStorage.removeItem('smym_users');
        localStorage.removeItem('smym_attendance');
        localStorage.removeItem('smym_activities');
        return initialUsers;
      }
      return parsed;
    }
    return initialUsers;
  });

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem('smym_attendance');
    if (saved) return JSON.parse(saved);
    return generateMockAttendanceHistory(initialUsers);
  });
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('smym_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('smym_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [admins, setAdmins] = useState(() => {
    const saved = localStorage.getItem('smym_admins');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('smym_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('smym_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('smym_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('smym_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smym_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smym_user_session');
    }
  }, [currentUser]);

  // Auth Operations
  const login = (email, password) => {
    console.log('Login request received for:', email, 'Password:', password);
    console.log('Registered accounts JSON:', JSON.stringify(admins));

    // Basic mock authentication
    if (email === 'admin@sarvoday.org' && password === 'admin123') {
      setCurrentUser({
        name: 'Ketan Vyas',
        firstName: 'Ketan',
        lastName: 'Vyas',
        role: 'Youth Coordinator',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        email: 'ketan.vyas@sarvoday.org'
      });
      addActivity('system', 'User Admin (Ketan Vyas) logged in successfully');
      return { success: true };
    }

    const registeredAdmin = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (registeredAdmin) {
      setCurrentUser({
        name: `${registeredAdmin.firstName} ${registeredAdmin.lastName}`,
        firstName: registeredAdmin.firstName,
        lastName: registeredAdmin.lastName,
        role: 'Youth Coordinator',
        avatar: '', // Default placeholder avatar
        email: registeredAdmin.email
      });
      addActivity('system', `User ${registeredAdmin.firstName} ${registeredAdmin.lastName} logged in successfully`);
      return { success: true };
    }

    return { success: false, message: 'Invalid email or password' };
  };

  const registerAdmin = (adminData) => {
    console.log('Attempting to register account:', adminData);
    if (adminData.email.toLowerCase() === 'admin@sarvoday.org' || admins.some(a => a.email.toLowerCase() === adminData.email.toLowerCase())) {
      console.log('Registration failed: email already registered');
      return { success: false, message: 'Email address is already registered' };
    }
    const newAdmin = {
      id: `admin_${Date.now()}`,
      ...adminData
    };
    setAdmins(prev => {
      const updated = [...prev, newAdmin];
      console.log('Updating admins state to:', updated);
      return updated;
    });
    return { success: true };
  };

  const logout = () => {
    addActivity('system', 'User Admin (Ketan Vyas) logged out');
    setCurrentUser(null);
  };

  // Add Activity Log
  const addActivity = (type, message) => {
    const newActivity = {
      id: `act_${Date.now()}`,
      user: currentUser ? `Admin (${currentUser.name})` : 'System',
      type,
      message,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep latest 50
  };

  // User CRUD Operations
  const addUser = (userData) => {
    const newUser = {
      id: `u_${Date.now()}`,
      ...userData,
      joiningDate: userData.joiningDate || dayjs().format('YYYY-MM-DD'),
      status: userData.status || 'active',
      attendancePct: 100 // New users start at 100%
    };
    setUsers(prev => [newUser, ...prev]);
    addActivity('registration', `registered new Yuvak ${newUser.name}`);
  };

  const updateUser = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addActivity('status', `updated profile details of ${updatedUser.name}`);
  };

  const deleteUser = (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    // Clean up attendance history for this user
    setAttendance(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(date => {
        delete updated[date][userId];
      });
      return updated;
    });

    addActivity('status', `removed Yuvak ${targetUser.name} from the records`);
  };

  // Attendance Marking
  const saveAttendance = (dateStr, recordMap) => {
    setAttendance(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        ...recordMap
      }
    }));

    // Recompute attendance percentages for all users immediately
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        const userRecords = [];
        
        // Collate all records for this user, incorporating the newly marked ones
        const allDates = new Set([
          ...Object.keys(attendance),
          dateStr
        ]);

        allDates.forEach(d => {
          const dayRecords = d === dateStr ? recordMap : attendance[d];
          if (dayRecords && dayRecords[user.id]) {
            userRecords.push(dayRecords[user.id]);
          }
        });

        if (userRecords.length === 0) return { ...user, attendancePct: 100 };

        const presents = userRecords.filter(r => r === 'present').length;
        const leaves = userRecords.filter(r => r === 'leave').length;
        const total = userRecords.length;

        // In our spiritual organization, official leaves count towards attendance or are neutral.
        // Let's compute attendance percentage as: (Present + Leave) / Total * 100
        const percentage = Math.round(((presents + leaves) / total) * 100);

        return {
          ...user,
          attendancePct: percentage
        };
      });
    });

    addActivity('attendance', `marked attendance for ${dayjs(dateStr).format('MMMM DD, YYYY')}`);
  };

  // Memoized System Calculations for Dashboards
  const stats = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'active');
    const totalUsersCount = users.length;

    // 1. Overall Attendance %
    let totalMarks = 0;
    let totalPresentsOrLeaves = 0;
    Object.keys(attendance).forEach(date => {
      Object.keys(attendance[date]).forEach(uId => {
        // Only count active users in overall percentage
        const user = users.find(u => u.id === uId);
        if (user && user.status === 'active') {
          totalMarks++;
          if (attendance[date][uId] === 'present' || attendance[date][uId] === 'leave') {
            totalPresentsOrLeaves++;
          }
        }
      });
    });
    const overallAttendancePct = totalMarks > 0 
      ? Math.round((totalPresentsOrLeaves / totalMarks) * 100) 
      : 0;

    // 2. Weekly Perfect Attendance Count
    // Look at past 7 days of records, count active users who were never absent
    const past7Days = [];
    for (let i = 0; i < 7; i++) {
      past7Days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
    }

    const perfectAttendanceCount = activeUsers.filter(user => {
      let perfect = true;
      let hasRecord = false;
      past7Days.forEach(date => {
        if (attendance[date] && attendance[date][user.id]) {
          hasRecord = true;
          if (attendance[date][user.id] === 'absent') {
            perfect = false;
          }
        }
      });
      return hasRecord && perfect;
    }).length;

    // 3. Today's Attendance %
    const todayStr = dayjs().format('YYYY-MM-DD');
    let todayPresent = 0;
    let todayMarked = 0;

    if (attendance[todayStr]) {
      Object.keys(attendance[todayStr]).forEach(uId => {
        const user = users.find(u => u.id === uId);
        if (user && user.status === 'active') {
          todayMarked++;
          if (attendance[todayStr][uId] === 'present' || attendance[todayStr][uId] === 'leave') {
            todayPresent++;
          }
        }
      });
    }

    // Fallback if today's attendance isn't marked yet
    const todayAttendancePct = todayMarked > 0 
      ? Math.round((todayPresent / todayMarked) * 100) 
      : null;

    return {
      totalUsers: totalUsersCount,
      overallAttendance: overallAttendancePct,
      perfectAttendance: perfectAttendanceCount,
      todayAttendance: todayAttendancePct,
    };
  }, [users, attendance]);

  // Individual user's detailed attendance statistics helper
  const getUserStats = (userId) => {
    const userRecords = [];
    const history = [];

    // Sort dates descending to show newest first in profile log
    const sortedDates = Object.keys(attendance).sort((a, b) => dayjs(b).diff(dayjs(a)));

    sortedDates.forEach(date => {
      if (attendance[date] && attendance[date][userId]) {
        const status = attendance[date][userId];
        userRecords.push(status);
        history.push({
          date,
          status
        });
      }
    });

    const total = userRecords.length;
    const presents = userRecords.filter(r => r === 'present').length;
    const leaves = userRecords.filter(r => r === 'leave').length;
    const absents = userRecords.filter(r => r === 'absent').length;

    return {
      total,
      presents,
      leaves,
      absents,
      history
    };
  };

  return (
    <AppContext.Provider value={{
      users,
      attendance,
      activities,
      currentUser,
      stats,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      saveAttendance,
      getUserStats,
      addActivity,
      registerAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
