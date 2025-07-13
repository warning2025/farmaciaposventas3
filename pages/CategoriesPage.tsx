import React, { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { Category } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { PlusCircle, Edit, Trash2, Tag, AlertTriangle } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError('Error al cargar las categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category: Category | null = null) => {
    setCurrentCategory(category);
    setCategoryName(category ? category.name : '');
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
    setCategoryName('');
  };

  const openDeleteModal = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('El nombre de la categoría no puede estar vacío.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      if (currentCategory) {
        await updateCategory(currentCategory.id, categoryName);
      } else {
        await addCategory(categoryName);
      }
      await fetchCategories();
      closeModal();
    } catch (err) {
      setError('Error al guardar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCategory) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(currentCategory.id);
      await fetchCategories();
      closeDeleteModal();
    } catch (err) {
      setError('Error al eliminar la categoría. Asegúrate de que no esté siendo usada por ningún producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
          <Tag size={32} className="mr-3 text-cyan-600 dark:text-cyan-400" />
          Gestión de Categorías
        </h1>
        <Button onClick={() => openModal()} icon={<PlusCircle size={20} />} variant="primary">
          Añadir Categoría
        </Button>
      </div>

      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">{error}</p>}

      <Card className="shadow-lg dark:bg-gray-800">
        {loading ? (
          <div className="p-6 text-center"><Spinner /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{category.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModal(category)}><Edit size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteModal(category)} className="text-red-500"><Trash2 size={16} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentCategory ? 'Editar Categoría' : 'Añadir Categoría'}>
        <form onSubmit={handleSubmit}>
          <Input
            label="Nombre de la Categoría"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Ej: Antibióticos"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Confirmar Eliminación">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-lg">¿Estás seguro de que deseas eliminar la categoría "{currentCategory?.name}"?</p>
          <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <Button variant="ghost" onClick={closeDeleteModal}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
            {isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
