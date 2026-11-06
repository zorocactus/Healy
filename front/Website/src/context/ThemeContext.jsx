import { createContext, useContext, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("medDk") : null) || "light"
  );

  function toggleTheme() {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") localStorage.setItem("medDk", next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans <ThemeProvider>");
  return ctx;
}
