import { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check local storage or system preference
    const getInitialTheme = () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedPrefs = window.localStorage.getItem('color-theme');
            if (typeof storedPrefs === 'string') {
                return storedPrefs;
            }

            const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
            if (userMedia.matches) {
                return 'dark';
            }
        }
        return 'light'; // Default to light
    };

    const [theme, setTheme] = useState(getInitialTheme);

    const toggleTheme = () => {
        const root = window.document.documentElement;
        root.classList.add('theme-transitioning');
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
        setTimeout(() => root.classList.remove('theme-transitioning'), 350);
    };

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove both classes to prevent conflicts
        root.classList.remove('light', 'dark');
        // Add the current theme class
        root.classList.add(theme);

        // Save preference in localStorage
        localStorage.setItem('color-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
