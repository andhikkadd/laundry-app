'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createService, updateService, toggleServiceStatus, deleteService } from '@/actions/services';
import { updateMachineCapacity } from '@/actions/settings';
import { formatPrice } from '@/lib/format';
import { Plus, Edit2, Trash2, Loader2, WashingMachine, Check, Sparkles } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  slug: string;
  pricePerKg: number;
  baseDurationMinutes: number;
  durationPerKgMinutes: number;
  isExpress: boolean;
  isActive: boolean;
  unit: string;
}

interface ServicesDashboardProps {
  initialServices: Service[];
  settings: Record<string, string>;
  occupiedMachines: number[];
}

export default function ServicesDashboard({
  initialServices,
  settings,
  occupiedMachines = [],
}: ServicesDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [pricePerKg, setPricePerKg] = useState<number | ''>('');
  const [baseDurationMinutes, setBaseDurationMinutes] = useState<number | ''>('');
  const [durationPerKgMinutes, setDurationPerKgMinutes] = useState<number | ''>('');
  const [isExpress, setIsExpress] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [unit, setUnit] = useState('KG');

  const maxMachines = parseInt(settings.max_parallel_orders || '3', 10);

  const handleOpenCreate = () => {
    setError(null);
    setSuccess(null);
    setEditingService(null);
    setName('');
    setSlug('');
    setPricePerKg('');
    setBaseDurationMinutes('');
    setDurationPerKgMinutes('');
    setIsExpress(false);
    setIsActive(true);
    setUnit('KG');
    setShowModal(true);
  };

  const handleOpenEdit = (service: Service) => {
    setError(null);
    setSuccess(null);
    setEditingService(service);
    setName(service.name);
    setSlug(service.slug);
    setPricePerKg(service.pricePerKg);
    setBaseDurationMinutes(service.baseDurationMinutes);
    setDurationPerKgMinutes(service.durationPerKgMinutes);
    setIsExpress(service.isExpress);
    setIsActive(service.isActive);
    setUnit(service.unit || 'KG');
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingService) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleUpdateCapacity = (newCapacity: number) => {
    if (newCapacity < 1) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await updateMachineCapacity(newCapacity);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(`Kapasitas mesin cuci berhasil diubah menjadi ${newCapacity} unit!`);
        router.refresh();
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const price = Number(pricePerKg);
    const baseDuration = Number(baseDurationMinutes);
    const durationPerKg = Number(durationPerKgMinutes);

    if (price < 0 || baseDuration < 1 || durationPerKg < 0) {
      setError('Masukkan nilai parameter dengan benar.');
      return;
    }

    const payload = {
      name,
      slug,
      pricePerKg: price,
      baseDurationMinutes: baseDuration,
      durationPerKgMinutes: durationPerKg,
      isExpress,
      isActive,
      unit,
    };

    startTransition(async () => {
      let res;
      if (editingService) {
        res = await updateService(editingService.id, payload);
      } else {
        res = await createService(payload);
      }

      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(editingService ? 'Layanan berhasil diperbarui!' : 'Layanan baru ditambahkan!');
        setShowModal(false);
        router.refresh();
      }
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await toggleServiceStatus(id, !currentStatus);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess('Status layanan berhasil diperbarui!');
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus layanan ini?')) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await deleteService(id);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(res.message || 'Layanan dihapus.');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Washing Machines Overview Card */}
      <div className="rounded-2xl border border-border-brand bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider flex items-center gap-2">
              <WashingMachine className="text-emerald-brand h-5 w-5" />
              Kelola & Status Mesin Cuci
            </h3>
            <p className="text-[11px] text-text-muted mt-1">
              Atur jumlah total mesin cuci aktif dan pantau mesin yang sedang memproses antrean laundry.
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-light-bg rounded-xl border border-border-brand px-3 py-1.5 self-start sm:self-center">
            <span className="text-xs font-semibold text-text-dark">Kapasitas Mesin:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdateCapacity(maxMachines - 1)}
                disabled={maxMachines <= 1 || isPending}
                className="w-7 h-7 rounded-lg bg-white border border-border-brand flex items-center justify-center font-bold text-text-dark hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer text-xs"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-bold text-navy-dark select-none">{maxMachines}</span>
              <button
                type="button"
                onClick={() => handleUpdateCapacity(maxMachines + 1)}
                disabled={isPending}
                className="w-7 h-7 rounded-lg bg-white border border-border-brand flex items-center justify-center font-bold text-text-dark hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Machines Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 pt-2">
          {Array.from({ length: maxMachines }).map((_, index) => {
            const machineNum = index + 1;
            const isOccupied = occupiedMachines.includes(machineNum);
            return (
              <div
                key={machineNum}
                className={`relative rounded-xl p-4 border flex flex-col items-center justify-center text-center space-y-2 transition-all duration-300 ${
                  isOccupied
                    ? 'bg-amber-50/50 border-amber-200/60 shadow-xs'
                    : 'bg-emerald-50/20 border-emerald-100/60 hover:bg-emerald-50/30'
                }`}
              >
                <div className={`p-2 rounded-full ${isOccupied ? 'bg-amber-100/60' : 'bg-emerald-100/50'}`}>
                  <WashingMachine
                    className={`h-6 w-6 ${
                      isOccupied ? 'text-amber-600 animate-pulse' : 'text-emerald-600'
                    }`}
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-navy-dark">Mesin {machineNum}</p>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isOccupied 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${isOccupied ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {isOccupied ? 'Sibuk' : 'Tersedia'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Banner / Trigger button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border-brand shadow-xs">
        <p className="text-xs text-text-muted">
          Kelola harga, durasi pengerjaan dasar, serta tipe satuan dan status aktif paket laundry.
        </p>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-brand px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
        >
          <Plus size={14} />
          Tambah Layanan
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-rose-250 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {/* Services Table */}
      <div className="rounded-xl border border-border-brand bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-brand bg-light-bg text-text-muted font-bold">
                <th className="p-4">NAMA LAYANAN</th>
                <th className="p-4">KODE / SLUG</th>
                <th className="p-4">TIPE SATUAN</th>
                <th className="p-4">HARGA / SATUAN</th>
                <th className="p-4">DURASI DASAR</th>
                <th className="p-4">ESTIMASI TAMBAHAN</th>
                <th className="p-4 text-center">TIPE EXPRESS</th>
                <th className="p-4 text-center">STATUS AKTIF</th>
                <th className="p-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {initialServices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-text-muted">
                    Belum ada layanan laundry terdaftar.
                  </td>
                </tr>
              ) : (
                initialServices.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border-brand hover:bg-light-bg transition-colors"
                  >
                    <td className="p-4 font-bold text-navy-dark">{s.name}</td>
                    <td className="p-4 font-mono text-text-muted">{s.slug}</td>
                    <td className="p-4 font-bold text-text-dark">{s.unit || 'KG'}</td>
                    <td className="p-4 font-extrabold text-navy-dark">
                      {formatPrice(s.pricePerKg)} / {(s.unit || 'KG').toLowerCase()}
                    </td>
                    <td className="p-4 font-semibold text-text-dark">{s.baseDurationMinutes} menit</td>
                    <td className="p-4 font-semibold text-text-dark">
                      +{s.durationPerKgMinutes} menit / {(s.unit || 'KG').toLowerCase()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.isExpress 
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {s.isExpress ? 'Express' : 'Regular'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(s.id, s.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer hover:opacity-80 transition-all ${
                          s.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                            : 'bg-rose-50 text-rose-700 border-rose-250'
                        }`}
                      >
                        {s.isActive ? 'Aktif' : 'Non-Aktif'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-text-muted hover:text-navy-dark rounded-md hover:bg-light-bg transition-colors"
                          title="Ubah Layanan"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-light-bg transition-colors"
                          title="Hapus Layanan"
                        >
                          <Trash2 size={13} />
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

      {/* Edit / Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-border-brand space-y-4">
            <h3 className="text-sm font-bold text-navy-dark uppercase tracking-wider border-b border-border-brand pb-2">
              {editingService ? 'Ubah Layanan Laundry' : 'Tambah Layanan Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-text-dark mb-1">NAMA LAYANAN</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Setrika Regular, Cuci Kering Express"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:outline-hidden"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-text-dark mb-1">SLUG / KODE</label>
                <input
                  type="text"
                  required
                  placeholder="contoh-slug-layanan"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs font-mono text-text-dark focus:outline-hidden"
                />
              </div>

              {/* Unit Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-text-dark mb-1">SATUAN TARIF</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs font-semibold text-text-dark focus:outline-hidden"
                >
                  <option value="KG">Kiloan (KG)</option>
                  <option value="ITEM">Satuan (ITEM / PCS)</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-text-dark mb-1">
                  HARGA PER {unit === 'KG' ? 'KG' : 'ITEM'} (RP)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="7000"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs font-bold text-text-dark focus:outline-hidden"
                />
              </div>

              {/* Durations */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">DURASI DASAR (MENIT)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="120"
                    value={baseDurationMinutes}
                    onChange={(e) => setBaseDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    DURASI / {unit === 'KG' ? 'KG' : 'ITEM'} (+MENIT)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="30"
                    value={durationPerKgMinutes}
                    onChange={(e) => setDurationPerKgMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                    className="block w-full rounded-xl border border-border-brand bg-light-bg py-2 px-3 text-xs text-text-dark focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Express type / Active */}
              <div className="flex gap-4 items-center pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-text-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isExpress}
                    onChange={(e) => setIsExpress(e.target.checked)}
                    className="h-4 w-4 rounded border-border-brand text-emerald-brand focus:ring-emerald-brand"
                  />
                  Layanan Express
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-text-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-border-brand text-emerald-brand focus:ring-emerald-brand"
                  />
                  Aktifkan Layanan
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-border-brand py-2 text-xs font-bold text-text-muted hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-emerald-brand py-2 text-xs font-bold text-white hover:bg-emerald-600 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 size={13} className="animate-spin" />}
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
