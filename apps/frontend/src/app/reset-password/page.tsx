'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

// 1. The Form Component
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);

  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });

  const toggleVisibility = (field:'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field:'new' | 'confirm', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const BACKEND_URL = 'http://localhost:3001';

    if (!token) {
      toast.error('Invalid link. Please request a new one.');
      return;
    }
    if (!passwords.new || !passwords.confirm) {
      toast.error('Please fill in all fields');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Resetting password...');
    console.log('Submitting new password with token:', token);
    try {
      const response = await axios.post(`${BACKEND_URL}/reset-password`, {
        token: token,
        newPassword: passwords.new
      });
      console.log(response);
      toast.success('Password changed successfully!', { id: toastId });
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);

    } catch (err) {
      console.error(err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
        <p className="font-medium">Invalid or Missing Token</p>
        <p className="text-sm mt-1">Please request a new reset link.</p>
        <button 
          onClick={() => router.push('/auth/forgot-password')}
          className="text-sm text-red-600 underline mt-2 hover:text-red-800 cursor-pointer"
        >
          Go back
        </button>
      </div>
    );
  }

  

  const renderPasswordInput = (
    field:'new' | 'confirm', 
    placeholder: string
  ) => (
    <div className="relative mb-4">
      <input
        type={showPassword[field] ? "text" : "password"}
        className="w-full px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-teal-50/30 placeholder:text-slate-400 text-slate-700 pr-12"
        placeholder={placeholder}
        value={passwords[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => toggleVisibility(field)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition p-1 cursor-pointer"
      >
        {showPassword[field] ? (
          // Eye Off Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        ) : (
          // Eye Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">New Password</label>
        {renderPasswordInput('new', 'Enter new password')}

      <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Confirm Password</label>
        {renderPasswordInput('confirm', 'Confirm new password')}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-medium text-white shadow-sm transition-all cursor-pointer
          ${loading 
            ? 'bg-teal-300 cursor-not-allowed' 
            : 'bg-teal-500 hover:bg-teal-600 hover:shadow-md'
          }`}
      >
        {loading ? 'Updating Password...' : 'Reset Password'}
      </button>
    </div>
  );
}

// 2. The Page Wrapper (Handles Suspense)
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-teal-50">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-teal-100">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800">Set New Password</h2>
          <p className="text-sm text-slate-500 mt-2">
            Please enter your new password below.
          </p>
        </div>

        {/* Suspense is required when using useSearchParams in Next.js App Router */}
        <Suspense fallback={<div className="text-center text-teal-600">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>

      </div>
    </div>
  );
}