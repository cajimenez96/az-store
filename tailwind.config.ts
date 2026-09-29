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
  			'az-primary': '#0064e0',
  			'az-primary-deep': '#0457cb',
  			'az-primary-soft': '#0091ff',
  			'az-on-primary': '#ffffff',
  			'az-ink-button': '#000000',
  			'az-on-ink': '#ffffff',
  			'az-fb-blue': '#1876f2',
  			'az-meta-link': '#385898',
  			'az-success': '#31a24c',
  			'az-success-bg': '#24e400',
  			'az-attention': '#f2a918',
  			'az-warning': '#f7b928',
  			'az-warning-bg': '#ffe200',
  			'az-critical': '#e41e3f',
  			'az-critical-strong': '#f0284a',
  			'az-canvas': 'rgb(var(--az-canvas) / <alpha-value>)',
  			'az-surface-soft': 'rgb(var(--az-surface-soft) / <alpha-value>)',
  			'az-ink-deep': 'rgb(var(--az-ink-deep) / <alpha-value>)',
  			'az-ink': 'rgb(var(--az-ink) / <alpha-value>)',
  			'az-charcoal': 'rgb(var(--az-charcoal) / <alpha-value>)',
  			'az-slate': 'rgb(var(--az-slate) / <alpha-value>)',
  			'az-steel': 'rgb(var(--az-steel) / <alpha-value>)',
  			'az-stone': 'rgb(var(--az-stone) / <alpha-value>)',
  			'az-hairline': 'rgb(var(--az-hairline) / <alpha-value>)',
  			'az-hairline-soft': 'rgb(var(--az-hairline-soft) / <alpha-value>)',
  			'az-disabled-text': 'rgb(var(--az-disabled-text) / <alpha-value>)',
  			'canvas-night': '#000000',
  			'canvas-night-elevated': '#0a0a0a',
  			'surface-elevated-dark': '#1e2c31',
  			'canvas-cream': '#fbfbf5',
  			'canvas-light': '#ffffff',
  			'aloe-10': '#c1fbd4',
  			'pistachio-10': '#d4f9e0',
  			'shade-30': '#d4d4d8',
  			'shade-40': '#a1a1aa',
  			'shade-50': '#71717a',
  			'shade-60': '#52525b',
  			'shade-70': '#3f3f46',
  			'hairline-light': '#e4e4e7',
  			'hairline-dark': '#1e2c31',
  			'link-cool-1': '#9dabad',
  			'link-cool-2': '#9797a2',
  			'link-cool-3': '#bdbdca',
  			'link-mint': '#99b3ad',
  			ink: '#000000',
  			'nike-ink': '#111111',
  			'nike-canvas': '#ffffff',
  			'nike-soft-cloud': '#f5f5f5',
  			'nike-hairline': '#cacacb',
  			'nike-hairline-soft': '#e5e5e5',
  			'nike-charcoal': '#39393b',
  			'nike-ash': '#4b4b4d',
  			'nike-mute': '#707072',
  			'nike-stone': '#9e9ea0',
  			'nike-sale': '#d30005',
  			'nike-sale-deep': '#780700',
  			'nike-success': '#007d48',
  			'nike-success-bright': '#1eaa52',
  			'nike-info': '#1151ff',
  			'nike-info-deep': '#0034e3',
  			'nike-accent-pink': '#ed1aa0',
  			'nike-accent-pink-soft': '#ffb0dd',
  			'nike-accent-purple-soft': '#beaffd',
  			'nike-accent-purple-pale': '#d6d1ff',
  			'nike-accent-teal': '#0a7281',
  			'nike-accent-pink-deep': '#4c012d',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)',
  				'var(--font-geist)',
  				'Inter',
  				'Helvetica Neue',
  				'Helvetica',
  				'Arial',
  				'sans-serif'
  			],
  			serif: [
  				'var(--font-cormorant)',
  				'Cormorant Garamond',
  				'Georgia',
  				'serif'
  			],
  			display: [
  				'var(--font-cormorant)',
  				'Cormorant Garamond',
  				'Georgia',
  				'serif'
  			],
  			'marder-display': [
  				'var(--font-cormorant)',
  				'Cormorant Garamond',
  				'Georgia',
  				'serif'
  			],
  			'marder-body': [
  				'var(--font-inter)',
  				'var(--font-geist)',
  				'Inter',
  				'sans-serif'
  			],
  			'nike-display': [
  				'var(--font-cormorant)',
  				'Cormorant Garamond',
  				'Georgia',
  				'serif'
  			],
  			'nike-body': [
  				'var(--font-inter)',
  				'Inter',
  				'Helvetica Now Text',
  				'Helvetica',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'az-xs': '2px',
  			'az-sm': '4px',
  			'az-md': '6px',
  			'az-lg': '8px',
  			'az-xl': '16px',
  			'az-xxl': '24px',
  			'az-xxxl': '32px',
  			'az-feature': '40px',
  			'az-full': '100px',
  			'az-circle': '9999px',
  			pill: '9999px',
  			'nike-none': '0px',
  			'nike-sm': '18px',
  			'nike-md': '24px',
  			'nike-lg': '30px',
  			'nike-full': '9999px'
  		},
  		spacing: {
  			'az-xxs': '4px',
  			'az-xs': '8px',
  			'az-sm': '10px',
  			'az-md': '12px',
  			'az-base': '16px',
  			'az-lg': '20px',
  			'az-xl': '24px',
  			'az-xxl': '32px',
  			'az-xxxl': '40px',
  			'az-section-sm': '48px',
  			'az-section': '64px',
  			'az-section-lg': '80px',
  			'az-hero': '120px',
  			'nike-xxs': '2px',
  			'nike-xs': '4px',
  			'nike-sm': '8px',
  			'nike-md': '12px',
  			'nike-lg': '18px',
  			'nike-xl': '24px',
  			'nike-xxl': '30px',
  			'nike-section': '48px'
  		},
  		boxShadow: {
  			'az-sticky': 'rgba(20, 22, 26, 0.3) 0px 1px 4px 0px',
  			'az-tab': 'rgba(0, 0, 0, 0.2) 1px 1px 0px 0px',
  			'nike-hairline-inset': 'inset 0 -1px 0 #e5e5e5'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

