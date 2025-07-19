const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
    theme: {
    extend: {
      screens: {
        's256': '256px',
        's288': '288px',
        's384': '384px',
        's448': '448px',
        's576': '576px',
        'md':  '768px',   // you already have these by default if you like
        'lg':  '1024px',
        'xl':  '1280px',
      }
    }
  }
};
export default config;