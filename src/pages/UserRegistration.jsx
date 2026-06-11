import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { Upload, X, ArrowLeft, CheckCircle, Camera } from 'lucide-react';
import dayjs from 'dayjs';

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
      name: '',
      photo: '',
      dob: '',
      mobile: '',
      address: ''
    }
  });

  // Watch date of birth to dynamically calculate age
  const dobValue = watch('dob');
  const [calculatedAge, setCalculatedAge] = useState('');

  useEffect(() => {
    if (dobValue) {
      const birthDate = dayjs(dobValue);
      const today = dayjs();
      if (birthDate.isValid() && birthDate.isBefore(today)) {
        const age = today.diff(birthDate, 'year');
        setCalculatedAge(`${age} years old`);
      } else {
        setCalculatedAge('Invalid date');
      }
    } else {
      setCalculatedAge('');
    }
  }, [dobValue]);

  // Video Ref management and stream triggers
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
      // Mirror picture to match mirrored live preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoPreview(dataUrl);
      setValue('photo', dataUrl); // Save base64 string
      
      stopCamera();
    }
  };

  // Handle local photo upload to generate base64 string
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size and type
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
        setValue('photo', reader.result); // Save base64 string to form values
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setValue('photo', '');
  };

  const onSubmit = (data) => {
    // Add default values for removed fields to prevent app crashes
    const submissionData = {
      ...data,
      email: data.email || '',
      gender: data.gender || 'Male',
      joiningDate: data.joiningDate || dayjs().format('YYYY-MM-DD'),
      status: data.status || 'active',
      notes: data.notes || ''
    };

    addUser(submissionData);
    setIsSuccess(true);
    
    // Smooth reset state
    setTimeout(() => {
      setIsSuccess(false);
      reset();
      setPhotoPreview('');
      navigateTo('users'); // Redirect to user list
    }, 1500);
  };

  return (
    <DashboardLayout title="Register New Youth Member">
      
      {/* Back button */}
      <div className="mb-6">
        <button 
          onClick={() => navigateTo('users')}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Member List
        </button>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-150 text-green-800 flex items-center shadow-xs page-enter">
          <CheckCircle className="h-5.5 w-5.5 mr-2.5 text-green-600" />
          <span className="text-sm font-semibold">Member registered successfully! Redirecting to user list...</span>
        </div>
      )}

      <Card title="New Member Registration Form" subtitle="Enter personal information and organization alignment details.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          {/* Photo Upload Section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Profile Photo
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              
              {/* Preview Box */}
              <div className="relative h-24 w-24 rounded-2xl border-2 border-white bg-slate-100 shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>

              {/* Upload control */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <div className="relative inline-block">
                    <input
                      type="file"
                      id="photo-file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-file"
                      className="inline-flex items-center px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload Photo
                    </label>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    icon={Camera}
                    onClick={startCamera}
                    className="text-xs py-2.5 cursor-pointer"
                  >
                    Take Photo
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2.5 font-medium">
                  Support PNG, JPG, or JPEG. Max size 2MB. Recommended square aspect ratio.
                </p>
              </div>

            </div>
          </div>

          {/* Camera Capture Modal */}
          <Modal
            isOpen={isCameraOpen}
            onClose={stopCamera}
            title="Take Member Photo"
            size="md"
            footer={
              <>
                <Button variant="secondary" onClick={stopCamera}>
                  Cancel
                </Button>
                {!cameraError && (
                  <Button variant="primary" onClick={capturePhoto}>
                    Capture
                  </Button>
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
                    Align Face Here
                  </div>
                </div>
              )}
            </div>
          </Modal>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="Enter full name"
              error={errors.name}
              {...register('name', { required: 'Full name is required' })}
            />

            {/* Mobile Number */}
            <Input
              label="Mobile Number"
              type="tel"
              name="mobile"
              placeholder="e.g. 9876543210"
              error={errors.mobile}
              {...register('mobile', { 
                required: 'Mobile number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Must be a valid 10-digit mobile number'
                }
              })}
            />

            {/* Date of Birth */}
            <div className="w-full">
              <Input
                label="Date of Birth"
                type="date"
                name="dob"
                error={errors.dob}
                {...register('dob', { required: 'Date of birth is required' })}
              />
            </div>

            {/* Age (Readonly Auto-Calculated) */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Age (Auto-Calculated)
              </label>
              <div className="w-full rounded-xl border border-slate-100 bg-slate-50/50 py-2.5 px-3.5 text-sm text-slate-700 font-semibold h-10.5 flex items-center">
                {calculatedAge || <span className="text-slate-400 font-normal">Select date of birth</span>}
              </div>
            </div>

            {/* Address (Span full-width) */}
            <div className="w-full md:col-span-2">
              <label htmlFor="address" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Residential Address
              </label>
              <textarea
                id="address"
                rows={2}
                placeholder="Enter complete residential address"
                className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-300 focus:border-brand-orange-400"
                {...register('address', { required: 'Residential address is required' })}
              />
              {errors.address && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">● {errors.address.message}</p>
              )}
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3.5 border-t border-slate-50 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reset();
                setPhotoPreview('');
              }}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Register Member
            </Button>
          </div>

        </form>
      </Card>

    </DashboardLayout>
  );
};

export default UserRegistration;
