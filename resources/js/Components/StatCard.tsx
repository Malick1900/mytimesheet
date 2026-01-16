import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    delta?: string;
    color?: 'green' | 'yellow' | 'blue' | 'red' | 'gray';
    icon?: string;
}

const colorClasses = {
    green: 'border-l-corporate-green',
    yellow: 'border-l-yellow-400',
    blue: 'border-l-corporate-blue',
    red: 'border-l-red-500',
    gray: 'border-l-gray-400',
};

export default function StatCard({ label, value, delta, color = 'blue', icon }: StatCardProps) {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${colorClasses[color]}`}>
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                {icon && <span className="text-2xl opacity-50">{icon}</span>}
            </div>
            <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{value}</span>
                {delta && <span className="text-xs font-bold text-gray-400 mb-1">{delta}</span>}
            </div>
        </div>
    );
}
