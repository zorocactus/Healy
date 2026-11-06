import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // expose sur 0.0.0.0 → accessible depuis le réseau local
    port: 5173,
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  build: {
    // Code-splitting : on isole les libs lourdes dans des chunks séparés
    // pour réduire le bundle principal (2.3 MB → ~700 KB).
    // Les utilisateurs ne téléchargent les libs spécifiques (3D, charts, PDF)
    // que sur les pages qui les utilisent.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom'],
          'three-vendor':   ['three', '@react-three/fiber', 'ogl'],
          'charts-vendor':  ['recharts'],
          'pdf-vendor':     ['jspdf', 'jspdf-autotable'],
          'date-vendor':    ['date-fns'],
          'icons-vendor':   ['lucide-react'],
          'qr-vendor':      ['html5-qrcode'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
