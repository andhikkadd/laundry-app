import React from 'react';
import { Menu, User } from 'lucide-react';

interface AdminTopbarProps {
  title: string;
  onOpenSidebar: () => void;
  adminName?: string;
}

export default function AdminTopbar({
  title,
  onOpenSidebar,
  adminName = 'Admin Bilasin',
}: AdminTopbarProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border-brand bg-white px-6 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-1.5 text-text-dark hover:bg-light-bg lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-xl font-bold text-navy-dark tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-text-dark hidden sm:inline">
          {adminName}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-light-bg text-navy-dark border border-border-brand">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
