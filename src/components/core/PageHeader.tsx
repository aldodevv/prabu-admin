import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex justify-between items-start gap-4 mb-6 max-sm:flex-col max-sm:items-stretch">
      <div className="space-y-1">
        <h2 className="text-3xl font-heading text-slate-800 uppercase tracking-tight">{title}</h2>
        {description && (
          <p className="text-slate-500 text-xs uppercase tracking-widest font-accent font-semibold">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
