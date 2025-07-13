
import React from 'react';
import { createRoot } from 'react-dom/client'; // Importar createRoot desde react-dom/client
import App from './App';
import './index.css'; // Importar el CSS de Tailwind
import '@fontsource/poppins'; // Reactivar la importación de la fuente Poppins
import { AuthProvider } from './contexts/AuthContext';
import { HashRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement); // Usar createRoot
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
