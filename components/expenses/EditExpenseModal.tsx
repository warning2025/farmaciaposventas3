import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Expense } from '../../types';
import { EXPENSE_CATEGORIES } from '../../constants';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Partial<Omit<Expense, 'id' | 'date' | 'timestamp'>>) => Promise<void>;
  initialData: Expense;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setConcept(initialData.concept);
      setAmount(initialData.amount);
      setCategory(initialData.category);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    if (!concept || amount <= 0 || !category) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    const updatedExpense: Partial<Omit<Expense, 'id' | 'date' | 'timestamp'>> = {
      concept,
      amount,
      category,
    };

    await onSave(updatedExpense);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Gasto">
      <div>
        <label htmlFor="concept" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto</label>
        <Input
          type="text"
          id="concept"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
        <Input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Seleccione una categoría</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onClose} variant="secondary" className="mr-2">Cancelar</Button>
        <Button onClick={handleSubmit}>Actualizar Gasto</Button>
      </div>
    </Modal>
  );
};

export default EditExpenseModal;
