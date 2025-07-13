import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useAuth } from '../hooks/useAuth';
import { UserProfile, UserRole } from '../types';
import { onUsersUpdate, addUser, updateUser, deleteUser } from '../services/usersService';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserProfile | null>(null);
  const [newUserData, setNewUserData] = useState({ email: '', password: '', role: UserRole.CASHIER, displayName: '' });
  const { currentUser } = useAuth();

  const roleOptions = Object.values(UserRole).map(role => ({ value: role, label: role }));

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onUsersUpdate(setUsers);
    setLoading(false);
    return () => unsubscribe();
  }, []);

  const openModalForAdd = () => {
    setIsEditing(false);
    setNewUserData({ email: '', password: '', role: UserRole.CASHIER, displayName: '' });
    setIsModalOpen(true);
  };

  const openModalForEdit = (user: UserProfile) => {
    setIsEditing(true);
    setCurrentUserData(user);
    setNewUserData({ email: user.email || '', password: '', role: user.role || UserRole.CASHIER, displayName: user.displayName || '' });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    if (isEditing && currentUserData) {
      await handleUpdateUser();
    } else {
      await handleAddUser();
    }
  };

  const handleAddUser = async () => {
    if (!currentUser) {
      alert('Debe iniciar sesión para agregar un usuario.');
      return;
    }
    try {
      await addUser(newUserData);
      alert('Usuario agregado con éxito.');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      alert('Error al agregar el usuario.');
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUserData) return;
    try {
      await updateUser(currentUserData.uid, {
        role: newUserData.role,
        displayName: newUserData.displayName,
      });
      alert('Usuario actualizado con éxito.');
      setIsModalOpen(false);
      setCurrentUserData(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Error al actualizar el usuario.');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await deleteUser(uid);
        alert('Usuario eliminado con éxito.');
      } catch (error) {
        console.error("Error deleting user:", error);
        alert('Error al eliminar el usuario.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Usuarios</h1>
        <Button onClick={openModalForAdd}>Agregar Usuario</Button>
      </div>
      <Card>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Lista de Usuarios</h2>
        {loading ? (
          <p className="text-gray-800 dark:text-white">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Nombre</th>
                  <th scope="col" className="px-6 py-3">Rol</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.uid} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{user.email}</td>
                    <td className="px-6 py-4">{user.displayName}</td>
                    <td className="px-6 py-4">{user.role}</td>
                    <td className="px-6 py-4">
                      <Button onClick={() => openModalForEdit(user)} variant="secondary" size="sm" className="mr-2">Editar</Button>
                      <Button onClick={() => handleDeleteUser(user.uid)} variant="danger" size="sm">Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Editar Usuario" : "Agregar Usuario"}>
        <div>
          <label>Email</label>
          <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} disabled={isEditing} />
        </div>
        {!isEditing && (
          <div className="mt-4">
            <label>Contraseña</label>
            <Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} />
          </div>
        )}
        <div className="mt-4">
          <label>Nombre</label>
          <Input type="text" value={newUserData.displayName} onChange={(e) => setNewUserData({ ...newUserData, displayName: e.target.value })} />
        </div>
        <div className="mt-4">
          <label>Rol</label>
          <Select
            options={roleOptions}
            value={newUserData.role}
            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="mr-2">Cancelar</Button>
          <Button onClick={handleFormSubmit}>{isEditing ? "Actualizar" : "Agregar"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
