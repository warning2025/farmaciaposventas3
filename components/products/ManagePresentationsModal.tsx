import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import * as presentationService from '../../services/presentationService'; // RUTA CORREGIDA

interface Presentation {
  id: string;
  name: string;
}

interface ManagePresentationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManagePresentationsModal: React.FC<ManagePresentationsModalProps> = ({ isOpen, onClose }) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [newPresentationName, setNewPresentationName] = useState('');
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPresentations();
    }
  }, [isOpen]);

  const fetchPresentations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await presentationService.getPresentations();
      setPresentations(data);
    } catch (err: any) {
      setError('Error al cargar las presentaciones.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPresentation = async () => {
    if (!newPresentationName.trim()) {
      setError('El nombre de la presentación no puede estar vacío.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newPresentation = { name: newPresentationName };
      await presentationService.addPresentation(newPresentation);
      setNewPresentationName('');
      fetchPresentations(); // Refresh list
    } catch (err: any) {
      setError('Error al agregar la presentación.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePresentation = async () => {
    if (!editingPresentation || !editingPresentation.name.trim()) {
      setError('El nombre de la presentación no puede estar vacío.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await presentationService.updatePresentation(editingPresentation.id, { name: editingPresentation.name });
      setEditingPresentation(null);
      fetchPresentations(); // Refresh list
    } catch (err: any) {
      setError('Error al actualizar la presentación.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePresentation = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta presentación?')) {
      setLoading(true);
      setError(null);
      try {
        await presentationService.deletePresentation(id);
        fetchPresentations(); // Refresh list
      } catch (err: any) {
        setError('Error al eliminar la presentación.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Presentaciones">
      {loading && <Spinner />}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Agregar Nueva Presentación</h3>
        <div className="flex">
          <Input
            type="text"
            placeholder="Nombre de la presentación"
            value={newPresentationName}
            onChange={(e) => setNewPresentationName(e.target.value)}
            className="mr-2 flex-grow"
          />
          <Button onClick={handleAddPresentation} disabled={loading}>
            Agregar
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Presentaciones Existentes</h3>
        {presentations.length === 0 && !loading && <p className="text-gray-600 dark:text-gray-400">No hay presentaciones registradas.</p>}
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {presentations.map(presentation => (
            <li key={presentation.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {editingPresentation?.id === presentation.id ? (
                <Input
                  type="text"
                  value={editingPresentation.name}
                  onChange={(e) => setEditingPresentation({ ...editingPresentation, name: e.target.value })}
                  className="flex-grow mr-2"
                />
              ) : (
                <span className="text-gray-800 dark:text-white">{presentation.name}</span>
              )}
              <div className="flex space-x-2">
                {editingPresentation?.id === presentation.id ? (
                  <Button onClick={handleUpdatePresentation} size="sm" disabled={loading}>Guardar</Button>
                ) : (
                  <Button onClick={() => setEditingPresentation(presentation)} size="sm" variant="secondary">Editar</Button>
                )}
                <Button onClick={() => handleDeletePresentation(presentation.id)} size="sm" variant="danger" disabled={loading}>Eliminar</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={onClose} variant="secondary">Cerrar</Button>
      </div>
    </Modal>
  );
};

export default ManagePresentationsModal;
