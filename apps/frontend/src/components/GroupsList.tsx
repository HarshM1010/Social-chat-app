'use client';

import { useQuery, useSubscription } from '@apollo/client/react';
import { GET_ALL_GROUPS } from '@/graphql/queries';
import EmptyState from './EmptyState';
import { LISTEN_FOR_ADDED_MEMBER, LISTEN_FOR_REMOVED_MEMBER } from '@/graphql/subscription';
import { useState } from 'react';

type GetAllGroupsResponse = {
  getAllGroups: Array<{
    id: string;
    name: string;
    admins: Array<{ userId: string; username: string }>;
    members: Array<{ userId: string; username: string }>;
  }>;
};

type GroupsListProps = {
  onSelectChat: (groupId: string, group: any, isGroup: boolean) => void;
  currentUser: {
    userId: string,
    username: string,
  };
};

export default function GroupsList({ onSelectChat, currentUser }: GroupsListProps) {
  const { data, loading, error } = useQuery<GetAllGroupsResponse>(GET_ALL_GROUPS);
  const [currGroupId,setCurrGroupId] = useState(null);

  useSubscription(LISTEN_FOR_ADDED_MEMBER, {
    variables: { userId: currentUser.userId },
    skip: !currentUser.userId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_GROUPS],
        });
      },1000)
    }
  });

  useSubscription(LISTEN_FOR_REMOVED_MEMBER, {
    variables: { userId: currentUser.userId },
    skip: !currentUser.userId,
    onData: ({ client, data }: any) => {
      const eventData = data?.data?.removedMemberReceived;
      if (eventData.groupId === currGroupId) {
        onSelectChat(null, null, false);
      }
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_GROUPS],
        });
      },1000)
    }
  });

  if (loading) return <div className="p-4 text-center text-slate-500">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading groups</div>;

  const groups = data?.getAllGroups || [];

  if (groups.length === 0) {
    return <EmptyState icon="👥" message="No groups yet" subMessage="Create or join a group to start" />;
  }

  return (
    <div>
      {groups.map((group: any) => (
        <div
          key={group.id}
          onClick={() => {onSelectChat(group.id, group, true); setCurrGroupId(group.id);}}
          className="p-4 border-b border-teal-50 hover:bg-teal-50/50 cursor-pointer transition"
        >
          <div className="flex items-center gap-3">
            {/* Group Avatar */}
            <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 relative">
              {group.name?.charAt(0).toUpperCase() || 'G'}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center text-[10px] border-2 border-white">
                {group.memberCount || 0}
              </div>
            </div>

            {/* Group Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 truncate">{group.name}</div>
              <div className="text-sm text-slate-500 truncate">
                {group.lastMessage || 'No messages yet'}
              </div>
            </div>

            {/* Unread badge (optional) */}
            {group.unreadCount > 0 && (
              <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {group.unreadCount > 9 ? '9+' : group.unreadCount}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}