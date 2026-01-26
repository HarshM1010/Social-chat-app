'use client';

import { useState } from 'react';

type MessageProps = {
  message: {
    id: string;
    content: string;
    isOwn: boolean;
    createdAt: string;
  };
  onDelete: (messageId: string) => void;
};

export default function Message({ message, onDelete }: MessageProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`flex gap-2 ${message.isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => message.isOwn && setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="relative max-w-[70%]">
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            message.isOwn
              ? 'bg-teal-500 text-white rounded-br-sm'
              : 'bg-white text-slate-800 rounded-bl-sm border border-teal-100'
          }`}
        >
          <p className="text-sm wrap-break-word">{message.content}</p>
          <p
            className={`text-xs mt-1 ${
              message.isOwn ? 'text-teal-100' : 'text-slate-400'
            }`}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {message.isOwn && showDelete && (
          <button
            onClick={() => onDelete(message.id)}
            className="absolute -right-10 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center cursor-pointer"
            title="Delete message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}