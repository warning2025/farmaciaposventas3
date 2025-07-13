import React, { useState, useEffect } from 'react';
import { Product, Branch } from '../../types';
import { getAllProducts, transferStock } from '../../services/productService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceBranch: Branch | null;
  targetBranch: Branch | null;
}

interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
  stock: number;
}

const StockTransferModal: React.FC<StockTransferModalProps> = ({ isOpen, onClose, sourceBranch, targetBranch }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transferList, setTransferList] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        const allProducts = await getAllProducts();
        setProducts(allProducts);
      };
      fetchProducts();
    }
  }, [isOpen]);

  const handleQuantityChange = (productId: string, productName: string, stock: number, quantity: string) => {
    const numQuantity = parseInt(quantity);
    setTransferList(prevList => {
      const existingItem = prevList.find(item => item.productId === productId);
      if (existingItem) {
        if (numQuantity > 0) {
          return prevList.map(item => item.productId === productId ? { ...item, quantity: numQuantity } : item);
        } else {
          return prevList.filter(item => item.productId !== productId);
        }
      } else if (numQuantity > 0) {
        return [...prevList, { productId, productName, stock, quantity: numQuantity }];
      }
      return prevList;
    });
  };

  const handleTransfer = async () => {
    if (!targetBranch || transferList.length === 0) {
      alert('Por favor, seleccione productos para transferir.');
      return;
    }
    setLoading(true);
    try {
      await transferStock(targetBranch.id!, transferList);
      alert('Transferencia de stock realizada con éxito.');
      onClose();
    } catch (error: any) {
      console.error('Error transferring stock:', error);
      alert(`Error al transferir stock: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Transferir de ${sourceBranch?.name} a ${targetBranch?.name}`} size="xl">
      <div className="p-4">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Cantidad a Transferir</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.commercialName}</td>
                  <td>{p.currentStock}</td>
                  <td>
                    <Input
                      type="number"
                      min="0"
                      max={p.currentStock}
                      onChange={(e) => handleQuantityChange(p.id!, p.commercialName, p.currentStock, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleTransfer} disabled={loading}>
            {loading ? 'Transfiriendo...' : 'Confirmar Transferencia'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StockTransferModal;
