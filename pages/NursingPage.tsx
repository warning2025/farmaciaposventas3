import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { NursingRecord, NursingServiceType, UserRole } from '../types';
import {
  createNursingRecord,
  onNursingRecordsUpdate,
  deleteNursingRecord,
  deleteNursingRecords,
} from '../services/nursingService';

const NursingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<NursingRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Omit<NursingRecord, 'id' | 'date'> | null>(null);
  const receiptToPrintRef = useRef<HTMLDivElement>(null);

  // Form state
  const [patientName, setPatientName] = useState('');
  const [serviceType, setServiceType] = useState<NursingServiceType>(NursingServiceType.CONSULTA);
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState(0);

  useEffect(() => {
    let branchIdToFilter: string | undefined;
    if (currentUser && currentUser.role !== UserRole.ADMIN && currentUser.branchAssignments) {
      const assignedBranchIds = Object.keys(currentUser.branchAssignments);
      if (assignedBranchIds.length > 0) {
        branchIdToFilter = assignedBranchIds[0];
      }
    }

    console.log("NursingPage: currentUser", currentUser);
    console.log("NursingPage: branchIdToFilter", branchIdToFilter);

    const unsubscribe = onNursingRecordsUpdate((records) => {
      console.log("NursingPage: Records data received", records);
      setRecords(records);
    }, branchIdToFilter);
    return () => unsubscribe();
  }, [currentUser]);

  const resetForm = () => {
    setPatientName('');
    setServiceType(NursingServiceType.CONSULTA);
    setNotes('');
    setCost(0);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Debe iniciar sesión para registrar un servicio.');
      return;
    }
    if (!patientName || cost <= 0) {
      alert('Por favor, complete el nombre del paciente y un costo válido.');
      return;
    }

    let recordBranchId: string | undefined;
    if (currentUser && currentUser.branchAssignments) {
      const assignedBranchIds = Object.keys(currentUser.branchAssignments);
      if (assignedBranchIds.length > 0) {
        recordBranchId = assignedBranchIds[0];
      }
    }

    if (!recordBranchId) {
      alert('No se pudo determinar la sucursal para registrar el servicio. Asegúrate de que el usuario tenga una sucursal asignada.');
      setIsLoading(false);
      return;
    }

    const recordToCreate = {
      branchId: recordBranchId,
      patientName,
      serviceType,
      notes,
      cost,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'N/A',
    };
    setNewRecord(recordToCreate);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    const printContent = receiptToPrintRef.current;
    if (printContent) {
      const receiptWindow = window.open('', '', 'width=800,height=600');
      receiptWindow?.document.write('<html><head><title>Recibo de Servicio</title>');
      receiptWindow?.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">');
      receiptWindow?.document.write('</head><body>');
      receiptWindow?.document.write(printContent.innerHTML);
      receiptWindow?.document.write('</body></html>');
      receiptWindow?.document.close();
      receiptWindow?.print();
    }
  };

  const handleConfirmRecord = async () => {
    if (!newRecord) return;

    setIsLoading(true);
    try {
      await createNursingRecord(newRecord);
      alert('Servicio de enfermería registrado con éxito.');
      handlePrint();
      resetForm();
      setIsModalOpen(false);
      setNewRecord(null);
    } catch (error) {
      console.error("Error creating nursing record: ", error);
      alert('Error al registrar el servicio.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords(prev =>
      prev.includes(recordId) ? prev.filter(id => id !== recordId) : [...prev, recordId]
    );
  };

  const handleDeleteSelectedRecords = async () => {
    if (selectedRecords.length === 0) {
      alert('No hay registros seleccionados para eliminar.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedRecords.length} registros?`)) {
      try {
        const recordsToDelete = records.filter(record => selectedRecords.includes(record.id!));
        await deleteNursingRecords(recordsToDelete);
        alert('Registros eliminados con éxito.');
        setSelectedRecords([]);
      } catch (error) {
        console.error("Error deleting selected records: ", error);
        alert('Error al eliminar los registros seleccionados.');
      }
    }
  };

  const handleDeleteRecord = async (record: NursingRecord) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      try {
        if (!record.id) throw new Error("Record ID is missing");
        await deleteNursingRecord(record.id, record.cost);
        alert('Registro eliminado con éxito.');
      } catch (error) {
        console.error("Error deleting record: ", error);
        alert('Error al eliminar el registro.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Módulo de Enfermería</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Registrar Nuevo Servicio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-300">Nombre del Paciente</label>
              <Input
                type="text"
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-300">Tipo de Servicio</label>
              <Select
                id="serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as NursingServiceType)}
                options={Object.values(NursingServiceType).map(type => ({ value: type, label: type }))}
              />
            </div>
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-300">Costo (Bs.)</label>
              <Input
                type="number"
                id="cost"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notas Adicionales</label>
              <Input
                type="text"
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles del servicio, medicamentos aplicados, etc."
              />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrar Servicio'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Historial de Servicios</h2>
        {currentUser?.role === UserRole.ADMIN && selectedRecords.length > 0 && (
          <div className="mb-4">
            <Button onClick={handleDeleteSelectedRecords} variant="danger">
              Eliminar Seleccionados ({selectedRecords.length})
            </Button>
          </div>
        )}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                <tr>
                  {currentUser?.role === UserRole.ADMIN && (
                    <th scope="col" className="p-4">
                      <div className="flex items-center">
                        <input id="checkbox-all" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecords(records.map(r => r.id!));
                            } else {
                              setSelectedRecords([]);
                            }
                          }}
                          checked={selectedRecords.length === records.length && records.length > 0}
                        />
                        <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                      </div>
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3">Fecha</th>
                  <th scope="col" className="px-6 py-3">Paciente</th>
                  <th scope="col" className="px-6 py-3">Servicio</th>
                  <th scope="col" className="px-6 py-3">Costo</th>
                  <th scope="col" className="px-6 py-3">Atendido por</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                    {currentUser?.role === UserRole.ADMIN && (
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input id={`checkbox-${record.id}`} type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            checked={selectedRecords.includes(record.id!)}
                            onChange={() => handleSelectRecord(record.id!)}
                          />
                          <label htmlFor={`checkbox-${record.id}`} className="sr-only">checkbox</label>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">{new Date(record.date).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{record.patientName}</td>
                    <td className="px-6 py-4">{record.serviceType}</td>
                    <td className="px-6 py-4">{record.cost.toFixed(2)} Bs.</td>
                    <td className="px-6 py-4">{record.userName}</td>
                    <td className="px-6 py-4">
                      {currentUser?.role === UserRole.ADMIN && (
                        <Button onClick={() => handleDeleteRecord(record)} variant="danger" size="sm">Eliminar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {newRecord && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirmar Servicio de Enfermería">
          <div ref={receiptToPrintRef} style={{ display: 'none' }}>
              <h2 className="text-xl font-bold text-center">Recibo de Servicio</h2>
              <p className="text-center">Farmacia Unzueta</p>
              <hr className="my-2" />
              <p><strong>Paciente:</strong> {newRecord.patientName}</p>
              <p><strong>Servicio:</strong> {newRecord.serviceType}</p>
              <p><strong>Notas:</strong> {newRecord.notes}</p>
              <hr className="my-2" />
              <div className="text-right">
                <p className="text-xl font-bold"><strong>Total:</strong> {newRecord.cost.toFixed(2)} Bs.</p>
              </div>
          </div>
          <p className='text-gray-800 dark:text-white'>¿Confirmar el registro del servicio?</p>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="mr-2" disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleConfirmRecord} disabled={isLoading}>
              {isLoading ? 'Confirmando...' : 'Confirmar e Imprimir'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NursingPage;
