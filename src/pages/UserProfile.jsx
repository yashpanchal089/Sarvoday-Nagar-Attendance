import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
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
        <Card className="text-center p-8">
          <p className="text-sm text-slate-400 font-semibold uppercase">No users found in the system.</p>
          <Button variant="primary" onClick={() => navigateTo('register')} className="mt-4 cursor-pointer">
            Register a Member
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  // Get user-specific attendance details
  const { total, presents, leaves, absents, history } = getUserStats(user.id);

  // 1. Heatmap data: Generate 30 days grid blocks
  const heatmapData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const record = history.find(h => h.date === dateStr);
      days.push({
        date: dateStr,
        dayNum: dayjs(dateStr).format('D'),
        monthName: dayjs(dateStr).format('MMM'),
        status: record ? record.status : 'unmarked'
      });
    }
    return days;
  }, [history]);

  // 2. Personal Trend chart data (Last 10 marked days)
  const personalChartData = useMemo(() => {
    // Take the last 10 entries from history, reverse to chronological order
    const last10 = [...history].slice(0, 10).reverse();
    let cumulativePresent = 0;
    let totalMarked = 0;

    return last10.map(h => {
      totalMarked++;
      if (h.status === 'present' || h.status === 'leave') {
        cumulativePresent++;
      }
      const score = Math.round((cumulativePresent / totalMarked) * 100);
      return {
        name: dayjs(h.date).format('MMM DD'),
        Rate: score
      };
    });
  }, [history]);

  return (
    <DashboardLayout title={`${user.name}'s Profile`}>
      
      {/* Header Back controls */}
      <div className="mb-6">
        <button 
          onClick={() => navigateTo('users')}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Member Directory
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Personal Metadata Details */}
        <Card padded={false} className="lg:col-span-1 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="p-6 text-center border-b border-slate-50">
            
            {/* Large Avatar */}
            <Avatar src={user.photo} name={user.name} size="2xl" className="shadow-md border-4 border-white mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{user.name}</h3>
            
            <div className="mt-2 flex justify-center gap-1.5">
              <Badge variant={user.status}>{user.status}</Badge>
              {user.gender && <Badge variant="info">{user.gender}</Badge>}
            </div>

            {user.notes && (
              <p className="text-[11px] text-slate-500 mt-4 italic bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                "{user.notes}"
              </p>
            )}
          </div>

          {/* Contact Details List */}
          <div className="p-6 space-y-4 flex-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Contact &amp; Mandal Info</h4>
            
            {/* Phone */}
            <div className="flex items-start">
              <Phone className="h-4 w-4 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Mobile Number</span>
                <span className="text-xs text-slate-700 font-semibold tracking-wide">{user.mobile}</span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start">
              <Mail className="h-4 w-4 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Email Address</span>
                <span className="text-xs text-slate-700 font-semibold truncate block max-w-[180px]">{user.email}</span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Address</span>
                <span className="text-xs text-slate-700 font-medium leading-relaxed block">{user.address}</span>
              </div>
            </div>

            {/* Join Date */}
            <div className="flex items-start">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Mandal Joining Date</span>
                <span className="text-xs text-slate-700 font-semibold">{dayjs(user.joiningDate).format('MMMM DD, YYYY')}</span>
              </div>
            </div>

          </div>
        </Card>

        {/* Right Stack: Stats Summary, Heatmap, Chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Metric Summaries */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Metric: Attendance score */}
            <Card padded={false} className="p-4.5 text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate %</span>
              <span className={`text-2xl font-extrabold mt-1 block ${
                user.attendancePct >= 90 ? 'text-green-600' :
                user.attendancePct >= 75 ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                {user.attendancePct}%
              </span>
            </Card>

            {/* Metric: Presents */}
            <Card padded={false} className="p-4.5 text-center flex flex-col justify-center border-l-4 border-l-green-400">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Present Days
              </span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{presents}</span>
            </Card>

            {/* Metric: Leaves */}
            <Card padded={false} className="p-4.5 text-center flex flex-col justify-center border-l-4 border-l-yellow-400">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center">
                <Sparkles className="h-3 w-3 mr-1 text-yellow-500" /> Leave Days
              </span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{leaves}</span>
            </Card>

            {/* Metric: Absents */}
            <Card padded={false} className="p-4.5 text-center flex flex-col justify-center border-l-4 border-l-red-400">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center">
                <XCircle className="h-3 w-3 mr-1 text-red-500" /> Absent Days
              </span>
              <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{absents}</span>
            </Card>

          </div>

          {/* 2. Heatmap-Style Calendar Grid (30 days contribution style) */}
          <Card title="Attendance Heatmap Calendar" subtitle="Visual record of the past 30 days status tracker">
            
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-4">
              {heatmapData.map((day) => {
                const colors = {
                  present: 'bg-green-100 hover:bg-green-200 border-green-200 text-green-800',
                  absent: 'bg-red-100 hover:bg-red-200 border-red-200 text-red-800',
                  leave: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200 text-yellow-800',
                  unmarked: 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-400'
                };
                
                return (
                  <div
                    key={day.date}
                    className={`
                      heatmap-cell border rounded-lg p-2 text-center flex flex-col justify-between shadow-xs select-none
                      ${colors[day.status]}
                    `}
                    title={`${day.date}: ${day.status.toUpperCase()}`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider">{day.monthName}</span>
                    <span className="text-sm font-extrabold mt-0.5">{day.dayNum}</span>
                    <span className="text-[8px] font-semibold uppercase tracking-wider mt-1 block">
                      {day.status === 'present' ? '✓' :
                       day.status === 'absent' ? '✗' :
                       day.status === 'leave' ? 'L' : '-'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Heatmap Legends */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-50 text-[10px] font-semibold text-slate-500">
              <div className="flex items-center"><span className="w-3.5 h-3.5 bg-green-100 border border-green-200 rounded-md mr-1.5" /> Present</div>
              <div className="flex items-center"><span className="w-3.5 h-3.5 bg-yellow-100 border border-yellow-200 rounded-md mr-1.5" /> Leave</div>
              <div className="flex items-center"><span className="w-3.5 h-3.5 bg-red-100 border border-red-200 rounded-md mr-1.5" /> Absent</div>
              <div className="flex items-center"><span className="w-3.5 h-3.5 bg-slate-50 border border-slate-100 rounded-md mr-1.5" /> Unmarked</div>
              
              {user.attendancePct === 100 && (
                <div className="ml-auto flex items-center text-brand-orange-600 bg-brand-orange-50 px-2.5 py-0.5 rounded-full font-bold">
                  <Award className="h-3.5 w-3.5 mr-1" /> Perfect Attendance Candidate
                </div>
              )}
            </div>
          </Card>

          {/* 3. Personal Attendance Trend Line Graph */}
          {personalChartData.length > 0 ? (
            <Card title="Attendance Development" subtitle="Individual historical performance score trends over past sessions">
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={personalChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Rate" stroke="#3B82F6" fill="url(#colorPersonal)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ) : null}

        </div>

      </div>

    </DashboardLayout>
  );
};

export default UserProfile;
