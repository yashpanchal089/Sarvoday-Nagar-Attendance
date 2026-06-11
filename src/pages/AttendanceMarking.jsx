import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { Calendar, Save, CheckCircle, AlertCircle, Sparkles, Check, X, ShieldAlert } from 'lucide-react';
import dayjs from 'dayjs';

export const AttendanceMarking = () => {
  const { users, attendance, saveAttendance } = useApp();
  const { navigateTo } = useNavigation();

  // Date selection (defaults to today)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  // Local attendance grid map: userId -> status
  const [markingGrid, setMarkingGrid] = useState({});
  const [isSaved, setIsSaved] = useState(false);

  // Active users only should be marked
  const activeUsers = users.filter(user => user.status === 'active');

  // Load existing records whenever selectedDate changes
  useEffect(() => {
    const existingRecords = attendance[selectedDate] || {};
    const initialGrid = {};
    
    activeUsers.forEach(user => {
      // If a record exists, use it. Otherwise, leave it empty/unmarked
      initialGrid[user.id] = existingRecords[user.id] || null;
    });

    setMarkingGrid(initialGrid);
    setIsSaved(false);
  }, [selectedDate, attendance, users]);

  // Update status for a specific user
  const handleMark = (userId, status) => {
    setMarkingGrid(prev => ({
      ...prev,
      [userId]: status
    }));
  };

  // Quick select helpers
  const markAll = (status) => {
    const updated = {};
    activeUsers.forEach(user => {
      updated[user.id] = status;
    });
    setMarkingGrid(updated);
  };

  const handleSave = () => {
    // Validate that at least some users are marked, or prompt
    const unmarkedCount = activeUsers.filter(user => !markingGrid[user.id]).length;
    
    if (unmarkedCount > 0) {
      if (!confirm(`You have ${unmarkedCount} unmarked Yuvak(s). Saving will mark them as Absent. Do you want to proceed?`)) {
        return;
      }
    }

    // Prepare complete payload (any unmarked active users default to 'absent')
    const finalRecords = {};
    activeUsers.forEach(user => {
      finalRecords[user.id] = markingGrid[user.id] || 'absent';
    });

    saveAttendance(selectedDate, finalRecords);
    setIsSaved(true);

    // Fade out notification
    setTimeout(() => {
      setIsSaved(false);
      navigateTo('dashboard'); // Redirect to dashboard
    }, 1500);
  };

  return (
    <DashboardLayout title="Mark Daily Attendance">
      
      {/* Save Success Alert */}
      {isSaved && (
        <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-150 text-green-800 flex items-center shadow-xs page-enter">
          <CheckCircle className="h-5.5 w-5.5 mr-2.5 text-green-600" />
          <span className="text-sm font-semibold">Attendance sheet saved successfully! Redirecting to Dashboard...</span>
        </div>
      )}

      {/* Grid of Controls: Calendar on Left, Quick Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Date Selector block */}
        <Card title="Date Selection" subtitle="Select the calendar date to mark or edit logs" className="lg:col-span-1">
          <div className="space-y-4 mt-3">
            <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <Calendar className="h-5 w-5 text-brand-orange-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={dayjs().format('YYYY-MM-DD')} // Can't mark future dates
                className="bg-transparent border-none text-slate-800 text-sm font-bold focus:outline-none w-full cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              💡 Dates already marked will display their logs automatically. You can edit them and click save to overwrite records.
            </p>
          </div>
        </Card>

        {/* Quick Operations block */}
        <Card title="Quick Selection Helpers" subtitle="Batch updates for all active youth Yuvaks" className="lg:col-span-2">
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="secondary"
              icon={Check}
              onClick={() => markAll('present')}
              className="text-xs py-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 cursor-pointer"
            >
              Mark All Present
            </Button>
            <Button
              variant="secondary"
              icon={X}
              onClick={() => markAll('absent')}
              className="text-xs py-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 cursor-pointer"
            >
              Mark All Absent
            </Button>
            <Button
              variant="secondary"
              icon={Sparkles}
              onClick={() => markAll('leave')}
              className="text-xs py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 cursor-pointer"
            >
              Mark All On Leave
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const cleared = {};
                activeUsers.forEach(u => cleared[u.id] = null);
                setMarkingGrid(cleared);
              }}
              className="text-xs py-2 cursor-pointer"
            >
              Reset Sheet
            </Button>
          </div>
        </Card>

      </div>

      {/* Attendance Sheet Card */}
      <Card padded={false} className="overflow-hidden border border-slate-100 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Attendance Sheet</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Active Yuvaks: {activeUsers.length}</p>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-100 px-3 py-1 rounded-xl shadow-xs">
            📅 {dayjs(selectedDate).format('dddd, MMMM DD, YYYY')}
          </span>
        </div>

        {/* Table representation (Visible on desktop & tablet >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/30">
              <tr>
                <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Yuvak Details</th>
                <th className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present</th>
                <th className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Absent</th>
                <th className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leave</th>
                <th className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-8">Status Info</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {activeUsers.length > 0 ? (
                activeUsers.map((user) => {
                  const currentStatus = markingGrid[user.id];
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-3.5">
                          <Avatar src={user.photo} name={user.name} size="sm" />
                          <div>
                            <div className="text-xs font-bold text-slate-800">{user.name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">{user.mobile}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Present Radio */}
                      <td className="px-6 py-3.5 text-center whitespace-nowrap">
                        <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-green-50 transition-colors cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${user.id}`}
                            checked={currentStatus === 'present'}
                            onChange={() => handleMark(user.id, 'present')}
                            className="h-5 w-5 rounded-full border-slate-300 text-green-500 focus:ring-green-400 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Absent Radio */}
                      <td className="px-6 py-3.5 text-center whitespace-nowrap">
                        <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${user.id}`}
                            checked={currentStatus === 'absent'}
                            onChange={() => handleMark(user.id, 'absent')}
                            className="h-5 w-5 rounded-full border-slate-300 text-red-500 focus:ring-red-400 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Leave Radio */}
                      <td className="px-6 py-3.5 text-center whitespace-nowrap">
                        <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-yellow-50 transition-colors cursor-pointer">
                          <input
                            type="radio"
                            name={`attendance-${user.id}`}
                            checked={currentStatus === 'leave'}
                            onChange={() => handleMark(user.id, 'leave')}
                            className="h-5 w-5 rounded-full border-slate-300 text-yellow-500 focus:ring-yellow-400 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Live status badge */}
                      <td className="px-6 py-3.5 text-right whitespace-nowrap pr-8">
                        {currentStatus ? (
                          <Badge variant={currentStatus}>{currentStatus}</Badge>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Unmarked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    No active Yuvaks registered. Please register Yuvaks first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card representation (Visible on mobile/phones < 768px) */}
        <div className="md:hidden divide-y divide-slate-100 bg-white">
          {activeUsers.length > 0 ? (
            activeUsers.map((user) => {
              const currentStatus = markingGrid[user.id];
              return (
                <div key={user.id} className="p-4 flex flex-col space-y-3 hover:bg-slate-50/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar src={user.photo} name={user.name} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{user.mobile}</div>
                      </div>
                    </div>
                    {currentStatus ? (
                      <Badge variant={currentStatus}>{currentStatus}</Badge>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Unmarked</span>
                    )}
                  </div>

                  {/* Status Toggles grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleMark(user.id, 'present')}
                      className={`
                        py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95
                        ${currentStatus === 'present'
                          ? 'bg-green-50 border-green-300 text-green-700 font-extrabold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(user.id, 'absent')}
                      className={`
                        py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95
                        ${currentStatus === 'absent'
                          ? 'bg-red-50 border-red-300 text-red-700 font-extrabold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMark(user.id, 'leave')}
                      className={`
                        py-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95
                        ${currentStatus === 'leave'
                          ? 'bg-yellow-50 border-yellow-300 text-yellow-700 font-extrabold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-bold uppercase">No active youth Yuvaks registered</div>
          )}
        </div>

        {/* Action Panel Footer */}
        <div className="flex items-center justify-end px-6 py-4.5 bg-slate-50 border-t border-slate-100">
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSave}
            className="py-3 px-6 cursor-pointer"
          >
            Save Attendance
          </Button>
        </div>

      </Card>

    </DashboardLayout>
  );
};

export default AttendanceMarking;
