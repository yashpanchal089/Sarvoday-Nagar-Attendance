import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import {
  Search,
  Trash2,
  Edit3,
  Eye,
  UserPlus,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import dayjs from 'dayjs';

export const UserList = () => {
  const { users, deleteUser, updateUser } = useApp();
  const { navigateTo } = useNavigation();

  // Search & Filter Sorts
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest'); // 'newest' | 'oldest' | 'attendance'
  const [selectedOccupation, setSelectedOccupation] = useState('All');

  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 8;

  // Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPhoto, setEditPhoto] = useState('');

  // Delete State
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form register
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm();

  // Age watcher for edit form
  const dobWatch = watch('dob');
  const [calculatedEditAge, setCalculatedEditAge] = useState(0);

  React.useEffect(() => {
    if (dobWatch) {
      const age = dayjs().diff(dayjs(dobWatch), 'year');
      setCalculatedEditAge(age >= 0 ? age : 0);
      setValue('age', age >= 0 ? age : 0);
    }
  }, [dobWatch, setValue]);

  // Search filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        user.name.toLowerCase().includes(q) ||
        user.mobile.includes(q);

      const matchesOccupation = selectedOccupation === 'All' || user.occupation === selectedOccupation;

      return matchesSearch && matchesOccupation;
    });
  }, [users, searchQuery, selectedOccupation]);

  // Sort calculations
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    if (selectedSort === 'newest') {
      sorted.sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
    } else if (selectedSort === 'oldest') {
      sorted.sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));
    } else if (selectedSort === 'attendance') {
      sorted.sort((a, b) => b.attendancePct - a.attendancePct);
    }
    return sorted;
  }, [filteredUsers, selectedSort]);

  // Pagination indices
  const paginatedUsers = useMemo(() => {
    const start = (currentPageNum - 1) * itemsPerPage;
    return sortedUsers.slice(start, start + itemsPerPage);
  }, [sortedUsers, currentPageNum]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;

  // Open edit modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditPhoto(user.photoUrl || '');
    setIsEditModalOpen(true);
    reset({
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      mobile: user.mobile,
      dob: user.dob,
      age: user.age,
      occupation: user.occupation,
      address: user.address,
    });
  };

  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveEdit = async (data) => {
    const payload = {
      ...editingUser,
      ...data,
      photoUrl: editPhoto
    };
    await updateUser(payload);
    setIsEditModalOpen(false);
  };

  // Delete handlers
  const openDeleteModal = (id) => {
    setDeletingUserId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    await deleteUser(deletingUserId);
    setIsDeleteModalOpen(false);
    setDeletingUserId(null);
    if (paginatedUsers.length === 1 && currentPageNum > 1) {
      setCurrentPageNum(currentPageNum - 1);
    }
  };

  // CSV Excel Export
  const handleExportToExcel = () => {
    const headers = ['First Name', 'Middle Name', 'Last Name', 'Mobile Number', 'Date of Birth', 'Age', 'Occupation', 'Home Address', 'Attendance %'];
    const rows = users.map(u => [
      u.firstName,
      u.middleName || '',
      u.lastName,
      u.mobile,
      u.dob,
      u.age,
      u.occupation,
      `"${u.address.replace(/"/g, '""')}"`,
      `${u.attendancePct}%`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sarvoday_Yuvak_List_${dayjs().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout title="Yuvak List">

      {/* Mobile Page Title */}
      <div className="md:hidden mb-6">
        <h1 className="text-2xl font-bold text-[#2C1F16] font-serif leading-tight">Yuvak List</h1>
        <p className="text-[#8C8276] text-xs mt-1 font-medium">Directory of registered members</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6">

        {/* Search */}
        <div className="w-full lg:w-80">
          <Input
            placeholder="Search by name or mobile number..."
            type="text"
            icon={Search}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPageNum(1);
            }}
          />
        </div>

        {/* Filters and Actions */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-row gap-3">
          
          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:flex lg:flex-row">
            {/* Sorting */}
            <select
              value={selectedSort}
              onChange={(e) => { setSelectedSort(e.target.value); setCurrentPageNum(1); }}
              className="w-full lg:w-auto text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="attendance">Sort: Attendance %</option>
            </select>

            {/* Occupation Filter */}
            <select
              value={selectedOccupation}
              onChange={(e) => { setSelectedOccupation(e.target.value); setCurrentPageNum(1); }}
              className="w-full lg:w-auto text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All Occupations</option>
              <option value="Student">Students Only</option>
              <option value="Job">Jobs Only</option>
              <option value="Business">Business Only</option>
              <option value="Other">Other Occupations</option>
            </select>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:flex lg:flex-row">
            {/* Export to Excel */}
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExportToExcel}
              className="w-full lg:w-auto text-xs py-2 cursor-pointer flex justify-center"
            >
              Export to Excel
            </Button>

            {/* Register Button */}
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={() => navigateTo('register')}
              className="w-full lg:w-auto text-xs py-2 cursor-pointer font-bold flex justify-center"
            >
              Register Yuvak
            </Button>
          </div>

        </div>
      </div>

      {/* Directory Table */}
      <Card padded={false} className="overflow-hidden border border-slate-100 shadow-sm bg-white">

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-[#FAF9F6]">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Occupation</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance %</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Avatar src={user.photoUrl} name={user.name} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</div>
                      {user.middleName && <div className="text-[10px] text-slate-400 font-semibold">{user.middleName} (Middle Name)</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-semibold">{user.age} yrs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-bold tracking-wide">{user.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {user.occupation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-extrabold mr-2 ${user.attendancePct === 100 ? 'text-emerald-600' :
                            user.attendancePct >= 75 ? 'text-blue-600' :
                              user.attendancePct >= 50 ? 'text-yellow-600' : 'text-red-500'
                          }`}>
                          {user.attendancePct}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${user.attendancePct === 100 ? 'bg-emerald-500' :
                                user.attendancePct >= 75 ? 'bg-blue-500' :
                                  user.attendancePct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${user.attendancePct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs pr-8">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigateTo('profile', user.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-orange-500 cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    No yuvaks match your query
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100 bg-white">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => (
              <div key={user.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                {/* Left: Avatar, Name & Meta details */}
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar src={user.photoUrl} name={user.name} size="sm" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                      {user.mobile} • {user.age} yrs • <span className={user.attendancePct >= 75 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>{user.attendancePct}%</span>
                    </p>
                  </div>
                </div>

                {/* Right: Actions in one line */}
                <div className="flex items-center space-x-0.5 flex-shrink-0">
                  <button 
                    onClick={() => navigateTo('profile', user.id)} 
                    className="p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="View Profile"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => openEditModal(user)} 
                    className="p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-400 hover:text-brand-orange-500 transition-colors cursor-pointer"
                    title="Edit Details"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(user.id)} 
                    className="p-2 rounded-lg hover:bg-red-50 active:bg-red-100 text-slate-400 hover:text-red-650 transition-colors cursor-pointer"
                    title="Delete Member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-xs text-slate-400 font-semibold uppercase">No yuvaks match your query</div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4.5 border-t border-slate-100 bg-[#FAF9F6]/30">
          <span className="text-xs text-slate-500 font-medium">
            Showing <b className="text-slate-800">{sortedUsers.length > 0 ? (currentPageNum - 1) * itemsPerPage + 1 : 0}</b> to{' '}
            <b className="text-slate-800">{Math.min(currentPageNum * itemsPerPage, sortedUsers.length)}</b> of{' '}
            <b className="text-slate-800">{sortedUsers.length}</b> Yuvaks
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPageNum(currentPageNum - 1)}
              disabled={currentPageNum === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">
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

      {/* A. Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Yuvak Details"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(saveEdit)}>Save Changes</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Avatar edit upload option */}
          <div className="sm:col-span-2 flex items-center space-x-4 bg-[#FAF9F6] p-3 rounded-xl border border-slate-100">
            <Avatar src={editPhoto} name="Edit Preview" size="lg" />
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Update Photo</label>
              <input type="file" accept="image/*" onChange={handleEditPhotoChange} className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-slate-200 file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer" />
            </div>
          </div>

          <Input
            label="First Name *"
            type="text"
            error={errors.firstName}
            {...register('firstName', { required: 'First name is required' })}
          />
          <Input
            label="Middle Name"
            type="text"
            {...register('middleName')}
          />
          <Input
            label="Last Name *"
            type="text"
            error={errors.lastName}
            {...register('lastName', { required: 'Last name is required' })}
          />
          <Input
            label="Mobile Number *"
            type="text"
            name="mobile"
            maxLength={10}
            error={errors.mobile}
            {...register('mobile', {
              required: 'Mobile number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Must be a 10-digit mobile number'
              },
              onChange: (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
              }
            })}
          />
          <Input
            label="Date of Birth *"
            type="date"
            error={errors.dob}
            {...register('dob', { required: 'Date of birth is required' })}
          />
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Age (Calculated)</label>
            <div className="h-10.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 flex items-center text-xs font-bold text-slate-600">
              {calculatedEditAge} yrs
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Occupation</label>
            <select
              className="w-full h-10.5 text-sm rounded-xl border border-slate-200 bg-white px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-orange-300"
              {...register('occupation')}
            >
              <option value="Student">Student</option>
              <option value="Job">Job</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Home Address (Optional)</label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-brand-orange-300"
              {...register('address')}
            />
          </div>
        </form>
      </Modal>

      {/* B. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete Member</Button>
          </>
        }
      >
        <div className="text-center p-3">
          <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-3.5 animate-bounce" />
          <h4 className="text-base font-bold text-slate-800">Are you sure?</h4>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            This will permanently remove the yuvak and their complete historical attendance data from the system. This action cannot be undone.
          </p>
        </div>
      </Modal>

    </DashboardLayout>
  );
};

export default UserList;
