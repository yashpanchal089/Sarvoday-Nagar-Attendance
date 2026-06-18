import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import { 
  Calendar, 
  Trash2,
  Search,
  Download,
  History
} from 'lucide-react';
import dayjs from 'dayjs';

export const AttendanceHistory = () => {
  const { attendance, users, deleteAttendanceRecord } = useApp();

  // Date selection states
  const [selectedDate, setSelectedDate] = useState(() => {
    const dates = Object.keys(attendance).sort((a, b) => dayjs(b).diff(dayjs(a)));
    return dates[0] || '';
  });

  const [detailSearchQuery, setDetailSearchQuery] = useState('');

  // Delete confirm modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState('');

  // 1. Daily Summaries list (for the right panel)
  const dailySummaries = useMemo(() => {
    const summaries = [];
    Object.keys(attendance).forEach(dateStr => {
      const records = attendance[dateStr];
      let presentCount = 0;
      let absentCount = 0;
      
      Object.keys(records).forEach(yuvakId => {
        if (records[yuvakId] === 'Present') {
          presentCount++;
        } else {
          absentCount++;
        }
      });

      const total = presentCount + absentCount;
      const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

      summaries.push({
        date: dateStr,
        present: presentCount,
        absent: absentCount,
        total,
        percentage: pct
      });
    });

    // Sort descending (newest first)
    return summaries.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  }, [attendance]);

  // Update selectedDate if it gets deleted
  React.useEffect(() => {
    if (selectedDate && !attendance[selectedDate]) {
      const dates = Object.keys(attendance).sort((a, b) => dayjs(b).diff(dayjs(a)));
      setSelectedDate(dates[0] || '');
    } else if (!selectedDate) {
      const dates = Object.keys(attendance).sort((a, b) => dayjs(b).diff(dayjs(a)));
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    }
  }, [attendance, selectedDate]);

  // 2. Filter yuvaks for the left details panel
  const detailRecords = useMemo(() => {
    if (!selectedDate || !attendance[selectedDate]) return [];
    const records = attendance[selectedDate];
    return users.map(user => {
      const status = records[user.id] || 'Absent';
      return {
        ...user,
        status
      };
    }).filter(u => {
      const q = detailSearchQuery.toLowerCase().trim();
      const fullName = `${u.firstName} ${u.middleName || ''} ${u.lastName}`.toLowerCase();
      return !q || fullName.includes(q) || u.mobile.includes(q);
    });
  }, [users, attendance, selectedDate, detailSearchQuery]);

  const selectedDateSummary = useMemo(() => {
    return dailySummaries.find(s => s.date === selectedDate);
  }, [dailySummaries, selectedDate]);

  // Actions
  const handleExportCSV = () => {
    if (!selectedDate || !attendance[selectedDate]) return;
    const records = attendance[selectedDate];
    const headers = ['Yuvak Name', 'Mobile Number', 'Occupation', 'Occupation Details', 'Attendance Status'];
    const rows = users.map(user => {
      const status = records[user.id] || 'Absent';
      const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ');
      return [
        fullName,
        user.mobile,
        user.occupation,
        `"${(user.occupationSpec || '').replace(/"/g, '""')}"`,
        status
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sarvoday_Attendance_Report_${dayjs(selectedDate).format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    const target = dateToDelete || selectedDate;
    if (target) {
      await deleteAttendanceRecord(target);
      setIsDeleteModalOpen(false);
      setDateToDelete('');
    }
  };

  return (
    <DashboardLayout title="Attendance History">
      
      {/* 1. Header controls */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center mb-6">
        
        <div>
          <h2 className="text-3xl font-bold text-[#2C1F16] font-serif leading-tight">Attendance History</h2>
          <p className="text-xs text-[#8C8276] mt-1.5 font-medium">View past attendance records</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Calendar Selector */}
          <div className="flex items-center space-x-3 bg-white border border-[#E5E0D8] px-3.5 py-2 rounded-2xl shadow-xs w-full sm:w-60">
            <Calendar className="h-4.5 w-4.5 text-brand-orange-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={!selectedDate || !attendance[selectedDate]}
            className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-slate-750 bg-white border border-[#E5E0D8] rounded-xl hover:bg-slate-50 shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="h-4 w-4 mr-2 text-slate-500" /> Export
          </button>

          {/* Delete All Records Button */}
          <button
            onClick={() => {
              setDateToDelete('');
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedDate || !attendance[selectedDate]}
            className="inline-flex items-center px-4 py-2.5 text-xs font-bold text-white bg-red-650 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete Sheet
          </button>
        </div>

      </div>

      {/* 2. Main content split-pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Attendance Details of Selected Date */}
        <div className="lg:col-span-2">
          {selectedDate && attendance[selectedDate] ? (
            <Card padded={false} className="overflow-hidden border border-slate-100 shadow-sm bg-white min-h-[500px] flex flex-col rounded-[24px]">
              
              {/* Selected date overview banner */}
              <div className="px-6 py-5 border-b border-slate-100 bg-[#FAF9F6]/30 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-sm font-extrabold text-[#2C1F16]">
                    📅 {dayjs(selectedDate).format('dddd, MMMM DD, YYYY')}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-[#8C8276] font-bold uppercase tracking-wider">
                    <span className="flex items-center text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
                      Present: {selectedDateSummary?.present || 0}
                    </span>
                    <span className="flex items-center text-red-500">
                      <span className="h-2 w-2 rounded-full bg-red-550 mr-1.5" />
                      Absent: {selectedDateSummary?.absent || 0}
                    </span>
                    <span className="text-brand-orange-500">
                      Rate: {selectedDateSummary?.percentage || 0}%
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-60">
                  <Input
                    placeholder="Search yuvak status..."
                    type="text"
                    icon={Search}
                    value={detailSearchQuery}
                    onChange={(e) => setDetailSearchQuery(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Members status table */}
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-[#FAF9F6]/25">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Yuvak Name</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Occupation</th>
                      <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-8">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {detailRecords.length > 0 ? (
                      detailRecords.map((row) => {
                        const fullName = [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ');
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/15 transition-colors">
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              <div className="flex items-center space-x-3.5">
                                <Avatar src={row.photoUrl || row.photo} name={fullName} size="sm" />
                                <span className="text-xs font-bold text-slate-800">{fullName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500 font-semibold tracking-wide">
                              {row.mobile}
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-150">
                                {row.occupation}
                              </span>
                              {row.occupationSpec && (
                                <div className="text-[9px] text-slate-400 font-semibold mt-1 max-w-[120px] truncate" title={row.occupationSpec}>
                                  {row.occupationSpec}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap text-right pr-8">
                              <Badge variant={row.status === 'Present' ? 'success' : 'danger'}>
                                {row.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          {detailSearchQuery ? 'No matching yuvaks found' : 'No attendance logs marked on this date'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </Card>
          ) : (
            <Card padded={false} className="border border-slate-100 shadow-sm bg-white min-h-[500px] flex items-center justify-center rounded-[24px]">
              <div className="text-center p-6">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3.5" />
                <h4 className="text-sm font-bold text-slate-755">Select a date to view attendance details</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-sm">
                  Choose a date from the calendar or select one from the history list on the right to load records.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Side: List of All Attendance History */}
        <div className="lg:col-span-1">
          <div className="border border-slate-100 rounded-[24px] bg-white shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            
            {/* Right Card Header */}
            <div className="px-5 py-4.5 border-b border-slate-100 bg-[#FAF9F6]/30 flex items-center space-x-2 flex-shrink-0">
              <History className="h-4.5 w-4.5 text-brand-orange-500" />
              <h4 className="text-xs font-bold text-[#2C1F16] uppercase tracking-wider">All Attendance History</h4>
            </div>

            {/* List Table container */}
            <div className="overflow-y-auto flex-1 max-h-[500px]">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-[#FAF9F6]/25 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present</th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Absent</th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {dailySummaries.length > 0 ? (
                    dailySummaries.map((summary) => {
                      const isSelected = summary.date === selectedDate;
                      return (
                        <tr 
                          key={summary.date} 
                          onClick={() => setSelectedDate(summary.date)}
                          className={`cursor-pointer transition-all duration-150 ${
                            isSelected 
                              ? 'bg-orange-50/70 border-l-4 border-l-brand-orange-500 font-bold' 
                              : 'hover:bg-slate-50/50'
                          }`}
                        >
                          {/* Date */}
                          <td className={`px-5 py-3.5 text-xs text-slate-700 tracking-wide ${isSelected ? 'font-bold text-brand-orange-700' : 'font-medium'}`}>
                            {dayjs(summary.date).format('DD/MM/YYYY')}
                          </td>

                          {/* Present */}
                          <td className="px-5 py-3.5 text-center text-xs font-extrabold text-emerald-600">
                            {summary.present}/{summary.total}
                          </td>

                          {/* Absent */}
                          <td className="px-5 py-3.5 text-center text-xs font-extrabold text-red-500">
                            {summary.absent}
                          </td>

                          {/* Action Button */}
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDateToDelete(summary.date);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1 rounded-lg hover:bg-red-50 text-[#8C8276] hover:text-red-650 transition-colors cursor-pointer outline-none"
                              title="Delete sheet"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        No history logs marked yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDateToDelete('');
        }}
        title="Delete Attendance Record"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDateToDelete('');
              }}
              className="px-4.5 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl text-sm font-semibold hover:bg-slate-50 mr-2.5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-4.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
            >
              Delete Record
            </button>
          </>
        }
      >
        <div className="text-center p-3">
          <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-3.5 animate-bounce" />
          <h4 className="text-base font-bold text-slate-800">Are you absolutely sure?</h4>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            This will permanently delete the attendance sheets for <b>{dayjs(dateToDelete || selectedDate).format('MMMM DD, YYYY')}</b> from the database. This action cannot be undone.
          </p>
        </div>
      </Modal>

    </DashboardLayout>
  );
};

export default AttendanceHistory;
