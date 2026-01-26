type EmptyStateProps = {
  icon: string;
  message: string;
  subMessage?: string;
};

export default function EmptyState({ icon, message, subMessage }: EmptyStateProps) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-teal-50 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <p className="text-sm text-slate-600 font-medium">{message}</p>
      {subMessage && <p className="text-xs text-slate-400 mt-1">{subMessage}</p>}
    </div>
  );
}