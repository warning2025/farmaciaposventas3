import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getLowStockProducts, updateProduct } from '../services/productService';
import { Product } from '../types';

interface RestockItem extends Product {
  restockQuantity: number;
}

const RepositionPage: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [restockOrder, setRestockOrder] = useState<RestockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const products = await getLowStockProducts();
        setLowStockProducts(products);
      } catch (error) {
        console.error("Error fetching low stock products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStockProducts();
  }, []);

  const handleAddToOrder = (product: Product) => {
    setRestockOrder(prevOrder => {
      const existingProduct = prevOrder.find(item => item.id === product.id);
      if (existingProduct) {
        return prevOrder.map(item =>
          item.id === product.id ? { ...item, restockQuantity: item.restockQuantity + 1 } : item
        );
      }
      return [...prevOrder, { ...product, restockQuantity: 1 }];
    });
  };

  const handleUpdateRestockQuantity = (productId: string, quantity: number) => {
    setRestockOrder(prevOrder =>
      prevOrder.map(item =>
        item.id === productId ? { ...item, restockQuantity: quantity } : item
      )
    );
  };

  const handleRemoveFromOrder = (productId: string) => {
    setRestockOrder(prevOrder => prevOrder.filter(item => item.id !== productId));
  };

  const handleConfirmRestock = async () => {
    try {
      await Promise.all(
        restockOrder.map(item =>
          updateProduct(item.id!, { currentStock: item.currentStock + item.restockQuantity })
        )
      );
      alert('Stock actualizado con éxito.');
      setRestockOrder([]);
      // Refetch low stock products
      const products = await getLowStockProducts();
      setLowStockProducts(products);
    } catch (error) {
      console.error("Error updating stock:", error);
      alert('Error al actualizar el stock.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Productos con Bajo Stock</h1>
      <Card>
        {loading ? (
          <p className="text-gray-800 dark:text-white">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Producto</th>
                  <th scope="col" className="px-6 py-3">Stock Actual</th>
                  <th scope="col" className="px-6 py-3">Stock Mínimo</th>
                  <th scope="col" className="px-6 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(product => (
                  <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{product.commercialName}</td>
                    <td className="px-6 py-4">{product.currentStock}</td>
                    <td className="px-6 py-4">{product.minStock}</td>
                    <td className="px-6 py-4">
                      <Button size="sm" onClick={() => handleAddToOrder(product)}>Añadir a Orden</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {restockOrder.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Orden de Reposición</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Producto</th>
                    <th scope="col" className="px-6 py-3">Cantidad a Reponer</th>
                    <th scope="col" className="px-6 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {restockOrder.map(item => (
                    <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.commercialName}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={item.restockQuantity}
                          onChange={(e) => handleUpdateRestockQuantity(item.id!, parseInt(e.target.value))}
                          className="w-20 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="danger" onClick={() => handleRemoveFromOrder(item.id!)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Button onClick={handleConfirmRestock} className="w-full">Confirmar Reposición</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RepositionPage;
