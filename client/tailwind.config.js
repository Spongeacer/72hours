/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 游戏主题色
        'game-bg': '#1a1a1a',
        'game-panel': '#252525',
        'game-border': '#3a3a3a',
        'game-text': '#d4c4a8',
        'game-accent': '#c9b896',
        'game-muted': '#8a7a5a',
        'game-dim': '#6a5a4a',
        'game-error': '#c9a0a0',
        'game-error-bg': '#3a2525',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'SimSun', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
