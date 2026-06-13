/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        valorant: {
          red: "#ff4655",
          deep: "#08090d",
          panel: "#11141b",
          border: "#262b36",
          text: "#f7f7f7",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(255, 70, 85, 0.16)",
      },
    },
  },
  plugins: [],
};
