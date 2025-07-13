import React, { useState, useEffect } from 'react';
import { Branch } from '../types';
import { getBranches, createBranch, verifyActivationCode } from '../services/branchService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ManageBranchModal from '../components/branches/ManageBranchModal';

const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [activationCode, setActivationCode] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const allBranches = await getBranches();
      setBranches(allBranches);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    if (!activationCode) {
      setError('Por favor, ingrese un código.');
      return;
    }
    const isValid = await verifyActivationCode(activationCode);
    if (isValid) {
      setIsModalOpen(false);
      setIsFormModalOpen(true);
    } else {
      setError('Código inválido o ya ha sido utilizado.');
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName || !newBranchAddress) {
      alert('Nombre y dirección son requeridos.');
      return;
    }
    try {
      await createBranch({
        name: newBranchName,
        address: newBranchAddress,
        phone: newBranchPhone,
      });
      alert('Sucursal creada con éxito.');
      setIsFormModalOpen(false);
      fetchBranches();
      // Reset form
      setNewBranchName('');
      setNewBranchAddress('');
      setNewBranchPhone('');
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Error al crear la sucursal.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Sucursales</h1>
        <Button onClick={() => setIsModalOpen(true)}>Añadir Nueva Sucursal</Button>
      </div>

      {loading ? (
        <p>Cargando sucursales...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => (
            <Card key={branch.id} className="flex flex-col justify-between">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  {branch.name}
                  {branch.isMain && <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Principal</span>}
                </h2>
                <p>{branch.address}</p>
                <p>{branch.phone}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700">
                <Button onClick={() => {
                  setSelectedBranch(branch);
                  setIsManageModalOpen(true);
                }} className="w-full">
                  Administrar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ManageBranchModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        branch={selectedBranch}
        onBranchUpdated={fetchBranches}
        onBranchDeleted={fetchBranches}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Verificar Código de Activación">
        <p className="mb-4">Para crear una nueva sucursal, por favor ingrese un código de activación válido o solicítelo al desarrollador.</p>
        <Input
          type="text"
          placeholder="Código de Activación"
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button onClick={handleVerifyCode}>Verificar</Button>
        </div>
      </Modal>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Crear Nueva Sucursal">
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Nombre de la Sucursal"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Dirección"
            value={newBranchAddress}
            onChange={(e) => setNewBranchAddress(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Teléfono (Opcional)"
            value={newBranchPhone}
            onChange={(e) => setNewBranchPhone(e.target.value)}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleCreateBranch}>Crear Sucursal</Button>
        </div>
      </Modal>
    </div>
  );
};

export default BranchesPage;
