'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });

  const signup = async () => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    if (!form.name || !form.username || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Creating your account...');
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/signup`, form, {
        withCredentials: true,
      });
      console.log(response);
      toast.success('Signed up successfully!', { id: toastId });
      setTimeout(() => {
        // Use router.push instead of window.location for smoother navigation
        router.push('/home');
      }, 1000);
    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 to-teal-50">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-teal-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-500 rounded-full mx-auto mb-3 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-light text-slate-800 font-mono">Create account</h2>
          <p className="text-md text-slate-500 mt-1">Join us today</p>
        </div>

        <div className="space-y-4">
          <input
            className="w-full px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-teal-50/30 placeholder:text-slate-400 text-slate-700"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="w-full px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-teal-50/30 placeholder:text-slate-400 text-slate-700"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />

          <input
            className="w-full px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-teal-50/30 placeholder:text-slate-400 text-slate-700"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            className="w-full px-4 py-3 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition bg-teal-50/30 placeholder:text-slate-400 text-slate-700"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            onClick={signup}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-medium shadow-sm transition-all cursor-pointer
              ${loading 
                ? 'bg-teal-300 cursor-not-allowed text-white' 
                : 'bg-teal-500 hover:bg-teal-600 text-white hover:shadow-md'
              }`}
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500 font-medium">Or</span>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-white border border-teal-200 text-teal-600 py-3 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition font-medium shadow-sm cursor-pointer"
        >
          Sign in
        </button>

      </div>
    </div>
  );
}