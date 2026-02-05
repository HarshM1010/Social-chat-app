// src/app/home/page.tsx
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_USER_STATS } from '@/graphql/queries';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import GroupChatWindow from '@/components/GroupChatWindow';
import ProfileSection from '@/components/ProfileSection';

type UserStatsResponse = {
  getUserStats: {
    friendsCount: number;
    groupsCount: number;
    preference: string;
  }
};

export default function HomePage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isGroup, setIsGroup] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
  const timer = setTimeout(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('user_static_data');
      if (storedData) {
        try {
          setCurrentUser(JSON.parse(storedData));
        } catch (err) {
          console.error("Error parsing user data",err);
          setCurrentUser(null);
        }
      }
    }
    setIsAuthChecked(true);
  }, 0);
  return () => clearTimeout(timer);
}, []);
  
  const { data: statsData, error } = useQuery<UserStatsResponse>(GET_USER_STATS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !currentUser?.userId
  });
  if(error) {
    console.error("Error fetching user stats:", error);
  }
  const finalUser = currentUser ? {
    ...currentUser,
    friendsCount: statsData?.getUserStats?.friendsCount || 0,
    groupsCount: statsData?.getUserStats?.groupsCount || 0,
    preference: statsData?.getUserStats?.preference || null,
  }: null;
  const currentUserId = currentUser?.userId || '';
  const currentUsername = currentUser?.username || '';
  const handleSelectChat = useCallback((userId: string | null, user: any, isGroupChat = false) => {
    setSelectedChat(userId);
    setSelectedUser(user);
    setIsGroup(isGroupChat);
  }, []);

  const handleFriendRemoved = (removedFriendId: string) => {
    if (selectedUser?.userId === removedFriendId) {
      setSelectedChat(null);
      setSelectedUser(null);
    }
  };
  if (!isAuthChecked) return null;
  return (
      <div className="h-screen flex bg-slate-50">
        <Sidebar 
          onSelectChat={handleSelectChat}
          currentUser={{
            userId: currentUserId,
            username: currentUsername,
          }}
          onFriendRemoved={handleFriendRemoved}
        />
        <main className="flex-1">
          {selectedChat && currentUserId ? ( 
            isGroup ? (
              <GroupChatWindow 
                roomId={selectedChat} 
                group={selectedUser} 
                user={selectedUser} 
                currentUserId={currentUserId} 
              />
            ) : (
              <ChatWindow 
                friendId={selectedChat}   // we have friend's userId in selectedChat
                user={selectedUser} 
                currentUserId={currentUserId}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center bg-linear-to-b from-teal-50/20 to-cyan-50/20">
              <div className="text-center">
                <p className="text-lg text-slate-600 tracking-wide">Select a chat to start Conversation</p>
              </div>
            </div>
          )}
        </main>
        <ProfileSection finalUser={finalUser} />
      </div>
  );
}