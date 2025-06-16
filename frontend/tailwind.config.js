module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          blue: "var(--primary-blue)",
          'blue-hover': "var(--primary-blue-hover)",
          'blue-light': "var(--primary-blue-light)",
          'blue-dark': "var(--primary-blue-dark)",
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
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};