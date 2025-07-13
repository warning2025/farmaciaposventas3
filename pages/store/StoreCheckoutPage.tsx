import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCart } from '../../contexts/CartContext';
import { createSale } from '../../services/salesService';
import { getMainBranch } from '../../services/branchService';
import { ROUTES } from '../../constants';

const StoreCheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }
    if (!customerName || !customerPhone) {
      alert('Por favor, complete su nombre y teléfono.');
      return;
    }

    setIsLoading(true);
    try {
      const mainBranch = await getMainBranch();
      if (!mainBranch) {
        throw new Error("No main branch configured for online sales.");
      }
      await createSale(
        {
          branchId: mainBranch.id!,
          items: cartItems,
          subtotal: cartTotal,
          totalDiscount: 0,
          finalTotal: cartTotal,
          userId: 'online-customer', // Or a more sophisticated customer ID system
          userName: customerName,
          paymentMethod: 'online', // Placeholder
          channel: 'online',
          status: 'pending',
          customerPhone: customerPhone,
        },
        cartItems
      );
      alert('¡Pedido realizado con éxito! Se le enviará una notificación por WhatsApp cuando su pedido esté en proceso. Recuerde agregar nuestro número de WhatsApp correctamente.');
      clearCart();
      navigate(ROUTES.STORE_HOME);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Hubo un error al procesar su pedido. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="customerName">Nombre Completo</label>
                <Input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Su nombre completo"
                  required
                />
              </div>
              <div>
                <label htmlFor="customerPhone">Teléfono / WhatsApp</label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Su número de teléfono"
                  required
                />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Resumen del Pedido</h2>
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.productId} className="flex justify-between">
                  <span>{item.productName} x {item.quantity}</span>
                  <span>{item.totalPrice.toFixed(2)} Bs.</span>
                </div>
              ))}
            </div>
            <hr className="my-4" />
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>{cartTotal.toFixed(2)} Bs.</span>
            </div>
            <div className="mt-6">
              <Button className="w-full" onClick={handlePlaceOrder} disabled={isLoading}>
                {isLoading ? 'Procesando...' : 'Realizar Pedido'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StoreCheckoutPage;
