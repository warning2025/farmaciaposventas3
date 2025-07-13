import React from 'react';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';

const StickyCart: React.FC = () => {
  const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="sticky top-24 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
        <ShoppingCart size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tu pedido está vacío</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Añade productos para verlos aquí.</p>
      </div>
    );
  }

  return (
    <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-7rem)]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-xl font-bold">Mi Pedido</h3>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500" aria-label="Vaciar carrito">
          Vaciar
        </Button>
      </div>
      <div className="p-4 overflow-y-auto flex-grow">
        {cartItems.map(item => (
          <div key={item.productId} className="flex justify-between items-center mb-3">
            <div className="flex-grow">
              <p className="font-semibold text-sm">{item.productName}</p>
              <p className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">{item.quantity} x {item.unitPrice.toFixed(2)} Bs.</p>
            </div>
            <p className="font-bold text-sm mr-2">{item.totalPrice.toFixed(2)}</p>
            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)} className="text-gray-400 hover:text-red-500 p-1 h-auto">
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{cartTotal.toFixed(2)} Bs.</span>
        </div>
        <Button onClick={() => navigate(ROUTES.STORE_CHECKOUT)} className="w-full" size="lg">
          Continuar Compra
        </Button>
      </div>
    </div>
  );
};

export default StickyCart;
