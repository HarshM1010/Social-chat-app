'use client';

import { X, User, Users, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    username: string;
    email: string;
    friendsCount: number;
    groupsCount: number;
    preference: string | null;
  } | null;
  onUpdatePreference: (choice: 'Messi' | 'Ronaldo') => void;
};

export default function ProfileModal({ isOpen, onClose, user, onUpdatePreference }: ProfileModalProps) {
  const router = useRouter();
  if (!isOpen) return null;
  const handleChangePassword = () => {
    setTimeout(() => {
      router.push('/home/change-password');
    }, 200);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User size={20} /> My Profile
          </h2>
          <button onClick={onClose} className="hover:bg-teal-700 p-1 rounded-full transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Read-Only Info */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 font-medium cursor-not-allowed">
                {user?.name}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                <div className="text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 font-medium cursor-not-allowed">
                  @{user?.username}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                <div className="text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 font-medium cursor-not-allowed truncate">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-teal-50 p-3 rounded-xl flex items-center gap-3 border border-teal-100">
              <div className="p-2 bg-teal-100 rounded-full text-teal-600">
                <Users size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-teal-700">{user?.friendsCount}</div>
                <div className="text-xs text-teal-600 font-medium">{user?.friendsCount === 1 ? "Friend" : "Friends"}</div>
              </div>
            </div>
            <div className="bg-teal-50 p-3 rounded-xl flex items-center gap-3 border border-teal-100">
              <div className="p-2 bg-teal-100 rounded-full text-teal-600">
                <Shield size={18} /> {/* Using Shield as icon for Groups/Admin */}
              </div>
              <div>
                <div className="text-xl font-bold text-teal-700">{user?.groupsCount}</div>
                <div className="text-xs text-teal-600 font-medium">{user?.groupsCount === 1 ? "Group" : "Groups"}</div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* The Question */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Who is the GOAT? 🐐 <span className="text-slate-400 font-normal text-xs">(Click to change)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdatePreference('Messi')}
                className={`py-3 px-4 rounded-xl border-2 transition-all font-bold cursor-pointer ${
                  user?.preference === 'Messi'
                    ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-md transform scale-105'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                Lionel Messi
              </button>
              <button
                onClick={() => onUpdatePreference('Ronaldo')}
                className={`py-3 px-4 rounded-xl border-2 transition-all font-bold cursor-pointer ${
                  user?.preference === 'Ronaldo'
                    ? 'border-purple-500 bg-purple-50 text-purple-600 shadow-md transform scale-105'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                CR7 Ronaldo
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />
          <button onClick={() => handleChangePassword()} className="w-full py-2.5 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm cursor-pointer">
            Change Password
          </button>

        </div>
      </div>
    </div>
  );
}