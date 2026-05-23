'use client';

import React, { useState } from 'react';
import { Menu, User, LogOut, Shield } from 'lucide-react';
import { logoutAction } from '@/actions/auth';

interface AdminTopbarProps {
  title: string;
  onOpenSidebar: () => void;
  adminName?: string;
  adminEmail?: string;
}

export default function AdminTopbar({
  title,
  onOpenSidebar,
  adminName = 'Admin',
  adminEmail = 'admin@bilasin.com',
}: AdminTopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border-brand bg-white px-6 shadow-xs relative">
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

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-light-bg transition-colors cursor-pointer border border-transparent hover:border-border-brand"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-text-dark leading-tight">{adminName}</p>
            <p className="text-[10px] text-text-muted leading-tight mt-0.5">{adminEmail}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy-dark border border-border-brand">
            <User size={16} />
          </div>
        </button>

        {dropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border-brand bg-white p-2 shadow-lg z-40 space-y-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-black text-emerald-brand uppercase tracking-wider flex items-center gap-1">
                  <Shield size={12} />
                  Active Administrator
                </p>
                <p className="text-xs font-extrabold text-navy-dark mt-1.5 truncate">{adminName}</p>
                <p className="text-[10px] text-text-muted mt-0.5 truncate">{adminEmail}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-text-dark hover:bg-rose-50 hover:text-rose-600 transition-colors text-left w-full cursor-pointer"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
