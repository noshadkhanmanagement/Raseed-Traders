/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          bg: '#FFFFFF',
          'dark-bg': '#000000',
          card: '#FFFFFF',
          'dark-card': '#111111',
          border: '#E5E7EB',
          'dark-border': '#262626',
          text: '#000000',
          'dark-text': '#FFFFFF',
          secondary: '#71717A',
          'dark-secondary': '#A1A1AA',
          muted: '#A1A1AA',
          'dark-muted': '#52525B',
          primary: '#000000',
          'dark-primary': '#FFFFFF',
          danger: '#DC2626',
          success: '#16A34A',
          warning: '#D97706',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro"',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'SFMono-Regular',
          'ui-monospace',
          'monospace',
        ],
      },
      boxShadow: {
        'ios-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'ios': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'ios-md': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'ios-sheet': '0 -4px 24px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'ios-sm': '8px',
        'ios': '12px',
        'ios-md': '14px',
        'ios-lg': '16px',
        'ios-sheet': '20px',
      },
    },
  },
  plugins: [],
}
