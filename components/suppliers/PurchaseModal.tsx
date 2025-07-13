import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Purchase } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchase: Omit<Purchase, 'id' | 'timestamp' | 'userId' | 'userName'>) => Promise<void>;
  supplierId: string;
  supplierName: string;
  contactPerson?: string; // New prop for contact person
  initialData?: { // Optional initial data for editing
    invoiceNumber: string;
    itemCount: number;
    totalAmount: number;
    paymentType: 'credito' | 'contado';
    purchaseDate: string; // YYYY-MM-DD format
    dueDate?: string; // YYYY-MM-DD format
  };
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onSave, supplierId, supplierName, contactPerson, initialData }) => {
  const { currentUser } = useAuth();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [itemCount, setItemCount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'credito' | 'contado'>('contado');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setInvoiceNumber(initialData.invoiceNumber);
        setItemCount(initialData.itemCount);
        setTotalAmount(initialData.totalAmount);
        setPaymentType(initialData.paymentType);
        setPurchaseDate(initialData.purchaseDate);
        setDueDate(initialData.dueDate || '');
      } else {
        // Reset form for new purchase
        setInvoiceNumber('');
        setItemCount(0);
        setTotalAmount(0);
        setPaymentType('contado');
        setPurchaseDate(new Date().toISOString().split('T')[0]); // Default to today
        setDueDate('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('Debe iniciar sesión para registrar una compra.');
      return;
    }

    if (!invoiceNumber || itemCount <= 0 || totalAmount <= 0 || !purchaseDate) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    if (paymentType === 'credito' && !dueDate) {
      alert('La fecha de vencimiento es obligatoria para compras a crédito.');
      return;
    }

    const purchaseToSave: Omit<Purchase, 'id' | 'timestamp' | 'userId' | 'userName'> = {
      supplierId,
      invoiceNumber,
      itemCount,
      totalAmount,
      paymentType,
      purchaseDate: new Date(purchaseDate),
      ...(paymentType === 'credito' && { dueDate: new Date(dueDate) }), // Only include dueDate if paymentType is 'credito'
    };
    
    await onSave(purchaseToSave);
    onClose();
  };

  const titleText = initialData 
    ? `Editar Compra de ${supplierName} (${contactPerson || 'N/A'})` 
    : `Registrar Compra para ${supplierName} (${contactPerson || 'N/A'})`;
  const buttonText = initialData ? "Actualizar Compra" : "Registrar Compra";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Factura/Boleta</label>
        <Input
          type="text"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Ej: 001-001-000123"
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad de Ítems</label>
        <Input
          type="number"
          value={itemCount}
          onChange={(e) => setItemCount(Number(e.target.value))}
          min="0"
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total</label>
        <Input
          type="number"
          value={totalAmount}
          onChange={(e) => setTotalAmount(Number(e.target.value))}
          min="0"
          step="0.01"
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Pago</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as 'credito' | 'contado')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="contado">Contado</option>
          <option value="credito">Crédito</option>
        </select>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Adquisición</label>
        <Input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>
      {(paymentType === 'credito' || (initialData && initialData.paymentType === 'credito')) && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Vencimiento (Pago)</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose} variant="secondary" className="mr-2">Cancelar</Button>
        <Button onClick={handleSubmit}>{buttonText}</Button>
      </div>
    </Modal>
  );
};

export default PurchaseModal;
