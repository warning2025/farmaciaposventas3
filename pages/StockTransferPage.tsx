import React, { useState, useEffect } from 'react';
import { Branch } from '../types';
import { getBranches } from '../services/branchService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import StockTransferModal from '../components/stock/StockTransferModal';

const StockTransferPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [targetBranch, setTargetBranch] = useState<Branch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const allBranches = await getBranches();
      setBranches(allBranches);
    };
    fetchData();
  }, []);

  const handleOpenModal = () => {
    if (!targetBranch) {
      alert('Por favor, seleccione una sucursal de destino.');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transferencia de Stock por Lote</h1>
      <Card>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Desde Sucursal:</label>
            <p className="font-bold text-lg">Almacén Central</p>
          </div>
          <Select
            label="Hacia Sucursal"
            options={branches.map(b => ({ value: b.id!, label: b.name }))}
            onChange={(e) => {
              const branch = branches.find(b => b.id === e.target.value);
              setTargetBranch(branch || null);
            }}
            placeholder="Seleccione una sucursal de destino"
          />
          <Button onClick={handleOpenModal} className="w-full">
            Seleccionar Productos para Transferir
          </Button>
        </div>
      </Card>
      <StockTransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sourceBranch={null} // Source is always main warehouse
        targetBranch={targetBranch}
      />
    </div>
  );
};

export default StockTransferPage;
