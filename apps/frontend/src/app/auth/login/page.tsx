'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    if (!identifier || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Logging in...');
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/login`, { identifier, password }, {
        withCredentials: true,
      });
      console.log(response);
      toast.success('Logged in successfully!', { id: toastId });
      setTimeout(() => {
        router.push('/home');
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-teal-50">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-teal-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-500 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-light text-slate-800 font-mono">Welcome back</h2>
          <p className="text-md text-slate-700 mt-1">Sign in to continue</p>
        </div>

        <input
          className="w-full mb-4 px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-teal-50/30 placeholder:text-slate-400 text-slate-700"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-2 px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-teal-50/30 placeholder:text-slate-400 text-slate-700"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && login()}
        />

        <div className="flex justify-end mb-6">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium transition cursor-pointer hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-teal-500 text-white py-3 rounded-xl hover:bg-teal-600 transition font-medium shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500 font-medium">Or</span>
          </div>
        </div>

        <button
          onClick={handleSignup}
          className="w-full bg-white border border-teal-200 text-teal-600 py-3 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition font-medium shadow-sm cursor-pointer"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}