import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// DESIGN.md — Cinematic Track
  			'canvas-night': '#000000',
  			'canvas-night-elevated': '#0a0a0a',
  			'surface-elevated-dark': '#1e2c31',
  			// DESIGN.md — Transactional Track
  			'canvas-cream': '#fbfbf5',
  			'canvas-light': '#ffffff',
  			// DESIGN.md — Brand Accents (light track only)
  			'aloe-10': '#c1fbd4',
  			'pistachio-10': '#d4f9e0',
  			// DESIGN.md — Shade Ladder
  			'shade-30': '#d4d4d8',
  			'shade-40': '#a1a1aa',
  			'shade-50': '#71717a',
  			'shade-60': '#52525b',
  			'shade-70': '#3f3f46',
  			// DESIGN.md — Hairlines
  			'hairline-light': '#e4e4e7',
  			'hairline-dark': '#1e2c31',
  			// DESIGN.md — Link tones (dark track)
  			'link-cool-1': '#9dabad',
  			'link-cool-2': '#9797a2',
  			'link-cool-3': '#bdbdca',
  			'link-mint': '#99b3ad',
  			// Base
  			'ink': '#000000',
  		},
  		fontFamily: {
  			display: [
  				'var(--font-inter-display)',
  				'Helvetica Neue',
  				'Helvetica',
  				'Arial',
  				'sans-serif',
  			],
  			sans: [
  				'var(--font-inter)',
  				'Inter',
  				'Helvetica',
  				'Arial',
  				'sans-serif',
  			],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			pill: '9999px',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

