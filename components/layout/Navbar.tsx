
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';
import { Sun, Moon, LogOut, UserCircle, Settings, Bell, Menu, LayoutDashboard, Package, ShoppingCart, BarChart2, Users, Archive, Truck, DollarSign, PlusCircle, Repeat, HeartPulse, GitBranch, ArrowRightLeft, Tag } from 'lucide-react'; // Using lucide-react

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'CASHIER', 'WAREHOUSE'] },
    { name: 'Productos', path: ROUTES.PRODUCTS, icon: <Package size={20} />, roles: ['ADMIN', 'WAREHOUSE'] },
    { name: 'Categorías', path: ROUTES.CATEGORIES, icon: <Tag size={20} />, roles: ['ADMIN', 'WAREHOUSE'] },
    { name: 'Nueva Venta', path: ROUTES.CREATE_SALE, icon: <PlusCircle size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Ventas', path: ROUTES.SALES, icon: <ShoppingCart size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Enfermería', path: ROUTES.NURSING, icon: <HeartPulse size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Reposición', path: ROUTES.REPOSITION, icon: <Repeat size={20} />, roles: ['ADMIN', 'WAREHOUSE'] },
    { name: 'Transferencias', path: ROUTES.STOCK_TRANSFER, icon: <ArrowRightLeft size={20} />, roles: ['ADMIN', 'WAREHOUSE'] },
    { name: 'Caja', path: ROUTES.CASH_REGISTER, icon: <Archive size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Reportes', path: ROUTES.REPORTS, icon: <BarChart2 size={20} />, roles: ['ADMIN'] },
    { name: 'Gastos', path: ROUTES.EXPENSES, icon: <DollarSign size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Proveedores', path: ROUTES.SUPPLIERS, icon: <Truck size={20} />, roles: ['ADMIN', 'WAREHOUSE'] },
    { name: 'Usuarios', path: ROUTES.USERS, icon: <Users size={20} />, roles: ['ADMIN'] },
    { name: 'Sucursales', path: ROUTES.BRANCHES, icon: <GitBranch size={20} />, roles: ['ADMIN'] },
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
      // Show error notification to user
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 h-16">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to={ROUTES.DASHBOARD} className="flex-shrink-0 flex items-center">
              <img className="h-10 w-auto" src="https://picsum.photos/seed/pharma_logo/100/100" alt="Farmacia Logo" />
              <span className="ml-3 text-xl font-bold text-cyan-600 dark:text-cyan-400 hidden sm:block">FARMA SANTIAGO CHIJMUNI</span>
            </Link>
          </div>
          
          {/* Menu Button - Mobile */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            <Menu size={24} />
          </button>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-2 overflow-x-auto">
            {navItems.map((item) => (
              item.roles.includes(currentUser?.role || 'CASHIER') && (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-cyan-100 dark:hover:bg-gray-700 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Link>
              )
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-cyan-500"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            
            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 relative" aria-label="Notifications">
              <Bell size={22} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-900 bg-red-500"></span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-cyan-500"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Abrir menú de usuario</span>
                {currentUser?.photoURL ? (
                    <img className="h-10 w-10 rounded-full object-cover" src={currentUser.photoURL} alt="User" />
                ) : (
                    <span className="h-10 w-10 rounded-full bg-cyan-500 flex items-center justify-center text-white text-lg font-semibold">
                        {userInitial}
                    </span>
                )}
              </button>
              {dropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none py-2 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.displayName || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mt-1">{currentUser?.role}</p>
                  </div>
                  <Link
                    to={ROUTES.SETTINGS}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserCircle size={20} className="mr-3 text-gray-500 dark:text-gray-400" />
                    Mi Perfil
                  </Link>
                  <Link
                    to={ROUTES.SETTINGS} // Or a dedicated settings page
                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={20} className="mr-3 text-gray-500 dark:text-gray-400" />
                    Configuración
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    <LogOut size={20} className="mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
