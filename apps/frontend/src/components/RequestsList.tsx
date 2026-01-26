'use client';

import { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { GET_ALL_REQUESTS, GET_ALL_FRIENDS, GET_SUGGESTIONS, SEARCH_USERS } from '@/graphql/queries';
import {ACCEPT_FRIEND_REQUEST, REJECT_FRIEND_REQUEST} from '@/graphql/mutations';
import EmptyState from './EmptyState';
import { LISTEN_FOR_SENT_REQUEST, LISTEN_FOR_CANCELLED_REQUEST } from '@/graphql/subscription';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

type GetAllRequestsResponse = {
  getAllRequests: Array<{ userId: string; name: string; username: string }>;
};

type RequestsListProps = {
  currentUser: {
    userId: string,
    username: string,
  };
};

export default function RequestsList({ currentUser }: RequestsListProps) {
  const [loadingRequest,setLoadingRequest] = useState(false);
  const { data, loading, error } = useQuery<GetAllRequestsResponse>(GET_ALL_REQUESTS);
  
  const [acceptRequest] = useMutation(ACCEPT_FRIEND_REQUEST, {
    refetchQueries: [
      { query: GET_ALL_REQUESTS },
      { query: GET_ALL_FRIENDS },
      { query: SEARCH_USERS },
    ],
  });
  const [rejectRequest] = useMutation(REJECT_FRIEND_REQUEST, {
    refetchQueries: [
      { query: GET_ALL_REQUESTS },
      { query: GET_SUGGESTIONS },
      { query: SEARCH_USERS }
    ],
  });

  useSubscription(LISTEN_FOR_SENT_REQUEST, {
    variables: { userId: currentUser?.userId },
    skip: !currentUser?.userId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_REQUESTS,GET_SUGGESTIONS,SEARCH_USERS],
        });
      },500)
    } 
  });

  useSubscription(LISTEN_FOR_CANCELLED_REQUEST, {
    variables: { userId: currentUser?.userId },
    skip: !currentUser?.userId,
    onData: ({ client }) => {
      setTimeout(() => {
        client.refetchQueries({
          include: [GET_ALL_REQUESTS,GET_SUGGESTIONS,SEARCH_USERS],
        });
      },500)
    } 
  });

  if (loading) return <div className="p-4 text-center text-slate-500">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading requests</div>;

  const requests = data?.getAllRequests || [];

  if (requests.length === 0) {
    return <EmptyState icon="📥" message="No friend requests" />;
  }

  const handleAccept = async (userId: string) => {
    setLoadingRequest(true);
    const toastId = toast.loading('Accepting request...');
    try {
      await acceptRequest({ variables: { senderId: userId } });
      toast.success('Friend added successfully', { id: toastId });
    } catch (err) {
      console.error('Error accepting request:', err);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleReject = async (userId: string) => {
    setLoadingRequest(true);
    const toastId = toast.loading('Rejecting request...');
    try {
      await rejectRequest({ variables: { from: userId } });
      toast.success('Request rejected successfully', { id: toastId });
    } catch (err) {
      console.error('Error rejecting request:', err);
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoadingRequest(false);
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
              <div className="font-semibold text-slate-800 truncate">{request?.name}</div>
              <div className="text-sm text-slate-500">@{request?.username}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request?.userId)}
                className="px-3 py-1.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(request?.userId)}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}