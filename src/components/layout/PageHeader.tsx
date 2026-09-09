import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevron } from '../common/Icons';

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
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 mb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="flex items-start sm:items-center space-x-2.5">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 mt-0.5 sm:mt-0 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 icon-press border border-zinc-200/60 dark:border-zinc-700/60 shrink-0"
            aria-label="Back"
          >
            <IconChevron direction="left" size={18} />
          </button>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center space-x-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
};
