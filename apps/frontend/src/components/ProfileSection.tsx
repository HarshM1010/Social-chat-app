'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchUsers from './SearchUsers';
import SuggestionsList from './SuggestionsList';
import ProfileModal from './ProfileModal';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { SUBMIT_ANSWER } from '@/graphql/mutations';
import { toast } from 'react-hot-toast';
import { GET_CURRENT_USER } from '@/graphql/queries';
import axios from 'axios';

type ProfileSectionProps = {
  user: {
    userId: string;
    name: string;
    username: string;
    email: string;
    friendsCount: number;
    groupsCount: number;
    preference: string | null;
  } | null;
};

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions'>('search');
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [updatePreference] = useMutation(SUBMIT_ANSWER, {
    refetchQueries: [
      { query: GET_CURRENT_USER } 
    ],
    awaitRefetchQueries: true,
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const [loading,setLoading] = useState(false);
  const client = useApolloClient();

  const handleUpdatePreference = async (choice: 'Messi' | 'Ronaldo') => {
    if (!user) return;
    const optionId = choice === 'Messi' ? 'opt-messi' : 'opt-ronaldo';
    setLoading(true);
    const toastId = toast.loading('Updating preference...');
    try {
      await updatePreference({
        variables: { optionId },
      });
      toast.success('Preference updated successfully', { id: toastId });
    } catch (err) {
      console.error('Error updating preference:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    setLoading(true);
    const toastId = toast.loading('Logging out...');
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      toast.success('Logged out successfully', { id: toastId });
      await client.clearStore();
      setTimeout(() => {
        router.push('/auth/login');
      }, 100);
    } catch (err) {
      console.error('Logout error:', err);
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

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <>
      <aside className="w-90 bg-white border-l border-teal-100 flex flex-col">
        {/* Profile Header */}
        <div className="p-4 border-b border-teal-100 flex justify-between items-center">
          {user ? (
            <>
              <button 
              onClick={() => setIsProfileOpen(true)}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition cursor-pointer">
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3 w-full justify-end">
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={handleSignup}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
              >
                Signup
              </button>
               
            </div>
          )} 
        </div>

        {/* Search/Suggestions Tabs */}
        <div className="p-4 border-b border-teal-100">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-teal-500 text-white'
                  : 'bg-teal-50 text-slate-600 hover:bg-teal-100'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-teal-500 text-white'
                  : 'bg-teal-50 text-slate-600 hover:bg-teal-100'
              }`}
            >
              Suggestions
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'search' ? <SearchUsers /> : <SuggestionsList />}
        </div>
      </aside>
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdatePreference={handleUpdatePreference}
      />
    </>
  );
}