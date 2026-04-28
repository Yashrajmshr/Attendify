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
                }
            },
            fontFamily: {
                sans: ['"Outfit"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['"Outfit"', 'sans-serif'],
                body: ['"Inter"', 'sans-serif'],
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
