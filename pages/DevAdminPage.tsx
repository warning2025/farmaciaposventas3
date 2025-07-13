import React, { useState } from 'react';
import { generateActivationCode } from '../services/branchService';
import { assignOrphanProductsToMainBranch } from '../services/productService';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const DevAdminPage: React.FC = () => {
  const [newCode, setNewCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  const initialCodes = ['7789906', '5478990', '2589563'];

  const handleSeedInitialCodes = async () => {
    setSeedingLoading(true);
    setMessage('');
    setError('');
    try {
      for (const code of initialCodes) {
        await generateActivationCode(code);
      }
      setMessage('Códigos iniciales cargados con éxito.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSeedingLoading(false);
    }
  };

  const handleAssignProducts = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const count = await assignOrphanProductsToMainBranch();
      setMessage(`${count} productos han sido asignados a la sucursal principal.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!newCode) {
      setError('Por favor, ingrese un código.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await generateActivationCode(newCode);
      setMessage(`Código "${newCode}" generado con éxito.`);
      setNewCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center mb-4">Panel de Desarrollador</h1>
          <p className="text-center mb-6 text-gray-400">Generar nuevos códigos de activación para sucursales.</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Generar Código Manualmente</h3>
              <Input
                type="text"
                placeholder="Nuevo Código"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
              <Button onClick={handleGenerateCode} disabled={loading} className="w-full mt-2">
                {loading ? 'Generando...' : 'Generar Código'}
              </Button>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-semibold mb-2">Cargar Códigos Iniciales</h3>
              <p className="text-sm text-gray-500 mb-2">Haz clic para cargar los 3 códigos de activación iniciales.</p>
              <Button onClick={handleSeedInitialCodes} disabled={seedingLoading} className="w-full">
                {seedingLoading ? 'Cargando...' : 'Cargar Códigos Iniciales'}
              </Button>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-semibold mb-2">Asignar Productos a Sucursal Principal</h3>
              <p className="text-sm text-gray-500 mb-2">Asigna todos los productos sin sucursal a la sucursal principal.</p>
              <Button onClick={handleAssignProducts} disabled={loading} className="w-full">
                {loading ? 'Asignando...' : 'Asignar Productos'}
              </Button>
            </div>
          </div>

          {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>
      </Card>
    </div>
  );
};

export default DevAdminPage;
