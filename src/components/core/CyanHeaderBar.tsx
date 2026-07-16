import React from 'react';

interface CyanHeaderBarProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CyanHeaderBar: React.FC<CyanHeaderBarProps> = ({ title, icon, action, className = '' }) => {
  return (
    <div 
      className={`bg-[#17A2B8] px-5 py-3 text-white font-bold select-none flex items-center justify-between no-print rounded-t ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm uppercase tracking-wider font-heading">{title}</span>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
