import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { LayoutDashboard, Package, ShoppingCart, BarChart2, Users, Archive, Truck, DollarSign, Settings, PlusCircle, Repeat, HelpCircle, Briefcase, HeartPulse, GitBranch, ArrowRightLeft, Tag } from 'lucide-react'; // Using lucide-react
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const commonLinkClasses = "flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ease-in-out text-gray-700 dark:text-gray-300 hover:bg-cyan-100 dark:hover:bg-gray-700";
const activeLinkClasses = "bg-cyan-500 dark:bg-cyan-600 text-white font-semibold shadow-md";
const inactiveLinkClasses = "hover:text-cyan-600 dark:hover:text-cyan-400";


const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: <LayoutDashboard size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.WAREHOUSE] },
    { name: 'Productos', path: ROUTES.PRODUCTS, icon: <Package size={22} />, roles: [UserRole.ADMIN, UserRole.WAREHOUSE] },
    { name: 'Categorías', path: ROUTES.CATEGORIES, icon: <Tag size={22} />, roles: [UserRole.ADMIN, UserRole.WAREHOUSE] },
    { name: 'Nueva Venta', path: ROUTES.CREATE_SALE, icon: <PlusCircle size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER] },
    { name: 'Ventas', path: ROUTES.SALES, icon: <ShoppingCart size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER] },
    { name: 'Enfermería', path: ROUTES.NURSING, icon: <HeartPulse size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER] },
    { name: 'Reposición', path: ROUTES.REPOSITION, icon: <Repeat size={22} />, roles: [UserRole.ADMIN, UserRole.WAREHOUSE] },
    { name: 'Transferencias', path: ROUTES.STOCK_TRANSFER, icon: <ArrowRightLeft size={22} />, roles: [UserRole.ADMIN, UserRole.WAREHOUSE] },
    { name: 'Caja', path: ROUTES.CASH_REGISTER, icon: <Archive size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER] },
    { name: 'Reportes', path: ROUTES.REPORTS, icon: <BarChart2 size={22} />, roles: [UserRole.ADMIN] },
    { name: 'Gastos', path: ROUTES.EXPENSES, icon: <DollarSign size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER] },
    { name: 'Proveedores', path: ROUTES.SUPPLIERS, icon: <Truck size={22} />, roles: [UserRole.ADMIN, UserRole.WAREHOUSE] },
    { name: 'Facturación', path: ROUTES.FACTURACION, icon: <DollarSign size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.WAREHOUSE] },
    { name: 'Usuarios', path: ROUTES.USERS, icon: <Users size={22} />, roles: [UserRole.ADMIN] },
    { name: 'Sucursales', path: ROUTES.BRANCHES, icon: <GitBranch size={22} />, roles: [UserRole.ADMIN] },
    { name: 'Configuración', path: ROUTES.SETTINGS, icon: <Settings size={22} />, roles: [UserRole.ADMIN, UserRole.CASHIER, UserRole.WAREHOUSE] },
  ];

  const userRole = currentUser?.role || UserRole.CASHIER; // Default to cashier if role not set

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));


  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden" 
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-800 shadow-xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                   lg:translate-x-0 lg:relative transition-transform duration-300 ease-in-out flex flex-col h-[calc(100vh-4rem)]`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 px-4">
           <span className="ml-3 text-xl font-bold text-cyan-600 dark:text-cyan-400">SISTEMA</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={isOpen && window.innerWidth < 1024 ? toggleSidebar : undefined} // Close sidebar on mobile nav click
              className={({ isActive }) => 
                `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
              }
            >
              <span className="mr-4">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto flex-shrink-0">
          <a
            href="#" // Replace with actual help/docs link
            className={`${commonLinkClasses} ${inactiveLinkClasses}`}
          >
            <HelpCircle size={22} className="mr-4 text-gray-500 dark:text-gray-400"/>
            Ayuda y Soporte
          </a>
           <div className="mt-4 p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg text-white text-center">
            <Briefcase size={30} className="mx-auto mb-2" />
            <p className="font-semibold text-sm">¿Necesitas más funciones?</p>
            <p className="text-xs mt-1">Contacta a elcreadorweb@gmail.com para una versión premium.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
