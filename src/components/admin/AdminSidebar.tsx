'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  ListOrdered,
  Users,
  WashingMachine,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import AppLogo from '../ui/AppLogo';
import { logoutAction } from '@/actions/auth';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'Create Order', href: '/admin/orders/new', icon: PlusCircle },
    { name: 'Queue', href: '/admin/queue', icon: ListOrdered },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Services', href: '/admin/services', icon: WashingMachine },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border-brand bg-navy-dark text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:h-screen`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center">
            <AppLogo lightText={true} iconSize={24} textSize="text-xl" />
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' &&
                item.href !== '/admin/orders' &&
                pathname.startsWith(item.href)) ||
              (item.href === '/admin/orders' &&
                pathname.startsWith('/admin/orders') &&
                pathname !== '/admin/orders/new');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-brand text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="border-t border-slate-800 p-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-rose-400 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
