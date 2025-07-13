import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Product } from '../types';
import { FIRESTORE_COLLECTIONS, ROUTES, CURRENCY_SYMBOL } from '../constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card'; // Ensuring Card is imported
import { PlusCircle, Edit3, Trash2, Search, Package, AlertTriangle, FileWarning, CalendarClock, ChevronsUpDown } from 'lucide-react'; // Changed PackageWarning to FileWarning
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import useDebounce from '../hooks/useDebounce';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Added debouncedSearchTerm
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'status' | null; direction: 'ascending' | 'descending' }>({ key: 'commercialName', direction: 'ascending' });
  const navigate = useNavigate(); // Added navigate

  const getProductStatusOrder = useCallback((product: Product): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // For accurate day comparison

    if (product.expirationDate) {
      try {
        const expiryDate = parseISO(product.expirationDate);
        if (!isNaN(expiryDate.getTime())) {
          const daysToExpiry = differenceInDays(expiryDate, today);
          if (daysToExpiry < 0) return 1; // Vencido (highest priority)
          if (daysToExpiry <= 30) return 2; // Vence Pronto
        }
      } catch (e) {
        // Ignore invalid date format
      }
    }

    if (product.minStock > 0 && product.currentStock <= product.minStock) return 3; // Stock Bajo
    return 4; // En Stock
  }, []);


  useEffect(() => {
    setLoading(true);
    const productsCollection = collection(db, FIRESTORE_COLLECTIONS.PRODUCTS);
    const baseSortKey = (sortConfig.key && sortConfig.key !== 'status') ? sortConfig.key : 'commercialName';
    const baseDirection = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
    const q = query(productsCollection, orderBy(baseSortKey as string, baseDirection));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let productsList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));

      if (sortConfig.key === 'status') {
        productsList.sort((a, b) => {
          const statusA = getProductStatusOrder(a);
          const statusB = getProductStatusOrder(b);
          if (statusA < statusB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (statusA > statusB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return a.commercialName.localeCompare(b.commercialName);
        });
      }

      setProducts(productsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products in real-time: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortConfig, getProductStatusOrder]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const lowercasedFilter = debouncedSearchTerm.toLowerCase();
      const filteredData = products.filter(item =>
        item.commercialName.toLowerCase().includes(lowercasedFilter) ||
        item.barcode.toLowerCase().includes(lowercasedFilter) ||
        (item.genericName && item.genericName.toLowerCase().includes(lowercasedFilter))
      );
      setFilteredProducts(filteredData);
    } else {
      setFilteredProducts(products);
    }
  }, [debouncedSearchTerm, products]);


  const handleDeleteProduct = async () => {
    if (!productToDelete || !productToDelete.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, productToDelete.id));
      // No need to call fetchProducts, onSnapshot will handle the update automatically
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting product: ", error);
      let errorMessage = "Ocurrió un error desconocido.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Error al eliminar el producto: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setProductToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const getStatusBadge = (product: Product) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (product.expirationDate) {
      try {
        const expiryDate = parseISO(product.expirationDate);
        if (!isNaN(expiryDate.getTime())) {
          const daysToExpiry = differenceInDays(expiryDate, today);

          if (daysToExpiry < 0) {
            return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 dark:text-red-200 dark:bg-red-700 rounded-full flex items-center"><AlertTriangle size={14} className="mr-1" /> Vencido</span>;
          }
          if (daysToExpiry <= 30) {
            return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-700 rounded-full flex items-center"><CalendarClock size={14} className="mr-1" /> Vence Pronto</span>;
          }
        }
      } catch (e) {
        // Ignore invalid date format
      }
    }

    if (product.minStock > 0 && product.currentStock <= product.minStock) {
      return <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-200 dark:text-orange-200 dark:bg-orange-700 rounded-full flex items-center"><FileWarning size={14} className="mr-1" /> Stock Bajo</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 dark:text-green-200 dark:bg-green-700 rounded-full">En Stock</span>;
  };
  
  const requestSort = (key: keyof Product | 'status') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader: React.FC<{ label: string; sortKey: keyof Product | 'status' }> = ({ label, sortKey }) => (
    <th 
      scope="col" 
      className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center justify-between">
        {label}
        <ChevronsUpDown size={14} className={`ml-1 opacity-50 ${sortConfig.key === sortKey ? 'opacity-100' : ''} transform ${sortConfig.key === sortKey && sortConfig.direction === 'descending' ? 'rotate-180' : 'rotate-0'}`} />
      </div>
    </th>
  );


  if (loading && products.length === 0) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <Package size={32} className="mr-3 text-cyan-600 dark:text-cyan-400" />
            Gestión de Productos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Administra tu inventario de productos de forma eficiente.</p>
        </div>
        <Button 
          onClick={() => navigate(ROUTES.ADD_PRODUCT)} 
          icon={<PlusCircle size={20} />}
          variant="primary"
          size="lg"
        >
          Añadir Producto
        </Button>
      </div>

      <Card className="shadow-xl dark:bg-gray-800 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <Input
          type="text"
          placeholder="Buscar por nombre, código de barras o genérico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search size={20} className="text-gray-400 dark:text-gray-500" />}
          containerClassName="mb-0" // Removed bottom margin from input itself
          inputClassName="py-3 text-base"
        />
        </div>

        {loading && products.length > 0 && <div className="p-6 flex justify-center"><Spinner /></div>}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12 px-6">
            <Package size={60} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">No se encontraron productos</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? "Intenta con otro término de búsqueda o " : "Comienza "} 
              <Link to={ROUTES.ADD_PRODUCT} className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">
                añade un nuevo producto
              </Link>.
            </p>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto">
              <thead className="bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-1/4 cursor-pointer" onClick={() => requestSort('commercialName')}>Nombre</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-1/6 cursor-pointer" onClick={() => requestSort('barcode')}>Código Barras</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('sellingPrice')}>Precio</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('currentStock')}>Stock</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('expirationDate')}>Venc.</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('status')}>Estado</th>
                  <th scope="col" className="sticky right-0 bg-gray-50 dark:bg-gray-700/60 px-2 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.filter(p => p.id).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150">
                    <td className="px-2 py-3" title={product.commercialName}>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{product.commercialName}</div>
                      {product.genericName && <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.genericName}</div>}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={product.barcode}>{product.barcode}</td>
                    <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">{product.category}</td>
                    <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400 text-right">{CURRENCY_SYMBOL} {Number(product.sellingPrice).toFixed(2)}</td>
                    <td className={`px-2 py-3 text-sm text-right font-semibold ${product.minStock > 0 && product.currentStock <= product.minStock ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {product.currentStock} / <span className="text-xs text-gray-500 dark:text-gray-400">{product.minStock > 0 ? product.minStock : '-'}</span>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {(() => {
                        if (!product.expirationDate) return <span className="text-gray-400">N/A</span>;
                        try {
                          // Check if the date is valid before formatting
                          const date = parseISO(product.expirationDate);
                          if (isNaN(date.getTime())) {
                            return <span className="text-red-500" title={product.expirationDate}>Inválida</span>;
                          }
                          return format(date, 'dd MMM yy', { locale: es });
                        } catch (e) {
                          return <span className="text-red-500" title={product.expirationDate}>Inválida</span>;
                        }
                      })()}
                    </td>
                    <td className="px-2 py-3">{getStatusBadge(product)}</td>
                    <td className="sticky right-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40 px-2 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`${ROUTES.PRODUCTS}/editar/${product.id}`)}
                          className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 p-2 rounded-md"
                          aria-label="Editar producto"
                        >
                          <Edit3 size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteModal(product)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-md"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Confirmar Eliminación" size="md">
        <div className="text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4 animate-pulse" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">
            ¿Estás seguro de que deseas eliminar este producto?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            "{productToDelete?.commercialName}"
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="ghost" onClick={closeDeleteModal} disabled={isDeleting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteProduct} isLoading={isDeleting} className="w-full sm:w-auto">
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
