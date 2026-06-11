import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { 
  Users, 
  Percent, 
  CalendarCheck, 
  UserCheck, 
  PlusCircle, 
  Clipboard, 
  FileSpreadsheet, 
  Download,
  Calendar,
  ChevronRight
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
  AreaChart,
  Area,
  Legend
} from 'recharts';
import dayjs from 'dayjs';

export const Dashboard = () => {
  const { stats, users, activities, attendance } = useApp();
  const { navigateTo } = useNavigation();

  // 1. Compile Mini-Trend sparklines data dynamically based on actual stats
  const totalUsersTrend = useMemo(() => {
    return [
      { value: Math.max(0, users.length - 3) },
      { value: Math.max(0, users.length - 2) },
      { value: Math.max(0, users.length - 1) },
      { value: users.length }
    ];
  }, [users.length]);

  const perfectAttendanceTrend = useMemo(() => {
    return [
      { value: Math.max(0, stats.perfectAttendance - 2) },
      { value: Math.max(0, stats.perfectAttendance - 1) },
      { value: stats.perfectAttendance }
    ];
  }, [stats.perfectAttendance]);

  const overallTrend = useMemo(() => {
    return [
      { value: Math.max(0, stats.overallAttendance - 5) },
      { value: Math.max(0, stats.overallAttendance - 2) },
      { value: stats.overallAttendance }
    ];
  }, [stats.overallAttendance]);

  const todayTrend = useMemo(() => {
    const val = stats.todayAttendance || 0;
    return [
      { value: Math.max(0, val - 5) },
      { value: Math.max(0, val - 2) },
      { value: val }
    ];
  }, [stats.todayAttendance]);

  const lineChartData = useMemo(() => {
    const dates = Object.keys(attendance).sort((a, b) => dayjs(a).diff(dayjs(b))).slice(-7);
    return dates.map(date => {
      const dayRecord = attendance[date];
      let present = 0;
      let total = 0;
      
      Object.keys(dayRecord).forEach(uId => {
        const user = users.find(u => u.id === uId);
        if (user && user.status === 'active') {
          total++;
          if (dayRecord[uId] === 'present') present++;
        }
      });

      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        name: dayjs(date).format('MMM DD'),
        Rate: rate
      };
    });
  }, [attendance, users]);

  // 3. Generate Chart Data: Distribution (Pie Chart of all recorded statuses)
  const pieChartData = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    Object.keys(attendance).forEach(date => {
      Object.keys(attendance[date]).forEach(uId => {
        const user = users.find(u => u.id === uId);
        if (user && user.status === 'active') {
          const status = attendance[date][uId];
          if (status === 'present') presentCount++;
          if (status === 'absent') absentCount++;
          if (status === 'leave') leaveCount++;
        }
      });
    });

    const total = presentCount + absentCount + leaveCount;
    if (total === 0) return [
      { name: 'Present', value: 0, color: '#86EFAC', labelColor: 'text-green-700' },
      { name: 'Absent', value: 0, color: '#FCA5A5', labelColor: 'text-red-700' },
      { name: 'Leave', value: 0, color: '#FDE68A', labelColor: 'text-yellow-700' }
    ];

    return [
      { name: 'Present', value: presentCount, color: '#86EFAC', labelColor: 'text-green-700' },
      { name: 'Absent', value: absentCount, color: '#FCA5A5', labelColor: 'text-red-700' },
      { name: 'Leave', value: leaveCount, color: '#FDE68A', labelColor: 'text-yellow-700' }
    ];
  }, [attendance, users]);

  // 4. Generate Chart Data: Performance Distribution (Bar Chart of Yuvak ranges)
  const barChartData = useMemo(() => {
    let perfect = 0;
    let range75_99 = 0;
    let range50_74 = 0;
    let below50 = 0;

    users.filter(u => u.status === 'active').forEach(u => {
      const pct = u.attendancePct;
      if (pct === 100) perfect++;
      else if (pct >= 75) range75_99++;
      else if (pct >= 50) range50_74++;
      else below50++;
    });

    return [
      { name: 'Perfect (100%)', count: perfect, fill: '#86EFAC' },
      { name: '75% - 99%', count: range75_99, fill: '#93C5FD' },
      { name: '50% - 74%', count: range50_74, fill: '#FDE68A' },
      { name: 'Below 50%', count: below50, fill: '#FCA5A5' }
    ];
  }, [users]);

  // Quick action mock triggers
  const handleGenerateReport = () => {
    alert("Simulated Action: Monthly Attendance Report generated for June 2026. Downloading in background...");
  };

  const handleExportData = () => {
    alert("Simulated Action: Exporting complete database to XLSX/CSV format...");
  };

  return (
    <DashboardLayout title="Dashboard Overview">
      
      {/* 1. Statistics / KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* KPI Card 1: Total Registered */}
        <Card padded={false} className="p-5 relative flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Users</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.totalUsers}</h3>
            </div>
            <div className="p-2.5 bg-brand-orange-50 rounded-xl border border-brand-orange-100 text-brand-orange-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
              +3 new this week
            </span>
            <div className="h-10 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={totalUsersTrend}>
                  <Area type="monotone" dataKey="value" stroke="#F97316" fill="#FFF7ED" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* KPI Card 2: Overall Attendance */}
        <Card padded={false} className="p-5 relative flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance %</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.overallAttendance}%</h3>
            </div>
            <div className="p-2.5 bg-brand-blue-50 rounded-xl border border-brand-blue-100 text-brand-blue-600">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
              {stats.overallAttendance > 0 ? `Active performance` : `No records yet`}
            </span>
            <div className="h-10 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overallTrend}>
                  <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#EFF6FF" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* KPI Card 3: Perfect Attendance Count */}
        <Card padded={false} className="p-5 relative flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Perfect Attendance</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.perfectAttendance}</h3>
            </div>
            <div className="p-2.5 bg-green-50 rounded-xl border border-green-100 text-green-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
              {users.length > 0 ? `${Math.round((stats.perfectAttendance / Math.max(1, users.filter(u => u.status === 'active').length)) * 100)}% of active youth` : 'No active youth'}
            </span>
            <div className="h-10 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfectAttendanceTrend}>
                  <Area type="monotone" dataKey="value" stroke="#22C55E" fill="#F0FDF4" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* KPI Card 4: Today's Attendance % */}
        <Card padded={false} className="p-5 relative flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance %</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {stats.todayAttendance !== null ? `${stats.todayAttendance}%` : 'Not Marked'}
              </h3>
            </div>
            <div className="p-2.5 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${stats.todayAttendance !== null ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100'}`}>
              {stats.todayAttendance !== null ? 'Marked successfully' : 'Mark attendance now'}
            </span>
            <div className="h-10 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={todayTrend}>
                  <Area type="monotone" dataKey="value" stroke="#EAB308" fill="#FEFCE8" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Quick Actions Panel */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Quick Management Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button 
            onClick={() => navigateTo('register')}
            className="flex items-center p-4 bg-white hover:bg-brand-orange-50/20 border border-slate-100 hover:border-brand-orange-200 rounded-2xl shadow-sm text-left group transition-all duration-300 cursor-pointer"
          >
            <div className="p-2 bg-brand-orange-50 rounded-xl border border-brand-orange-100 text-brand-orange-600 group-hover:scale-110 transition-transform">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div className="ml-3.5 min-w-0">
              <h4 className="text-xs font-bold text-slate-800">Register Yuvak</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Add personal information</p>
            </div>
          </button>

          <button 
            onClick={() => navigateTo('mark')}
            className="flex items-center p-4 bg-white hover:bg-brand-blue-50/20 border border-slate-100 hover:border-brand-blue-200 rounded-2xl shadow-sm text-left group transition-all duration-300 cursor-pointer"
          >
            <div className="p-2 bg-brand-blue-50 rounded-xl border border-brand-blue-100 text-brand-blue-600 group-hover:scale-110 transition-transform">
              <Clipboard className="h-5 w-5" />
            </div>
            <div className="ml-3.5 min-w-0">
              <h4 className="text-xs font-bold text-slate-800">Mark Attendance</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Open marking dashboard</p>
            </div>
          </button>

          <button 
            onClick={() => navigateTo('report')}
            className="flex items-center p-4 bg-white hover:bg-green-50/20 border border-slate-100 hover:border-green-200 rounded-2xl shadow-sm text-left group transition-all duration-300 cursor-pointer"
          >
            <div className="p-2 bg-green-50 rounded-xl border border-green-100 text-green-600 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="ml-3.5 min-w-0">
              <h4 className="text-xs font-bold text-slate-800">Monthly Report</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Process and review files</p>
            </div>
          </button>

          <button 
            onClick={handleExportData}
            className="flex items-center p-4 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-2xl shadow-sm text-left group transition-all duration-300 cursor-pointer"
          >
            <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 group-hover:scale-110 transition-transform">
              <Download className="h-5 w-5" />
            </div>
            <div className="ml-3.5 min-w-0">
              <h4 className="text-xs font-bold text-slate-800">Export All Data</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Excel, CSV, or PDF formats</p>
            </div>
          </button>

        </div>
      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Chart 1: Line Chart - Attendance Trend */}
        <Card title="Attendance Performance Trend" subtitle="Percentage of active youth attending over the last 7 assemblies" className="lg:col-span-2">
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }} 
                />
                <Line type="monotone" dataKey="Rate" stroke="#F97316" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Pie Chart - Attendance Status Distribution */}
        <Card title="Marked Distribution" subtitle="Proportion of Present, Absent, and Leave tallies">
          <div className="h-56 mt-4 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} marks`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Embedded center text */}
            <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-800">{stats.overallAttendance}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Attend</span>
            </div>
          </div>

          {/* Custom Legends */}
          <div className="flex justify-center gap-6 mt-4 border-t border-slate-50 pt-4">
            {pieChartData.map((d, index) => (
              <div key={d.name} className="flex flex-col items-center">
                <span className={`text-xs font-bold ${d.labelColor} flex items-center`}>
                  <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5">{d.value} logged</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Bottom Grid: Performance Ranges & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Distribution Chart */}
        <Card title="Performance Comparison" subtitle="Count of youth grouped by attendance bracket" className="lg:col-span-1">
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activities Timeline */}
        <Card title="Recent Activities" subtitle="Audited operations logs from coordinators" className="lg:col-span-2">
          <div className="flow-root mt-4">
            <ul className="-mb-8 max-h-64 overflow-y-auto pr-2">
              {activities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-6">
                    {activityIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`
                          h-8.5 w-8.5 rounded-full flex items-center justify-center ring-4 ring-white text-xs font-semibold
                          ${activity.type === 'attendance' ? 'bg-brand-blue-50 text-brand-blue-600' : ''}
                          ${activity.type === 'registration' ? 'bg-brand-orange-50 text-brand-orange-600' : ''}
                          ${activity.type === 'report' ? 'bg-green-50 text-green-600' : ''}
                          ${activity.type === 'status' ? 'bg-yellow-50 text-yellow-600' : ''}
                          ${activity.type === 'system' ? 'bg-slate-100 text-slate-600' : ''}
                        `}>
                          {activity.type === 'attendance' && '📋'}
                          {activity.type === 'registration' && '👤'}
                          {activity.type === 'report' && '📈'}
                          {activity.type === 'status' && '⚙️'}
                          {activity.type === 'system' && '💻'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{activity.user}</span>{' '}
                            {activity.message}
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-medium">
                          {dayjs(activity.timestamp).format('DD MMM, h:mm A')}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

    </DashboardLayout>
  );
};

export default Dashboard;
