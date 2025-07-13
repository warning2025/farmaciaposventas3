import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getReportData } from '../services/reportsService';
import { getBranches } from '../services/branchService';
import { Branch, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';

const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const reportOptions = [
    { value: 'sales', label: 'Ventas' },
    { value: 'nursing', label: 'Servicios de Enfermería' },
    { value: 'expenses', label: 'Gastos' },
    { value: 'cashRegister', label: 'Movimientos de Caja' }, // New report type
    { value: 'inventory', label: 'Inventario' },
    { value: 'suppliers', label: 'Proveedores' },
  ];
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  useEffect(() => {
    const fetchBranches = async () => {
      const allBranches = await getBranches();
      setBranches(allBranches);
      // Set default selected branch if user is not admin and has assignments
      if (currentUser && currentUser.role !== UserRole.ADMIN && currentUser.branchAssignments) {
        const assignedBranchIds = Object.keys(currentUser.branchAssignments);
        if (assignedBranchIds.length > 0) {
          setSelectedBranchId(assignedBranchIds[0]);
        }
      }
    };
    fetchBranches();
  }, [currentUser]);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert('Por favor, seleccione un rango de fechas.');
      return;
    }

    // If user is not admin and no branch is selected, alert
    if (currentUser?.role !== UserRole.ADMIN && !selectedBranchId) {
      alert('Por favor, seleccione una sucursal para generar el reporte.');
      return;
    }

    setLoading(true);
    try {
      const data = await getReportData(reportType, startDate, endDate, selectedBranchId);
      setReportData(data);
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      alert('Ocurrió un error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const renderTableHeader = () => {
    let headers = [];
    switch (reportType) {
      case 'sales':
        headers = ['Producto', 'Cantidad', 'Total', 'Fecha', 'Usuario', 'Sucursal'];
        break;
      case 'nursing':
        headers = ['Paciente', 'Servicio', 'Costo', 'Fecha', 'Atendido por', 'Sucursal'];
        break;
      case 'expenses':
        headers = ['Concepto', 'Monto', 'Fecha', 'Usuario', 'Sucursal'];
        break;
      case 'cashRegister':
        headers = ['Tipo', 'Concepto', 'Monto', 'Fecha', 'Usuario', 'Sucursal'];
        break;
      case 'inventory':
        headers = ['Producto', 'Stock', 'Precio', 'Sucursal'];
        break;
      case 'suppliers':
        headers = ['Nombre', 'Contacto', 'Teléfono', 'Email', 'RUC/NIT'];
        break;
      default:
        return null;
    }

    return (
      <thead className="bg-gray-50">
        <tr>
          {headers.map(header => (
            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
    );
  }

  const renderTableBody = () => {
    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {reportData && reportData.map((item: any) => { // Added check for reportData
          if (reportType === 'sales') {
            return item.items.map((saleItem: any, index: number) => (
              <tr key={`${item.id}-${saleItem.productId}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap">{saleItem.productName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{saleItem.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.finalTotal?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{branches.find(b => b.id === item.branchId)?.name || 'N/A'}</td>
              </tr>
            ));
          }
          if (reportType === 'nursing') {
            return (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.patientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.serviceType}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.cost?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{branches.find(b => b.id === item.branchId)?.name || 'N/A'}</td>
              </tr>
            );
          }
          if (reportType === 'expenses') {
            return (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.concept}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.amount?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{branches.find(b => b.id === item.branchId)?.name || 'N/A'}</td>
              </tr>
            );
          }
          if (reportType === 'cashRegister') {
            // Distinguish between summary and entry
            if (item.status) { // It's a summary
              return (
                <tr key={item.id} className="bg-blue-50 dark:bg-blue-900/50">
                  <td className="px-6 py-4 whitespace-nowrap font-bold">Resumen de Caja</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">Apertura: {item.openingBalance?.toFixed(2) || '0.00'} / Cierre: {item.actualBalance?.toFixed(2) || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">Ingresos: {item.totalIncome?.toFixed(2) || '0.00'} / Gastos: {item.totalExpense?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{item.timestampOpen ? new Date(item.timestampOpen).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{item.userNameOpen}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{branches.find(b => b.id === item.branchId)?.name || 'N/A'}</td>
                </tr>
              );
            } else { // It's an entry
              return (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.concept}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.amount?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{branches.find(b => b.id === item.branchId)?.name || 'N/A'}</td>
                </tr>
              );
            }
          }
          if (reportType === 'inventory') {
            return (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.commercialName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.currentStock}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.sellingPrice?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{branches.find(b => b.id === item.branchId)?.name || 'N/A'}</td>
              </tr>
            );
          }
          if (reportType === 'suppliers') {
            return (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.contactPerson}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.rucNit}</td>
                <td className="px-6 py-4 whitespace-nowrap">N/A</td> {/* Suppliers are not branch-specific in this schema */}
              </tr>
            );
          }
          return null;
        })}
      </tbody>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
              Tipo de Reporte
            </label>
            <Select
              id="reportType"
              options={reportOptions}
              value={reportType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportType(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Fecha de Inicio
            </label>
            <Input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Fecha de Fin
            </label>
            <Input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            />
          </div>
          {currentUser?.role === UserRole.ADMIN && (
            <div>
              <label htmlFor="branchSelect" className="block text-sm font-medium text-gray-700">
                Sucursal
              </label>
              <Select
                id="branchSelect"
                options={[{ value: '', label: 'Todas las Sucursales' }, ...branches.map(b => ({ value: b.id!, label: b.name }))]}
                value={selectedBranchId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBranchId(e.target.value)}
              />
            </div>
          )}
          <div className="self-end">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Generando...' : 'Generar Reporte'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">Resultados del Reporte</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : reportData.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            {renderTableHeader()}
            {renderTableBody()}
          </table>
        ) : (
          <p>No se encontraron datos para el período seleccionado.</p>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
