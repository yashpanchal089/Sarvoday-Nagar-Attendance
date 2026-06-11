import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  UserPlus, 
  Check, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import dayjs from 'dayjs';

export const UserList = () => {
  const { users, deleteUser, updateUser } = useApp();
  const { navigateTo } = useNavigation();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All');
  const [selectedAttendRange, setSelectedAttendRange] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 6;

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete Confirm Modal State
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit user React Hook Form
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  // Calculate age from DOB helper
  const getAge = (dob) => {
    return dayjs().diff(dayjs(dob), 'year');
  };

  // 1. Dynamic filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const age = getAge(user.dob);
      
      // Text search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        user.name.toLowerCase().includes(query) || 
        user.mobile.includes(query) || 
        user.email.toLowerCase().includes(query);

      // Gender filter
      const matchesGender = selectedGender === 'All' || user.gender === selectedGender;

      // Status filter
      const matchesStatus = selectedStatus === 'All' || user.status === selectedStatus.toLowerCase();

      // Age Group filter
      let matchesAgeGroup = true;
      if (selectedAgeGroup === 'under20') matchesAgeGroup = age < 20;
      else if (selectedAgeGroup === '20-25') matchesAgeGroup = age >= 20 && age <= 25;
      else if (selectedAgeGroup === '26-30') matchesAgeGroup = age >= 26 && age <= 30;
      else if (selectedAgeGroup === 'over30') matchesAgeGroup = age > 30;

      // Attendance range filter
      let matchesAttend = true;
      const pct = user.attendancePct;
      if (selectedAttendRange === 'perfect') matchesAttend = pct === 100;
      else if (selectedAttendRange === 'high') matchesAttend = pct >= 75 && pct < 100;
      else if (selectedAttendRange === 'mid') matchesAttend = pct >= 50 && pct < 75;
      else if (selectedAttendRange === 'low') matchesAttend = pct < 50;

      return matchesSearch && matchesGender && matchesStatus && matchesAgeGroup && matchesAttend;
    });
  }, [users, searchQuery, selectedGender, selectedStatus, selectedAgeGroup, selectedAttendRange]);

  // 2. Sorting
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Special cases
      if (sortField === 'age') {
        aVal = getAge(a.dob);
        bVal = getAge(b.dob);
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
    return sorted;
  }, [filteredUsers, sortField, sortOrder]);

  // 3. Pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPageNum]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPageNum(1);
  };

  // Open Edit User Modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
    reset({
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      gender: user.gender,
      status: user.status,
      notes: user.notes,
      address: user.address,
      dob: user.dob,
      joiningDate: user.joiningDate
    });
  };

  // Submit Edit Form
  const onEditSubmit = (data) => {
    const updated = {
      ...editingUser,
      ...data
    };
    updateUser(updated);
    setIsEditModalOpen(false);
  };

  // Trigger Delete Confirmation
  const triggerDelete = (userId) => {
    setDeletingUserId(userId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteUser(deletingUserId);
    setIsDeleteModalOpen(false);
    setDeletingUserId(null);
    // Adjust current page if empty
    if (paginatedUsers.length === 1 && currentPageNum > 1) {
      setCurrentPageNum(currentPageNum - 1);
    }
  };

  return (
    <DashboardLayout title="Youth Members Directory">
      
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        
        {/* Search Input */}
        <div className="w-full md:w-96">
          <Input
            placeholder="Search by name, phone, or email..."
            type="text"
            icon={Search}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPageNum(1);
            }}
          />
        </div>

        {/* Toggle Filters & Register Button */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <Button
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={() => setShowFilters(!showFilters)}
            className={`cursor-pointer ${showFilters ? 'bg-slate-100 border-slate-300' : ''}`}
          >
            Filters
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => navigateTo('register')}
            className="cursor-pointer"
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="mb-6 bg-slate-50/50 p-5 page-enter">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Gender */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
              <select 
                value={selectedGender} 
                onChange={(e) => { setSelectedGender(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Age Bracket */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Age Group</label>
              <select 
                value={selectedAgeGroup} 
                onChange={(e) => { setSelectedAgeGroup(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              >
                <option value="All">All Ages</option>
                <option value="under20">Under 20</option>
                <option value="20-25">20 - 25 yrs</option>
                <option value="26-30">26 - 30 yrs</option>
                <option value="over30">Over 30 yrs</option>
              </select>
            </div>

            {/* Attendance Range */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attendance %</label>
              <select 
                value={selectedAttendRange} 
                onChange={(e) => { setSelectedAttendRange(e.target.value); setCurrentPageNum(1); }}
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              >
                <option value="All">All Ranges</option>
                <option value="perfect">Perfect (100%)</option>
                <option value="high">High (75% - 99%)</option>
                <option value="mid">Moderate (50% - 74%)</option>
                <option value="low">Below 50%</option>
              </select>
            </div>

          </div>
          
          {/* Reset Filters button */}
          <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => {
                setSelectedGender('All');
                setSelectedStatus('All');
                setSelectedAgeGroup('All');
                setSelectedAttendRange('All');
                setCurrentPageNum(1);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </Card>
      )}

      {/* Main Table / Cards Grid */}
      <Card padded={false} className="overflow-hidden border border-slate-100 shadow-sm">
        
        {/* Desktop Table view (Visible only on tablets & desktops >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Photo</th>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-4.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center">
                    Name 
                    {sortField === 'name' ? (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />) : null}
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('age')}
                  className="px-6 py-4.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center">
                    Age
                    {sortField === 'age' ? (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />) : null}
                  </span>
                </th>
                <th className="px-6 py-4.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                <th 
                  onClick={() => handleSort('attendancePct')}
                  className="px-6 py-4.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center">
                    Attendance %
                    {sortField === 'attendancePct' ? (sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />) : null}
                  </span>
                </th>
                <th className="px-6 py-4.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Avatar src={user.photo} name={user.name} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {getAge(user.dob)} yrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium tracking-wide">
                      {user.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-bold mr-2 ${
                          user.attendancePct === 100 ? 'text-green-600' :
                          user.attendancePct >= 75 ? 'text-blue-600' :
                          user.attendancePct >= 50 ? 'text-yellow-600' : 'text-red-500'
                        }`}>
                          {user.attendancePct}%
                        </span>
                        
                        {/* Compact progress bar */}
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden lg:block">
                          <div 
                            className={`h-full rounded-full ${
                              user.attendancePct === 100 ? 'bg-green-500' :
                              user.attendancePct >= 75 ? 'bg-blue-500' :
                              user.attendancePct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${user.attendancePct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.status}>{user.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold pr-8">
                      <div className="flex items-center justify-end space-x-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigateTo('profile', user.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-brand-orange-600 cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => triggerDelete(user.id)}
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
                    No members match search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid List (Visible only on screens < 768px) */}
        <div className="md:hidden divide-y divide-slate-100 bg-white">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => (
              <div key={user.id} className="p-4 flex flex-col space-y-3 hover:bg-slate-50/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar src={user.photo} name={user.name} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{user.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{user.mobile}</p>
                    </div>
                  </div>
                  <Badge variant={user.status}>{user.status}</Badge>
                </div>
                
                <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 bg-slate-50/50 p-2 rounded-xl">
                  <div>
                    <span>Age: <b className="text-slate-700">{getAge(user.dob)} yrs</b></span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">Attendance:</span>
                    <b className={`font-bold ${
                      user.attendancePct === 100 ? 'text-green-600' :
                      user.attendancePct >= 75 ? 'text-blue-600' :
                      user.attendancePct >= 50 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {user.attendancePct}%
                    </b>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={() => navigateTo('profile', user.id)}
                    className="py-1 cursor-pointer"
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    onClick={() => openEditModal(user)}
                    className="py-1 text-brand-orange-600 hover:bg-brand-orange-50/50 cursor-pointer"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => triggerDelete(user.id)}
                    className="py-1 text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
              No members match search criteria
            </div>
          )}
        </div>

        {/* 4. Directory Pagination footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <span className="text-xs text-slate-500 font-medium">
            Showing <b className="text-slate-800">{sortedUsers.length > 0 ? (currentPageNum - 1) * itemsPerPage + 1 : 0}</b> to{' '}
            <b className="text-slate-800">{Math.min(currentPageNum * itemsPerPage, sortedUsers.length)}</b> of{' '}
            <b className="text-slate-800">{sortedUsers.length}</b> members
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

      {/* A. Edit User Information Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Youth Member Details"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onEditSubmit)}>Save Changes</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            type="text"
            error={errors.name}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Mobile Number"
            type="tel"
            error={errors.mobile}
            {...register('mobile', { required: 'Mobile is required' })}
          />
          <Input
            label="Email Address"
            type="email"
            error={errors.email}
            {...register('email', { required: 'Email is required' })}
          />
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Gender</label>
            <select
              className="w-full text-sm rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              {...register('gender')}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Status</label>
            <select
              className="w-full text-sm rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Input
            label="Date of Birth"
            type="date"
            {...register('dob')}
          />
          <Input
            label="Joining Date"
            type="date"
            {...register('joiningDate')}
          />
          <div className="w-full sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Residential Address</label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              {...register('address', { required: 'Address is required' })}
            />
          </div>
          <div className="w-full sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mandal Notes / Talents</label>
            <textarea
              rows={2}
              className="w-full text-sm rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-1 focus:ring-brand-orange-300 focus:outline-none"
              {...register('notes')}
            />
          </div>
        </form>
      </Modal>

      {/* B. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Member Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Remove Member</Button>
          </>
        }
      >
        <div className="text-center p-3">
          <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-3.5 animate-bounce" />
          <h4 className="text-base font-bold text-slate-800">Are you absolutely sure?</h4>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            This action will permanently delete the youth member's profile and remove their entire historical attendance archives. This cannot be undone.
          </p>
        </div>
      </Modal>

    </DashboardLayout>
  );
};

export default UserList;
