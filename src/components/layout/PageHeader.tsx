import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  actions,
}) => {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center space-x-2.5">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 icon-press"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-lg md:text-xl font-bold text-black dark:text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {actions && (
        <div className="flex items-center space-x-2 mt-1 md:mt-0 flex-wrap">
          {actions}
        </div>
      )}
    </header>
  );
};
