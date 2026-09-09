import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
}

// 1. Navigation Icons (Unique, iOS SF-Style)
export const NavHome: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 10.2L12 3l9 7.2V20a1.8 1.8 0 0 1-1.8 1.8H4.8A1.8 1.8 0 0 1 3 20v-9.8z" />
    <path d="M9.5 21v-7a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v7" />
  </svg>
);

export const NavBuy: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4.5 9h15l-1.5 11.5a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5L4.5 9z" />
    <path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3" />
    <path d="M12 13v4m-2-2l2 2 2-2" />
  </svg>
);

export const NavStock: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 2.5L3.5 7 12 11.5 20.5 7 12 2.5z" />
    <path d="M3.5 12L12 16.5 20.5 12" />
    <path d="M3.5 17L12 21.5 20.5 17" />
  </svg>
);

export const NavSell: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3.5 19.5h17" />
    <path d="M6 15l5-5 3.5 3.5L20.5 7" />
    <path d="M16 7h4.5v4.5" />
  </svg>
);

export const NavAnalytics: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3.5" y="13" width="4" height="7.5" rx="1.5" />
    <rect x="10" y="8" width="4" height="12.5" rx="1.5" />
    <rect x="16.5" y="3.5" width="4" height="17" rx="1.5" />
  </svg>
);

export const NavSettings: React.FC<IconProps> = ({ size = 20, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// 2. Action & Utility Icons
export const IconAdjust: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2.5" />
    <circle cx="8" cy="17" r="2.5" />
  </svg>
);

export const IconDelete: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3.5 6h17" />
    <path d="M8.5 6V4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6m4-6v6" />
  </svg>
);

export const IconReset: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3.5 12a8.5 8.5 0 1 1 2.5 6L2 22" />
    <path d="M3.5 6.5V12H9" />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 4.5v15M4.5 12h15" />
  </svg>
);

export const IconHistory: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20.5 20.5l-4.2-4.2" />
  </svg>
);

export const IconAlert: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M10.3 3.6a2 2 0 0 1 3.4 0l8.1 14.2a2 2 0 0 1-1.7 3H3.9a2 2 0 0 1-1.7-3l8.1-14.2z" />
    <path d="M12 9v4m0 4h.01" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12l2.5 2.5 5-5" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, className, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const IconChevron: React.FC<IconProps & { direction?: 'left' | 'right' | 'up' | 'down' }> = ({
  size = 18,
  strokeWidth = 2,
  direction = 'right',
  className,
  ...props
}) => {
  const rotation = {
    left: 'rotate-180',
    right: '',
    up: '-rotate-90',
    down: 'rotate-90',
  }[direction];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${rotation} ${className || ''}`}
      {...props}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
};
