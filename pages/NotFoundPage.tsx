
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import Button from '../components/ui/Button';
import { AlertTriangle, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900 text-white p-4">
      <div className="text-center">
        <AlertTriangle size={80} className="mx-auto text-yellow-400 animate-pulse" />
        <h1 className="mt-8 text-6xl font-extrabold tracking-tight sm:text-8xl">404</h1>
        <p className="mt-4 text-2xl font-medium text-gray-300">¡Ups! Página no encontrada.</p>
        <p className="mt-2 text-lg text-gray-400">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <div className="mt-10">
          <Button 
            onClick={() => window.history.back()} 
            variant="secondary" 
            size="lg"
            className="mr-4"
          >
            Volver Atrás
          </Button>
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="primary" size="lg" icon={<Home size={20}/>}>
              Ir al Dashboard
            </Button>
          </Link>
        </div>
        <img src="https://picsum.photos/seed/404page/500/300" alt="Lost Astronaut" className="mt-12 rounded-lg shadow-xl opacity-50 max-w-sm mx-auto" />
      </div>
       <p className="mt-12 text-center text-xs text-gray-500">
          FarmaciaPro - Sistema de Gestión © {new Date().getFullYear()}
        </p>
    </div>
  );
};

export default NotFoundPage;
