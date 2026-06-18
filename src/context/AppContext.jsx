import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { supabase } from '../utils/supabaseClient';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [activities, setActivities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  // Network Status Detectors
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Fetch all data from Supabase
  const fetchYuvaks = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('yuvaks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data.map(y => {
          const fName = y.first_name || '';
          const mName = y.middle_name || '';
          const lName = y.last_name || '';
          const fullName = `${fName} ${mName ? mName + ' ' : ''}${lName}`.trim();
          return {
            id: y.id,
            firstName: fName,
            middleName: mName,
            lastName: lName,
            name: fullName, // legacy template compatibility
            photo: y.photo_url || '',
            photoUrl: y.photo_url || '',
            dob: y.dob || '',
            age: y.age || 0,
            mobile: y.mobile || '',
            occupation: y.occupation || 'Other',
            occupationSpec: y.occupation_spec || '',
            address: y.address || '',
            createdAt: y.created_at
          };
        }));
      }
    } catch (err) {
      console.error('Error fetching yuvaks:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('attendance')
        .select('*');

      if (!error && data) {
        const formatted = {};
        data.forEach(row => {
          if (!formatted[row.attendance_date]) {
            formatted[row.attendance_date] = {};
          }
          formatted[row.attendance_date][row.yuvak_id] = row.status;
        });
        setAttendance(formatted);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setActivities(data.map(act => ({
          id: act.id,
          user: act.user_name,
          type: act.type,
          message: act.message,
          timestamp: dayjs(act.created_at).format('YYYY-MM-DD HH:mm:ss')
        })));
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchYuvaks(),
      fetchAttendance(),
      fetchActivities()
    ]);
    setLoading(false);
  };

  // Run on startup
  useEffect(() => {
    // Check if user session already exists in supabase auth
    const initAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: 'Youth Coordinator',
            avatar: '',
            email: profile.email
          });
        }
      }
      await fetchAllData();
    };

    initAuth();
  }, []);

  // Real-Time Database Channel Subscriptions
  useEffect(() => {
    if (!supabase) return;

    const yuvaksChannel = supabase.channel('yuvaks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'yuvaks' }, () => {
        fetchYuvaks();
      })
      .subscribe();

    const attendanceChannel = supabase.channel('attendance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchAttendance();
      })
      .subscribe();

    const activitiesChannel = supabase.channel('activities-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(yuvaksChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, []);

  // Logger helper
  const addActivity = async (type, message) => {
    const userName = currentUser ? `Admin (${currentUser.firstName})` : 'System';
    try {
      if (supabase) {
        await supabase.from('activities').insert({
          user_name: userName,
          type,
          message
        });
      }
    } catch (err) {
      console.error('Error saving activity:', err);
    }
  };

  // Auth Functions
  const login = async (email, password) => {
    try {
      if (!supabase) return { success: false, message: 'Supabase client not loaded' };
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      if (authData?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          const sessionUser = {
            id: authData.user.id,
            name: email.split('@')[0],
            firstName: email.split('@')[0],
            lastName: '',
            role: 'Youth Coordinator',
            avatar: '',
            email: email
          };
          setCurrentUser(sessionUser);
        } else {
          const sessionUser = {
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: 'Youth Coordinator',
            avatar: '',
            email: profile.email
          };
          setCurrentUser(sessionUser);
        }
        await addActivity('system', 'User logged in successfully');
        return { success: true };
      }
    } catch (err) {
      console.error('Login exception:', err);
      return { success: false, message: err.message };
    }
    return { success: false, message: 'Authentication failure' };
  };

  const registerAdmin = async (adminData) => {
    try {
      if (!supabase) return { success: false, message: 'Supabase client not loaded' };
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email.toLowerCase(),
        password: adminData.password,
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      if (authData?.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            first_name: adminData.firstName,
            last_name: adminData.lastName,
            email: adminData.email.toLowerCase()
          });

        if (dbError) {
          return { success: false, message: dbError.message };
        }
        
        return { success: true };
      }
    } catch (err) {
      console.error('Register exception:', err);
      return { success: false, message: err.message };
    }
    return { success: false, message: 'Registration failure' };
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  // Upload photo to storage
  const uploadPhoto = async (base64Data, filename) => {
    try {
      if (!supabase) return null;
      
      // Convert base64 data to blob
      const res = await fetch(base64Data);
      const blob = await res.blob();
      
      const fileExt = filename.split('.').pop() || 'jpg';
      const path = `${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('yuvak-photos')
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('yuvak-photos')
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload photo exception:', err);
      return null;
    }
  };

  // Yuvak CRUD Operations with Optimistic Updates
  const addUser = async (userData) => {
    const tempId = 'temp_' + Date.now();
    const finalPhotoUrl = userData.photo || '';
    const nameStr = `${userData.firstName} ${userData.middleName ? userData.middleName + ' ' : ''}${userData.lastName}`.trim();

    const newUserObj = {
      id: tempId,
      firstName: userData.firstName,
      middleName: userData.middleName || '',
      lastName: userData.lastName,
      name: nameStr,
      photo: finalPhotoUrl,
      photoUrl: finalPhotoUrl,
      dob: userData.dob,
      age: parseInt(userData.age) || 0,
      mobile: userData.mobile,
      occupation: userData.occupation || 'Other',
      occupationSpec: userData.occupationSpec || '',
      address: userData.address || '',
      createdAt: dayjs().toISOString(),
      attendancePct: 100
    };

    // Update local state immediately
    setUsers(prev => [newUserObj, ...prev]);

    // Perform database operations in the background
    (async () => {
      try {
        if (!supabase) return;
        
        let uploadedUrl = '';
        if (userData.photo && userData.photo.startsWith('data:image')) {
          uploadedUrl = await uploadPhoto(userData.photo, `${userData.firstName}_${userData.lastName}.jpg`);
        }

        const { data, error } = await supabase
          .from('yuvaks')
          .insert({
            first_name: userData.firstName,
            middle_name: userData.middleName || '',
            last_name: userData.lastName,
            dob: userData.dob,
            age: parseInt(userData.age) || 0,
            mobile: userData.mobile,
            occupation: userData.occupation,
            occupation_spec: userData.occupationSpec || '',
            address: userData.address,
            photo_url: uploadedUrl || finalPhotoUrl
          })
          .select()
          .single();

        if (error) throw error;

        // Replace temporary user with real database user in local state
        const dbUser = {
          id: data.id,
          firstName: data.first_name,
          middleName: data.middle_name,
          lastName: data.last_name,
          name: `${data.first_name} ${data.middle_name ? data.middle_name + ' ' : ''}${data.last_name}`.trim(),
          photo: data.photo_url || '',
          photoUrl: data.photo_url || '',
          dob: data.dob,
          age: data.age,
          mobile: data.mobile,
          occupation: data.occupation,
          occupationSpec: data.occupation_spec || '',
          address: data.address,
          createdAt: data.created_at,
          attendancePct: 100
        };

        setUsers(prev => prev.map(u => u.id === tempId ? dbUser : u));
        addActivity('registration', `registered new Yuvak ${userData.firstName} ${userData.lastName}`);
      } catch (err) {
        console.error('Error adding Yuvak in background:', err);
        // Rollback temporary user on error
        setUsers(prev => prev.filter(u => u.id !== tempId));
      }
    })();

    return { success: true };
  };

  const updateUser = async (updatedUser) => {
    // Keep reference of original user for potential rollback
    const originalUser = users.find(u => u.id === updatedUser.id);
    
    // Update local state immediately
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));

    (async () => {
      try {
        if (!supabase) return;

        let finalPhotoUrl = updatedUser.photoUrl || updatedUser.photo || '';
        if (finalPhotoUrl && finalPhotoUrl.startsWith('data:image')) {
          const uploadUrl = await uploadPhoto(finalPhotoUrl, `${updatedUser.firstName}_${updatedUser.lastName}.jpg`);
          finalPhotoUrl = uploadUrl || finalPhotoUrl;
        }

        const { error } = await supabase
          .from('yuvaks')
          .update({
            first_name: updatedUser.firstName,
            middle_name: updatedUser.middleName || '',
            last_name: updatedUser.lastName,
            dob: updatedUser.dob,
            age: parseInt(updatedUser.age) || 0,
            mobile: updatedUser.mobile,
            occupation: updatedUser.occupation,
            occupation_spec: updatedUser.occupationSpec || '',
            address: updatedUser.address,
            photo_url: finalPhotoUrl
          })
          .eq('id', updatedUser.id);

        if (error) throw error;

        addActivity('status', `updated profile of Yuvak ${updatedUser.firstName} ${updatedUser.lastName}`);
        fetchYuvaks(); // background sync
      } catch (err) {
        console.error('Error updating Yuvak in background:', err);
        // Rollback on error
        if (originalUser) {
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? originalUser : u));
        }
      }
    })();
  };

  const deleteUser = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Update local state immediately
    setUsers(prev => prev.filter(u => u.id !== userId));

    (async () => {
      try {
        if (!supabase) return;

        const { error } = await supabase
          .from('yuvaks')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        addActivity('status', `deleted Yuvak ${targetUser.firstName} ${targetUser.lastName}`);
      } catch (err) {
        console.error('Error deleting Yuvak in background:', err);
        // Rollback on error
        setUsers(prev => [targetUser, ...prev]);
      }
    })();
  };

  // Attendance Operations with Optimistic Updates
  const saveAttendance = async (dateStr, recordMap) => {
    // Update local state immediately so UI response is instant
    setAttendance(prev => ({
      ...prev,
      [dateStr]: recordMap
    }));

    // Perform DB sync in the background
    (async () => {
      try {
        if (!supabase) return;

        // 1. Delete existing logs on this date to prevent duplicates
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('attendance_date', dateStr);

        if (deleteError) throw deleteError;

        // 2. Insert new logs
        const insertRows = Object.keys(recordMap).map(yuvakId => ({
          attendance_date: dateStr,
          yuvak_id: yuvakId,
          status: recordMap[yuvakId],
          marked_by: currentUser?.email || 'coordinator@sarvoday.org'
        }));

        if (insertRows.length > 0) {
          const { error: insertError } = await supabase
            .from('attendance')
            .insert(insertRows);

          if (insertError) throw insertError;
        }

        addActivity('attendance', `marked attendance for ${dayjs(dateStr).format('MMMM DD, YYYY')}`);
      } catch (err) {
        console.error('Error saving attendance in background:', err);
        // Re-sync with database to correct the UI state in case of network write failure
        fetchAttendance();
      }
    })();

    return { success: true };
  };

  // Delete all attendance entries for a specific date
  const deleteAttendanceRecord = async (dateStr) => {
    try {
      if (!supabase) return;

      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('attendance_date', dateStr);

      if (error) throw error;

      await addActivity('attendance', `deleted attendance record of ${dayjs(dateStr).format('MMMM DD, YYYY')}`);
      await fetchAttendance();
    } catch (err) {
      console.error('Error deleting attendance record:', err);
    }
  };

  // Memoized lists and calculations
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

      const presents = userRecords.filter(r => r === 'Present').length;
      const total = userRecords.length;
      const percentage = Math.round((presents / total) * 100);

      return {
        ...user,
        attendancePct: percentage
      };
    });
  }, [users, attendance]);

  const stats = useMemo(() => {
    const totalUsersCount = usersWithAttendancePct.length;

    // 1. Overall Attendance %
    let totalMarks = 0;
    let totalPresents = 0;
    Object.keys(attendance).forEach(date => {
      Object.keys(attendance[date]).forEach(uId => {
        const user = usersWithAttendancePct.find(u => u.id === uId);
        if (user) {
          totalMarks++;
          if (attendance[date][uId] === 'Present') {
            totalPresents++;
          }
        }
      });
    });
    const overallAttendancePct = totalMarks > 0 
      ? Math.round((totalPresents / totalMarks) * 100) 
      : 0;

    // 2. Perfect Attendance Count (Users with overall percentage = 100)
    // Avoid counting if there are no sessions at all
    const hasAnySessions = Object.keys(attendance).length > 0;
    const perfectAttendanceCount = hasAnySessions 
      ? usersWithAttendancePct.filter(u => u.attendancePct === 100).length
      : 0;

    // 3. 3-Day Absent Alert Count
    let threeDayAbsentAlertCount = 0;
    const sortedDates = Object.keys(attendance).sort((a, b) => dayjs(b).diff(dayjs(a)));
    
    usersWithAttendancePct.forEach(user => {
      let consecutiveAbsents = 0;
      for (const d of sortedDates) {
        if (attendance[d] && attendance[d][user.id]) {
          if (attendance[d][user.id] === 'Absent') {
            consecutiveAbsents++;
            if (consecutiveAbsents === 3) {
              threeDayAbsentAlertCount++;
              break;
            }
          } else {
            // Broken chain of absents (Present)
            break;
          }
        }
      }
    });

    return {
      totalUsers: totalUsersCount,
      overallAttendance: overallAttendancePct,
      perfectAttendance: perfectAttendanceCount,
      absentAlerts: threeDayAbsentAlertCount,
    };
  }, [usersWithAttendancePct, attendance]);

  const getUserStats = (userId) => {
    const userRecords = [];
    const historyList = [];
    const sortedDates = Object.keys(attendance).sort((a, b) => dayjs(b).diff(dayjs(a)));

    sortedDates.forEach(date => {
      if (attendance[date] && attendance[date][userId]) {
        const status = attendance[date][userId];
        userRecords.push(status);
        historyList.push({ date, status });
      }
    });

    const total = userRecords.length;
    const presents = userRecords.filter(r => r === 'Present').length;
    const absents = userRecords.filter(r => r === 'Absent').length;

    return {
      total,
      presents,
      absents,
      history: historyList
    };
  };

  return (
    <AppContext.Provider value={{
      users: usersWithAttendancePct,
      attendance,
      activities,
      currentUser,
      stats,
      isOnline,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      saveAttendance,
      deleteAttendanceRecord,
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
