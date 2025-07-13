import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import * as concentrationService from '../../services/concentrationService'; // RUTA CORREGIDA

interface ManageConcentrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Concentration {
  id?: string;
  name: string;
}

const ManageConcentrationsModal: React.FC<ManageConcentrationsModalProps> = ({ isOpen, onClose }) => {
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newConcentrationName, setNewConcentrationName] = useState('');
  const [editingConcentration, setEditingConcentration] = useState<Concentration | null>(null);
  const [editedConcentrationName, setEditedConcentrationName] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchConcentrations();
    }
  }, [isOpen]);

  const fetchConcentrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await concentrationService.getConcentrations();
      setConcentrations(data);
    } catch (err: any) {
      setError('Error al cargar las concentraciones.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConcentration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcentrationName.trim()) {
      setError('El nombre de la concentración no puede estar vacío.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await concentrationService.addConcentration({ name: newConcentrationName });
      setNewConcentrationName('');
      fetchConcentrations(); // Refresh list
    } catch (err: any) {
      setError('Error al agregar la concentración.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditConcentration = (concentration: Concentration) => {
    setEditingConcentration(concentration);
    setEditedConcentrationName(concentration.name);
  };

  const handleUpdateConcentration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConcentration || !editedConcentrationName.trim()) {
      setError('El nombre de la concentración no puede estar vacío.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (editingConcentration.id) {
        await concentrationService.updateConcentration(editingConcentration.id, { name: editedConcentrationName });
        setEditingConcentration(null);
        setEditedConcentrationName('');
        fetchConcentrations(); // Refresh list
      }
    } catch (err: any) {
      setError('Error al actualizar la concentración.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConcentration = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta concentración?')) {
      setLoading(true);
      setError(null);
      try {
        await concentrationService.deleteConcentration(id);
        fetchConcentrations(); // Refresh list
      } catch (err: any) {
        setError('Error al eliminar la concentración.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Concentraciones">
      <div className="p-4">
        {loading && <Spinner />}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* Add New Concentration Form */}
        <form onSubmit={handleAddConcentration} className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Agregar Nueva Concentración</h3>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Nombre de la Concentración"
              value={newConcentrationName}
              onChange={(e) => setNewConcentrationName(e.target.value)}
              className="flex-grow"
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              Agregar
            </Button>
          </div>
        </form>

        {/* List of Concentrations */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Concentraciones Existentes</h3>
          {concentrations.length === 0 && !loading && <p className="text-gray-500">No hay concentraciones registradas.</p>}
          <ul>
            {concentrations.map(concentration => (
              <li key={concentration.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 py-2">
                {editingConcentration?.id === concentration.id ? (
                  <form onSubmit={handleUpdateConcentration} className="flex-grow flex space-x-2">
                    <Input
                      type="text"
                      value={editedConcentrationName}
                      onChange={(e) => setEditedConcentrationName(e.target.value)}
                      className="flex-grow"
                      disabled={loading}
                    />
                    <Button type="submit" size="sm" disabled={loading}>Guardar</Button>
                    <Button type="button" onClick={() => setEditingConcentration(null)} variant="secondary" size="sm" disabled={loading}>Cancelar</Button>
                  </form>
                ) : (
                  <>
                    <span className="text-gray-800 dark:text-white">{concentration.name}</span>
                    <div>
                      <Button onClick={() => handleEditConcentration(concentration)} size="sm" className="mr-2" disabled={loading}>Editar</Button>
                      <Button onClick={() => concentration.id && handleDeleteConcentration(concentration.id)} variant="danger" size="sm" disabled={loading}>Eliminar</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ManageConcentrationsModal;
