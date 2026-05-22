import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-brand bg-white p-12 text-center shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-light-bg text-text-muted mb-4">
        {icon || <Inbox size={24} />}
      </div>
      <h3 className="text-lg font-semibold text-text-dark">{title}</h3>
      <p className="mt-1 text-sm text-text-muted max-w-xs">{description}</p>
    </div>
  );
}
