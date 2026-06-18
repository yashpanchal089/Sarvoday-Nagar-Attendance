import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Avatar from '../components/Avatar';
import { X } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';

export const UserProfile = () => {
  const { activeUserId, navigateTo } = useNavigation();
  const { users, getUserStats } = useApp();

  // Find user details. Fallback to first active user if none selected
  const user = useMemo(() => {
    const found = users.find(u => u.id === activeUserId);
    if (found) return found;
    return users.find(u => u.status === 'active') || users[0];
  }, [users, activeUserId]);

  // If no users exist in the system
  if (!user) {
    return (
      <DashboardLayout title="Member Profile">
        <div className="max-w-xl mx-auto page-enter text-center p-8 bg-[#FAF9F6] border border-[#F2ECE4]/40 rounded-[28px] shadow-sm">
          <p className="text-sm text-[#8C8276] font-semibold uppercase">No users found in the system.</p>
          <button 
            onClick={() => navigateTo('register')} 
            className="mt-4 px-6 py-2.5 bg-[#FF7A3C] hover:bg-[#E66327] text-white font-semibold rounded-2xl cursor-pointer"
          >
            Register a Member
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Get user-specific attendance details
  const { total, presents, absents, history } = getUserStats(user.id);

  // Group history by month to prepare monthly bar chart data
  const monthlyData = useMemo(() => {
    const months = {};
    
    // Group records by month code (e.g. "06" for June)
    history.forEach(record => {
      const monthCode = dayjs(record.date).format('MM');
      if (!months[monthCode]) {
        months[monthCode] = { 
          monthName: monthCode, 
          present: 0, 
          absent: 0, 
          total: 0 
        };
      }
      months[monthCode].total++;
      if (record.status === 'Present') {
        months[monthCode].present++;
      } else if (record.status === 'Absent') {
        months[monthCode].absent++;
      }
    });

    // Convert to list sorted chronologically by month code
    const sortedList = Object.values(months).sort((a, b) => a.monthName.localeCompare(b.monthName));

    // Fallback to show current month if there's no history yet
    if (sortedList.length === 0) {
      const currentMonth = dayjs().format('MM');
      sortedList.push({
        monthName: currentMonth,
        present: 0,
        absent: 0,
        total: 0
      });
    }

    return sortedList;
  }, [history]);

  // Construct full name
  const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');

  return (
    <DashboardLayout title={`${fullName}'s Profile`}>
      <div className="max-w-xl mx-auto page-enter py-4">
        
        {/* Main Details Card */}
        <div className="bg-[#FAF9F6] rounded-[28px] border border-[#F2ECE4]/40 shadow-[0_16px_40px_rgba(223,215,202,0.3)] p-6 sm:p-8 relative">
          
          {/* Close Icon Button */}
          <button
            onClick={() => navigateTo('users')}
            className="absolute top-5 right-5 w-9 h-9 rounded-full border border-[#FF7A3C] bg-white flex items-center justify-center text-[#FF7A3C] hover:bg-orange-50 transition-colors shadow-xs cursor-pointer"
            title="Close Profile"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* User Name in Serif */}
          <h2 className="text-2xl font-bold text-[#2C1F16] font-serif mb-6 pr-10">
            {fullName}
          </h2>

          {/* Centered Circular Avatar */}
          <div className="flex justify-center mb-8">
            <div className="w-36 h-36 rounded-full overflow-hidden border border-slate-200/80 shadow-sm bg-white flex items-center justify-center">
              {user.photoUrl || user.photo ? (
                <img 
                  src={user.photoUrl || user.photo} 
                  alt={fullName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-3xl font-bold text-brand-orange-500 uppercase">
                  {user.firstName[0]}
                  {user.lastName ? user.lastName[0] : ''}
                </div>
              )}
            </div>
          </div>

          {/* Personal Metadata List with Horizontal Dividers */}
          <div className="space-y-4 mb-8">
            {/* DOB */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#F2ECE4]/60">
              <span className="text-sm font-medium text-[#8C8276]">DOB</span>
              <span className="text-sm font-semibold text-[#2C1F16]">{user.dob}</span>
            </div>
            
            {/* Age */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#F2ECE4]/60">
              <span className="text-sm font-medium text-[#8C8276]">Age</span>
              <span className="text-sm font-semibold text-[#2C1F16]">{user.age}</span>
            </div>
            
            {/* Mobile */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#F2ECE4]/60">
              <span className="text-sm font-medium text-[#8C8276]">Mobile</span>
              <span className="text-sm font-semibold text-[#2C1F16] tracking-wide">{user.mobile}</span>
            </div>
            
            {/* Occupation */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#F2ECE4]/60">
              <span className="text-sm font-medium text-[#8C8276]">Occupation</span>
              <span className="text-sm font-semibold text-[#2C1F16]">{user.occupation}</span>
            </div>
            
            {/* Occupation Details */}
            {user.occupationSpec && (
              <div className="flex justify-between items-center py-2.5 border-b border-[#F2ECE4]/60">
                <span className="text-sm font-medium text-[#8C8276]">
                  {user.occupation === 'Student' ? 'Standard Studying' :
                   user.occupation === 'Job' ? 'Job Title' :
                   user.occupation === 'Business' ? 'Business Type' : 'Details'}
                </span>
                <span className="text-sm font-semibold text-[#2C1F16] text-right max-w-[280px] break-words">
                  {user.occupationSpec}
                </span>
              </div>
            )}
            
            {/* Address */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#F2ECE4]/60">
              <span className="text-sm font-medium text-[#8C8276]">Address</span>
              <span className="text-sm font-semibold text-[#2C1F16] text-right max-w-[280px] break-words">
                {user.address || 'N/A'}
              </span>
            </div>
          </div>

          {/* Row of 4 Metrics Cards */}
          <div className="grid grid-cols-4 gap-2.5 mb-8">
            {/* Sabhas card */}
            <div className="bg-[#FFF5EE] rounded-2xl py-3 px-1 text-center border border-[#FEEAD9]/40 flex flex-col justify-center shadow-xs">
              <span className="text-xl font-bold text-[#2C1F16]">{total}</span>
              <span className="text-[10px] font-bold text-[#8C8276] mt-1 uppercase tracking-wider block">Sabhas</span>
            </div>

            {/* Present card */}
            <div className="bg-[#FFF5EE] rounded-2xl py-3 px-1 text-center border border-[#FEEAD9]/40 flex flex-col justify-center shadow-xs">
              <span className="text-xl font-bold text-[#2C1F16]">{presents}</span>
              <span className="text-[10px] font-bold text-[#8C8276] mt-1 uppercase tracking-wider block">Present</span>
            </div>

            {/* Absent card */}
            <div className="bg-[#FFF5EE] rounded-2xl py-3 px-1 text-center border border-[#FEEAD9]/40 flex flex-col justify-center shadow-xs">
              <span className="text-xl font-bold text-[#2C1F16]">{absents}</span>
              <span className="text-[10px] font-bold text-[#8C8276] mt-1 uppercase tracking-wider block">Absent</span>
            </div>

            {/* Attendance Rate card */}
            <div className="bg-[#FFF5EE] rounded-2xl py-3 px-1 text-center border border-[#FEEAD9]/40 flex flex-col justify-center shadow-xs">
              <span className="text-xl font-bold text-[#2C1F16]">{user.attendancePct}%</span>
              <span className="text-[10px] font-bold text-[#8C8276] mt-1 uppercase tracking-wider block">Rate</span>
            </div>
          </div>

          {/* Stacked Monthly Attendance Bar Chart */}
          <div className="h-56 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="monthName" 
                  tick={{ fontSize: 11, fill: '#8C8276', fontWeight: 500 }} 
                  axisLine={{ stroke: '#E5E0D8' }} 
                  tickLine={{ stroke: '#E5E0D8' }} 
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 11, fill: '#8C8276', fontWeight: 500 }} 
                  axisLine={{ stroke: '#E5E0D8' }} 
                  tickLine={{ stroke: '#E5E0D8' }} 
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="present" name="Present" stackId="a" fill="#10B981" barSize={32} />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
