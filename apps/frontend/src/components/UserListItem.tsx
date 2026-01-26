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
