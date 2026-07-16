import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  bg: string; // Tailwind class, e.g. "bg-[#007BFF]"
  onViewMore?: () => void;
  viewMoreLabel?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  bg,
  onViewMore,
  viewMoreLabel = 'LIHAT DETAIL',
  className = ''
}) => {
  return (
    <div className={`text-white overflow-hidden flex flex-col justify-between rounded shadow-sm ${bg} ${className}`}>
      <div className="p-6 flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/80 font-accent">
            {label}
          </span>
          <div className="text-4xl font-extrabold leading-none">{value}</div>
        </div>
        <div className="p-2.5 bg-white/10 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6 text-white/90" />
        </div>
      </div>
      
      {onViewMore && (
        <button
          onClick={onViewMore}
          className="w-full text-left bg-black/10 py-2 px-6 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest cursor-pointer hover:bg-black/20 transition-colors select-none border-t border-white/5"
        >
          <span>{viewMoreLabel}</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}
    </div>
  );
};
