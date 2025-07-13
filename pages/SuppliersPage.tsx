import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { Supplier } from '../types';
import { onSuppliersUpdate, addSupplier, updateSupplier, deleteSupplier, addPurchase, onSupplierPurchasesUpdate } from '../services/suppliersService';
import { addExpense } from '../services/expensesService';
import { getMainBranch } from '../services/branchService'; // Import getMainBranch
import PurchaseModal from '../components/suppliers/PurchaseModal';
import PurchaseHistoryModal from '../components/suppliers/PurchaseHistoryModal'; // New component
import { Purchase } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // For Add/Edit Supplier Modal
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({ name: '', contactPerson: '', phone: '', email: '', rucNit: '', address: '' });
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false); // For Purchase Modal
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState<Supplier | null>(null);
  const [isPurchaseHistoryModalOpen, setIsPurchaseHistoryModalOpen] = useState(false); // For Purchase History Modal
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<Supplier | null>(null);
  const [creditAlerts, setCreditAlerts] = useState<{ supplierName: string; dueDate: Date; daysRemaining: number }[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSuppliersUpdate(setSuppliers);
    setLoading(false);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Monitor credit purchases for alerts
    const today = new Date();
    const alerts: { supplierName: string; dueDate: Date; daysRemaining: number }[] = [];

    // This useEffect will now manage a single subscription for all credit purchases
    // to avoid multiple subscriptions per supplier.
    // This is a more efficient approach for monitoring alerts.
    const unsubscribeAllPurchases = onSupplierPurchasesUpdate('all', (purchases) => { // 'all' is a placeholder, will filter by supplierId later
      const today = new Date();
      const newAlerts: { supplierName: string; dueDate: Date; daysRemaining: number }[] = [];

      purchases.filter(p => p.paymentType === 'credito' && p.dueDate).forEach(purchase => {
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        if (supplier) {
          const dueDate = new Date(purchase.dueDate!);
          const timeDiff = dueDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

          if (daysRemaining <= 7 && daysRemaining >= 0) { // Alert if due in 7 days or less, but not overdue
            newAlerts.push({
              supplierName: supplier.name,
              dueDate: dueDate,
              daysRemaining: daysRemaining,
            });
          }
        }
      });
      setCreditAlerts(newAlerts);
    });

    return () => unsubscribeAllPurchases();
  }, [suppliers]); // Re-run when suppliers change to update supplier names in alerts

  const openModalForAdd = () => {
    setIsEditing(false);
    setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', rucNit: '', address: '' });
    setIsModalOpen(true);
  };

  const openPurchaseHistoryModal = (supplier: Supplier) => {
    setSelectedSupplierForHistory(supplier);
    setIsPurchaseHistoryModalOpen(true);
  };

  const openPurchaseModal = (supplier: Supplier) => {
    setSelectedSupplierForPurchase(supplier);
    setIsPurchaseModalOpen(true);
  };

  const handleSavePurchase = async (purchaseData: Omit<Purchase, 'id' | 'timestamp' | 'userId' | 'userName'>, supplierName: string) => {
    if (!currentUser || !currentUser.uid) {
      alert('Debe iniciar sesión para registrar una compra.');
      return;
    }
    try {
      await addPurchase({
        ...purchaseData,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Desconocido',
        timestamp: new Date(),
      });

      if (purchaseData.paymentType === 'contado') {
        // Also register as an expense
        let branchId = currentUser.branchAssignments ? Object.keys(currentUser.branchAssignments)[0] : undefined; // Assuming user is assigned to at least one branch
        
        if (!branchId) {
          // If user has no explicit branch assignment, try to get the main branch
          const mainBranch = await getMainBranch();
          if (mainBranch) {
            branchId = mainBranch.id;
          }
        }

        if (!branchId) {
          alert('No se pudo determinar la sucursal para registrar el gasto. Asegúrese de que haya una sucursal principal configurada o que el usuario tenga una sucursal asignada.');
          return;
        }

        await addExpense({
          branchId: branchId,
          concept: `Compra a Proveedor: ${supplierName} (Factura: ${purchaseData.invoiceNumber})`,
          amount: purchaseData.totalAmount,
          category: EXPENSE_CATEGORIES.find(cat => cat === "Compra Proveedores") || "Otros Gastos",
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email || 'Desconocido',
        });
        alert('Compra registrada con éxito y gasto registrado.');
      } else {
        alert('Compra registrada con éxito.');
      }
      setIsPurchaseModalOpen(false);
    } catch (error) {
      console.error("Error adding purchase or expense:", error);
      alert('Error al registrar la compra o el gasto.');
    }
  };

  const openModalForEdit = (supplier: Supplier) => {
    setIsEditing(true);
    setCurrentSupplier(supplier);
    setNewSupplier({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      rucNit: supplier.rucNit,
      address: supplier.address || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    if (isEditing && currentSupplier) {
      await handleUpdateSupplier();
    } else {
      await handleAddSupplier();
    }
  };

  const handleAddSupplier = async () => {
    if (!currentUser) {
      alert('Debe iniciar sesión para agregar un proveedor.');
      return;
    }
    try {
      await addSupplier(newSupplier);
      alert('Proveedor agregado con éxito.');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
      alert('Error al agregar el proveedor.');
    }
  };

  const handleUpdateSupplier = async () => {
    if (!currentSupplier) return;
    try {
      await updateSupplier(currentSupplier.id!, newSupplier);
      alert('Proveedor actualizado con éxito.');
      setIsModalOpen(false);
      setCurrentSupplier(null);
    } catch (error) {
      console.error("Error updating supplier:", error);
      alert('Error al actualizar el proveedor.');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      try {
        await deleteSupplier(id);
        alert('Proveedor eliminado con éxito.');
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert('Error al eliminar el proveedor.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Proveedores</h1>
        <Button onClick={openModalForAdd}>Agregar Proveedor</Button>
      </div>
      <Card>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Lista de Proveedores</h2>
        {loading ? (
          <p className="text-gray-800 dark:text-white">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Nombre</th>
                  <th scope="col" className="px-6 py-3">Contacto</th>
                  <th scope="col" className="px-6 py-3">Teléfono</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">RUC/NIT</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{supplier.name}</td>
                    <td className="px-6 py-4">{supplier.contactPerson}</td>
                    <td className="px-6 py-4">{supplier.phone}</td>
                    <td className="px-6 py-4">{supplier.email}</td>
                    <td className="px-6 py-4">{supplier.rucNit}</td>
                    <td className="px-6 py-4">
                      <Button onClick={() => openModalForEdit(supplier)} variant="secondary" size="sm" className="mr-2">Editar</Button>
                      <Button onClick={() => handleDeleteSupplier(supplier.id!)} variant="danger" size="sm" className="mr-2">Eliminar</Button>
                      <Button onClick={() => openPurchaseModal(supplier)} variant="primary" size="sm" className="mr-2">Registrar Compra</Button>
                      <Button onClick={() => openPurchaseHistoryModal(supplier)} variant="info" size="sm">Ver Compras</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creditAlerts.length > 0 && (
        <Card className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <h3 className="font-bold">Alertas de Pagos a Crédito Próximos:</h3>
          <ul className="list-disc list-inside">
            {creditAlerts.map((alert, index) => (
              <li key={index}>
                <strong>{alert.supplierName}</strong>: Vence el {alert.dueDate.toLocaleDateString()} (en {alert.daysRemaining} días)
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Proveedor" : "Agregar Proveedor"}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
          <Input type="text" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</label>
          <Input type="text" value={newSupplier.contactPerson} onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
          <Input type="text" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <Input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RUC/NIT</label>
          <Input type="text" value={newSupplier.rucNit} onChange={(e) => setNewSupplier({ ...newSupplier, rucNit: e.target.value })} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
          <Input type="text" value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="mr-2">Cancelar</Button>
          <Button onClick={handleFormSubmit}>{isEditing ? "Actualizar" : "Agregar"}</Button>
        </div>
      </Modal>

      {selectedSupplierForPurchase && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onSave={(data) => handleSavePurchase(data, selectedSupplierForPurchase.name)}
          supplierId={selectedSupplierForPurchase.id!}
          supplierName={selectedSupplierForPurchase.name}
          contactPerson={selectedSupplierForPurchase.contactPerson}
        />
      )}

      {selectedSupplierForHistory && (
        <PurchaseHistoryModal
          isOpen={isPurchaseHistoryModalOpen}
          onClose={() => setIsPurchaseHistoryModalOpen(false)}
          supplierId={selectedSupplierForHistory.id!}
          supplierName={selectedSupplierForHistory.name}
        />
      )}
    </div>
  );
};

export default SuppliersPage;
