
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PRODUCTS: '/productos',
  ADD_PRODUCT: '/productos/nuevo',
  EDIT_PRODUCT: '/productos/editar/:id',
  REPOSITION: '/reposicion',
  SALES: '/ventas',
  CREATE_SALE: '/ventas/nueva',
  REPORTS: '/reportes',
  USERS: '/usuarios',
  CASH_REGISTER: '/caja',
  EXPENSES: '/gastos',
  SUPPLIERS: '/proveedores',
  SETTINGS: '/configuracion',
  NURSING: '/enfermeria',
  NOT_FOUND: '/404',
  // Online Store
  STORE_HOME: '/tienda',
  STORE_CART: '/tienda/carrito',
  STORE_CHECKOUT: '/tienda/checkout',
  BRANCHES: '/sucursales',
  STOCK_TRANSFER: '/transferencia-stock',
  CATEGORIES: '/categorias',
  DEV_ADMIN: '/dev-admin',
  FACTURACION: '/facturacion',
};

export const FIRESTORE_COLLECTIONS = {
  PRODUCTS: 'products',
  SALES: 'sales',
  USERS: 'users', // For user profiles/roles, not auth itself
  CASH_REGISTER_ENTRIES: 'cashRegisterEntries',
  CASH_REGISTER_SUMMARIES: 'cashRegisterSummaries',
  EXPENSES: 'expenses',
  SUPPLIERS: 'suppliers',
  CATEGORIES: 'categories', // Product categories
  NURSING_RECORDS: 'nursingRecords',
  BRANCHES: 'branches',
  ACTIVATION_CODES: 'activationCodes',
  BRANCH_STOCKS: 'branchStocks',
  PURCHASES: 'purchases', // New collection for supplier purchases
  PRESENTATIONS: 'presentations', // New collection for product presentations
  CONCENTRATIONS: 'concentrations', // New collection for product concentrations
};

export const PRODUCT_CATEGORIES = [
  "Analgésicos",
  "Antibióticos",
  "Antihistamínicos",
  "Antiinflamatorios",
  "Vitaminas y Suplementos",
  "Cuidado Personal",
  "Primeros Auxilios",
  "Infantil",
  "Otros",
];

export const EXPENSE_CATEGORIES = [
  "Alquiler",
  "Servicios Públicos (Luz, Agua, Internet)",
  "Sueldos y Salarios",
  "Marketing y Publicidad",
  "Material de Oficina",
  "Limpieza",
  "Impuestos",
  "Mantenimiento",
  "Compra Proveedores", // Nueva categoría para compras a proveedores
  "Otros Gastos",
];

export const CURRENCY_SYMBOL = 'Bs.';
