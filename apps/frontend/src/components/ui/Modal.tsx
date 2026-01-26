'use client';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Window */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-teal-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-teal-50 bg-linear-to-r from-teal-500 to-cyan-600 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-teal-100 hover:text-white transition rounded-full p-1 hover:bg-white/10 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}