import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider } from "./context/DataContext";
import { LanguageProvider } from "./context/LanguageContext";
import AppRouter from "./router/AppRouter";
import ErrorToast from "./components/ErrorToast";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <DataProvider>
            <AppRouter />
            <ErrorToast />
          </DataProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);