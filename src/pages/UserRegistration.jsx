import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Modal from '../components/Modal';
import { Upload, X, ArrowLeft, CheckCircle, Camera, UserPlus } from 'lucide-react';
import dayjs from 'dayjs';

const getOccupationLabelAndPlaceholder = (occ) => {
  switch (occ) {
    case 'Student':
      return {
        label: 'Which standard is he studying? *',
        placeholder: 'e.g. 10th Standard, B.Tech 2nd Year',
        requiredMsg: 'Standard is required'
      };
    case 'Job':
      return {
        label: 'Which job does he do? *',
        placeholder: 'e.g. Software Engineer, Sales Manager',
        requiredMsg: 'Job description is required'
      };
    case 'Business':
      return {
        label: 'Which business does he do? *',
        placeholder: 'e.g. Grocery Store, Textile Manufacturing',
        requiredMsg: 'Business description is required'
      };
    case 'Other':
    default:
      return {
        label: 'What does he do? *',
        placeholder: 'e.g. Preparing for Exams, Job Seeking',
        requiredMsg: 'Details are required'
      };
  }
};

export const UserRegistration = () => {
  const { addUser } = useApp();
  const { navigateTo } = useNavigation();
  const [photoPreview, setPhotoPreview] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Camera settings state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      photo: '',
      dob: '',
      age: 0,
      mobile: '',
      occupation: 'Student',
      occupationSpec: '',
      address: ''
    }
  });

  // Watch date of birth and occupation to dynamically calculate age and render form fields
  const dobValue = watch('dob');
  const occupationValue = watch('occupation');
  const [calculatedAge, setCalculatedAge] = useState(0);

  useEffect(() => {
    if (dobValue) {
      const birthDate = dayjs(dobValue);
      const today = dayjs();
      if (birthDate.isValid() && birthDate.isBefore(today)) {
        const age = today.diff(birthDate, 'year');
        setCalculatedAge(age);
        setValue('age', age);
      } else {
        setCalculatedAge(0);
        setValue('age', 0);
      }
    } else {
      setCalculatedAge(0);
      setValue('age', 0);
    }
  }, [dobValue, setValue]);

  // Video stream handles
  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' }
      });
      setCameraStream(stream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please check camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      
      const ctx = canvas.getContext('2d');
      // Mirror picture to match live view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoPreview(dataUrl);
      setValue('photo', dataUrl);
      
      stopCamera();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setValue('photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setValue('photo', '');
  };

  const onSubmit = async (data) => {
    setIsSuccess(true);
    await addUser(data);
    
    setTimeout(() => {
      setIsSuccess(false);
      reset();
      setPhotoPreview('');
      setCalculatedAge(0);
    }, 2000); // Display toast for 2 seconds and reset form for next registration
  };

  return (
    <DashboardLayout title="Register Yuvak">
      {/* Back navigation */}
      <div className="mb-6">
        <button 
          onClick={() => navigateTo('users')}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Yuvak Directory
        </button>
      </div>

      {/* Toast Notification (Top Right) */}
      {isSuccess && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: '#ffffff',
            border: '1px solid #f1f5f9',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)',
            maxWidth: '380px',
            width: 'calc(100% - 48px)',
          }}
          className="toast-enter"
        >
          <div style={{
            display: 'flex',
            height: '40px',
            width: '40px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9999px',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            flexShrink: 0
          }}>
            <CheckCircle className="h-5.5 w-5.5" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
              Yuvak Registered
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Successfully added to Mandal directory.
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Header Section */}
      <div className="flex items-start mb-6">
        <UserPlus className="h-8 w-8 text-[#FF7A3C] mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="text-3xl font-bold text-[#2C1F16] font-serif leading-tight">
            Register Yuvak
          </h2>
          <p className="text-[#8C8276] text-sm mt-1.5 font-medium">
            Add a new member to the Mandal
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-[28px] shadow-[0_16px_40px_rgba(223,215,202,0.35)] p-8 sm:p-10 mb-6 border border-[#F2ECE4]/30">
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Photo Section */}
          <div className="flex flex-row items-center gap-5">
            {/* Dashed orange preview box */}
            <div className="relative h-28 w-28 rounded-[20px] border-2 border-dashed border-[#FF7A3C] bg-[#FFF5EE] flex items-center justify-center overflow-hidden flex-shrink-0">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <Camera className="h-9 w-9 text-[#FF7A3C]" />
              )}
            </div>

            {/* Vertically stacked capture and upload buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 border border-[#E5E0D8] bg-white rounded-xl text-xs font-semibold text-[#8C8276] hover:bg-slate-50 hover:text-[#2C1F16] active:scale-95 transition-all flex items-center gap-2 cursor-pointer outline-none"
              >
                <Camera className="h-3.5 w-3.5" />
                Take Photo
              </button>

              <div className="relative">
                <input
                  type="file"
                  id="photo-file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photo-file"
                  className="inline-flex px-4 py-2 border border-[#E5E0D8] bg-white rounded-xl text-xs font-semibold text-[#8C8276] hover:bg-slate-50 hover:text-[#2C1F16] active:scale-95 transition-all items-center gap-2 cursor-pointer outline-none"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Image
                </label>
              </div>
            </div>
          </div>

          {/* Responsive Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* First Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                className={`w-full px-4.5 py-2.5 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errors.firstName ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            {/* Middle Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Middle Name
              </label>
              <input
                type="text"
                className="w-full px-4.5 py-2.5 rounded-2xl border border-[#E5E0D8] bg-white text-sm text-[#2C1F16] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C] outline-none transition-all duration-200"
                {...register('middleName')}
              />
            </div>

            {/* Last Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                className={`w-full px-4.5 py-2.5 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errors.lastName ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.lastName.message}
                </span>
              )}
            </div>

            {/* Date of Birth */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                placeholder="dd-mm-yyyy"
                className={`w-full px-4.5 py-2.5 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errors.dob ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
                {...register('dob', { required: 'Date of birth is required' })}
              />
              {errors.dob && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.dob.message}
                </span>
              )}
            </div>

            {/* Age */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Age
              </label>
              <input
                type="text"
                readOnly
                placeholder="Auto"
                value={calculatedAge > 0 ? calculatedAge : ''}
                className="w-full px-4.5 py-2.5 rounded-2xl border border-[#E5E0D8] bg-[#FAF9F6] text-sm text-[#8C8276] font-semibold outline-none"
              />
            </div>

            {/* Mobile Number */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Mobile Number
              </label>
              <input
                type="text"
                placeholder="10-digit number"
                maxLength={10}
                className={`w-full px-4.5 py-2.5 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                  ${errors.mobile ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                `}
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
              {errors.mobile && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.mobile.message}
                </span>
              )}
            </div>

            {/* Occupation */}
            <div className="md:col-span-3 w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Occupation
              </label>
              <div className="relative">
                <select
                  className="w-full px-4.5 py-2.5 rounded-2xl border border-[#E5E0D8] bg-white text-sm text-[#2C1F16] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C] outline-none transition-all duration-200 appearance-none cursor-pointer"
                  {...register('occupation')}
                >
                  <option value="Student">Student</option>
                  <option value="Job">Job</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Occupation Specific Details */}
            {occupationValue && (
              <div className="md:col-span-3 w-full transition-all duration-200">
                <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                  {getOccupationLabelAndPlaceholder(occupationValue).label}
                </label>
                <input
                  type="text"
                  placeholder={getOccupationLabelAndPlaceholder(occupationValue).placeholder}
                  className={`w-full px-4.5 py-2.5 rounded-2xl border bg-white text-sm text-[#2C1F16] placeholder-[#B0A89E] transition-all duration-200 outline-none
                    ${errors.occupationSpec ? 'border-red-400 focus:border-red-500' : 'border-[#E5E0D8] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C]'}
                  `}
                  {...register('occupationSpec', { 
                    required: getOccupationLabelAndPlaceholder(occupationValue).requiredMsg 
                  })}
                />
                {errors.occupationSpec && (
                  <span className="text-xs text-red-500 mt-1 block">
                    {errors.occupationSpec.message}
                  </span>
                )}
              </div>
            )}

            {/* Home Address */}
            <div className="md:col-span-3 w-full">
              <label className="block text-sm font-medium text-[#2C1F16] mb-1.5">
                Home Address
              </label>
              <textarea
                rows={3}
                className="w-full px-4.5 py-2.5 rounded-2xl border border-[#E5E0D8] bg-white text-sm text-[#2C1F16] focus:border-[#FF7A3C] focus:ring-1 focus:ring-[#FF7A3C] outline-none transition-all duration-200"
                {...register('address')}
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#FF7A3C] hover:bg-[#E66327] active:scale-[0.98] transition-all text-white font-semibold rounded-2xl text-base shadow-sm focus:outline-none cursor-pointer flex justify-center items-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Register Yuvak
            </button>
          </div>

        </form>
      </div>

      {/* Camera Capture Modal */}
      <Modal
        isOpen={isCameraOpen}
        onClose={stopCamera}
        title="Take Member Photo"
        size="md"
        footer={
          <>
            <button 
              type="button" 
              onClick={stopCamera}
              className="px-4.5 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl text-sm font-semibold hover:bg-slate-50 mr-2.5 cursor-pointer"
            >
              Cancel
            </button>
            {!cameraError && (
              <button 
                type="button" 
                onClick={capturePhoto}
                className="px-4.5 py-2.5 bg-[#FF7A3C] hover:bg-[#E66327] text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Capture
              </button>
            )}
          </>
        }
      >
        <div className="flex flex-col items-center justify-center">
          {cameraError ? (
            <div className="text-center p-6 text-slate-500 font-semibold uppercase text-xs">
              <span className="text-red-500 block mb-2">⚠️ Error</span>
              {cameraError}
            </div>
          ) : (
            <div className="w-full relative overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-72 object-cover rounded-xl scale-x-[-1]"
              />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/85 font-bold uppercase tracking-wider select-none pointer-events-none">
                Center Face Preview
              </div>
            </div>
          )}
        </div>
      </Modal>

    </DashboardLayout>
  );
};

export default UserRegistration;
