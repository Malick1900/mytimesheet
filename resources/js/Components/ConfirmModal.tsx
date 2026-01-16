import { ReactNode } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger' | 'success';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmation',
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'default',
    isLoading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        default: {
            icon: '❓',
            iconBg: 'bg-blue-100',
            iconColor: 'text-corporate-blue',
            buttonBg: 'bg-corporate-blue hover:bg-blue-700',
        },
        danger: {
            icon: '⚠️',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
        },
        success: {
            icon: '✓',
            iconBg: 'bg-green-100',
            iconColor: 'text-corporate-green',
            buttonBg: 'bg-corporate-green hover:bg-green-700',
        },
    };

    const style = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div 
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-4">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full ${style.iconBg} ${style.iconColor} flex items-center justify-center text-2xl flex-shrink-0`}>
                                {style.icon}
                            </div>
                            <div className="flex-1 pt-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {title}
                                </h3>
                                <div className="mt-2 text-sm text-gray-600">
                                    {message}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2.5 ${style.buttonBg} text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Chargement...
                                </>
                            ) : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
