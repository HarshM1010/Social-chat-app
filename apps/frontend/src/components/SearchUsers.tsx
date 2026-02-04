'use client';

import { useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { GET_ALL_FRIENDS, GET_ALL_REQUESTED, GET_ALL_REQUESTS, GET_SUGGESTIONS, SEARCH_USERS } from '@/graphql/queries';
import { SEND_FRIEND_REQUEST, CANCEL_FRIEND_REQUEST, FORGET_FRIEND, ACCEPT_FRIEND_REQUEST, REJECT_FRIEND_REQUEST } from '@/graphql/mutations';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

type SearchUsersResponse = {
  searchUsers: Array<{
    userId: string;
    name: string;
    username: string;
    requestStatus: 'FRIEND' | 'SENT' | 'RECEIVED' | 'NONE';
  }>;
};

type SearchUsersProps = {
  user: {
    userId: string;
    name: string;
    username: string;
    email: string;
    friendsCount: number;
    groupsCount: number;
    preference: string | null;
  } | null;
};

export default function SearchUsers({ user }: SearchUsersProps) {
  const [query, setQuery] = useState('');
  const [loading,setLoading] = useState(false);

  const [searchUsers, { data, loading: searchLoading }] = useLazyQuery<SearchUsersResponse>(SEARCH_USERS, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const [sendRequest] = useMutation(SEND_FRIEND_REQUEST, {
    refetchQueries: [
      { query: GET_SUGGESTIONS },
      { query: GET_ALL_REQUESTED },
    ],
  });

  const [cancelRequest] = useMutation(CANCEL_FRIEND_REQUEST, {
    refetchQueries: [ 
      {query: GET_ALL_REQUESTED},
      {query: GET_SUGGESTIONS},
    ],
  });

  const [forgetFriend] = useMutation(FORGET_FRIEND, {
    refetchQueries: [
      { query: SEARCH_USERS },
      { query: GET_ALL_FRIENDS }
    ],
  });

  const [acceptRequest] = useMutation(ACCEPT_FRIEND_REQUEST, {
    refetchQueries: [
      { query: GET_ALL_REQUESTS },
      { query: GET_ALL_FRIENDS }
    ],
  });

  const [rejectRequest] = useMutation(REJECT_FRIEND_REQUEST, {
    refetchQueries: [
      { query: GET_ALL_REQUESTS },
      { query: GET_SUGGESTIONS }
    ],
  });

  const refreshSearch = () => {
    if (user?.userId && query.trim().length > 0) {
      setTimeout(() => {
        searchUsers({ 
          variables: { username: query }
        });
      }, 1000);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (user?.userId && value.trim().length > 0) {
      searchUsers({ variables: { username: value } });
    }
  };

  const handleSendRequest = async (userId: string) => {
    setLoading(true);
    const toastId = toast.loading('Sending request...');
    try {
      await sendRequest({ variables: { to:userId } });
      toast.success('Request Sent successfully', { id: toastId });
      refreshSearch();
    } catch (err) {
      console.error('Error sending request:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId: string) => {
    setLoading(true);
    const toastId = toast.loading('Accepting request...');
    try {
      await acceptRequest({ variables: { senderId: userId } });
      toast.success('Friend added successfully', { id: toastId });
      refreshSearch();
    } catch (err) {
      console.error('Error accepting request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    setLoading(true);
    const toastId = toast.loading('Rejecting request...');
    try {
      await rejectRequest({ variables: { from: userId } });
      toast.success('Request rejected successfully', { id: toastId });
      refreshSearch();
    } catch (err) {
      console.error('Error rejecting request:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (userId: string) => {
    setLoading(true);
    const toastId = toast.loading('deleting request...');
    try {
      await cancelRequest({ variables: { to:userId  } });
      toast.success('Request deleted successfully', { id: toastId });
      refreshSearch();
    } catch (err) {
      console.error('Error canceling request:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const ForgetFriend = async (user: any) => {
    if (confirm(`Are you sure you want to delete this chat and remove ${user.name} from your friends? This cannot be undone.`)) {
      setLoading(true);
      const toastId = toast.loading('Deletion in progress...');
      try {
        await forgetFriend({ variables: { friendId: user.userId, roomId: null} });
        toast.success('Removed friend and deleted chat history', { id: toastId });
        refreshSearch();
      } catch (err) {
        console.error("Error forgetting friend", err);
        let errorMessage = "Something went wrong";
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || errorMessage;
        }
        toast.error(errorMessage, { id: toastId });
      } finally {
        setLoading(false);
      }
    }
  };

  const renderActionButton = (user: any) => {
    switch (user.requestStatus) {
      case 'FRIEND':
        return (
          <button
            onClick={() => ForgetFriend(user)}
            className="px-3 py-1.5 text-[13px] font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
          >
            Forget
          </button>
        );
      case 'SENT':
        return (
          <button
            onClick={() => handleCancel(user?.userId)}
            className="px-3 py-1.5 text-[13px] font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
        );
      case 'RECEIVED':
        return (
          <span className="px-3 py-1.5 font-medium text-teal-600 bg-teal-50 rounded-lg">
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(user?.userId)}
                className="px-3 py-1.5 text-[13px] bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(user?.userId)}
                className="px-3 py-1.5 text-[13px] bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                Reject
              </button>
            </div>
          </span>
        );
      default:
        return (
          <button
            onClick={() => handleSendRequest(user?.userId)}
            className="px-3 py-1.5 text-[13px] font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition cursor-pointer"
          >
            Send Request
          </button>
        );
    }
  };

  const users = data?.searchUsers || [];

  return (
    <div className="p-4">
      <Toaster position="top-right" reverseOrder={false} />
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

      {
        !user?.userId && (
          <div className="text-center text-red-400 text-[13px]">Please login or signup</div>
        )
      }
      {users.length === 0 && query && !searchLoading && (
        <div className="text-center text-slate-400 text-[13px]">No users found</div>
      )}

      <div className="space-y-2">
        {users.map((user: any) => (
          <div key={user.userId} className="p-3 bg-teal-50/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">{user.name}</div>
                <div className="text-xs text-slate-500">@{user.username}</div>
              </div>
              {renderActionButton(user)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}