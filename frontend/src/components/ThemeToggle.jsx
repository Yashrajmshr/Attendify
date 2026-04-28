import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        // Initialize from localStorage or check system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="relative inline-flex h-10 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
            aria-label="Toggle Theme"
        >
            <div className={`absolute inset-0 bg-gradient-to-br from-primary-500/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

            <div className="flex items-center space-x-3 relative z-10 text-slate-600 dark:text-slate-400">
                <div className={`transition-all duration-500 transform ${!isDark ? 'text-amber-500 rotate-0 scale-110' : 'rotate-90 scale-75 opacity-50'}`}>
                    <Sun size={20} strokeWidth={2.5} />
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <div className={`transition-all duration-500 transform ${isDark ? 'text-indigo-400 rotate-0 scale-110' : '-rotate-90 scale-75 opacity-50'}`}>
                    <Moon size={18} strokeWidth={2.5} />
                </div>
            </div>

            {/* Animated background indicator */}
            <div
                className={`absolute left-1 h-8 w-8 bg-white dark:bg-slate-700 rounded-xl shadow-sm transition-all duration-500 ease-out-back ${isDark ? 'translate-x-10' : 'translate-x-0'}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            ></div>
        </button>
    );
};

export default ThemeToggle;
