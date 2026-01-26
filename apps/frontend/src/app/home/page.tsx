// src/app/home/page.tsx
'use client';
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@apollo/client/react'; // Import useQuery
import { GET_CURRENT_USER } from '@/graphql/queries'; // Import the query
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import GroupChatWindow from '@/components/GroupChatWindow';
import ProfileSection from '@/components/ProfileSection';

type CurrentUserIdResponse = {
  getCurrentUser?: {
    username: string;
    userId: string;
    name: string;
    email: string;
    friendsCount: number;
    groupsCount: number;
    preference: string | null;
  } | null;
}
export default function HomePage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isGroup, setIsGroup] = useState(false);

  // 1. Fetch Current User ID
  // If your backend doesn't have 'me', we can decode the token from localStorage here instead.
  const { data, loading } = useQuery<CurrentUserIdResponse>(GET_CURRENT_USER);
  // useEffect(() => {
  //   console.log("HomePage Render:", { loading, data, error });
  // }, [loading, data, error]);
  const currentUserId = data?.getCurrentUser?.userId || ''; 
  const currentUsername = data?.getCurrentUser?.username || '';
  const handleSelectChat = useCallback((userId: string, user: any, isGroupChat = false) => {
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

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

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
        <ProfileSection user={data?.getCurrentUser} />
      </div>
  );
}