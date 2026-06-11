import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { initialUsers, initialActivities, generateMockAttendanceHistory } from '../utils/mockData';
import { supabase } from '../utils/supabaseClient';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('smym_users');
    if (saved) return JSON.parse(saved);
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

  const [loading, setLoading] = useState(false);

  // Sync state to local storage as fallback
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

  // Load initial data from Supabase
  const fetchAllData = async () => {
    try {
      if (!supabase) {
        console.warn("Supabase client is not initialized. Using local storage data.");
        return;
      }

      setLoading(true);

      // 1. Fetch admins
      const { data: adminsData, error: adminsErr } = await supabase
        .from('admins')
        .select('*');
      if (!adminsErr && adminsData) {
        setAdmins(adminsData.map(a => ({
          id: a.id,
          email: a.email,
          password: a.password,
          firstName: a.first_name,
          lastName: a.last_name
        })));
      }

      // 2. Fetch yuvaks (users)
      const { data: yuvaksData, error: yuvaksErr } = await supabase
        .from('yuvaks')
        .select('*');
      if (!yuvaksErr && yuvaksData) {
        setUsers(yuvaksData.map(y => ({
          id: y.id,
          name: y.name,
          photo: y.photo,
          dob: y.dob,
          mobile: y.mobile,
          address: y.address,
          email: y.email,
          gender: y.gender,
          joiningDate: y.joining_date,
          status: y.status,
          notes: y.notes
        })));
      }

      // 3. Fetch attendance
      const { data: attendanceData, error: attendanceErr } = await supabase
        .from('attendance')
        .select('*');
      if (!attendanceErr && attendanceData) {
        const formatted = {};
        attendanceData.forEach(row => {
          if (!formatted[row.date]) {
            formatted[row.date] = {};
          }
          formatted[row.date][row.yuvak_id] = row.status;
        });
        setAttendance(formatted);
      }

      // 4. Fetch activities
      const { data: activitiesData, error: activitiesErr } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!activitiesErr && activitiesData) {
        setActivities(activitiesData.map(act => ({
          id: act.id,
          user: act.user_name,
          type: act.type,
          message: act.message,
          timestamp: dayjs(act.created_at).format('YYYY-MM-DD HH:mm:ss')
        })));
      }
    } catch (err) {
      console.error("Error connecting to Supabase database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync System Action Logger (Local & Supabase)
  const addActivity = async (type, message) => {
    const userName = currentUser ? `Admin (${currentUser.name})` : 'System';
    const newActivity = {
      id: `act_${Date.now()}`,
      user: userName,
      type,
      message,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 49)]);

    try {
      if (supabase) {
        await supabase.from('activities').insert({
          user_name: userName,
          type,
          message
        });
      }
    } catch (err) {
      console.error('Error saving activity to Supabase:', err);
    }
  };

  // Auth Operations
  const login = async (email, password) => {
    console.log('Login request received for:', email, 'Password:', password);

    // Standard hardcoded bypass developer console admin account
    if (email === 'admin@sarvoday.org' && password === 'admin123') {
      const devAdmin = {
        name: 'Ketan Vyas',
        firstName: 'Ketan',
        lastName: 'Vyas',
        role: 'Youth Coordinator',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        email: 'ketan.vyas@sarvoday.org'
      };
      setCurrentUser(devAdmin);
      await addActivity('system', 'User Admin (Ketan Vyas) logged in successfully');
      return { success: true };
    }

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (!error && data) {
          if (data.password === password) {
            const sessionUser = {
              name: `${data.first_name} ${data.last_name}`,
              firstName: data.first_name,
              lastName: data.last_name,
              role: 'Youth Coordinator',
              avatar: '',
              email: data.email
            };
            setCurrentUser(sessionUser);
            await addActivity('system', `User ${data.first_name} ${data.last_name} logged in successfully`);
            return { success: true };
          } else {
            return { success: false, message: 'Invalid email or password' };
          }
        }
      }
    } catch (err) {
      console.error('Supabase authentication check failed:', err);
    }

    // Fallback to local memory lists
    const registeredAdmin = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (registeredAdmin) {
      const sessionUser = {
        name: `${registeredAdmin.firstName} ${registeredAdmin.lastName}`,
        firstName: registeredAdmin.firstName,
        lastName: registeredAdmin.lastName,
        role: 'Youth Coordinator',
        avatar: '',
        email: registeredAdmin.email
      };
      setCurrentUser(sessionUser);
      await addActivity('system', `User ${registeredAdmin.firstName} ${registeredAdmin.lastName} logged in successfully`);
      return { success: true };
    }

    return { success: false, message: 'Invalid email or password' };
  };

  const registerAdmin = async (adminData) => {
    console.log('Attempting to register account:', adminData);
    if (adminData.email.toLowerCase() === 'admin@sarvoday.org') {
      return { success: false, message: 'Email address is already registered' };
    }

    try {
      if (supabase) {
        // Query to check existing
        const { data: existing } = await supabase
          .from('admins')
          .select('email')
          .eq('email', adminData.email.toLowerCase())
          .maybeSingle();

        if (existing) {
          return { success: false, message: 'Email address is already registered' };
        }

        const { data, error } = await supabase
          .from('admins')
          .insert({
            email: adminData.email.toLowerCase(),
            password: adminData.password,
            first_name: adminData.firstName,
            last_name: adminData.lastName
          })
          .select()
          .single();

        if (error) throw error;

        // Sync local memory list
        setAdmins(prev => [...prev, {
          id: data.id,
          email: data.email,
          password: data.password,
          firstName: data.first_name,
          lastName: data.last_name
        }]);

        return { success: true };
      }
    } catch (err) {
      console.error('Supabase registration failed, trying local fallback:', err);
    }

    // Local Storage fallback check
    if (admins.some(a => a.email.toLowerCase() === adminData.email.toLowerCase())) {
      return { success: false, message: 'Email address is already registered' };
    }

    const newAdmin = {
      id: `admin_${Date.now()}`,
      ...adminData
    };
    setAdmins(prev => [...prev, newAdmin]);
    return { success: true };
  };

  const logout = () => {
    addActivity('system', 'User Admin logged out');
    setCurrentUser(null);
  };

  // User CRUD Operations
  const addUser = async (userData) => {
    const localId = `u_${Date.now()}`;
    const joiningDateStr = userData.joiningDate || dayjs().format('YYYY-MM-DD');

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('yuvaks')
          .insert({
            name: userData.name,
            photo: userData.photo || '',
            dob: userData.dob || null,
            mobile: userData.mobile || '',
            address: userData.address || '',
            email: userData.email || '',
            gender: userData.gender || 'Male',
            joining_date: joiningDateStr,
            status: userData.status || 'active',
            notes: userData.notes || ''
          })
          .select()
          .single();

        if (error) throw error;

        setUsers(prev => [{
          id: data.id,
          name: data.name,
          photo: data.photo,
          dob: data.dob,
          mobile: data.mobile,
          address: data.address,
          email: data.email,
          gender: data.gender,
          joiningDate: data.joining_date,
          status: data.status,
          notes: data.notes
        }, ...prev]);

        await addActivity('registration', `registered new Yuvak ${data.name}`);
        return;
      }
    } catch (err) {
      console.error('Error saving Yuvak to database:', err);
    }

    // Local fallback
    const newUser = {
      id: localId,
      ...userData,
      joiningDate: joiningDateStr,
      status: userData.status || 'active'
    };
    setUsers(prev => [newUser, ...prev]);
    await addActivity('registration', `registered new Yuvak ${newUser.name}`);
  };

  const updateUser = async (updatedUser) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('yuvaks')
          .update({
            name: updatedUser.name,
            photo: updatedUser.photo || '',
            dob: updatedUser.dob || null,
            mobile: updatedUser.mobile || '',
            address: updatedUser.address || '',
            email: updatedUser.email || '',
            gender: updatedUser.gender || 'Male',
            joining_date: updatedUser.joiningDate,
            status: updatedUser.status,
            notes: updatedUser.notes || ''
          })
          .eq('id', updatedUser.id);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error updating Yuvak on database:', err);
    }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    await addActivity('status', `updated profile details of ${updatedUser.name}`);
  };

  const deleteUser = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from('yuvaks')
          .delete()
          .eq('id', userId);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error deleting Yuvak from database:', err);
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    setAttendance(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(date => {
        delete updated[date][userId];
      });
      return updated;
    });

    await addActivity('status', `removed Yuvak ${targetUser.name} from the records`);
  };

  // Attendance Marking
  const saveAttendance = async (dateStr, recordMap) => {
    try {
      if (supabase) {
        // Delete existing records on that date
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('date', dateStr);

        if (deleteError) throw deleteError;

        // Insert new records
        const insertRows = Object.keys(recordMap).map(yuvakId => ({
          date: dateStr,
          yuvak_id: yuvakId,
          status: recordMap[yuvakId]
        }));

        if (insertRows.length > 0) {
          const { error: insertError } = await supabase
            .from('attendance')
            .insert(insertRows);

          if (insertError) throw insertError;
        }
      }
    } catch (err) {
      console.error('Error saving attendance in database:', err);
    }

    // Always update local memory state immediately for immediate UI response
    setAttendance(prev => ({
      ...prev,
      [dateStr]: recordMap
    }));

    await addActivity('attendance', `marked attendance for ${dayjs(dateStr).format('MMMM DD, YYYY')}`);
  };

  // Dynamic user attendance percentage calculation (Shared across lists and profile cards)
  const usersWithAttendancePct = useMemo(() => {
    return users.map(user => {
      const userRecords = [];
      Object.keys(attendance).forEach(d => {
        const dayRecords = attendance[d];
        if (dayRecords && dayRecords[user.id]) {
          userRecords.push(dayRecords[user.id]);
        }
      });

      if (userRecords.length === 0) return { ...user, attendancePct: 100 };

      const presents = userRecords.filter(r => r === 'present').length;
      const leaves = userRecords.filter(r => r === 'leave').length;
      const total = userRecords.length;

      const percentage = Math.round(((presents + leaves) / total) * 100);

      return {
        ...user,
        attendancePct: percentage
      };
    });
  }, [users, attendance]);

  // Memoized System Calculations for Dashboards
  const stats = useMemo(() => {
    const activeUsers = usersWithAttendancePct.filter(u => u.status === 'active');
    const totalUsersCount = usersWithAttendancePct.length;

    // 1. Overall Attendance %
    let totalMarks = 0;
    let totalPresentsOrLeaves = 0;
    Object.keys(attendance).forEach(date => {
      Object.keys(attendance[date]).forEach(uId => {
        const user = usersWithAttendancePct.find(u => u.id === uId);
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
        const user = usersWithAttendancePct.find(u => u.id === uId);
        if (user && user.status === 'active') {
          todayMarked++;
          if (attendance[todayStr][uId] === 'present' || attendance[todayStr][uId] === 'leave') {
            todayPresent++;
          }
        }
      });
    }

    const todayAttendancePct = todayMarked > 0 
      ? Math.round((todayPresent / todayMarked) * 100) 
      : null;

    return {
      totalUsers: totalUsersCount,
      overallAttendance: overallAttendancePct,
      perfectAttendance: perfectAttendanceCount,
      todayAttendance: todayAttendancePct,
    };
  }, [usersWithAttendancePct, attendance]);

  // Individual user's detailed attendance statistics helper
  const getUserStats = (userId) => {
    const userRecords = [];
    const history = [];

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
      users: usersWithAttendancePct,
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
      registerAdmin,
      dbLoading: loading,
      refreshDb: fetchAllData
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
