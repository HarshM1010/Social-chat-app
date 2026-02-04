'use client';

import { useQuery, useSubscription } from '@apollo/client/react';
import { GET_ALL_FRIENDS, SEARCH_USERS } from '@/graphql/queries';
import EmptyState from './EmptyState';
import { memo } from 'react';
import { LISTEN_FOR_FRIEND_REMOVED } from '../graphql/subscription'

type FriendListProps = {
  onSelectChat: (userId: string, user: any) => void;
  currentUser: {
    userId: string,
    username: string,
  };
  onFriendRemoved: (removedFriendId: string) => void;
};

type GetAllFriendsResponse = {
  getAllFriends: Array<{ userId: string; name: string; username: string; lastMessage?: string }>;
};

type FriendRemovedResponse = {
  friendRemoved: {
    removedUserId: string;
  };
};

function FriendList({ onSelectChat, currentUser, onFriendRemoved }: FriendListProps) {
  const { data, loading, error } = useQuery<GetAllFriendsResponse>(GET_ALL_FRIENDS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !currentUser.userId,
  });

  useSubscription<FriendRemovedResponse>(LISTEN_FOR_FRIEND_REMOVED, {
    variables: { userId: currentUser.userId },
    skip: !currentUser.userId,
    onData: ({ client, data }) => {
      const removedFriendId = data?.data?.friendRemoved?.removedUserId;
      if(removedFriendId) {
        onFriendRemoved(removedFriendId);
      }
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_FRIENDS,SEARCH_USERS],
        });
      },1000)
    }
  });
  
  if (loading) return <div className="p-4 text-center text-slate-500">Loading...</div>;
  if (error && currentUser) return <div className="p-4 text-center text-red-500">Error loading friends</div>;

  const friends = data?.getAllFriends || [];

  if (friends.length === 0) {
    return <EmptyState icon="👥" message="No friends yet" />;
  }
  
  return (
    <div>
      {friends.map((friend: any) => (
        <div
          key={friend?.userId}
          onClick={() => onSelectChat(friend?.userId, friend)}
          className="p-4 border-b border-teal-50 hover:bg-teal-50/50 cursor-pointer transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {friend?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 truncate">{friend?.name}</div>
              <div className="text-sm text-slate-500 truncate">{friend?.lastMessage || 'No messages yet'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(FriendList);