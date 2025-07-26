module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          emerald: "var(--primary-blue)",
          'emerald-hover': "var(--primary-blue-hover)",
          'emerald-light': "var(--primary-blue-light)",
          'emerald-dark': "var(--primary-blue-dark)",
        },
        gray: {
          'custom-50': "var(--gray-50)",
          'custom-100': "var(--gray-100)",
          'custom-200': "var(--gray-200)",
          'custom-600': "var(--gray-600)",
          'custom-900': "var(--gray-900)",
        },
        background: {
          primary: "var(--background-primary)",
          secondary: "var(--background-secondary)",
          tertiary: "var(--background-tertiary)",
        },
        text: {
          'primary-custom': "var(--text-primary)",
          'secondary-custom': "var(--text-secondary)",
          'white-custom': "var(--text-white)",
        },
        border: {
          'primary-custom': "var(--border-primary)",
          'secondary-custom': "var(--border-secondary)",
        },
        tropical: {
          emerald: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          teal: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
          },
          cyan: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
          }
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};