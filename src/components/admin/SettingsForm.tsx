'use client';

import React, { useState, useTransition } from 'react';
import { updateSettings } from '@/actions/settings';
import { createStaffAccount, deleteStaffAccount, updateStaffPassword } from '@/actions/users';
import { useToast } from '@/components/ui/Toast';
import { 
  Settings, 
  Users, 
  Loader2, 
  Save, 
  Plus, 
  RotateCcw, 
  Trash2, 
  ShieldAlert, 
  Calendar,
  X,
  Lock,
  UserCheck
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface SettingsFormProps {
  initialSettings: Record<string, string>;
  initialStaff: StaffMember[];
}

export default function SettingsForm({ initialSettings, initialStaff }: SettingsFormProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'outlet' | 'staff'>('outlet');
  const [staffs, setStaffs] = useState<StaffMember[]>(initialStaff);

  // Tab 1 Form Fields State
  const [outletName, setOutletName] = useState(initialSettings.outlet_name || '');
  const [outletPhone, setOutletPhone] = useState(initialSettings.outlet_phone || '');
  const [outletAddress, setOutletAddress] = useState(initialSettings.outlet_address || '');
  const [openingHour, setOpeningHour] = useState(initialSettings.opening_hour || '08:00');
  const [closingHour, setClosingHour] = useState(initialSettings.closing_hour || '20:00');
  const [maxParallelOrders, setMaxParallelOrders] = useState(initialSettings.max_parallel_orders || '3');
  const [receiptFooter, setReceiptFooter] = useState(initialSettings.receipt_footer || '');

  // Tab 2 Staff Account Form Fields State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');

  // Password Update Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Handle Tab 1 Outlet Settings Submit
  const handleOutletSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      outlet_name: outletName,
      outlet_phone: outletPhone,
      outlet_address: outletAddress,
      opening_hour: openingHour,
      closing_hour: closingHour,
      max_parallel_orders: maxParallelOrders,
      receipt_footer: receiptFooter,
    };

    startTransition(async () => {
      const res = await updateSettings(payload);
      if (res?.error) {
        showToast(res.error, 'error');
      } else if (res?.success) {
        showToast('Pengaturan outlet berhasil disimpan!', 'success');
      }
    });
  };

  // Handle Tab 2 Add Staff Submit
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail || !newStaffPassword) {
      showToast('Mohon lengkapi seluruh formulir staff', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', newStaffName);
    formData.append('email', newStaffEmail);
    formData.append('password', newStaffPassword);

    startTransition(async () => {
      const res = await createStaffAccount(formData);
      if (res?.error) {
        showToast(res.error, 'error');
      } else if (res?.success) {
        showToast(`Akun staff "${newStaffName}" berhasil dibuat!`, 'success');
        
        // Dynamic state update
        const newMember: StaffMember = {
          id: Math.random().toString(), // Temp ID, will match DB on next load
          name: newStaffName,
          email: newStaffEmail,
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
        };
        setStaffs([newMember, ...staffs]);

        // Reset fields
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPassword('');
        setIsCreateOpen(false);
      }
    });
  };

  // Handle Tab 2 Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !resetPasswordVal) return;

    startTransition(async () => {
      const res = await updateStaffPassword(selectedStaffId, resetPasswordVal);
      if (res?.error) {
        showToast(res.error, 'error');
      } else if (res?.success) {
        showToast(`Password untuk staff "${selectedStaffName}" berhasil disetel ulang!`, 'success');
        setResetPasswordVal('');
        setIsPasswordModalOpen(false);
      }
    });
  };

  // Handle Tab 2 Delete Staff
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun staff "${name}"?\nTindakan ini permanen namun seluruh log proses kerjanya akan tetap tercatat secara abadi.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteStaffAccount(id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else if (res?.success) {
        showToast(`Akun staff "${name}" berhasil dihapus dari sistem!`, 'success');
        setStaffs(staffs.filter((s) => s.id !== id));
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Tab Navigation Bar */}
      <div className="flex border-b border-border-brand/80 pb-0.5 no-print gap-2">
        <button
          onClick={() => setActiveTab('outlet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'outlet'
              ? 'bg-white border border-border-brand border-b-white text-navy-dark shadow-2xs'
              : 'text-text-muted hover:text-navy-dark hover:bg-slate-50'
          }`}
        >
          <Settings size={14} className={activeTab === 'outlet' ? 'text-emerald-brand' : ''} />
          Pengaturan Outlet
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'staff'
              ? 'bg-white border border-border-brand border-b-white text-navy-dark shadow-2xs'
              : 'text-text-muted hover:text-navy-dark hover:bg-slate-50'
          }`}
        >
          <Users size={14} className={activeTab === 'staff' ? 'text-emerald-brand animate-pulse' : ''} />
          Manajemen Karyawan / Staff
        </button>
      </div>

      {/* Tab 1: Outlet Identity Form */}
      {activeTab === 'outlet' && (
        <form onSubmit={handleOutletSubmit} className="grid gap-6 md:grid-cols-3">
          {/* Form Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Identity Outlet Card */}
            <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2 flex items-center gap-2">
                <Settings size={14} className="text-emerald-brand" />
                Identitas Outlet
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="outlet_name" className="block text-xs font-bold text-text-dark mb-1">
                    Nama Outlet <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="outlet_name"
                    required
                    value={outletName}
                    onChange={(e) => setOutletName(e.target.value)}
                    placeholder="Bilasin Laundry"
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="outlet_phone" className="block text-xs font-bold text-text-dark mb-1">
                    No. Telepon Outlet <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="outlet_phone"
                    required
                    value={outletPhone}
                    onChange={(e) => setOutletPhone(e.target.value)}
                    placeholder="08123456789"
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="outlet_address" className="block text-xs font-bold text-text-dark mb-1">
                    Alamat Lengkap Outlet <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="outlet_address"
                    required
                    rows={3}
                    value={outletAddress}
                    onChange={(e) => setOutletAddress(e.target.value)}
                    placeholder="Jalan Kebon Jeruk No. 12, Jakarta Barat"
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Operating Schedule / Limit Settings */}
            <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
                Jam Operasional & Kapasitas
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="opening_hour" className="block text-xs font-bold text-text-dark mb-1">
                    Jam Buka <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="opening_hour"
                    required
                    value={openingHour}
                    onChange={(e) => setOpeningHour(e.target.value)}
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="closing_hour" className="block text-xs font-bold text-text-dark mb-1">
                    Jam Tutup <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="closing_hour"
                    required
                    value={closingHour}
                    onChange={(e) => setClosingHour(e.target.value)}
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label htmlFor="max_parallel_orders" className="block text-xs font-bold text-text-dark mb-1">
                    Jumlah Mesin Cuci (Kapasitas) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="max_parallel_orders"
                    required
                    min="1"
                    value={maxParallelOrders}
                    onChange={(e) => setMaxParallelOrders(e.target.value)}
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Settings */}
            <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
                Pengaturan Nota Belanja
              </h3>

              <div>
                <label htmlFor="receipt_footer" className="block text-xs font-bold text-text-dark mb-1">
                  Pesan Footer Struk <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="receipt_footer"
                  required
                  rows={2}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Terima kasih telah mempercayakan pakaian Anda kepada kami."
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2.5 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                />
              </div>
            </div>

          </div>

          {/* Action sidebar (Right) */}
          <div>
            <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4 sticky top-6">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider">Simpan</h3>
              <p className="text-[11px] text-text-muted leading-relaxed font-medium">
                Menyimpan pengaturan di sini akan langsung mengubah info struk cetak, jam operasional, dan kapasitas pembagian estimasi antrean order.
              </p>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-brand py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Staff / Karyawan Management */}
      {activeTab === 'staff' && (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Staff List Table (Left) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-border-brand bg-white shadow-xs overflow-hidden">
              <div className="p-5 border-b border-border-brand flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider">
                    Daftar Staff Aktif ({staffs.length})
                  </h3>
                  <p className="text-[10px] text-text-muted mt-1 font-medium">
                    Karyawan yang terdaftar dapat masuk ke sistem menggunakan email masing-masing.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(!isCreateOpen)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-brand hover:text-emerald-600 border border-emerald-250 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={12} />
                  Tambah Staff
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-brand bg-slate-50 text-text-muted font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-4">Staff / Akun</th>
                      <th className="p-4">Hak Akses</th>
                      <th className="p-4">Tanggal Gabung</th>
                      <th className="p-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-text-muted font-semibold">
                          Belum ada staff terdaftar.
                        </td>
                      </tr>
                    ) : (
                      staffs.map((staff) => (
                        <tr
                          key={staff.id}
                          className="border-b border-border-brand hover:bg-light-bg/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-extrabold text-navy-dark text-xs">{staff.name}</div>
                            <div className="text-[10px] text-text-muted font-medium mt-0.5">{staff.email}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[9px] font-black border border-slate-200">
                              <UserCheck size={9} />
                              {staff.role}
                            </span>
                          </td>
                          <td className="p-4 text-text-muted font-medium flex items-center gap-1.5 mt-2">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(staff.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex gap-1.5 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedStaffId(staff.id);
                                  setSelectedStaffName(staff.name);
                                  setIsPasswordModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-navy-dark hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Reset Password Staff"
                              >
                                <RotateCcw size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                className="inline-flex items-center justify-center p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Staff"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Staff Form Card (Collapsible) */}
            {isCreateOpen && (
              <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-border-brand pb-2">
                  <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-brand" />
                    Tambah Akun Staff Baru
                  </h3>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="text-text-muted hover:text-rose-600 transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddStaffSubmit} className="grid gap-4 sm:grid-cols-3 items-end">
                  <div>
                    <label htmlFor="staff_name" className="block text-[11px] font-bold text-text-dark mb-1.5">
                      Nama Lengkap Staff
                    </label>
                    <input
                      type="text"
                      id="staff_name"
                      required
                      placeholder="Staff Alpha"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="staff_email" className="block text-[11px] font-bold text-text-dark mb-1.5">
                      Email Karyawan
                    </label>
                    <input
                      type="email"
                      id="staff_email"
                      required
                      placeholder="alpha@bilasin.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="staff_pass" className="block text-[11px] font-bold text-text-dark mb-1.5">
                      Kata Sandi Awal
                    </label>
                    <input
                      type="password"
                      id="staff_pass"
                      required
                      placeholder="••••"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end gap-2.5 border-t border-border-brand pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-5 py-2 rounded-xl bg-emerald-brand text-xs font-bold text-white shadow-xs hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {isPending && <Loader2 size={12} className="animate-spin" />}
                      Daftarkan Staff
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Audit Logging Info Card (Right) */}
          <div>
            <div className="rounded-xl border border-border-brand bg-white p-6 shadow-xs space-y-4 sticky top-6">
              <h3 className="text-xs font-bold text-navy-dark uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-indigo-600" />
                Akuntabilitas & Log
              </h3>
              <p className="text-[11px] text-text-muted leading-relaxed font-medium">
                Sistem **Bilasin** mencatat setiap tindakan perubahan status cucian berdasarkan nama staff/admin aktif.
              </p>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-[10px] text-slate-500 font-semibold space-y-2">
                <p className="text-navy-dark font-black flex items-center gap-1">
                  💡 Informasi Log Audit:
                </p>
                <p>
                  Jika seorang karyawan resign dan akun mereka dihapus, riwayat log pengerjaan cucian lama **tidak akan hilang** dan tetap menampilkan nama mereka secara abadi demi keamanan audit toko.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Password Reset Modal Dialog */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-border-brand shadow-2xl max-w-sm w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-border-brand pb-2">
              <h3 className="text-xs font-extrabold text-navy-dark uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} className="text-indigo-600" />
                Reset Kata Sandi Staff
              </h3>
              <button
                onClick={() => {
                  setResetPasswordVal('');
                  setIsPasswordModalOpen(false);
                }}
                className="text-text-muted hover:text-rose-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                  Mengubah kata sandi untuk akun karyawan:  
                  <strong className="text-navy-dark block mt-0.5 text-xs">{selectedStaffName}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="reset_pass" className="block text-[11px] font-bold text-text-dark mb-1">
                  Masukkan Sandi Baru
                </label>
                <input
                  type="password"
                  id="reset_pass"
                  required
                  placeholder="••••••••"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:border-emerald-brand focus:bg-white focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border-brand pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordVal('');
                    setIsPasswordModalOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {isPending && <Loader2 size={12} className="animate-spin" />}
                  Ubah Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
