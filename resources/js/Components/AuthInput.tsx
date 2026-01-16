import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, error, icon, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-corporate-blue transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg outline-none focus:border-corporate-blue focus:ring-4 focus:ring-blue-50/50 transition-all text-gray-800 placeholder:text-gray-400`}
        />
      </div>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};

export default AuthInput;
