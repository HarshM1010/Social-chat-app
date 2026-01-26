'use client';
import React from 'react';

type ReadReceipt = {
  userId: string;
  readAt: string;
};

type MessageProps = {
  message: {
    _id: string;
    content: string;
    senderId: string;
    createdAt: string;
    status: string;
    sender?: { username: string };
    readBy?: ReadReceipt[];
  };
  isOwn: boolean;
  senderName?: string; // For group chats (friend's name or username)
  isActive: boolean;   // Is the menu currently open for this bubble?
  onToggleMenu: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function MessageBubble({ 
  message, 
  isOwn, 
  senderName, 
  isActive, 
  onToggleMenu, 
  onDelete
}: MessageProps) {
  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        relative max-w-[70%] px-4 py-2.5 shadow-sm text-sm group transition-all
        ${isOwn
          ? 'bg-teal-500 text-white rounded-2xl rounded-tr-none' // My Msg
          : 'bg-[#CBFBF1] text-slate-800 rounded-2xl rounded-tl-none' // Their Msg
        }
      `}>
        
        {/* === CHEVRON BUTTON (Only for own messages) === */}
        {isOwn && (
          <div className="absolute top-1 right-1 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(message._id);
              }}
              className={`
                p-1 rounded-full transition-all cursor-pointer
                ${isActive ? 'opacity-100 bg-black/10' : 'opacity-0 group-hover:opacity-100 hover:bg-black/10'}
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* === DROPDOWN MENU === */}
            {isActive && (
              <div className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-20 text-slate-700 animate-in fade-in zoom-in-95 duration-100 text-left">
                {/* Info Section */}
                <div className="px-3 py-2 border-b border-slate-100 text-xs bg-slate-50">
                  <p className="font-semibold text-slate-500 mb-1">Message Info</p>
                  <p>Status: <span className="capitalize">{message.status}</span></p>
                  {message.readBy && message.readBy.length > 0 && (
                     <p className="mt-1">Read by {message.readBy.length} people</p>
                  )}
                </div>
                
                {/* Actions Section */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(message._id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* === SENDER NAME (For Groups) === */}
        {!isOwn && senderName && (
          <p className="text-[12px] font-bold text-teal-600 mb-0.5">
            {senderName}
          </p>
        )}

        {/* === CONTENT === */}
        <p className="wrap-break-word leading-relaxed tracking-wide pr-4">
           {message.content}
        </p>

        {/* === FOOTER (Time & Ticks) === */}
        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwn ? 'text-teal-100' : 'text-slate-500'}`}>
          <span>
            {new Date(parseInt(message.createdAt)).toLocaleString([], {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
          {isOwn && (
            <span title={message.status}>
              {message.status === 'read' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}