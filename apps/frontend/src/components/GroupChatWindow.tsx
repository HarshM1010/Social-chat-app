// src/components/GroupChatWindow.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useLazyQuery, useSubscription } from '@apollo/client/react';
import { GET_MESSAGES, GET_ALL_FRIENDS, SEARCH_USERS, GET_ALL_NON_ADMINS, GET_GROUP_MEMBERS, GET_ALL_ADMINS } from '@/graphql/queries';
import { SEND_MESSAGE, DELETE_MESSAGE, DELETE_GROUP, LEAVE_GROUP, ADD_MEMBER_TO_GROUP, REMOVE_GROUP_MEMBER, MAKE_GROUP_ADMIN, REMOVE_GROUP_ADMIN } from '@/graphql/mutations';
import { LISTEN_FOR_ADDED_MEM_ROSTER_UPDATED, LISTEN_FOR_ADMIN_STATUS_CHANGED, LISTEN_FOR_DELETED_MESSAGE, LISTEN_FOR_MESSAGES, LISTEN_FOR_REMOVED_MEM_ROSTER_UPDATED } from '@/graphql/subscription'
import Message from './Message';
import Modal from './ui/Modal'
import toast, { Toaster } from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import axios from 'axios';

// Define the Message type for use in queries
type MessageType = {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    username?: string;
  };
  status: string;
  readBy: {
    userId: string;
    readAt: string;
  };
};

type GroupChatWindowProps = {
  roomId: string;
  group: any;
  user: any;
  currentUserId: string;
};

type GetMessagesResponse = {
  getMessages: {
    roomId: string;
    messages: MessageType[];
  };
};

type GetAllNonAdminsResponse = {
  getAllNonAdmins: Array<{ userId: string; name: string; username: string }>;
}

type GetAllFriendsResponse = {
  getAllFriends: Array<{ userId: string; name: string; username: string }>;
}

type ModalType = 'none' | 'viewAdmins' | 'addMember' | 'removeMember' | 'addAdmin' | 'removeAdmin';

type SearchUsersResponse = {
  searchUsers: Array<{
    userId: string;
    name: string;
    username: string;
    requestStatus: 'FRIEND' | 'SENT' | 'RECEIVED' | 'NONE';
  }>;
};

