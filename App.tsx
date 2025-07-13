import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage'; // For Add/Edit
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import MainLayout from './components/layout/MainLayout';
import { ROUTES } from './constants';
import FacturacionPage from './pages/FacturacionPage';
import Spinner from './components/ui/Spinner';
// Placeholder pages for other modules (to be implemented)
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SuppliersPage from './pages/SuppliersPage';
import ExpensesPage from './pages/ExpensesPage';
import CashRegisterPage from './pages/CashRegisterPage';
import RepositionPage from './pages/RepositionPage';
import NursingPage from './pages/NursingPage';
import StoreLayout from './components/layout/StoreLayout';
import StoreHomePage from './pages/store/StoreHomePage';
import StoreCartPage from './pages/store/StoreCartPage';
import StoreCheckoutPage from './pages/store/StoreCheckoutPage';
import { CartProvider } from './contexts/CartContext';
import BranchesPage from './pages/BranchesPage';
import DevAdminPage from './pages/DevAdminPage';
import StockTransferPage from './pages/StockTransferPage';
import CategoriesPage from './pages/CategoriesPage';


const ProtectedRoute: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Spinner size="lg" color="text-cyan-400" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

const App: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
       <div className="flex items-center justify-center h-screen bg-gray-900">
        <Spinner size="lg" color="text-cyan-400" />
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={currentUser ? <Navigate to={ROUTES.DASHBOARD} /> : <LoginPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path={ROUTES.ADD_PRODUCT} element={<ProductFormPage />} />
        <Route path={ROUTES.EDIT_PRODUCT} element={<ProductFormPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.SALES} element={<SalesPage />} />
        <Route path={ROUTES.CREATE_SALE} element={<SalesPage />} />
        <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
        <Route path={ROUTES.REPOSITION} element={<RepositionPage />} />
        <Route path={ROUTES.CASH_REGISTER} element={<CashRegisterPage />} />
        <Route path={ROUTES.EXPENSES} element={<ExpensesPage />} />
        <Route path={ROUTES.SUPPLIERS} element={<SuppliersPage />} />
        <Route path={ROUTES.USERS} element={<UsersPage />} />
        <Route path={ROUTES.NURSING} element={<NursingPage />} />
        <Route path={ROUTES.BRANCHES} element={<BranchesPage />} />
        <Route path={ROUTES.STOCK_TRANSFER} element={<StockTransferPage />} />
        <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
        <Route path={ROUTES.FACTURACION} element={<FacturacionPage />} />
      </Route>

      <Route element={<CartProvider><StoreLayout /></CartProvider>}>
        <Route path={ROUTES.STORE_HOME} element={<StoreHomePage />} />
        <Route path={ROUTES.STORE_CART} element={<StoreCartPage />} />
        <Route path={ROUTES.STORE_CHECKOUT} element={<StoreCheckoutPage />} />
      </Route>
      
      <Route path={ROUTES.DEV_ADMIN} element={<DevAdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
