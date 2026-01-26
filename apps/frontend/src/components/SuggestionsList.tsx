'use client';

import { useQuery, useMutation } from '@apollo/client/react';
import { GET_SUGGESTIONS, SEARCH_USERS } from '@/graphql/queries';
import { GET_ALL_REQUESTED } from '@/graphql/queries';
import { SEND_FRIEND_REQUEST } from '@/graphql/mutations';
import toast, { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import axios from 'axios';

export default function SuggestionsList() {
  const [loadingSendFr,setLoadingSendFr] = useState(false);
  const { data, loading, error } = useQuery(GET_SUGGESTIONS);
  const [sendRequest] = useMutation(SEND_FRIEND_REQUEST, {
    refetchQueries: [
      { query: GET_SUGGESTIONS },
      { query: GET_ALL_REQUESTED },
      { query: SEARCH_USERS }
    ],
  });

  if (loading) return <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500 text-sm">Error loading suggestions</div>;

  const suggestions = data?.getSuggestions || [];

  if (suggestions.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
          ✨
        </div>
        <p className="text-sm text-slate-600">No suggestions available</p>
      </div>
    );
  }

  const handleSendRequest = async (userId: string) => {
    setLoadingSendFr(true);
    const toastId = toast.loading('Sending request...');
    try {
      await sendRequest({ variables: { to:userId } });
      toast.success('Request Sent successfully', { id: toastId });
    } catch (err) {
      console.error('Error sending request:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingSendFr(false);
    }
  };

  return (
    <div className="p-4 space-y-2">
      <Toaster position="top-right" reverseOrder={false} />
      {suggestions.map((user: any) => (
        <div key={user.userId} className="p-3 bg-teal-50/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 text-sm truncate">{user.name}</div>
              <div className="text-xs text-slate-500">@{user.username}</div>
            </div>
            <button
              onClick={() => handleSendRequest(user.userId)}
              className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition cursor-pointer bg-teal-500 text-white hover:bg-teal-600"
              >
              Send Request
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}