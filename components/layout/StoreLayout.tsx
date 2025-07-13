import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { ROUTES } from '../../constants';
import { useCart } from '../../contexts/CartContext';

const StoreLayout: React.FC = () => {
  const { cartCount } = useCart();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to={ROUTES.STORE_HOME} className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            FARMA SANTIAGO CHIJMUNI - Tienda
          </Link>
          <Link to={ROUTES.STORE_CART} className="relative">
            <ShoppingCart size={28} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </header>

      <main className="container mx-auto p-4">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 mt-8 py-4 text-center">
        <p>&copy; {new Date().getFullYear()} FARMA SANTIAGO CHIJMUNI. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default StoreLayout;
