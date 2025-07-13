import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCart } from '../../contexts/CartContext';
import { ROUTES } from '../../constants';
import { Trash2 } from 'lucide-react';

const StoreCartPage: React.FC = () => {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Carrito de Compras</h1>
      <Card>
        {cartItems.length === 0 ? (
          <div className="text-center p-8">
            <p className="mb-4">Tu carrito está vacío.</p>
            <Link to={ROUTES.STORE_HOME}>
              <Button>Volver a la Tienda</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Producto</th>
                  <th scope="col" className="px-6 py-3">Precio</th>
                  <th scope="col" className="px-6 py-3">Cantidad</th>
                  <th scope="col" className="px-6 py-3">Subtotal</th>
                  <th scope="col" className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item.productId} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.productName}</td>
                    <td className="px-6 py-4">{item.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                        className="w-20"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4">{item.totalPrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Button onClick={() => removeFromCart(item.productId)} variant="danger" size="sm">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center font-bold text-xl">
                <span>Total:</span>
                <span>{cartTotal.toFixed(2)} Bs.</span>
              </div>
              <Link to={ROUTES.STORE_CHECKOUT}>
                <Button className="w-full mt-4">Proceder al Pago</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StoreCartPage;
