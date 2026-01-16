import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    onChange?: (value: string) => void;
}

export default function Select({
    label,
    options,
    placeholder = 'Sélectionner...',
    error,
    onChange,
    value,
    ...props
}: SelectProps) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-semibold text-gray-700">{label}</label>
            )}
            <select
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className={`w-full px-4 py-2.5 bg-white border ${
                    error ? 'border-red-500' : 'border-gray-300'
                } rounded-lg outline-none focus:border-corporate-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-gray-800`}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
        </div>
    );
}
