import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap sm:flex-nowrap">
      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading text-slate-800 uppercase tracking-tight leading-tight">{title}</h2>
        {description && (
          <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-widest font-accent font-semibold leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
