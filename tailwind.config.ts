import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Royal Concierge design tokens (match reference HTML class names) ──
        primary: {
          DEFAULT: '#3525cd', // Royal Purple
          container: '#4f46e5',
          fixed: '#e2dfff',
          'fixed-dim': '#c3c0ff',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#dad7ff',
        'on-primary-fixed': '#0f0069',
        'on-primary-fixed-variant': '#3323cc',
        'inverse-primary': '#c3c0ff',
        secondary: {
          DEFAULT: '#735c00',
          container: '#fed65b', // Luxe Gold container
          fixed: '#ffe088',
          'fixed-dim': '#e9c349', // Metallic Gold
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#745c00',
        'on-secondary-fixed': '#241a00',
        'on-secondary-fixed-variant': '#574500',
        tertiary: {
          DEFAULT: '#464375',
          container: '#5d5b8e',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#dcd8ff',
        surface: {
          DEFAULT: '#f8f9fa',
          dim: '#d9dadb',
          bright: '#ffffff',
          'container-lowest': '#ffffff',
          'container-low': '#f3f4f5',
          container: '#edeeef',
          'container-high': '#e7e8e9',
          'container-highest': '#e1e3e4',
          variant: '#e1e3e4',
        },
        'on-surface': '#191c1d',
        'on-surface-variant': '#464555',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        outline: {
          DEFAULT: '#777587',
          variant: '#c7c4d8',
        },
        background: '#f8f9fa',
        'on-background': '#191c1d',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        'surface-tint': '#4d44e3',

        // ── Legacy aliases (keep older components working, repointed to luxe) ──
        bg: {
          DEFAULT: '#f8f9fa',
          card: '#ffffff',
          surface: '#f3f4f5',
          hover: '#edeeef',
        },
        accent: {
          DEFAULT: '#3525cd', // now Royal Purple (was red)
          hover: '#2a1ea8',
          muted: 'rgba(53,37,205,0.12)',
        },
        purple: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          muted: 'rgba(79,70,229,0.12)',
        },
        gold: {
          DEFAULT: '#e9c349',
          soft: '#ffe088',
          container: '#fed65b',
          on: '#574500',
        },
        cream: '#191c1d', // primary text (dark ink)
        muted: '#464555', // secondary text
        border: 'rgba(199,196,216,0.45)', // outline-variant alpha
      },
      boxShadow: {
        card: '0 1px 2px rgba(53,37,205,0.04), 0 8px 24px rgba(53,37,205,0.06)',
        pop: '0 12px 40px rgba(53,37,205,0.14)',
        gold: '0 0 15px rgba(233,195,73,0.4)',
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'sans-serif'],
        body: ['var(--font-jakarta)', 'sans-serif'],
        'display-lg': ['var(--font-jakarta)', 'sans-serif'],
        'display-lg-mobile': ['var(--font-jakarta)', 'sans-serif'],
        'headline-md': ['var(--font-jakarta)', 'sans-serif'],
        'body-lg': ['var(--font-jakarta)', 'sans-serif'],
        'body-md': ['var(--font-jakarta)', 'sans-serif'],
        'label-caps': ['var(--font-jakarta)', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg-mobile': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.1em', fontWeight: '600' }],
      },
      spacing: {
        base: '8px',
        gutter: '24px',
        'margin-mobile': '20px',
        'margin-desktop': '64px',
        'container-max': '1280px',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      animation: {
        'dot-bounce': 'dotBounce 1.2s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
      },
      keyframes: {
        dotBounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
