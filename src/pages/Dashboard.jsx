import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import {
  Users,
  Percent,
  Award,
  AlertTriangle,
  UserPlus,
  ClipboardCheck,
  FileSpreadsheet,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  ChevronRight,
  Activity,
  Trophy
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import dayjs from 'dayjs';

// Animated Counter component
const AnimatedCounter = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 600;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = Math.ceil(end / steps);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}{suffix}</span>;
};

export const Dashboard = () => {
  const { stats, users, attendance, activities } = useApp();
  const { navigateTo } = useNavigation();

  // 1. Line Chart Data: Attendance Trend (Last 7 marked assemblies)
  const lineChartData = useMemo(() => {
    const dates = Object.keys(attendance).sort((a, b) => dayjs(a).diff(dayjs(b))).slice(-7);
    return dates.map(date => {
      const records = attendance[date];
      let present = 0;
      let total = 0;
      Object.keys(records).forEach(uId => {
        total++;
        if (records[uId] === 'Present') present++;
      });
      return {
        name: dayjs(date).format('MMM DD'),
        Attendance: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });
  }, [attendance]);

  // 2. Pie Chart Data: Present vs Absent
  const pieChartData = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    Object.keys(attendance).forEach(date => {
      Object.keys(attendance[date]).forEach(uId => {
        if (attendance[date][uId] === 'Present') presentCount++;
        else if (attendance[date][uId] === 'Absent') absentCount++;
      });
    });

    const total = presentCount + absentCount;
    if (total === 0) {
      return [
        { name: 'Present', value: 0, color: '#34D399' },
        { name: 'Absent', value: 0, color: '#F87171' }
      ];
    }
    return [
      { name: 'Present', value: presentCount, color: '#34D399' },
      { name: 'Absent', value: absentCount, color: '#F87171' }
    ];
  }, [attendance]);

  // 3. Bar Chart Data: Monthly Comparison
  const barChartData = useMemo(() => {
    const monthlySummary = {};
    Object.keys(attendance).forEach(date => {
      const monthName = dayjs(date).format('MMM YYYY');
      if (!monthlySummary[monthName]) {
        monthlySummary[monthName] = { present: 0, total: 0 };
      }
      Object.keys(attendance[date]).forEach(uId => {
        monthlySummary[monthName].total++;
        if (attendance[date][uId] === 'Present') {
          monthlySummary[monthName].present++;
        }
      });
    });

    // Format and sort chronologically
    return Object.keys(monthlySummary).map(month => ({
      name: month,
      Rate: monthlySummary[month].total > 0
        ? Math.round((monthlySummary[month].present / monthlySummary[month].total) * 100)
        : 0
    })).sort((a, b) => dayjs(a.name, 'MMM YYYY').diff(dayjs(b.name, 'MMM YYYY')));
  }, [attendance]);

  // 4. Performance Tables calculations
  const performanceTables = useMemo(() => {
    const activeYuvaks = users; // already has attendancePct computed

    // Top 5 Attendance (Highest percentage)
    const top5 = [...activeYuvaks]
      .sort((a, b) => b.attendancePct - a.attendancePct)
      .slice(0, 5);

    // Below 50% Attendance
    const below50 = activeYuvaks.filter(y => y.attendancePct < 50);

    // Perfect Attendance (100%)
    const perfect = activeYuvaks.filter(y => y.attendancePct === 100);

    return { top5, below50, perfect };
  }, [users]);

  return (
    <DashboardLayout title="Dashboard">

      {/* Mobile Page Title */}
      <div className="md:hidden mb-6">
        <h1 className="text-2xl font-bold text-[#2C1F16] font-serif leading-tight">Dashboard</h1>
        <p className="text-[#8C8276] text-xs mt-1 font-medium">Overview of Mandal attendance & activities</p>
      </div>

      {/* 1. Summary Cards (Top Row - 4 boxes matching the card design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Total Yuvaks */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex justify-between items-start">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8C8276] uppercase tracking-wider leading-tight block">
              TOTAL<br />YUVAKS
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-serif mt-3 block">
              <AnimatedCounter value={stats.totalUsers} />
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#FFF2EB] text-[#FF7A3C] flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 sm:h-5.5 sm:w-5.5 stroke-[2.2]" />
          </div>
        </div>

        {/* Overall Attendance */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex justify-between items-start">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8C8276] uppercase tracking-wider leading-tight block">
              OVERALL<br />ATTENDANCE
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-serif mt-3 block">
              <AnimatedCounter value={stats.overallAttendance} suffix="%" />
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EAF7F1] text-[#059669] flex items-center justify-center flex-shrink-0">
            <Activity className="h-5 w-5 sm:h-5.5 sm:w-5.5 stroke-[2.2]" />
          </div>
        </div>

        {/* Perfect Attendance */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex justify-between items-start">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8C8276] uppercase tracking-wider leading-tight block">
              PERFECT<br />ATTENDANCE
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-serif mt-3 block">
              <AnimatedCounter value={stats.perfectAttendance} />
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#FEF6E9] text-[#D97706] flex items-center justify-center flex-shrink-0">
            <Trophy className="h-5 w-5 sm:h-5.5 sm:w-5.5 stroke-[2.2]" />
          </div>
        </div>

        {/* 3-Day Absent Alerts */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex justify-between items-start">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8C8276] uppercase tracking-wider leading-tight block">
              3-DAY<br />ABSENT<br />ALERT
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-serif mt-3 block">
              <AnimatedCounter value={stats.absentAlerts} />
            </span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#FFF0F0] text-[#E11D48] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 sm:h-5.5 sm:w-5.5 stroke-[2.2]" />
          </div>
        </div>

      </div>

      {/* 2. Quick Action Section */}
      <div className="mb-8">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Navigation</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          <button
            onClick={() => navigateTo('register')}
            className="flex items-center p-4.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-brand-orange-300 hover:bg-orange-50/20 group transition-all duration-300 cursor-pointer text-left"
          >
            <div className="p-2.5 bg-orange-50 text-brand-orange-500 rounded-xl group-hover:scale-115 transition-transform duration-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-slate-800">Yuvak Registration</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Register new youth members</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('mark')}
            className="flex items-center p-4.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-300 hover:bg-emerald-50/10 group transition-all duration-300 cursor-pointer text-left"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-115 transition-transform duration-300">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-slate-800">Mark Attendance</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Log today's assembly records</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('report')}
            className="flex items-center p-4.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-300 hover:bg-blue-50/10 group transition-all duration-300 cursor-pointer text-left"
          >
            <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl group-hover:scale-115 transition-transform duration-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-bold text-slate-800">Monthly Report</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Export logs & view stats</p>
            </div>
          </button>

        </div>
      </div>

      {/* 3. Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Attendance Trend (Line Chart) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-50 mb-4">
            <TrendingUp className="h-4.5 w-4.5 text-brand-orange-500" />
            <h4 className="text-base font-bold text-[#2C1F16] font-serif tracking-tight">Attendance Trend</h4>
          </div>
          <div className="h-64">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ left: -25, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #E2E8F0' }} />
                  <Line type="monotone" dataKey="Attendance" stroke="#FFA94D" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 uppercase font-semibold">No trend logs registered</div>
            )}
          </div>
        </div>

        {/* Present vs Absent (Pie Chart) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-50 mb-4">
            <PieIcon className="h-4.5 w-4.5 text-brand-orange-500" />
            <h4 className="text-base font-bold text-[#2C1F16] font-serif tracking-tight">Present vs Absent</h4>
          </div>
          <div className="h-48 flex items-center justify-center relative">
            {pieChartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} marks`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 uppercase font-semibold">No markings logged</div>
            )}

            {pieChartData.some(d => d.value > 0) && (
              <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none">
                <span className="text-lg font-extrabold text-slate-800">{stats.overallAttendance}%</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Present</span>
              </div>
            )}
          </div>
          <div className="flex justify-center space-x-6 border-t border-slate-50 pt-4 mt-2">
            {pieChartData.map(d => (
              <div key={d.name} className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Monthly Comparison (Bar Chart) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-8">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-50 mb-4">
          <BarChart3 className="h-4.5 w-4.5 text-brand-orange-500" />
          <h4 className="text-base font-bold text-[#2C1F16] font-serif tracking-tight">Monthly Comparison</h4>
        </div>
        <div className="h-64">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ left: -25, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Bar dataKey="Rate" fill="#FFA94D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 uppercase font-semibold">No monthly summaries recorded</div>
          )}
        </div>
      </div>

      {/* 4. Performance Tables (Side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 5 Attendance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-[#2C1F16] font-serif tracking-tight border-b border-slate-100 pb-3 mb-3">Top 5 Attendance</h4>
          <div className="divide-y divide-slate-50">
            {performanceTables.top5.length > 0 ? (
              performanceTables.top5.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center space-x-3.5">
                    <Avatar src={user.photoUrl} name={user.name} size="xs" />
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{user.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{user.attendancePct}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center uppercase">No roster data available</p>
            )}
          </div>
        </div>

        {/* Below 50% Attendance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-red-655 font-serif tracking-tight border-b border-slate-100 pb-3 mb-3">Below 50% Attendance</h4>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto pr-1">
            {performanceTables.below50.length > 0 ? (
              performanceTables.below50.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center space-x-3.5">
                    <Avatar src={user.photoUrl} name={user.name} size="xs" />
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{user.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-red-500 bg-red-50 px-2 py-0.5 rounded">{user.attendancePct}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center uppercase">None below 50%</p>
            )}
          </div>
        </div>

        {/* Perfect Attendance (100%) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-emerald-750 font-serif tracking-tight border-b border-slate-100 pb-3 mb-3">Perfect Attendance (100%)</h4>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto pr-1">
            {performanceTables.perfect.length > 0 ? (
              performanceTables.perfect.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center space-x-3.5">
                    <Avatar src={user.photoUrl} name={user.name} size="xs" />
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{user.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">100%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center uppercase">No perfect attendance candidates</p>
            )}
          </div>
        </div>

      </div>

    </DashboardLayout>
  );
};

export default Dashboard;
