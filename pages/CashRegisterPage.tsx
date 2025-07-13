import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { onCurrentCashRegisterSummaryUpdate, closeCashRegister, openCashRegister, onCashRegisterEntriesUpdate } from '../services/cashRegisterService';
import { updateSaleStatus, onSalesUpdate } from '../services/salesService';
import { CashRegisterEntry, CashRegisterSummary, Sale, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';

const CashRegisterPage: React.FC = () => {
  const [entries, setEntries] = useState<CashRegisterEntry[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualBalance, setActualBalance] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
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

    console.log("CashRegisterPage: currentUser", currentUser);
    console.log("CashRegisterPage: branchIdToFilter", branchIdToFilter);

    const unsubscribeSummary = onCurrentCashRegisterSummaryUpdate((summaryData) => {
      console.log("CashRegisterPage: Summary data received", summaryData);
      setSummary(summaryData);
      setLoading(false);
    }, branchIdToFilter);
    
    const unsubscribeSales = onSalesUpdate((sales) => {
      console.log("CashRegisterPage: Sales data received", sales);
      setSales(sales);
    }, branchIdToFilter); // Assuming sales also need to be filtered by branch

    return () => {
      unsubscribeSummary();
      unsubscribeSales();
    };
  }, [currentUser]);

  useEffect(() => {
    console.log("CashRegisterPage: Summary for entries", summary);
    const unsubscribeEntries = onCashRegisterEntriesUpdate(summary, (allEntries) => {
      console.log("CashRegisterPage: Entries data received", allEntries);
      const saleEntries = allEntries.filter(e => e.type === 'sale');
      const otherEntries = allEntries.filter(e => e.type !== 'sale');
      
      // This is a simplified approach. A better approach would be to fetch the sale doc for each sale entry.
      // For now, we just filter and will enhance the data structure later if needed.
      setEntries(allEntries);
    });

    return () => {
      unsubscribeEntries();
    };
  }, [summary]);

  useEffect(() => {
    const unsubscribeEntries = onCashRegisterEntriesUpdate(summary, (allEntries) => {
      const saleEntries = allEntries.filter(e => e.type === 'sale');
      const otherEntries = allEntries.filter(e => e.type !== 'sale');
      
      // This is a simplified approach. A better approach would be to fetch the sale doc for each sale entry.
      // For now, we just filter and will enhance the data structure later if needed.
      setEntries(allEntries);
    });

    return () => {
      unsubscribeEntries();
    };
  }, [summary]);

  const handleOpenRegister = async () => {
    if (!currentUser) {
      alert('Debe iniciar sesión para abrir la caja.');
      return;
    }

    let cashRegisterBranchId: string | undefined;
    if (currentUser.branchAssignments) {
      const assignedBranchIds = Object.keys(currentUser.branchAssignments);
      if (assignedBranchIds.length > 0) {
        cashRegisterBranchId = assignedBranchIds[0];
      }
    }

    if (!cashRegisterBranchId) {
      alert('No se pudo determinar la sucursal para abrir la caja. Asegúrate de que el usuario tenga una sucursal asignada.');
      return;
    }

    try {
      await openCashRegister(openingBalance, currentUser.uid, currentUser.displayName || 'N/A', cashRegisterBranchId);
      alert('Caja abierta con éxito.');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error opening cash register:", error);
      alert('Error al abrir la caja.');
    }
  };

  const handleCloseRegister = async () => {
    if (!summary || !currentUser) {
      alert('No hay resumen de caja o usuario actual para cerrar la caja.');
      return;
    }

    let cashRegisterBranchId: string | undefined;
    if (currentUser.branchAssignments) {
      const assignedBranchIds = Object.keys(currentUser.branchAssignments);
      if (assignedBranchIds.length > 0) {
        cashRegisterBranchId = assignedBranchIds[0];
      }
    }

    if (!cashRegisterBranchId) {
      alert('No se pudo determinar la sucursal para cerrar la caja. Asegúrate de que el usuario tenga una sucursal asignada.');
      return;
    }

    try {
      await closeCashRegister(summary.id!, actualBalance, currentUser.uid, currentUser.displayName || 'N/A', cashRegisterBranchId);
      alert('Caja cerrada con éxito.');
    } catch (error) {
      console.error("Error closing cash register:", error);
      alert('Error al cerrar la caja.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Caja</h1>
        {!summary && !loading && (
          <Button onClick={() => setIsModalOpen(true)}>Abrir Caja</Button>
        )}
      </div>
      {loading ? (
        <p className="text-gray-800 dark:text-white">Cargando...</p>
      ) : summary ? (
        <Card className="mb-4">
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Resumen de Caja</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-800 dark:text-white">
            <p><strong>Saldo Inicial:</strong> {summary.openingBalance.toFixed(2)}</p>
            <p><strong>Ingresos Totales:</strong> {summary.totalIncome.toFixed(2)}</p>
            <p><strong>Gastos Totales:</strong> {summary.totalExpense.toFixed(2)}</p>
            <p><strong>Saldo Esperado:</strong> {summary.expectedBalance.toFixed(2)}</p>
          </div>
          <div className="mt-4">
            <label htmlFor="actualBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Real</label>
            <input
              type="number"
              id="actualBalance"
              value={actualBalance}
              onChange={(e) => setActualBalance(parseFloat(e.target.value))}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleCloseRegister} className="w-full">Cerrar Caja</Button>
          </div>
        </Card>
      ) : null}
      <Card>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Movimientos de Caja</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Fecha</th>
                <th scope="col" className="px-6 py-3">Tipo</th>
                <th scope="col" className="px-6 py-3">Concepto</th>
                <th scope="col" className="px-6 py-3">Monto</th>
                <th scope="col" className="px-6 py-3">Usuario</th>
                <th scope="col" className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => {
                const sale = entry.type === 'sale' ? sales.find(s => entry.concept.includes(s.id!.substring(0, 6))) : undefined;
                return (
                  <tr key={entry.id} className={`border-b dark:border-gray-700 ${entry.type === 'expense' ? 'bg-red-100 dark:bg-red-900' : 'bg-white dark:bg-gray-800'}`}>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">{entry.type}</td>
                    <td className="px-6 py-4">{entry.concept}</td>
                    <td className="px-6 py-4">{entry.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">{entry.userName}</td>
                    <td className="px-6 py-4">
                      {entry.type === 'sale' && sale?.channel === 'online' && (
                        <div className="flex space-x-2">
                          <select
                            value={sale.status}
                            onChange={(e) => updateSaleStatus(sale.id!, e.target.value as any)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="processing">En Proceso</option>
                            <option value="completed">Completado</option>
                          </select>
                          <Button onClick={() => {
                            setSelectedSale(sale);
                            setIsCustomerModalOpen(true);
                          }}>Ver Cliente</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Abrir Caja">
        <div>
          <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Inicial</label>
          <input
            type="number"
            id="openingBalance"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(parseFloat(e.target.value))}
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="mr-2">Cancelar</Button>
          <Button onClick={handleOpenRegister}>Abrir Caja</Button>
        </div>
      </Modal>

      {selectedSale && (
        <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Información del Cliente">
          <div>
            <p><strong>Nombre:</strong> {selectedSale.userName}</p>
            <p><strong>Teléfono:</strong> {selectedSale.customerPhone}</p>
            <a
              href={`https://wa.me/${selectedSale.customerPhone}?text=Hola%20${selectedSale.userName},%20tu%20pedido%20de%20Farmacia%20Divina%20está%20siendo%20procesado.`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full mt-4">Notificar por WhatsApp</Button>
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CashRegisterPage;
