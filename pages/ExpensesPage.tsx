import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { Expense, UserRole } from '../types';
import { onExpensesUpdate, addExpense, updateExpense, deleteExpense } from '../services/expensesService';
import EditExpenseModal from '../components/expenses/EditExpenseModal';
import { EXPENSE_CATEGORIES } from '../constants';
import { getMainBranch } from '../services/branchService'; // Import getMainBranch

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpenseToEdit, setCurrentExpenseToEdit] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({ concept: '', amount: 0, category: '' });
  const { currentUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    let branchIdToFilter: string | undefined;
    if (currentUser && currentUser.role !== UserRole.ADMIN && currentUser.branchAssignments) {
      const assignedBranchIds = Object.keys(currentUser.branchAssignments);
      if (assignedBranchIds.length > 0) {
        branchIdToFilter = assignedBranchIds[0];
      }
    }
    // console.log("ExpensesPage: currentUser", currentUser); // Keep for debugging if needed
    // console.log("ExpensesPage: branchIdToFilter", branchIdToFilter); // Keep for debugging if needed

    const unsubscribe = onExpensesUpdate((expenses) => {
      // console.log("ExpensesPage: Expenses data received", expenses); // Keep for debugging if needed
      setExpenses(expenses);
    }, branchIdToFilter);
    setLoading(false);
    return () => unsubscribe();
  }, [currentUser]);

  const openAddModal = () => {
    setNewExpense({ concept: '', amount: 0, category: '' });
    setIsAddModalOpen(true);
  };

  const handleAddExpense = async () => {
    if (!currentUser || !currentUser.uid) {
      alert('Debe iniciar sesión para agregar un gasto.');
      return;
    }

    let expenseBranchId: string | undefined;
    if (currentUser.branchAssignments) {
      const assignedBranchIds = Object.keys(currentUser.branchAssignments);
      if (assignedBranchIds.length > 0) {
        expenseBranchId = assignedBranchIds[0];
      }
    }

    if (!expenseBranchId) {
      // If user has no explicit branch assignment, try to get the main branch
      const mainBranch = await getMainBranch();
      if (mainBranch) {
        expenseBranchId = mainBranch.id;
      }
    }

    if (!expenseBranchId) {
      alert('No se pudo determinar la sucursal para registrar el gasto. Asegúrese de que haya una sucursal principal configurada o que el usuario tenga una sucursal asignada.');
      return;
    }

    try {
      await addExpense({
        ...newExpense,
        branchId: expenseBranchId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'N/A',
      });
      alert('Gasto agregado con éxito.');
      setNewExpense({ concept: '', amount: 0, category: '' });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding expense:", error);
      alert('Error al agregar el gasto.');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setCurrentExpenseToEdit(expense);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedExpense = async (editedData: Partial<Omit<Expense, 'id' | 'date' | 'timestamp'>>) => {
    if (!currentUser || !currentUser.uid) {
      alert('Debe iniciar sesión para editar un gasto.');
      return;
    }
    if (!currentExpenseToEdit?.id) {
      alert('ID de gasto no encontrado para editar.');
      return;
    }

    try {
      await updateExpense(currentExpenseToEdit.id, editedData);
      alert('Gasto actualizado con éxito.');
      setIsEditModalOpen(false);
      setCurrentExpenseToEdit(null);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert('Error al actualizar el gasto.');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este gasto?')) {
      try {
        await deleteExpense(expenseId);
        alert('Gasto eliminado con éxito.');
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert('Error al eliminar el gasto.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gastos</h1>
        <Button onClick={openAddModal}>Agregar Gasto</Button>
      </div>
      <Card>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Registro de Gastos</h2>
        {loading ? (
          <p className="text-gray-800 dark:text-white">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Fecha</th>
                  <th scope="col" className="px-6 py-3">Concepto</th>
                  <th scope="col" className="px-6 py-3">Monto</th>
                  <th scope="col" className="px-6 py-3">Categoría</th>
                  <th scope="col" className="px-6 py-3">Usuario</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{expense.concept}</td>
                    <td className="px-6 py-4">{expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">{expense.category}</td>
                    <td className="px-6 py-4">{expense.userName}</td>
                    <td className="px-6 py-4">
                      <Button onClick={() => handleEditExpense(expense)} variant="secondary" size="sm" className="mr-2">Editar</Button>
                      <Button onClick={() => handleDeleteExpense(expense.id!)} variant="danger" size="sm">Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Add Expense Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Gasto">
        <div>
          <label htmlFor="concept" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto</label>
          <Input
            type="text"
            id="concept"
            value={newExpense.concept}
            onChange={(e) => setNewExpense({ ...newExpense, concept: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
          <Input
            type="number"
            id="amount"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
          <select
            id="category"
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Seleccione una categoría</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsAddModalOpen(false)} variant="secondary" className="mr-2">Cancelar</Button>
          <Button onClick={handleAddExpense}>Agregar</Button>
        </div>
      </Modal>

      {/* Edit Expense Modal */}
      {currentExpenseToEdit && (
        <EditExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEditedExpense}
          initialData={currentExpenseToEdit}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
