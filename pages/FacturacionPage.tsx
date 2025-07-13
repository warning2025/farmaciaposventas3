import React from 'react';

const FacturacionPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Facturación (Próximamente)</h1>
      <p className="mb-4">Módulo de facturación a solicitud.</p>
      <div className="mb-4">
        <label htmlFor="nit" className="block text-gray-700 text-sm font-bold mb-2">
          NIT:
        </label>
        <input
          type="text"
          id="nit"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Ingrese NIT"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="razonSocial" className="block text-gray-700 text-sm font-bold mb-2">
          Nombre / Razón Social:
        </label>
        <input
          type="text"
          id="razonSocial"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Ingrese Nombre / Razón Social"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="direccion" className="block text-gray-700 text-sm font-bold mb-2">
          Dirección:
        </label>
        <input
          type="text"
          id="direccion"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Ingrese Dirección"
        />
      </div>
    </div>
  );
};

export default FacturacionPage;
