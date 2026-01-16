import React from 'react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function Drawer({ isOpen, onClose, title, subtitle, children, footer }: DrawerProps) {
    if (!isOpen) return null;

    return (
        <div className="w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-gray-800 text-lg">{title}</h4>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                    ×
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {children}
            </div>

            {footer && (
                <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                    {footer}
                </div>
            )}
        </div>
    );
}
