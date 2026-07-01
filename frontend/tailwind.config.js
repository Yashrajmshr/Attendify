/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#7c3aed', // Refined brand color (slightly deeper/vibrant violet)
                    600: '#6d28d9',
                    700: '#5b21b6',
                    800: '#4c1d95',
                    900: '#2e1065',
                },
                secondary: '#db2777', // Slightly warmer pink
                dark: '#020617', // Much deeper slate for better dark mode depth
                surface: {
                    light: '#ffffff',
                    dark: '#0f172a',
                    alt: '#f8fafc'
                },
                // Stitch design custom tokens
                'primary-design': '#c3c0ff',
                'primary-container': '#4f46e5',
                'on-primary-container': '#dad7ff',
                'surface-container-high': '#272a2c',
                'surface-container-highest': '#323537',
                'surface-container-lowest': '#0b0f10',
                'surface-container-low': '#191c1e',
                'surface-container': '#1d2022',
                'outline-variant': '#464555',
                'on-surface': '#e0e3e5',
                'on-surface-variant': '#c7c4d8',
                'surface-bright': '#363a3b',
                'background': '#101415',
                'on-background': '#e0e3e5',
                'on-primary': '#1d00a5',
                'on-primary-fixed': '#0f0069',
                'primary-fixed': '#e2dfff',
                'primary-fixed-dim': '#c3c0ff',
                'inverse-primary': '#4d44e3',
                'inverse-surface': '#e0e3e5',
                'inverse-on-surface': '#2d3133',
                'on-secondary-fixed': '#171b26',
                'on-secondary-fixed-variant': '#434652',
                'on-secondary-container': '#b5b8c6',
                'secondary-container': '#454955',
                'secondary-fixed': '#dfe2f1',
                'secondary-fixed-dim': '#c3c6d4',
                'on-tertiary-fixed': '#171c23',
                'on-tertiary-fixed-variant': '#42474f',
                'on-tertiary-container': '#d7dbe5',
                'tertiary-container': '#5b6068',
                'tertiary-fixed': '#dee2ec',
                'tertiary-fixed-dim': '#c2c7d0',
                'on-secondary': '#2c303b',
                'on-tertiary': '#2c3138',
                'on-error-container': '#ffdad6',
                'error-container': '#93000a',
                'on-error': '#690005',
                'on-primary-fixed-variant': '#3323cc',
                'surface-tint': '#c3c0ff',
                'outline': '#918fa1',
                'tertiary': '#c2c7d0',
                'surface-dim': '#101415'
            },
            fontFamily: {
                sans: ['"Outfit"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['"Outfit"', 'sans-serif'],
                body: ['"Inter"', 'sans-serif'],
                // Stitch design custom fonts
                'headline-lg': ['"Outfit"', 'sans-serif'],
                'label-caps': ['"Inter"', 'sans-serif'],
                'mono-label': ['"Geist Mono"', 'monospace'],
                'body-lg': ['"Inter"', 'sans-serif'],
                'headline-lg-mobile': ['"Outfit"', 'sans-serif'],
                'headline-md': ['"Outfit"', 'sans-serif'],
                'body-sm': ['"Inter"', 'sans-serif']
            },
            spacing: {
                'margin-mobile': '16px',
                'max-width': '1440px',
                'gutter': '24px',
                'unit': '4px',
                'margin-desktop': '40px'
            },
            boxShadow: {
                'premium': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                'premium-card': '0 20px 25px -5px rgb(0 0 0 / 0.02), 0 8px 10px -6px rgb(0 0 0 / 0.02)',
                'premium-hover': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
                'active-primary': '0 10px 15px -3px rgba(124, 58, 237, 0.2), 0 4px 6px -4px rgba(124, 58, 237, 0.2)',
                'glow-primary': '0 0 25px rgba(124, 58, 237, 0.15)',
            }
        },
    },
    plugins: [],
}
