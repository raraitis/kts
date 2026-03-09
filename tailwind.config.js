/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/client/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark panel palette
        'dp-bg':     '#0f1117',
        'dp-panel':  '#161b22',
        'dp-input':  '#0d1117',
        'dp-border': '#30363d',
        'dp-text':   '#e6edf3',
        'dp-muted':  '#8b949e',
        // Accent
        accent: '#58a6ff',
        'accent-hover': '#79b8ff',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
