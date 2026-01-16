import React from 'react';

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
}

export default function DataTable<T extends { id: string }>({
    columns,
    data,
    emptyMessage = 'Aucune donnée disponible',
    isLoading = false,
    onRowClick,
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-corporate-blue border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-4">Chargement...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className={`px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick?.(item)}
                            className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                        >
                            {columns.map((col) => (
                                <td
                                    key={String(col.key)}
                                    className={`px-6 py-4 text-sm text-gray-700 ${col.className || ''}`}
                                >
                                    {col.render
                                        ? col.render(item)
                                        : String((item as Record<string, unknown>)[col.key as string] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
