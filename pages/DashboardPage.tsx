import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { FileWarning, AlertTriangle, DollarSign, Archive, Package, ShoppingBag, BarChartBig, UserCheck, CalendarDays } from 'lucide-react';
import { Product, Sale, CashRegisterSummary } from '../types';
import { FIRESTORE_COLLECTIONS, CURRENCY_SYMBOL, ROUTES } from '../constants';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import Spinner from '../components/ui/Spinner';
import { onCurrentCashRegisterSummaryUpdate } from '../services/cashRegisterService';
import SalesChart from '../components/charts/SalesChart';
import { getBranches } from '../services/branchService';
import { Branch } from '../types';

interface DashboardStats {
  lowStockCount: number;
  expiringSoonCount: number;
  todaySalesTotal: number;
  currentCash: number;
  topProducts: { name: string, quantity: number }[];
  sales: Sale[];
}

interface BranchAssignment {
  branchName: string;
  role: string;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string; trend?: string, unit?: string }> = ({ title, value, icon, colorClass, trend, unit }) => {
  const numberFormatOptions = unit === CURRENCY_SYMBOL
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 0, maximumFractionDigits: 0 };

  return (
    <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800 border-l-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' && unit === CURRENCY_SYMBOL ? `${unit} ` : ''}
            {typeof value === 'number'
              ? value.toLocaleString('es-BO', numberFormatOptions)
              : value}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('border-l-', 'bg-')}`}>
          {icon}
        </div>
      </div>
      {trend && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{trend}</p>}
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [branchAssignments, setBranchAssignments] = useState<BranchAssignment[]>([]);

  useEffect(() => {
    const productsRef = collection(db, FIRESTORE_COLLECTIONS.PRODUCTS);
    const salesRef = collection(db, FIRESTORE_COLLECTIONS.SALES);

    const unsubscribes = [
      onSnapshot(query(productsRef), (snapshot) => {
        let lowStockCount = 0;
        let expiringSoonCount = 0;
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const topProducts = snapshot.docs
          .map(doc => doc.data() as Product)
          .sort((a, b) => a.currentStock - b.currentStock)
          .slice(0, 5)
          .map(p => ({ name: p.commercialName, quantity: p.currentStock }));

        snapshot.forEach(doc => {
          const product = doc.data() as Product;
          if (product.currentStock <= product.minStock) {
            lowStockCount++;
          }
          const expDate = new Date(product.expirationDate);
          if (expDate >= today && expDate <= thirtyDaysFromNow) {
            expiringSoonCount++;
          }
        });

        setStats(prev => ({ ...prev!, lowStockCount, expiringSoonCount, topProducts }));
      }),

      onSnapshot(query(salesRef, where('date', '>=', Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0))))), (snapshot) => {
        let todaySalesTotal = 0;
        const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        snapshot.forEach(doc => {
          todaySalesTotal += (doc.data() as Sale).finalTotal;
        });
        setStats(prev => ({ ...prev!, todaySalesTotal, sales }));
      }),

      onCurrentCashRegisterSummaryUpdate((summary: CashRegisterSummary | null) => {
        setStats(prev => ({ ...prev!, currentCash: summary?.expectedBalance ?? 0 }));
      }),

    ];

    const fetchBranchAssignments = async () => {
      if (currentUser?.branchAssignments) {
        console.log("currentUser.branchAssignments:", currentUser.branchAssignments);
        const branchIds = Object.keys(currentUser.branchAssignments);
        const branches = await getBranches();

        const assignments: BranchAssignment[] = branchIds.map(branchId => {
          const branch = branches.find(b => b.id === branchId);
          return {
            branchName: branch?.name || 'Sucursal Desconocida',
            role: currentUser.branchAssignments![branchId]
          };
        });
        setBranchAssignments(assignments);
        console.log("Branch Assignments:", assignments);
      } else {
        console.log("currentUser.branchAssignments is undefined or null.");
      }
    };

    setLoading(false);
    fetchBranchAssignments();
    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
            Bienvenido, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Aquí tienes un resumen de tu farmacia.</p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0 flex items-center">
          <CalendarDays size={18} className="mr-2" />
          {format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es })}
        </div>
      </div>

      {branchAssignments.length > 0 && (
        <Card title="Asignación de Sucursal" className="shadow-lg dark:bg-gray-800">
          <ul className="space-y-2">
            {branchAssignments.map((assignment, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="font-medium text-gray-700 dark:text-gray-200">{assignment.branchName}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Rol: {assignment.role}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Stock Bajo" value={stats?.lowStockCount ?? 0} icon={<FileWarning size={30} className="text-orange-500" />} colorClass="border-l-orange-500" />
        <StatCard title="Próximos a Vencer" value={stats?.expiringSoonCount ?? 0} icon={<AlertTriangle size={30} className="text-red-500" />} colorClass="border-l-red-500" />
        <StatCard title="Ventas del Día" value={stats?.todaySalesTotal ?? 0} unit={CURRENCY_SYMBOL} icon={<DollarSign size={30} className="text-green-500" />} colorClass="border-l-green-500" />
        <StatCard title="Caja Actual" value={stats?.currentCash ?? 0} unit={CURRENCY_SYMBOL} icon={<Archive size={30} className="text-blue-500" />} colorClass="border-l-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Productos con Bajo Stock" className="lg:col-span-2 shadow-lg dark:bg-gray-800">
          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <ul className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <li key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-medium text-gray-700 dark:text-gray-200">{product.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{product.quantity} en stock</span>
                </li>
              ))}
            </ul>
          ) : <p>No hay productos con bajo stock.</p>}
        </Card>

        <Card title="Atajos Rápidos" className="shadow-lg dark:bg-gray-800">
          <div className="space-y-3">
            <Link to={ROUTES.ADD_PRODUCT} className="w-full flex items-center p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"><Package size={20} /><span className="ml-3">Nuevo Producto</span></Link>
            <Link to={ROUTES.CREATE_SALE} className="w-full flex items-center p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"><ShoppingBag size={20} /><span className="ml-3">Registrar Venta</span></Link>
            <Link to={ROUTES.REPORTS} className="w-full flex items-center p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"><BarChartBig size={20} /><span className="ml-3">Ver Reportes</span></Link>
            <Link to={ROUTES.USERS} className="w-full flex items-center p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"><UserCheck size={20} /><span className="ml-3">Administrar Usuarios</span></Link>
          </div>
        </Card>
      </div>

      <Card title="Estadísticas de Ventas" className="shadow-lg dark:bg-gray-800">
        {stats?.sales ? <SalesChart salesData={stats.sales} /> : <p>Cargando gráfico...</p>}
      </Card>
    </div>
  );
};

export default DashboardPage;
