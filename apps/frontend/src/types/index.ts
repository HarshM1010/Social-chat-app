export type User = {
  id: string;
  name: string;
  username: string;
  email?: string;
};

export type Friend = User & {
  lastMessage?: string;
  lastMessageTime?: string;
};

export type FriendRequest = User & {
  requestStatus?: 'sent' | 'received' | 'none';
};

export type Message = {
  id: string;
  content: string;
  senderId: string;
  roomId: string;
  isOwn: boolean;
  createdAt: string;
};

export type ChatRoom = {
  id: string;
  participants: User[];
  lastMessage?: Message;
};