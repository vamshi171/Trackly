import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("theme");
        return saved ? saved === "dark" : true;
    });

    // ✅ Apply initial theme on mount
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        
        if (isDark) {
            root.setAttribute("data-theme", "dark");
            root.style.colorScheme = "dark";
            body.classList.add("dark-theme");
            body.classList.remove("light-theme");
        } else {
            root.setAttribute("data-theme", "light");
            root.style.colorScheme = "light";
            body.classList.add("light-theme");
            body.classList.remove("dark-theme");
        }
    }, []); // Run once on mount

    useEffect(() => {
        localStorage.setItem("theme", isDark ? "dark" : "light");
        
        // ✅ Apply theme to body element
        const root = document.documentElement;
        const body = document.body;
        
        if (isDark) {
            root.setAttribute("data-theme", "dark");
            root.style.colorScheme = "dark";
            body.classList.add("dark-theme");
            body.classList.remove("light-theme");
        } else {
            root.setAttribute("data-theme", "light");
            root.style.colorScheme = "light";
            body.classList.add("light-theme");
            body.classList.remove("dark-theme");
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
};
