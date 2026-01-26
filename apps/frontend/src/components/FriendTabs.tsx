'use client';

type Tab = {
  id: string;
  label: string;
};

type FriendTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function FriendTabs({ tabs, activeTab, onTabChange }: FriendTabsProps) {
  return (
    <div className="flex border-b border-teal-100 bg-teal-50/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === tab.id
              ? 'text-teal-600 border-b-2 border-teal-500 bg-white'
              : 'text-slate-500 hover:text-teal-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}