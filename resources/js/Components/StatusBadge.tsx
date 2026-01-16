import React from 'react';
import { TimeEntryStatus } from '@/types';

interface StatusBadgeProps {
    status: TimeEntryStatus;
    size?: 'sm' | 'md';
}

const statusConfig: Record<TimeEntryStatus, { label: string; className: string }> = {
    DRAFT: {
        label: 'Brouillon',
        className: 'bg-gray-100 text-gray-600',
    },
    SUBMITTED: {
        label: 'Soumis',
        className: 'bg-yellow-100 text-yellow-700',
    },
    APPROVED: {
        label: 'Validé',
        className: 'bg-green-100 text-green-700',
    },
    REJECTED: {
        label: 'Rejeté',
        className: 'bg-red-100 text-red-700',
    },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const config = statusConfig[status];
    const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

    return (
        <span className={`inline-flex items-center font-bold rounded-full ${sizeClass} ${config.className}`}>
            {config.label}
        </span>
    );
}
