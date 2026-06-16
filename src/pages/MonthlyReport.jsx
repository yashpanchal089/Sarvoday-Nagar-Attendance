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
  ChevronRight,
  FileText
} from 'lucide-react';
import dayjs from 'dayjs';

export const MonthlyReport = () => {
  const { users, attendance } = useApp();
  const { navigateTo } = useNavigation();

  // Filters: Month Selector and Year Selector
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('MM')); // '01'-'12'
  const [selectedYear, setSelectedYear] = useState(() => dayjs().format('YYYY')); // '2026'

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const monthsList = [
    { value: '01', name: 'Jan' },
    { value: '02', name: 'Feb' },
    { value: '03', name: 'Mar' },
    { value: '04', name: 'Apr' },
    { value: '05', name: 'May' },
    { value: '06', name: 'Jun' },
    { value: '07', name: 'Jul' },
    { value: '08', name: 'Aug' },
    { value: '09', name: 'Sep' },
    { value: '10', name: 'Oct' },
    { value: '11', name: 'Nov' },
    { value: '12', name: 'Dec' }
  ];

  const yearsList = ['2026', '2025', '2024'];

  // 1. Get dates in selected month and year
  const targetDates = useMemo(() => {
    return Object.keys(attendance).filter(date => {
      const d = dayjs(date);
      return d.format('MM') === selectedMonth && d.format('YYYY') === selectedYear;
    });
  }, [attendance, selectedMonth, selectedYear]);

  // 2. Aggregate active Yuvaks statistics for the selected month
  const rosterData = useMemo(() => {
    return users.map(user => {
      let presentsCount = 0;
      let absentsCount = 0;

      targetDates.forEach(date => {
        if (attendance[date] && attendance[date][user.id]) {
          const status = attendance[date][user.id];
          if (status === 'Present') presentsCount++;
          else if (status === 'Absent') absentsCount++;
        }
      });

      const totalMarked = presentsCount + absentsCount;
      const rate = totalMarked > 0 
        ? Math.round((presentsCount / totalMarked) * 100)
        : 0;

      return {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
        presents: presentsCount,
        absents: absentsCount,
        total: totalMarked,
        rate
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

    rosterData.forEach(row => {
      totalPresentsSum += row.presents;
      totalAbsentsSum += row.absents;
    });

    const grandTotal = totalPresentsSum + totalAbsentsSum;
    const overallPct = grandTotal > 0
      ? Math.round((totalPresentsSum / grandTotal) * 100)
      : 0;

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // PDF exports trigger the print layouts with custom alerts asking user to "Save as PDF"
    alert("System instructions: The Print dialog will now load. In the Destination drop-down, select 'Save as PDF' to export the file.");
    window.print();
  };

  const handleExportExcel = () => {
    const headers = ['Yuvak Name', 'Present Count', 'Absent Count', 'Attendance Percentage'];
    const rows = rosterData.map(r => [
      r.name,
      r.presents,
      r.absents,
      `${r.rate}%`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const activeMonth = monthsList.find(m => m.value === selectedMonth)?.name || 'Month';
    link.download = `Sarvoday_Monthly_Attendance_Report_${activeMonth}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout title="Monthly Reports">
      
      {/* Printable CSS definitions */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12pt !important;
          }
          aside, header, nav, button, input, select, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .print-full-width {
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .print-card-grid {
            display: grid !important;
            grid-template-cols: 1fr 1fr 1fr 1fr !important;
            gap: 15px !important;
            margin-bottom: 20px !important;
          }
        }
      `}} />

      {/* 1. Page Header (mockup style) */}
      <div className="mb-6 flex flex-col items-start no-print">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-50 text-[#FF7A3C] rounded-xl">
            <FileSpreadsheet className="h-6.5 w-6.5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1F16] font-serif tracking-tight">
            Monthly Reports
          </h1>
        </div>
        <p className="text-sm font-medium text-[#8C8276] mt-1 ml-0.5">
          Detailed per-Yuvak attendance summary
        </p>
      </div>

      <div className="print-full-width mb-6">
        
        {/* Dropdowns Row (Jun, 2026) - No Labels, Rounded style */}
        <div className="flex items-center space-x-3 mb-4 no-print">
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
            className="text-xs font-bold text-slate-755 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.02)] min-w-[90px]"
          >
            {monthsList.map(m => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            className="text-xs font-bold text-slate-755 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.02)] min-w-[90px]"
          >
            {yearsList.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Buttons Row - Wrapping layout, matching exact labels and order */}
        <div className="flex flex-wrap gap-2.5 mb-6 no-print w-full">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-slate-750 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <FileText className="h-4 w-4 mr-2 text-slate-500" /> Export PDF
          </button>
          
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-slate-750 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2 text-slate-500" /> Export Excel
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-slate-750 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Printer className="h-4 w-4 mr-2 text-slate-500" /> Print
          </button>
        </div>

        {/* Print Title (Only visible in Print) */}
        <div className="hidden print:flex flex-col items-center mb-6 border-b pb-4 text-center">
          <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-200 shadow-sm mb-2 flex items-center justify-center bg-white">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-full w-full object-cover scale-[1.12]" 
            />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Sarvoday Nagar Yuvak Mandal</h2>
          <h3 className="text-sm font-semibold text-slate-500 mt-1">
            Monthly Attendance Report — {monthsList.find(m => m.value === selectedMonth)?.name} {selectedYear}
          </h3>
        </div>

        {/* Monthly Summary Cards (4 boxes matching mockup) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print-card-grid">
          
          {/* Sabhas Held */}
          <div className="bg-[#FFF9F6] p-4.5 rounded-[24px] border border-[#FDE3D3] shadow-xs">
            <span className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider block">SABHAS HELD</span>
            <span className="text-3xl font-extrabold text-[#C2410C] font-serif mt-2 block">
              {targetDates.length}
            </span>
          </div>

          {/* Total Present */}
          <div className="bg-[#F0FDF4] p-4.5 rounded-[24px] border border-[#DCFCE7] shadow-xs">
            <span className="text-[10px] font-bold text-[#047857] uppercase tracking-wider block">TOTAL PRESENT</span>
            <span className="text-3xl font-extrabold text-[#047857] font-serif mt-2 block">
              {summary.presents}
            </span>
          </div>

          {/* Total Absent */}
          <div className="bg-[#FFF1F2] p-4.5 rounded-[24px] border border-[#FFE4E6] shadow-xs">
            <span className="text-[10px] font-bold text-[#BE123C] uppercase tracking-wider block">TOTAL ABSENT</span>
            <span className="text-3xl font-extrabold text-[#BE123C] font-serif mt-2 block">
              {summary.absents}
            </span>
          </div>

          {/* Overall Attendance Percentage */}
          <div className="bg-[#FFFBEB] p-4.5 rounded-[24px] border border-[#FEF3C7] shadow-xs">
            <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider block">OVERALL %</span>
            <span className="text-3xl font-extrabold text-[#B45309] font-serif mt-2 block">
              {summary.rate}%
            </span>
          </div>

        </div>

      </div>

      {/* Detailed Yuvak Report */}
      <Card padded={false} className="overflow-hidden border border-slate-100 shadow-sm bg-white print-full-width">
        
        {/* Table Header with Search */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-[#FAF9F6]/20 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center no-print">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Detailed Yuvak Report</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Individual stats for {monthsList.find(m => m.value === selectedMonth)?.name} {selectedYear}
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

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-[#FAF9F6]">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center">
                    Yuvak Name
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('presents')}
                  className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center justify-center">
                    Present Count
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('absents')}
                  className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center justify-center">
                    Absent Count
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('rate')}
                  className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center justify-center">
                    Attendance Percentage
                    <ArrowUpDown className="h-3 w-3 ml-1 text-slate-400" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/20 transition-colors">
                    
                    {/* Yuvak details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <Avatar src={row.photoUrl} name={row.name} size="sm" className="no-print" />
                        <span className="text-xs font-bold text-slate-800">{row.name}</span>
                      </div>
                    </td>

                    {/* Present */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-emerald-600">
                      {row.presents} sabhas
                    </td>

                    {/* Absent */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-red-500">
                      {row.absents} sabhas
                    </td>

                    {/* Attendance percentage with progress bars */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-3 max-w-[200px] mx-auto">
                        <span className={`text-xs font-black w-10 text-right ${
                          row.rate >= 75 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {row.rate}%
                        </span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div 
                            className={`h-full rounded-full ${
                              row.rate >= 75 ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold uppercase">
                    No yuvak roster metrics for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Roster Pagination (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-[#FAF9F6]/20 no-print">
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
            <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">
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