export default function GroupChatWindow({ roomId, user, group, currentUserId }: GroupChatWindowProps) {
  const [text, setText] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // UI State for Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [addMemberTab, setAddMemberTab] = useState<'friends' | 'search'>('friends');
  const [loadingUpdate,setLoadingUpdate] = useState(false);
  
  // 1. Messages
  const { data, loading } = useQuery<GetMessagesResponse>(GET_MESSAGES, {
    variables: { roomId, friendId:null },
  });

  // 2. Admins & Members (For permissions)
  const { data: adminsData } = useQuery<{ getAllAdmins: Array<{ userId: string; name: string; username: string }> }>(GET_ALL_ADMINS, { variables: { groupId: roomId } });
  const { data: membersData } = useQuery<{ getGroupMembers: Array<{ userId: string; name: string; username: string }> }>(GET_GROUP_MEMBERS, { variables: { groupId: roomId } });

  // 3. Helper data for modals (queries)
  const { data: friendsData } = useQuery<GetAllFriendsResponse>(GET_ALL_FRIENDS);
  const { data: allNonAdmins } = useQuery<GetAllNonAdminsResponse>(GET_ALL_NON_ADMINS, { variables: { groupId: roomId } });
  
  const [searchUsers, { data:searchData, loading: searchLoading }] = useLazyQuery<SearchUsersResponse>(SEARCH_USERS, {
    fetchPolicy: 'network-only',
  });

  const refreshSearch = () => {
    if (query.trim().length > 0) {
      setTimeout(() => {
        searchUsers({ 
          variables: { username: query }
        });
      }, 1000);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      searchUsers({ variables: { username: value } });
    }
  };

  // === MUTATIONS ===
  const [sendMessage] = useMutation(SEND_MESSAGE, {
  refetchQueries: [
    { 
      query: GET_MESSAGES, 
      variables: { friendId:null,roomId }
    }
  ],
  awaitRefetchQueries: true,
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    refetchQueries: [{ query: GET_MESSAGES, variables: { friendId:null,roomId } }],
  });

  // Admin Actions
  const [leaveGroup] = useMutation(LEAVE_GROUP, { onCompleted: () => window.location.reload() });
  const [deleteGroup] = useMutation(DELETE_GROUP, { onCompleted: () => window.location.reload() });
  const [addMember] = useMutation(ADD_MEMBER_TO_GROUP, { refetchQueries: [GET_GROUP_MEMBERS] });
  const [removeMember] = useMutation(REMOVE_GROUP_MEMBER, { refetchQueries: [GET_GROUP_MEMBERS, GET_ALL_ADMINS]});
  const [makeAdmin] = useMutation(MAKE_GROUP_ADMIN, { refetchQueries: [GET_ALL_NON_ADMINS,GET_ALL_ADMINS] });
  const [removeAdmin] = useMutation(REMOVE_GROUP_ADMIN, { refetchQueries: [GET_ALL_NON_ADMINS,GET_ALL_ADMINS] });

  // SUBSCRIPTIONS
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

  useSubscription(LISTEN_FOR_DELETED_MESSAGE, {
    variables: {roomId},
    skip: !roomId,
    onData: ({ client }) => {
      client.refetchQueries({
        include: [GET_MESSAGES],
      });
    }
  });

  useSubscription(LISTEN_FOR_ADDED_MEM_ROSTER_UPDATED, {
    variables: { groupId: roomId },
    skip: !roomId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_NON_ADMINS],
        });
      },1000)
    }
  })

  useSubscription(LISTEN_FOR_REMOVED_MEM_ROSTER_UPDATED, {
    variables: { groupId: roomId },
    skip: !roomId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_NON_ADMINS,GET_ALL_ADMINS],
        });
      },1000)
    }
  })

  useSubscription(LISTEN_FOR_ADMIN_STATUS_CHANGED, {
    variables: { groupId: roomId },
    skip: !roomId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_NON_ADMINS,GET_ALL_ADMINS],
        });
      },1000)
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data]);

  // LOGIC
  const messages = [...(data?.getMessages?.messages || [])].reverse();
  const admins = adminsData?.getAllAdmins || [];
  const members = membersData?.getGroupMembers || [];
  
  // Check if current user is admin
  const isAdmin = admins.some((a: any) => a.userId === currentUserId);

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setIsMenuOpen(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendMessage({
        variables: { 
          input: {
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

  const handleDelete = async (messageId: string) => {
    setLoadingUpdate(true);
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
      setLoadingUpdate(false);
    }
  };

  const handleAddMember = async ( groupId: string, newMemberId: string) => {
    setLoadingUpdate(true);
    const toastId = toast.loading('Adding new member...');
    try {
      await addMember({ variables: { groupId: groupId, newMemberId: newMemberId } });
      if(addMemberTab === 'search') {
        refreshSearch();
      }
      toast.success('Member added successfully!', { id: toastId });
    } catch (err) {
      console.error('Error adding member:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleRemoveMember = async ( groupId: string, targetUserId: string) => {
    setLoadingUpdate(true);
    const toastId = toast.loading('Removing member...');
    try {
      await removeMember({ variables: { groupId: groupId, targetUserId: targetUserId } });
      toast.success('Member removed successfully!', { id: toastId });
    } catch (err) {
      console.error('Error removing member:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleMakeAdmin = async ( groupId: string, targetUserId: string) => {
    setLoadingUpdate(true);
    const toastId = toast.loading('Updating admin status...');
    try {
      await makeAdmin({ variables: { groupId: groupId, targetUserId: targetUserId } });
      toast.success('Status updated successfully!', { id: toastId });
    } catch (err) {
      console.error('Error updating status:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingUpdate(false);
    }
  }

  const handleRemoveAdmin = async ( groupId: string, targetUserId: string) => {
    setLoadingUpdate(true);
    const toastId = toast.loading('Updating admin status...');
    try {
      await removeAdmin({ variables: { groupId: groupId, targetUserId: targetUserId } });
      toast.success('Status updated successfully!', { id: toastId });
    } catch (err) {
      console.error('Error updating status:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingUpdate(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const noOfAdmins = admins.length;
  const nonAdmins = allNonAdmins?.getAllNonAdmins || [];
  const noOfMembers = nonAdmins.length;
  const users = searchData?.searchUsers || [];

  return (
    <div className="h-full flex flex-col bg-white relative">
      <Toaster position="top-right" reverseOrder={false} />
      {/* === HEADER === */}
      <div className="px-6 py-4 border-b border-teal-100 flex justify-between items-center bg-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold">
            {group?.name?.charAt(0).toUpperCase() || 'G'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{group?.name || 'Group'}</h3>
            <p className="text-xs text-teal-500">{noOfMembers} {noOfMembers === 1 ? "member" : "members"} • {noOfAdmins} {noOfAdmins === 1 ? "admin" : "admins"}</p>
          </div>
          <button onClick={() => setShowGroupInfo(!showGroupInfo)} className="p-1 hover:bg-teal-50 rounded-full text-slate-400 cursor-pointer">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </div>

        {/* THREE DOTS MENU */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-teal-50 rounded-full transition text-slate-500 hover:text-teal-600 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-teal-100 overflow-hidden z-20 py-1">
                {isAdmin ? (
                  <>
                    <button onClick={() => openModal('addMember')} className="w-full text-left px-4 py-2 hover:bg-teal-50 text-sm text-slate-700 cursor-pointer">Add Member</button>
                    <button onClick={() => openModal('removeMember')} className="w-full text-left px-4 py-2 hover:bg-teal-50 text-sm text-slate-700 cursor-pointer">Remove Member</button>
                    <button onClick={() => openModal('addAdmin')} className="w-full text-left px-4 py-2 hover:bg-teal-50 text-sm text-slate-700 cursor-pointer">Make Admin</button>
                    <button onClick={() => openModal('removeAdmin')} className="w-full text-left px-4 py-2 hover:bg-teal-50 text-sm text-slate-700 cursor-pointer">Demote Admin</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={() => leaveGroup({ variables: { groupId: roomId } })} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 cursor-pointer">Leave Group</button>
                    <button onClick={() => deleteGroup({ variables: { groupId: roomId } })} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 cursor-pointer">Delete Group</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openModal('viewAdmins')} className="w-full text-left px-4 py-2 hover:bg-teal-50 text-sm text-slate-700 cursor-pointer">View Admins</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={() => leaveGroup({ variables: { groupId: roomId } })} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 cursor-pointer">Leave Group</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Group Info Panel */}
      {showGroupInfo && (
        <div className="p-4 bg-teal-50 border-b border-teal-100 animate-in slide-in-from-top-2">
          <div className="text-sm">
            <p className="text-slate-600 mb-2"><span className="font-semibold">Created:</span> {new Date(group?.createdAt).toLocaleDateString()}</p>
            <p className="text-slate-600"><span className="font-semibold">Description:</span> {group?.description || 'No description'}</p>
          </div>
        </div>
      )}

      {/* === MODALS (The 5 Popups) === */}
      <Modal isOpen={activeModal === 'viewAdmins'} onClose={() => setActiveModal('none')} title="Group Admins">
        <div className="p-4 space-y-2">
          {admins.map((admin: any) => (
            <div key={admin.userId} className="flex items-center gap-3 p-2 rounded-lg bg-teal-50/50">
               <div className="w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center text-teal-700 text-xs font-bold">{admin.name[0]}</div>
               <span className="text-sm font-medium text-slate-700">{admin.name}</span>
               <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">Admin</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'addMember'} onClose={() => setActiveModal('none')} title="Add Member">
        <div className="p-4">
           <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
              <button onClick={() => setAddMemberTab('friends')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition cursor-pointer ${addMemberTab === 'friends' ? 'bg-white shadow text-teal-600' : 'text-slate-500'}`}>Friends</button>
              <button onClick={() => setAddMemberTab('search')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition cursor-pointer ${addMemberTab === 'search' ? 'bg-white shadow text-teal-600' : 'text-slate-500'}`}>Search</button>
           </div>
           {addMemberTab === 'friends' && (
             <div className="space-y-2 max-h-60 overflow-y-auto">
               {(friendsData?.getAllFriends || []).map((friend: any) => {
                 const isAlreadyMember = members.some((m: any) => m?.userId === friend?.userId);
                 return (
                  <div key={friend?.userId} className="p-3 bg-teal-50/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {friend?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">{friend?.name}</div>
                        <div className="text-xs text-slate-500">@{friend?.username}</div>
                      </div>
                      {isAlreadyMember ? <span className="text-[13px] text-slate-400">Joined</span> : 
                        <button onClick={() => handleAddMember(roomId,friend?.userId)} className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-md hover:bg-teal-600 cursor-pointer">Add</button>
                      }
                    </div>
                  </div>
                );
               })}
             </div>
           )}
           {addMemberTab === 'search' && (
             <div className="space-y-3">
               <div className="relative mb-4">
                  <svg className="w-5 h-5 text-teal-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2.5 bg-teal-50/50 border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm placeholder:text-slate-400 text-slate-700"
                  />
                </div>
                {searchLoading && <div className="text-center text-slate-500 text-[13px]">Searching...</div>}

                {users.length === 0 && query && !searchLoading && (
                  <div className="text-center text-slate-400 text-[13px]">No users found</div>
                )}
               <div className="space-y-2 max-h-48 overflow-y-auto">
                 {(users || []).map((u: any) => {
                    const isAlreadyMember = members.some((m: any) => m?.userId === u?.userId);
                    return (
                      <div key={u?.userId} className="p-3 bg-teal-50/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {u?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 text-sm truncate">{u?.name}</div>
                            <div className="text-xs text-slate-500">@{u?.username}</div>
                          </div>
                          {isAlreadyMember ? <span className="text-[13px] text-slate-400">Joined</span> : 
                            <button onClick={() => handleAddMember(roomId,u?.userId)} className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-md hover:bg-teal-600 cursor-pointer">Add</button>
                          }
                        </div>
                      </div>
                    )
                 })}
               </div>
             </div>
           )}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'removeMember'} onClose={() => setActiveModal('none')} title="Remove Member">
         <div className="p-4 space-y-2">
           {nonAdmins.map((m: any) => (
             <div key={m?.userId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">{m?.name}</span>
                {m?.userId !== currentUserId && <button onClick={() => handleRemoveMember(roomId,m?.userId)} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-200 cursor-pointer">Remove</button>}
             </div>
           ))}
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'addAdmin'} onClose={() => setActiveModal('none')} title="Make Admin">
         <div className="p-4 space-y-2">
           {nonAdmins.map((m: any) => (
             <div key={m?.userId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">{m?.name}</span>
                <button onClick={() => handleMakeAdmin(roomId,m?.userId)} className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-md hover:bg-teal-600 cursor-pointer">Make Admin</button>
             </div>
           ))}
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'removeAdmin'} onClose={() => setActiveModal('none')} title="Demote Admin">
         <div className="p-4 space-y-2">
           {admins.filter((a: any) => a?.userId !== currentUserId).map((admin: any) => (
             <div key={admin?.userId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">{admin?.name}</span>
                <button onClick={() => handleRemoveAdmin(roomId,admin?.userId)} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md hover:bg-amber-200 cursor-pointer">Remove Admin</button>
             </div>
           ))}
         </div>
      </Modal>

      {/* === MESSAGES AREA === */}
      <div className="flex-1 p-6 overflow-y-auto bg-linear-to-b from-teal-50/20 to-cyan-50/20">
        {loading ? (
          <div className="text-center text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="text-sm text-slate-400">No messages yet.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: any) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.senderId === currentUserId}
                senderName={message.sender?.username || user.name}
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
            <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}