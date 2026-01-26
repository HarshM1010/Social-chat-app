'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { GET_MESSAGES } from '@/graphql/queries';
import { SEND_MESSAGE, FORGET_FRIEND, DELETE_MESSAGE } from '@/graphql/mutations';
import { LISTEN_FOR_MESSAGES, LISTEN_FOR_DELETED_MESSAGE } from '../graphql/subscription'
import MessageBubble from './MessageBubble';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Define the shape of a Read Receipt
type ReadReceipt = {
  userId: string;
  readAt: string;
};

// Define the full Message shape matching your GraphQL Query
type Message = {
  _id: string;
  roomId: string;
  content: string;
  senderId: string;
  createdAt: string;
  status: string;// 'sent' | 'delivered' | 'read'
  sender: {
    username: string;
  };
  readBy: ReadReceipt[];
};

// Define the Query Response
type GetMessagesResponse = {
  getMessages: {
    roomId: string;
    messages: Message[];
  };
};

type ChatWindowProps = {
  friendId: string; 
  user: any; // The friend object containing name, id, username
  currentUserId: string;
};


export default function ChatWindow({ friendId, user, currentUserId }: ChatWindowProps) {
  const [text, setText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [loadingDelete,setLoadingDelete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Messages
  const { data, loading, error } = useQuery<GetMessagesResponse>(GET_MESSAGES, {
    variables: { roomId:null, friendId },
  });
  if(error) console.log(error);

  
  const roomId = data?.getMessages?.roomId;
  // 2. Real-time Subscription
  useSubscription(LISTEN_FOR_MESSAGES, {
    variables: { roomId },
    skip: !roomId,
    onData: ({ client }) => {
    client.refetchQueries({
      include: [GET_MESSAGES],
    }); 
    setTimeout(scrollToBottom, 50);
  }
  });

  // 3. Mutations
  const [sendMessage] = useMutation(SEND_MESSAGE, {
    refetchQueries: [
      { 
        query: GET_MESSAGES, 
        variables: { friendId,roomId:null }
      }
    ],
    awaitRefetchQueries: true,
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    refetchQueries: [{ query: GET_MESSAGES, variables: { friendId,roomId:null } }],
  });

  const [forgetFriend] = useMutation(FORGET_FRIEND, {
    onCompleted: () => {
      window.location.reload();
    }
  });

  // 4. Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data]);

  useEffect(() => {
    const closeMenu = () => setActiveMessageId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // 5. Handlers
  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendMessage({
        variables: { 
          input: { // Assuming your CreateMessageInput structure
            roomId: roomId, 
            content: text,
          }
        },
      });
      setText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (messageId: string) => {
    setLoadingDelete(true);
    const toastId = toast.loading('Deletion in progress...');
    try {
      await deleteMessage({ variables: { messageId: messageId } });
      toast.success('Msg deleted successfully!', { id: toastId });
    } catch (err) {
      console.error('Error deleting message:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingDelete(false);
    }
  };

  useSubscription(LISTEN_FOR_DELETED_MESSAGE, {
    variables: {roomId},
    skip: !roomId,
    onData: ({ client }) => {
      client.refetchQueries({
        include: [GET_MESSAGES],
      });
    }
  });

  const handleForgetChat = async () => {
    if (confirm(`Are you sure you want to delete this chat and remove ${user.name} from your friends? This cannot be undone.`)) {
      setLoadingDelete(true);
      const toastId = toast.loading('Deletion in progress...');
      try {
        await forgetFriend({ variables: { friendId: user.userId, roomId: roomId } });
        toast.success('Removed friend and deleted chat history', { id: toastId });
      } catch (err) {
        console.error("Error forgetting friend", err);
        let errorMessage = "Something went wrong";
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage, { id: toastId });
      } finally {
        setLoadingDelete(false);
      }
    }
  };

  const messages = [...(data?.getMessages?.messages || [])].reverse();

  return (
    <div className="h-full flex flex-col bg-white relative">
      <Toaster position="top-right" reverseOrder={false} />
      {/* === HEADER === */}
      <div className="px-6 py-4 border-b border-teal-100 flex items-center justify-between bg-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{user?.name}</h3>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
               <p className="text-xs text-slate-500 font-medium">Online</p>
            </div>
          </div>
        </div>

        {/* --- THREE DOTS MENU --- */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-teal-50 rounded-full transition text-slate-500 hover:text-teal-600 outline-none cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {isMenuOpen && (
            <>
              {/* Invisible backdrop to close menu when clicking outside */}
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-10 w-64 bg-white rounded-xl shadow-xl border border-teal-100 overflow-hidden z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={handleForgetChat}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Forget and delete chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* === MESSAGES AREA === */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
        {loading ? (
          <div className="flex h-full items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
                👋
              </div>
              <p className="text-slate-600 font-medium">Say hello to {user?.name}!</p>
              <p className="text-xs text-slate-400 mt-1">This is the start of your conversation.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderId === currentUserId}
                // Determine name to show (Friend's name or specific sender in group)
                senderName={message.sender?.username || user.name}
                // Menu Logic
                isActive={activeMessageId === message._id}
                onToggleMenu={(id) => setActiveMessageId(activeMessageId === id ? null : id)}
                onDelete={(id) => {
                  handleDelete(id);
                  setActiveMessageId(null);
                }}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* === INPUT AREA === */}
      <div className="p-4 bg-white border-t border-teal-100">
        <div className="flex gap-3 items-end">
          <input
            className="flex-1 px-4 py-3 bg-teal-50/50 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition resize-none placeholder:text-slate-400 text-slate-700"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-5 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition flex items-center gap-2 font-medium shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}