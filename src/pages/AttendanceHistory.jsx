import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { 
  Search, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal 
} from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

export const AttendanceHistory = () => {
  const { attendance, users } = useApp();

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 8;

  // 1. Flatten attendance logs to array of objects
  const flattenedLogs = useMemo(() => {
    const logs = [];
    
    // Sort dates descending (newest first)
    const sortedDates = Object.keys(attendance).sort((a, b) => dayjs(b).diff(dayjs(a)));

    sortedDates.forEach(date => {
      const dayRecord = attendance[date];
      Object.keys(dayRecord).forEach(uId => {
        const user = users.find(u => u.id === uId);
        if (user) {
          logs.push({
            id: `${date}_${uId}`,
            date,
            userId: uId,
            userName: user.name,
            userPhoto: user.photo,
            status: dayRecord[uId],
            userAttendancePct: user.attendancePct
          });
        }
      });
    });

    return logs;
  }, [attendance, users]);

  // 2. Filter flattened logs
  const filteredLogs = useMemo(() => {
    return flattenedLogs.filter(log => {
      // User name search
      const matchesSearch = !searchQuery || log.userName.toLowerCase().includes(searchQuery.toLowerCase().trim());

      // Date range filter
      let matchesRange = true;
      if (startDate && endDate) {
        matchesRange = dayjs(log.date).isBetween(dayjs(startDate), dayjs(endDate), 'day', '[]');
      } else if (startDate) {
        matchesRange = dayjs(log.date).isSameOrAfter(dayjs(startDate), 'day');
      } else if (endDate) {
        matchesRange = dayjs(log.date).isSameOrBefore(dayjs(endDate), 'day');
      }

      // Month filter
      let matchesMonth = true;
      if (selectedMonth !== 'All') {
        const logMonth = dayjs(log.date).month(); // 0-11
        matchesMonth = logMonth === parseInt(selectedMonth);
      }

      // Year filter
      let matchesYear = true;
      if (selectedYear !== 'All') {
        const logYear = dayjs(log.date).year();
        matchesYear = logYear === parseInt(selectedYear);
      }

      return matchesSearch && matchesRange && matchesMonth && matchesYear;
    });
  }, [flattenedLogs, searchQuery, startDate, endDate, selectedMonth, selectedYear]);

  // 3. Paginate logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPageNum]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  // Export functions simulation
  const triggerExport = (format) => {
    alert(`Exporting ${filteredLogs.length} matching attendance log records to ${format.toUpperCase()} format... Download started!`);
  };

  return (
    <DashboardLayout title="Attendance History Archives">
      
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        
        {/* Search */}
        <div className="w-full md:w-96">
          <Input
            placeholder="Search logs by Yuvak name..."
            type="text"
            icon={Search}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPageNum(1);
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <Button
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={() => setShowFilters(!showFilters)}
            className={`cursor-pointer ${showFilters ? 'bg-slate-100 border-slate-300' : ''}`}
          >
            Filters
          </Button>

          {/* Export Dropdown options as buttons */}
          <div className="flex items-center space-x-1.5 border border-slate-200 bg-white rounded-xl p-1 shadow-xs">
            <button
              onClick={() => triggerExport('excel')}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-green-600 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1 text-green-500" /> Excel
            </button>
            <button
              onClick={() => triggerExport('csv')}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-1 text-blue-500" /> CSV
            </button>
            <button
              onClick={() => triggerExport('pdf')}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-1 text-red-500" /> PDF
            </button>
          </div>
        </div>

      </div>

      {/* Advanced Filters Drawer Panel */}
      {showFilters && (
        <Card className="mb-6 bg-slate-50/50 p-5 page-enter">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Start Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl"
              />
            </div>

            {/* Month Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Month</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              >
                <option value="All">All Months</option>
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>
            </div>

            {/* Year Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year</label>
              <select 
                value={selectedYear} 
                onChange={(e) => { setSelectedYear(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              >
                <option value="All">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedMonth('All');
                setSelectedYear('2026');
                setCurrentPageNum(1);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </Card>
      )}

      {/* Main Historical Table Card */}
      <Card padded={false} className="overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Marked</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Yuvak Details</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-8">Yuvak Attendance %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700 font-bold tracking-wide">
                      {dayjs(log.date).format('YYYY-MM-DD')}
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        {dayjs(log.date).format('dddd')}
                      </span>
                    </td>

                    {/* Yuvak Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Avatar src={log.userPhoto} name={log.userName} size="xs" />
                        <span className="text-xs font-bold text-slate-800">{log.userName}</span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant={log.status}>{log.status}</Badge>
                    </td>

                    {/* Overall Yuvak score */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold pr-8">
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] ${
                        log.userAttendancePct === 100 ? 'text-green-700 bg-green-50' :
                        log.userAttendancePct >= 75 ? 'text-blue-700 bg-blue-50' : 'text-yellow-700 bg-yellow-50'
                      }`}>
                        {log.userAttendancePct}% aggregate
                      </span>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    No historical logs match your query
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <span className="text-xs text-slate-500 font-medium">
            Showing <b className="text-slate-800">{filteredLogs.length > 0 ? (currentPageNum - 1) * itemsPerPage + 1 : 0}</b> to{' '}
            <b className="text-slate-800">{Math.min(currentPageNum * itemsPerPage, filteredLogs.length)}</b> of{' '}
            <b className="text-slate-800">{filteredLogs.length}</b> historical records
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPageNum(currentPageNum - 1)}
              disabled={currentPageNum === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-semibold text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">
              Page {currentPageNum} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageNum(currentPageNum + 1)}
              disabled={currentPageNum === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

      </Card>

    </DashboardLayout>
  );
};

export default AttendanceHistory;
