'use client';

import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { usePathname } from 'next/navigation';

interface AdminLayoutShellProps {
  children: React.ReactNode;
  adminName: string;
}

export default function AdminLayoutShell({ children, adminName }: AdminLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Hide dashboard decorations on login page
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  // Derive dynamic page titles based on routes
  const getPageTitle = () => {
    if (pathname.startsWith('/admin/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/admin/orders/new')) return 'Buat Pesanan Baru';
    if (pathname.match(/^\/admin\/orders\/[a-f0-9-]+$/i) || pathname.match(/^\/admin\/orders\/LDY-[0-9-]+$/)) return 'Detail Pesanan';
    if (pathname.startsWith('/admin/orders')) return 'Daftar Pesanan';
    if (pathname.startsWith('/admin/queue')) return 'Antrean Laundry';
    if (pathname.match(/^\/admin\/customers\/[a-f0-9-]+$/i)) return 'Detail Pelanggan';
    if (pathname.startsWith('/admin/customers')) return 'Pelanggan';
    if (pathname.startsWith('/admin/services')) return 'Daftar Layanan';
    if (pathname.startsWith('/admin/reports')) return 'Laporan Keuangan';
    if (pathname.startsWith('/admin/settings')) return 'Pengaturan Outlet';
    return 'Bilasin Admin';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-light-bg">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <AdminTopbar
          title={getPageTitle()}
          onOpenSidebar={() => setSidebarOpen(true)}
          adminName={adminName}
        />

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
