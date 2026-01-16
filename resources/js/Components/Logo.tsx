import React from 'react';

export const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size]} relative flex items-center`}>
        <svg viewBox="0 0 100 100" className="h-full w-auto fill-corporate-green">
           <path d="M50 85 C50 85, 45 40, 80 20 C60 20, 45 40, 50 55 C50 55, 30 10, 10 35 C30 35, 45 55, 50 85 Z" />
           <path d="M50 85 C50 85, 52 70, 65 65 C55 65, 50 75, 50 85 Z" className="opacity-80" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-corporate-blue font-extrabold text-2xl tracking-tighter leading-none">MyTimesheet</span>
        <span className="text-corporate-green text-[0.6rem] font-bold uppercase tracking-widest leading-none mt-1">Efficiency. Growth.</span>
      </div>
    </div>
  );
};

export default Logo;
