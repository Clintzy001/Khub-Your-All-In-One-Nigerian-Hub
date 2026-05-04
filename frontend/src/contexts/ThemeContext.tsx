import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// 1. Keep the context private to the file to prevent outside misuse
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage safely
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("khub-theme") as Theme;
      return saved || "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 2. Efficiently toggle classes
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    localStorage.setItem("khub-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Add a check to ensure the hook is used inside a Provider
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
