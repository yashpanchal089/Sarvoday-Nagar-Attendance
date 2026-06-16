import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Avatar from '../components/Avatar';
import { Calendar, Save, CheckCircle, Search, Check, X, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';

export const AttendanceMarking = () => {
  const { users, attendance, saveAttendance } = useApp();
  const { navigateTo } = useNavigation();

  // Date selection (defaults to today)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  // Local attendance grid map: userId -> status ('Present' or 'Absent')
  const [markingGrid, setMarkingGrid] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset saved notification when selected date changes
  useEffect(() => {
    setIsSaved(false);
  }, [selectedDate]);

  // Load existing records or default to 'Absent'
  useEffect(() => {
    if (isSaved) return; // Prevent resetting grid values while the success popup is active

    const existingRecords = attendance[selectedDate] || {};
    const initialGrid = {};
    
    users.forEach(user => {
      const statusVal = existingRecords[user.id];
      if (statusVal) {
        initialGrid[user.id] = statusVal === 'Present' || statusVal === 'present' ? 'Present' : 'Absent';
      } else {
        initialGrid[user.id] = 'Absent';
      }
    });

    setMarkingGrid(initialGrid);
  }, [selectedDate, attendance, users, isSaved]);

  // Update status for a specific user
  const handleToggle = (userId) => {
    setMarkingGrid(prev => ({
      ...prev,
      [userId]: prev[userId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  // Quick select helpers
  const markAll = (status) => {
    const updated = {};
    users.forEach(user => {
      updated[user.id] = status;
    });
    setMarkingGrid(updated);
  };

  const resetSelection = () => {
    const updated = {};
    users.forEach(user => {
      updated[user.id] = 'Absent';
    });
    setMarkingGrid(updated);
  };

  // Filter users based on search input
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.toLowerCase();
      return !q || 
        fullName.includes(q) || 
        user.mobile.includes(q);
    });
  }, [users, searchQuery]);

  // Real-time Summary Counters
  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    users.forEach(user => {
      const status = markingGrid[user.id] || 'Absent';
      if (status === 'Present') present++;
      else absent++;
    });
    return { present, absent };
  }, [markingGrid, users]);

  const handleSave = async () => {
    const finalRecords = {};
    users.forEach(user => {
      finalRecords[user.id] = markingGrid[user.id] || 'Absent';
    });

    console.log("handleSave: Saving attendance for", selectedDate, "with records:", finalRecords);
    try {
      await saveAttendance(selectedDate, finalRecords);
      console.log("handleSave: saveAttendance completed successfully.");
      setIsSaved(true);
      console.log("handleSave: Set isSaved state to true.");
    } catch (err) {
      console.error("handleSave: Error calling saveAttendance:", err);
    }

    setTimeout(() => {
      console.log("handleSave: Timeout finished. Resetting isSaved.");
      setIsSaved(false);
    }, 5000); // Hide popup after 5 seconds, remaining on the page
  };

  console.log("AttendanceMarking Render: isSaved =", isSaved);

  return (
    <DashboardLayout title="Mark Attendance">
      
      {/* Save Success Toast */}
      {isSaved && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #f1f5f9',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)',
            maxWidth: '380px',
            width: 'calc(100% - 48px)',
          }}
          className="toast-enter"
        >
          <div style={{
            display: 'flex',
            height: '40px',
            width: '40px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            flexShrink: 0
          }}>
            <CheckCircle className="h-5.5 w-5.5" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
              Attendance saved.
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Successfully synced to the system.
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Header controls (Title & Date picker) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        {/* Left: Title & Subtitle */}
        <div className="flex items-start">
          <Calendar className="h-8 w-8 text-[#FF7A3C] mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="text-3xl font-bold text-[#2C1F16] font-serif leading-tight">
              Mark Attendance
            </h2>
            <p className="text-[#8C8276] text-sm mt-1.5 font-medium">
              Quickly record today's sabha attendance
            </p>
          </div>
        </div>

        {/* Right: Date Picker Box */}
        <div className="relative flex items-center bg-white border border-[#E5E0D8] rounded-2xl px-4 py-2 hover:border-[#FF7A3C] transition-colors cursor-pointer shadow-xs">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={dayjs().format('YYYY-MM-DD')}
            className="bg-transparent border-none text-slate-700 text-sm font-semibold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 3 Stats Metrics Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-6">
        {/* Total card */}
        <div className="bg-white border border-[#E5E0D8]/60 shadow-[0_8px_20px_rgba(223,215,202,0.15)] rounded-2xl p-3 sm:p-5 text-center flex flex-col justify-center min-h-[84px] sm:min-h-[96px]">
          <span className="text-[10px] sm:text-xs font-semibold text-[#8C8276] tracking-wide block">Total</span>
          <span className="text-xl sm:text-3xl font-bold text-[#2C1F16] mt-1 block sm:mt-1.5">{users.length}</span>
        </div>

        {/* Present card */}
        <div className="bg-[#E6F4EA] border border-[#A7F3D0]/60 shadow-[0_8px_20px_rgba(223,215,202,0.08)] rounded-2xl p-3 sm:p-5 text-center flex flex-col justify-center min-h-[84px] sm:min-h-[96px]">
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 tracking-wide block">Present</span>
          <span className="text-xl sm:text-3xl font-bold text-[#10B981] mt-1 block sm:mt-1.5">{summary.present}</span>
        </div>

        {/* Absent card */}
        <div className="bg-[#FCE8E6] border border-[#FECDD3]/60 shadow-[0_8px_20px_rgba(223,215,202,0.08)] rounded-2xl p-3 sm:p-5 text-center flex flex-col justify-center min-h-[84px] sm:min-h-[96px]">
          <span className="text-[10px] sm:text-xs font-semibold text-red-500 tracking-wide block">Absent</span>
          <span className="text-xl sm:text-3xl font-bold text-red-500 mt-1 block sm:mt-1.5">{summary.absent}</span>
        </div>
      </div>

      {/* Search and Quick Action Bar */}
      <div className="bg-white rounded-[20px] border border-[#E5E0D8]/60 shadow-xs p-4 flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C8276]" />
          <input
            type="text"
            placeholder="Search Yuvak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E5E0D8] rounded-xl text-sm text-[#2C1F16] placeholder-[#B0A89E] focus:outline-none focus:border-[#FF7A3C] transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => markAll('Present')}
            className="px-3.5 py-2 border border-[#10B981] bg-white rounded-xl text-xs font-semibold text-[#10B981] hover:bg-[#E6F4EA] transition-all flex items-center gap-1.5 cursor-pointer outline-none"
          >
            <Check className="h-3.5 w-3.5" />
            All Present
          </button>

          <button
            type="button"
            onClick={() => markAll('Absent')}
            className="px-3.5 py-2 border border-[#F43F5E] bg-white rounded-xl text-xs font-semibold text-[#F43F5E] hover:bg-[#FCE8E6] transition-all flex items-center gap-1.5 cursor-pointer outline-none"
          >
            <X className="h-3.5 w-3.5" />
            All Absent
          </button>

          <button
            type="button"
            onClick={resetSelection}
            className="px-3.5 py-2 border border-[#8C8276] bg-white rounded-xl text-xs font-semibold text-[#8C8276] hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer outline-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Yuvak List Container Card */}
      <div className="bg-white rounded-[28px] shadow-[0_16px_40px_rgba(223,215,202,0.3)] border border-[#F2ECE4]/30 overflow-hidden mb-6">
        <div className="divide-y divide-[#F2ECE4]/60">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const currentStatus = markingGrid[user.id] || 'Absent';
              const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
              return (
                <div key={user.id} className="flex items-center justify-between py-4 border-b border-[#F2ECE4]/60 hover:bg-slate-50/20 transition-colors px-6 sm:px-8">
                  {/* Left: Avatar and Name */}
                  <div className="flex items-center space-x-4">
                    <Avatar src={user.photoUrl || user.photo} name={fullName} size="sm" />
                    <span className="text-sm font-semibold text-[#2C1F16]">
                      {fullName}
                    </span>
                  </div>
                  
                  {/* Right: Toggle Switch A / P */}
                  <div className="flex items-center space-x-3.5">
                    <span className={`text-xs font-bold transition-colors ${currentStatus === 'Absent' ? 'text-red-500' : 'text-slate-400'}`}>
                      A
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggle(user.id)}
                      className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        currentStatus === 'Present' ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${
                          currentStatus === 'Present' ? 'translate-x-6.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-bold transition-colors ${currentStatus === 'Present' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      P
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-sm text-[#8C8276] font-medium">
              No Yuvaks found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Save Action Button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-[#FF7A3C] hover:bg-[#E66327] active:scale-[0.98] transition-all text-white font-semibold rounded-2xl text-base shadow-sm focus:outline-none cursor-pointer flex justify-center items-center gap-2"
        >
          <Save className="h-5 w-5" />
          Save Attendance
        </button>
      </div>

    </DashboardLayout>
  );
};

export default AttendanceMarking;
