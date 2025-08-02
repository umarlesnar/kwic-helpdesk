import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        icon: {
          DEFAULT: "#768683",
        //   brand: `var(--color-primary)`,
          brand: `#4AC959`,
          primary: "#3C524E",
          onLight: "#FFFFFF",
          secondary: "#768683",
          teritary: "#C0C7C6",
        },
        surface: {
        //   dark: `var(--color-dark)`,
        //   light: `var(--color-light)`,
          dark: "#143518",
          light: "#FFFFFF",
        },
        input: "#D5D5D5",
        ring: "#4ac959",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
        //   "50": `var(--color-primary-50)`,
        //   "100": `var(--color-primary-100)`,
        //   "200": `var(--color-primary-200)`,
        //   "300": `var(--color-primary-300)`,
        //   "400":` var(--color-primary-400)`,
        //   "500":` var(--color-primary-500)`,
        //   "600": `var(--color-primary-600)`,
        //   "700": `var(--color-primary-700)`,
        //   "800": `var(--color-primary-800)`,
        //   "900": `var(--color-primary-900)`,
        //   DEFAULT: `var(--color-primary)`,
          "50": "#EDFAEE",
          "100": "#C7EECC",
          "200": "#ACE6B3",
          "300": "#86DB90",
          "400": "#6ED47A",
          "500": "#4AC959",
          "600": "#43B751",
          "700": "#358F3F",
          "800": "#296F31",
          "900": "#1F5425",
          DEFAULT: "#43B751",
          foreground: "hsl(var(--primary-foreground))",
        },

        
        neutral: {
          "10": "#FAFBFA",
          "20": "#F5F6F6",
          "30": "#EBEDED",
          "40": "#DEE2E1",
          "50": "#C0C7C6",
          "60": "#B1B9B8",
          "70": "#A4AEAC",
          "80": "#95A19E",
          "90": "#869391",
          "100": "#768683",
          "200": "#677875",
          "300": "#586B67",
          "400": "#4B5F5C",
          "500": "#3C524E",
          "600": "#304742",
          "700": "#1E3732",
          "800": "#0F2925",
          "900": "#021E19",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          blue_100: "#DEEDFF",
          orange: "#FFE3D3",
          yellow: "#FFFACA",
          green: "#EAFFF7",
          blue: "#E7F6FF",
          purple: "#EEE5FF",
          pink: "#FFE8EC",
          green_2: "#DEF5DE",
          green_active: "#D1FAE5",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        text: {
          primary: "#304742",
          secondary: "#586B67",
          teritary: "#768683",
          brand: `var(--color-primary)`,
          onDark: "#021E19",
          onLight: "#FFFFFF",
        },
        border: {
		
          primary: "#d1d5db",
          secondary: "#d1d5db",
          teritary: "#DEE2E1",
          input: "#D1D5DB",
          onDark: "#1B4A21",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;