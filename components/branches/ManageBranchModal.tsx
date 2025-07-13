import React, { useState, useEffect } from 'react';
import { Branch, UserProfile, UserRole } from '../../types';
import { getAllUsers, assignUserToBranch, updateUserBranchAssignment, removeUserBranchAssignment } from '../../services/usersService';
import { updateBranch, deleteBranch } from '../../services/branchService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';

interface ManageBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  onBranchUpdated: () => void; // Callback to refresh branches list
  onBranchDeleted: () => void; // Callback to refresh branches list
}

const ManageBranchModal: React.FC<ManageBranchModalProps> = ({ isOpen, onClose, branch, onBranchUpdated, onBranchDeleted }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserToAssign, setSelectedUserToAssign] = useState('');
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<UserRole>(UserRole.CASHIER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshUsersTrigger, setRefreshUsersTrigger] = useState(0); // New state to trigger user re-fetch

  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // State for editing assigned user
  const [isEditUserAssignmentModalOpen, setIsEditUserAssignmentModalOpen] = useState(false);
  const [userToEditAssignment, setUserToEditAssignment] = useState<UserProfile | null>(null);
  const [newAssignedRole, setNewAssignedRole] = useState<UserRole>(UserRole.CASHIER);

  useEffect(() => {
    if (isOpen && branch) {
      setEditName(branch.name);
      setEditAddress(branch.address);
      setEditPhone(branch.phone || '');
      setEditError(null);
      setSelectedUserToAssign('');
      setSelectedRoleToAssign(UserRole.CASHIER);

      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const usersData = await getAllUsers();
          setAllUsers(usersData);
        } catch (error) {
          console.error("Error fetching users:", error);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, branch, refreshUsersTrigger]); // Add refreshUsersTrigger to dependencies

  // Filter users already assigned to this branch
  const assignedUsers = allUsers.filter(user => user.branchAssignments && user.branchAssignments[branch?.id || '']);
  const unassignedUsers = allUsers.filter(user => !user.branchAssignments || !user.branchAssignments[branch?.id || '']);

  const handleAssignUser = async () => {
    if (!branch || !selectedUserToAssign) {
      alert('Por favor, seleccione un usuario.');
      return;
    }
    setIsSubmitting(true);
    try {
      await assignUserToBranch(selectedUserToAssign, branch.id!, selectedRoleToAssign);
      alert(`Usuario asignado a ${branch.name} con el rol de ${selectedRoleToAssign}.`);
      onBranchUpdated(); // Refresh parent list
      setRefreshUsersTrigger(prev => prev + 1); // Trigger re-fetch of users
      setSelectedUserToAssign('');
      setSelectedRoleToAssign(UserRole.CASHIER);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Error al asignar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!branch) return;
    if (!editName.trim() || !editAddress.trim()) {
      setEditError('Nombre y dirección no pueden estar vacíos.');
      return;
    }
    setIsSubmitting(true);
    setEditError(null);
    try {
      await updateBranch(branch.id!, { name: editName, address: editAddress, phone: editPhone });
      alert('Sucursal actualizada con éxito.');
      onBranchUpdated(); // Refresh parent list
      onClose();
    } catch (error) {
      console.error('Error updating branch:', error);
      setEditError('Error al actualizar la sucursal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!branch) return;
    if (window.confirm(`¿Estás seguro de que deseas eliminar la sucursal "${branch.name}"? Esta acción no se puede deshacer y liberará el código de activación.`)) {
      setIsSubmitting(true);
      try {
        await deleteBranch(branch.id!);
        alert('Sucursal eliminada con éxito. El código de activación ha sido liberado.');
        onBranchDeleted(); // Refresh parent list
        onClose();
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Error al eliminar la sucursal.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const openEditUserAssignmentModal = (user: UserProfile) => {
    setUserToEditAssignment(user);
    setNewAssignedRole(user.branchAssignments![branch!.id!] || UserRole.CASHIER);
    setIsEditUserAssignmentModalOpen(true);
  };

  const handleUpdateUserAssignment = async () => {
    if (!userToEditAssignment || !branch) return;
    setIsSubmitting(true);
    try {
      await updateUserBranchAssignment(userToEditAssignment.uid, branch.id!, newAssignedRole);
      alert(`Rol de ${userToEditAssignment.displayName || userToEditAssignment.email} actualizado a ${newAssignedRole} en ${branch.name}.`);
      onBranchUpdated(); // Refresh parent list
      setRefreshUsersTrigger(prev => prev + 1); // Trigger re-fetch of users
      setIsEditUserAssignmentModalOpen(false);
    } catch (error) {
      console.error('Error updating user assignment:', error);
      alert('Error al actualizar la asignación del usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUserAssignment = async (user: UserProfile) => {
    if (!user || !branch) return;
    if (window.confirm(`¿Estás seguro de que deseas desasignar a ${user.displayName || user.email} de ${branch.name}?`)) {
      setIsSubmitting(true);
      try {
        await removeUserBranchAssignment(user.uid, branch.id!);
        alert(`${user.displayName || user.email} ha sido desasignado de ${branch.name}.`);
        onBranchUpdated(); // Refresh parent list
        setRefreshUsersTrigger(prev => prev + 1); // Trigger re-fetch of users
      } catch (error) {
        console.error('Error removing user assignment:', error);
        alert('Error al desasignar el usuario.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!branch) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Administrar Sucursal: ${branch.name}`}>
      <div className="p-4 space-y-6">
        {/* Edit Branch Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Editar Información de Sucursal</h3>
          <div className="space-y-4">
            <Input
              label="Nombre de la Sucursal"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre de la Sucursal"
            />
            <Input
              label="Dirección"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Dirección de la Sucursal"
            />
            <Input
              label="Teléfono (Opcional)"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="Teléfono de la Sucursal"
            />
            {editError && <p className="text-red-500 text-sm mt-2">{editError}</p>}
            <Button onClick={handleUpdateBranch} className="w-full" isLoading={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Assigned Users Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Usuarios Asignados a esta Sucursal</h3>
          {loadingUsers ? (
            <p>Cargando usuarios asignados...</p>
          ) : assignedUsers.length === 0 ? (
            <p className="text-gray-500">No hay usuarios asignados a esta sucursal.</p>
          ) : (
            <div className="space-y-3">
              {assignedUsers.map(user => (
                <div key={user.uid} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <div>
                    <p className="font-medium">{user.displayName || user.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rol: {user.branchAssignments![branch!.id!]}</p>
                  </div>
                  <div className="space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => openEditUserAssignmentModal(user)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => handleRemoveUserAssignment(user)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Assign New User Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Asignar Nuevo Usuario a Sucursal</h3>
          {loadingUsers ? (
            <p>Cargando usuarios...</p>
          ) : unassignedUsers.length === 0 ? (
            <p className="text-gray-500">Todos los usuarios están asignados o no hay usuarios disponibles.</p>
          ) : (
            <div className="space-y-4">
              <Select
                label="Seleccionar Usuario"
                options={unassignedUsers.map(u => ({ value: u.uid, label: u.displayName || u.email || 'Usuario sin nombre' }))}
                value={selectedUserToAssign}
                onChange={(e) => setSelectedUserToAssign(e.target.value)}
              />
              <Select
                label="Asignar Rol"
                options={Object.values(UserRole).map(role => ({ value: role, label: role }))}
                value={selectedRoleToAssign}
                onChange={(e) => setSelectedRoleToAssign(e.target.value as UserRole)}
              />
              <Button onClick={handleAssignUser} className="w-full" isLoading={isSubmitting}>
                {isSubmitting ? 'Asignando...' : 'Asignar Usuario'}
              </Button>
            </div>
          )}
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Delete Branch Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Eliminar Sucursal</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Eliminará esta sucursal permanentemente y liberará su código de activación.
          </p>
          <Button onClick={handleDeleteBranch} variant="danger" className="w-full" isLoading={isSubmitting}>
            {isSubmitting ? 'Eliminando...' : 'Eliminar Sucursal'}
          </Button>
        </div>
      </div>

      {/* Modal for Editing User Assignment */}
      {userToEditAssignment && (
        <Modal
          isOpen={isEditUserAssignmentModalOpen}
          onClose={() => setIsEditUserAssignmentModalOpen(false)}
          title={`Editar Asignación para ${userToEditAssignment.displayName || userToEditAssignment.email}`}
        >
          <div className="p-4">
            <Select
              label="Nuevo Rol"
              options={Object.values(UserRole).map(role => ({ value: role, label: role }))}
              value={newAssignedRole}
              onChange={(e) => setNewAssignedRole(e.target.value as UserRole)}
            />
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setIsEditUserAssignmentModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateUserAssignment} isLoading={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default ManageBranchModal;
