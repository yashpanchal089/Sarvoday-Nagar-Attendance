import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  Calendar, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import dayjs from 'dayjs';

export const MonthlyReport = () => {
  const { users, attendance } = useApp();
  const { navigateTo } = useNavigation();

  // selectedMonthYear in "YYYY-MM" format, defaults to current month
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => dayjs().format('YYYY-MM'));
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('name'); // 'name' | 'rate' | 'presents' | 'absents'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Parsed date dimensions
  const parsedDate = useMemo(() => {
    const d = dayjs(selectedMonthYear);
    return d.isValid() ? d : dayjs();
  }, [selectedMonthYear]);

  const monthInt = useMemo(() => parsedDate.month(), [parsedDate]); // 0-11
  const yearInt = useMemo(() => parsedDate.year(), [parsedDate]);

  // 1. Get dates in the selected month
  const targetDates = useMemo(() => {
    return Object.keys(attendance).filter(date => {
      const d = dayjs(date);
      return d.month() === monthInt && d.year() === yearInt;
    });
  }, [attendance, monthInt, yearInt]);

  // 2. Aggregate active Yuvaks statistics for the selected month
  const rosterData = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'active');
    
    return activeUsers.map(user => {
      let presentsCount = 0;
      let absentsCount = 0;
      let leavesCount = 0;

      targetDates.forEach(date => {
        if (attendance[date] && attendance[date][user.id]) {
          const status = attendance[date][user.id];
          if (status === 'present') presentsCount++;
          else if (status === 'absent') absentsCount++;
          else if (status === 'leave') leavesCount++;
        }
      });

      const totalMarked = presentsCount + absentsCount + leavesCount;
      const rate = totalMarked > 0 
        ? ((presentsCount + leavesCount) / totalMarked * 100).toFixed(2)
        : "0.00";

      return {
        id: user.id,
        name: user.name,
        photo: user.photo,
        presents: presentsCount,
        absents: absentsCount,
        leaves: leavesCount,
        total: totalMarked,
        rate: parseFloat(rate) // Keep as number for sorting
      };
    });
  }, [users, targetDates, attendance]);

  // 3. Filter data by search query
  const filteredData = useMemo(() => {
    return rosterData.filter(row => {
      return row.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });
  }, [rosterData, searchQuery]);

  // 4. Sort data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'name') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
    return sorted;
  }, [filteredData, sortField, sortOrder]);

  // 5. Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;

  // 6. Compute aggregate summary metrics for the month
  const summary = useMemo(() => {
    let totalPresentsSum = 0;
    let totalAbsentsSum = 0;
    let totalLeavesSum = 0;

    rosterData.forEach(row => {
      totalPresentsSum += row.presents;
      totalAbsentsSum += row.absents;
      totalLeavesSum += row.leaves;
    });

    const grandTotal = totalPresentsSum + totalAbsentsSum + totalLeavesSum;
    const overallPct = grandTotal > 0
      ? ((totalPresentsSum + totalLeavesSum) / grandTotal * 100).toFixed(2)
      : "0.00";

    return {
      presents: totalPresentsSum,
      absents: totalAbsentsSum,
      rate: overallPct
    };
  }, [rosterData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleExportPDF = () => {
    alert(`Generating PDF Print Report for ${parsedDate.format('MMMM, YYYY')}...`);
  };

  const handleExportExcel = () => {
    alert(`Downloading Excel spreadsheet report for ${parsedDate.format('MMMM, YYYY')}...`);
  };

  return (
    <DashboardLayout title="Monthly Reports">
      <p className="text-xs text-slate-500 -mt-3.5 mb-6">Generate monthly attendance reports</p>

      {/* Main Filter & Summary Block Container Card */}
      <Card padded={false} className="p-5 md:p-6 mb-6 border border-slate-100 shadow-sm bg-white">
        
        {/* Upper Selection & Action Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-5 border-b border-slate-50 mb-5">
          
          {/* Calendar Selector */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Report month
            </label>
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl focus-within:ring-2 focus-within:ring-brand-orange-300">
              <Calendar className="h-4.5 w-4.5 text-brand-orange-500 flex-shrink-0" />
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => {
                  setSelectedMonthYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="h-4 w-4 mr-2 text-slate-500" /> Export PDF (Print)
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-slate-500" /> Export All Excel
            </button>
          </div>

        </div>

        {/* Lower Summary Box Grid (3 Boxes inside Card) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Total Present Summary */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Present</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
              {summary.presents}
            </span>
          </div>

          {/* Total Absent Summary */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Absent</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
              {summary.absents}
            </span>
          </div>

          {/* Overall Attendance Percentage */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Attendance</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-1 block">
              {summary.rate}%
            </span>
          </div>

        </div>

      </Card>

      {/* Roster Table Card below */}
      <Card padded={false} className="overflow-hidden border border-slate-100 shadow-sm bg-white">
        
        {/* Table Header with Search Bar */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Roster Attendance Log</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Active users roster for {parsedDate.format('MMMM, YYYY')}
            </p>
          </div>
          <div className="w-full md:w-64">
            <Input
              placeholder="Search Yuvak name..."
              type="text"
              icon={Search}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-slate-50/50">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center">
                    Yuvak Name
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('rate')}
                  className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center justify-center">
                    Attendance %
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('presents')}
                  className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center justify-center">
                    Present
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('absents')}
                  className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center justify-center">
                    Absent
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/20 transition-colors">
                    
                    {/* Student Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <Avatar src={row.photo} name={row.name} size="sm" />
                        <span className="text-xs font-bold text-slate-800">{row.name}</span>
                      </div>
                    </td>

                    {/* Attendance % */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-semibold text-slate-700">
                      {row.rate.toFixed(0)}%
                    </td>

                    {/* Present */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-green-600">
                      {row.presents}
                    </td>

                    {/* Absent */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-red-500">
                      {row.absents}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold uppercase">
                    No active Yuvaks found in roster
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <span className="text-xs text-slate-500 font-medium">
            Showing <b className="text-slate-800">{sortedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b> to{' '}
            <b className="text-slate-800">{Math.min(currentPage * itemsPerPage, sortedData.length)}</b> of{' '}
            <b className="text-slate-800">{sortedData.length}</b> Yuvaks
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-semibold text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
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

export default MonthlyReport;
