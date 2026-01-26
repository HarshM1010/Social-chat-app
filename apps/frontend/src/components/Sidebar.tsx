'use client';

import { useState } from 'react';
import FriendList from './FriendList';
import RequestedList from './RequestedList';
import RequestsList from './RequestsList';
import GroupsList from './GroupsList';

type SidebarProps = {
  onSelectChat: (userId: string | null, user: any, isGroup?: boolean) => void;
  currentUser: {
    userId: string,
    username: string;
  };
  onFriendRemoved: (removedFriendId: string) => void;
};

export default function Sidebar({ onSelectChat,  currentUser, onFriendRemoved }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'requested' | 'requests'>('friends');

  return (
    <aside className="w-100 bg-white border-r border-teal-100 flex flex-col">
      {/* App Header */}
      <div className="p-6 border-b border-teal-100 bg-linear-to-r from-teal-500 to-teal-600">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className='flex flex-col'>
            <h1 className="text-xl font-semibold text-white">Chat App</h1>
            <h2>{currentUser.username}</h2>
          </div>
          
          
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-teal-100 bg-teal-50/50">
        <button
          onClick={() => setActiveTab('friends')}
          className={`py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === 'friends'
              ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
              : 'text-slate-500 hover:text-teal-600'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === 'groups'
              ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
              : 'text-slate-500 hover:text-teal-600'
          }`}
        >
          Groups
        </button>
        <button
          onClick={() => setActiveTab('requested')}
          className={`py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === 'requested'
              ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
              : 'text-slate-500 hover:text-teal-600'
          }`}
        >
          Sent
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === 'requests'
              ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
              : 'text-slate-500 hover:text-teal-600'
          }`}
        >
          Received
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'friends' && <FriendList onSelectChat={onSelectChat} currentUser={currentUser} onFriendRemoved={onFriendRemoved} />}
        {activeTab === 'groups' && <GroupsList onSelectChat={onSelectChat} currentUser={currentUser}/>}
        {activeTab === 'requested' && <RequestedList currentUser={currentUser} />}
        {activeTab === 'requests' && <RequestsList currentUser={currentUser} />}
      </div>
    </aside>
  );
}