'use client';

import { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { GET_ALL_REQUESTED, GET_ALL_FRIENDS, SEARCH_USERS } from '@/graphql/queries';
import {CANCEL_FRIEND_REQUEST} from '@/graphql/mutations';
import EmptyState from './EmptyState';
import { GET_SUGGESTIONS } from '@/graphql/queries';
import toast, { Toaster } from 'react-hot-toast';
import { LISTEN_FOR_ACCEPTED_REQUEST, LISTEN_FOR_REJECTED_REQUEST } from '../graphql/subscription'
import axios from 'axios';

type GetAllRequestedResponse = {
  getAllRequested: Array<{ userId: string; name: string; username: string }>;
};

type RequestedListProps = {
  currentUser?: {
    userId: string,
    username: string,
  };
};

export default function RequestedList({ currentUser }: RequestedListProps) {
  const { data, loading, error } = useQuery<GetAllRequestedResponse>(GET_ALL_REQUESTED, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    skip: !currentUser?.userId,
  });
  const [loadingSent,setLoadingSent] = useState(false);
  const [cancelRequest] = useMutation(CANCEL_FRIEND_REQUEST, {
    refetchQueries: [ 
      {query: GET_ALL_REQUESTED},
      {query: GET_SUGGESTIONS},
      { query: SEARCH_USERS },
    ],
  });

  useSubscription(LISTEN_FOR_ACCEPTED_REQUEST, {
    variables: { userId: currentUser?.userId },
    skip: !currentUser?.userId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_REQUESTED,GET_ALL_FRIENDS,SEARCH_USERS],
        });
      },2000)
    }
  });

  useSubscription(LISTEN_FOR_REJECTED_REQUEST, {
    variables: { userId: currentUser?.userId },
    skip: !currentUser?.userId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_REQUESTED,GET_SUGGESTIONS,SEARCH_USERS],
        });
      },500)
    } 
  });

  if (loading) return <div className="p-4 text-center text-slate-500">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading requests</div>;

  const requests = data?.getAllRequested || [];

  if (requests.length === 0) {
    return <EmptyState icon="📤" message="No sent requests" />;
  }

  const handleCancel = async (userId: string) => {
    setLoadingSent(true);
    const toastId = toast.loading('deleting request...');
    try {
      await cancelRequest({ variables: { to:userId  } });
      toast.success('Request deleted successfully', { id: toastId });
    } catch (err) {
      console.error('Error canceling request:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingSent(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      {requests.map((request: any) => (
        <div key={request.userId} className="p-4 border-b border-teal-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {request.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 truncate">{request.name}</div>
              <div className="text-sm text-slate-500">@{request.username}</div>
            </div>
            <button
              onClick={() => handleCancel(request.userId)}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}