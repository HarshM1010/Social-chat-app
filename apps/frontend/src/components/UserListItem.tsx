'use client';

import { useQuery } from '@apollo/client';
import { GET_FRIENDS } from '@/graphql/queries';
import EmptyState from './EmptyState';
import UserListItem from './UserListItem';

type FriendListProps = {
  onSelectChat: (userId: string, user: any) => void;
};

export default function FriendList({ onSelectChat }: FriendListProps) {
  const { data, loading, error } = useQuery(GET_FRIENDS);

  if (loading) return <div className="p-4 text-center text-slate-500">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading friends</div>;

  const friends = data?.getFriends || [];

  if (friends.length === 0) {
    return <EmptyState icon="👥" message="No friends yet" subMessage="Search for users to start chatting" />;
  }

  return (
    <div>
      {friends.map((friend: any) => (
        <UserListItem
          key={friend.id}
          user={friend}
          onClick={() => onSelectChat(friend.id, friend)}
          showLastMessage={true}
        />
      ))}
    </div>
  );
}

// src/components/UserListItem.tsx
'use client';

type UserListItemProps = {
  user: {
    id: string;
    name: string;
    username?: string;
    lastMessage?: string;
    lastMessageTime?: string;
  };
  onClick?: () => void;
  showLastMessage?: boolean;
  actions?: React.ReactNode;
};

export default function UserListItem({ 
  user, 
  onClick, 
  showLastMessage = false,
  actions 
}: UserListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-teal-50 transition ${
        onClick ? 'hover:bg-teal-50/50 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 truncate">{user.name}</div>
          {showLastMessage && user.lastMessage && (
            <div className="text-sm text-slate-500 truncate">{user.lastMessage}</div>
          )}
          {!showLastMessage && user.username && (
            <div className="text-sm text-slate-500">@{user.username}</div>
          )}
        </div>

        {/* Actions */}
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
