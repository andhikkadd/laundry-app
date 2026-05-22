export function formatPrice(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}.${minutes}`;
}

export function getRemainingTimeText(estimatedEndAt: Date | string | null | undefined, status: string): string {
  if (!estimatedEndAt) return '-';
  if (status === 'READY') return 'Ready to Pick Up';
  if (status === 'PICKED_UP') return 'Picked Up';
  if (status === 'CANCELLED') return 'Cancelled';

  const end = typeof estimatedEndAt === 'string' ? new Date(estimatedEndAt) : estimatedEndAt;
  const now = new Date();
  
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Almost done (expected soon)';

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
}
