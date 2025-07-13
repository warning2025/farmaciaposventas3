import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Purchase } from '../../types';
import { onSupplierPurchasesUpdate, updatePurchase, deletePurchase } from '../../services/suppliersService';
import { addExpense } from '../../services/expensesService';
import { format, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { EXPENSE_CATEGORIES } from '../../constants';
import PurchaseModal from './PurchaseModal'; // Reusing PurchaseModal for editing

interface PurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
}

const PurchaseHistoryModal: React.FC<PurchaseHistoryModalProps> = ({ isOpen, onClose, supplierId, supplierName }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditPurchaseModalOpen, setIsEditPurchaseModalOpen] = useState(false);
  const [currentPurchaseToEdit, setCurrentPurchaseToEdit] = useState<Purchase | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (isOpen && supplierId) {
      setLoading(true);
      const unsubscribe = onSupplierPurchasesUpdate(supplierId, (fetchedPurchases) => {
        setPurchases(fetchedPurchases);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isOpen, supplierId]);

  const handleMarkAsPaid = async (purchase: Purchase) => {
    if (!currentUser || !currentUser.uid) {
      alert('Debe iniciar sesión para registrar un pago.');
      return;
    }
    if (!purchase.id) {
      alert('ID de compra no encontrado.');
      return;
    }

    try {
      // 1. Update purchase status
      await updatePurchase(purchase.id, {
        isPaid: true,
        paymentDate: new Date(),
      });

      // 2. Register as an expense
      const branchId = currentUser.branchAssignments ? Object.keys(currentUser.branchAssignments)[0] : undefined;
      if (!branchId) {
        alert('No se pudo determinar la sucursal para registrar el gasto.');
        return;
      }

      await addExpense({
        branchId: branchId,
        concept: `Pago a Proveedor: ${supplierName} (Factura: ${purchase.invoiceNumber})`,
        amount: purchase.totalAmount,
        category: EXPENSE_CATEGORIES.find(cat => cat === "Compra Proveedores") || "Otros Gastos",
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Desconocido',
      });
      alert('Pago registrado con éxito y gasto registrado.');
    } catch (error) {
      console.error("Error marking purchase as paid or adding expense:", error);
      alert('Error al registrar el pago o el gasto.');
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta compra?')) {
      try {
        await deletePurchase(purchaseId);
        alert('Compra eliminada con éxito.');
      } catch (error) {
        console.error("Error deleting purchase:", error);
        alert('Error al eliminar la compra.');
      }
    }
  };

  const handleEditPurchase = (purchaseToEdit: Purchase) => {
    setCurrentPurchaseToEdit(purchaseToEdit);
    setIsEditPurchaseModalOpen(true);
  };

  const handleSaveEditedPurchase = async (editedPurchaseData: Omit<Purchase, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    if (!currentUser || !currentUser.uid) {
      alert('Debe iniciar sesión para editar una compra.');
      return;
    }
    if (!currentPurchaseToEdit?.id) {
      alert('ID de compra no encontrado para editar.');
      return;
    }

    try {
      await updatePurchase(currentPurchaseToEdit.id, {
        ...editedPurchaseData,
        purchaseDate: editedPurchaseData.purchaseDate, // Already Date object
        ...(editedPurchaseData.paymentType === 'credito' && { dueDate: editedPurchaseData.dueDate }), // Only include dueDate if paymentType is 'credito'
      });
      alert('Compra actualizada con éxito.');
      setIsEditPurchaseModalOpen(false);
      setCurrentPurchaseToEdit(null);
    } catch (error) {
      console.error("Error updating purchase:", error);
      alert('Error al actualizar la compra.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Historial de Compras de ${supplierName}`} size="full">
      {loading ? (
        <p className="text-gray-800 dark:text-white">Cargando historial de compras...</p>
      ) : purchases.length === 0 ? (
        <p className="text-gray-800 dark:text-white">No hay compras registradas para este proveedor.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Factura/Boleta
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ítems
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Tipo Pago
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Fecha Compra
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Fecha Venc.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {purchases.map((purchase) => {
                const isCredit = purchase.paymentType === 'credito';
                const isPaid = isCredit && purchase.isPaid;
                const dueDate = isCredit && purchase.dueDate ? new Date(purchase.dueDate) : null;
                const isDueTodayOrPast = dueDate && (isToday(dueDate) || isPast(dueDate));

                return (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {purchase.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {purchase.itemCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {purchase.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {isCredit ? 'Crédito' : 'Contado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(purchase.purchaseDate, 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isCredit ? (isPaid ? <span className="text-green-600">Pagado</span> : <span className="text-red-600">Pendiente</span>) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {isCredit && !isPaid && isDueTodayOrPast && (
                          <Button onClick={() => handleMarkAsPaid(purchase)} variant="success" size="sm">
                            Pagar
                          </Button>
                        )}
                        <Button onClick={() => handleEditPurchase(purchase)} variant="secondary" size="sm">
                          Editar
                        </Button>
                        <Button onClick={() => handleDeletePurchase(purchase.id!)} variant="danger" size="sm">
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {currentPurchaseToEdit && (
        <PurchaseModal
          isOpen={isEditPurchaseModalOpen}
          onClose={() => setIsEditPurchaseModalOpen(false)}
          onSave={handleSaveEditedPurchase}
          supplierId={currentPurchaseToEdit.supplierId}
          supplierName={supplierName} // Pass current supplier name
          contactPerson={supplierName} // Pass contact person for editing
          initialData={{ // Pass initial data for editing
            invoiceNumber: currentPurchaseToEdit.invoiceNumber,
            itemCount: currentPurchaseToEdit.itemCount,
            totalAmount: currentPurchaseToEdit.totalAmount,
            paymentType: currentPurchaseToEdit.paymentType,
            purchaseDate: format(currentPurchaseToEdit.purchaseDate, 'yyyy-MM-dd'),
            dueDate: currentPurchaseToEdit.dueDate ? format(currentPurchaseToEdit.dueDate, 'yyyy-MM-dd') : '',
          }}
        />
      )}
    </Modal>
  );
};

export default PurchaseHistoryModal;
