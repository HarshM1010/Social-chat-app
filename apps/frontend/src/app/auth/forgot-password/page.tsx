'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const canResend = timer === 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Sending reset link...');

    try {
      const response = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email });
      console.log(response);
      toast.success('Reset link sent! Check your inbox.', { id: toastId });
      setLinkSent(true);
      setTimer(600);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-teal-50">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-teal-100">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 9.636 14.636 6.536 15 7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800">Forgot Password?</h2>
          <p className="text-sm text-slate-500 mt-2">
            Enter your email and we'll send you a link to reset your password. <span className='text-red-400'>This link will expire in 10 minutes</span>.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            className="w-full px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-teal-50/30 text-slate-700"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading || (linkSent && !canResend)}
          />

          {!linkSent ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white shadow-sm transition-all cursor-pointer
                ${loading ? 'bg-teal-300 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 hover:shadow-md'}`}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canResend || loading}
              className={`w-full py-3 rounded-xl font-medium transition-all border-2 cursor-pointer
                ${!canResend 
                  ? 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed' 
                  : 'bg-white text-teal-600 border-teal-500 hover:bg-teal-50'
                }`}
            >
              {!canResend ? `Resend email in ${formatTime(timer)}` : 'Resend Email'}
            </button>
          )}

          <button
            onClick={() => router.push('/auth/login')}
            className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium transition mt-4 cursor-pointer"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}