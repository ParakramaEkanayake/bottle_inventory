/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F2A2E",
        teal: {
          50: "#EAF3F2",
          100: "#CFE6E3",
          400: "#2F7A73",
          500: "#1F5C57",
          600: "#164641",
        },
        amber: {
          400: "#E2A33B",
          500: "#C98420",
        },
        shopgreen: "#2E8B57",
        shopred: "#C0392B",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
