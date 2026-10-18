import type { Config } from "tailwindcss";

// Every colour is a CSS variable (see src/app/globals.css), so light and dark mode
// switch by changing the variables, never the components.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        sunken: token("sunken"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        accent: token("accent"),
        "accent-ink": token("accent-ink"),
        "accent-soft": token("accent-soft"),
        signal: token("signal"),
        good: token("good"),
        warn: token("warn"),
        bad: token("bad"),
        "bad-ink": token("bad-ink"),
      },
      fontFamily: {
        sans: ['"Public Sans Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
