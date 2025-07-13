
import { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile extends FirebaseUser {
  role?: UserRole;
  branchAssignments?: { [branchId: string]: UserRole }; // e.g., { "branch123": "Admin", "branch456": "Cajero" }
}

export enum UserRole {
  ADMIN = 'Admin',
  CASHIER = 'Cajero',
  WAREHOUSE = 'Almacén',
}

export interface Product {
  id?: string;
  barcode: string; // Auto-generated or manual
  commercialName: string;
  genericName?: string;
  category: string;
  supplier: string; // Could be an ID to a Supplier collection later
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  currentStock: number;
  expirationDate: string; // Store as ISO string (YYYY-MM-DD)
  imageUrl?: string; // New field
  unit?: string; // New field
  batchNumber?: string; // New field
  location?: string; // New field
  branchId?: string; // New field: ID of the branch where the product is primarily stocked
  createdAt?: Date;
  updatedAt?: Date;
  concentration?: number; // Added concentration field
  presentation?: string; // Added presentation field
  laboratory?: string; // Added laboratory field
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountApplied?: number; // Discount per item or percentage
  totalPrice: number;
}

export interface Sale {
  id?: string;
  branchId: string;
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number; // Total discount for the entire sale
  finalTotal: number;
  userId: string; // User who made the sale
  userName?: string;
  date: Date;
  paymentMethod?: 'efectivo' | 'qr' | 'transferencia' | 'tarjeta' | 'online';
  channel?: 'pos' | 'online'; // Point of Sale or Online Store
  status?: 'pending' | 'processing' | 'completed' | 'rejected'; // For online orders
  customerPhone?: string; // For online orders
}

export interface CashRegisterEntry {
  id?: string;
  branchId: string; // Added branchId
  type: 'initial' | 'income' | 'expense' | 'sale';
  amount: number;
  concept: string;
  userId: string;
  userName?: string;
  timestamp: Date;
}

export interface CashRegisterSummary {
  id?: string;
  branchId: string;
  openingBalance: number;
  totalIncome: number; // Includes sales and manual income
  totalExpense: number;
  expectedBalance: number;
  actualBalance?: number; // To be filled at closing
  difference?: number;
  userIdOpen: string;
  userNameOpen?: string;
  timestampOpen: Date;
  userIdClose?: string;
  userNameClose?: string;
  timestampClose?: Date;
  status: 'open' | 'closed';
}

export interface Expense {
  id?: string;
  branchId: string;
  concept: string;
  amount: number;
  category: string; // e.g., 'Utilities', 'Supplies', 'Rent'
  date: Date;
  userId: string;
  userName?: string;
  timestamp: Date;
}

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  rucNit: string; // RUC/NIT
  address?: string;
}

export interface Category {
  id: string;
  name: string;
}

// For AuthContext
export interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export enum NursingServiceType {
  CURACION = 'Curación',
  INYECTABLE = 'Inyectable',
  SUERO = 'Suero',
  SACADA_DE_PUNTOS = 'Sacada de Puntos',
  TOMA_DE_PRESION = 'Toma de Presión',
  TOMA_DE_GLUCOSA = 'Toma de Glucosa',
  CONSULTA = 'Consulta',
}

export interface NursingRecord {
  id?: string;
  branchId: string;
  serviceType: NursingServiceType;
  patientName: string;
  notes?: string;
  cost: number;
  date: Date;
  userId: string;
  userName?: string;
}

export interface Branch {
  id?: string;
  name: string;
  address: string;
  phone?: string;
  createdAt: Date;
  isMain?: boolean;
}

export interface BranchStock {
  id?: string;
  branchId: string;
  productId: string;
  currentStock: number;
  updatedAt: Date;
}

export interface Purchase {
  id?: string;
  supplierId: string;
  invoiceNumber: string;
  itemCount: number;
  totalAmount: number;
  paymentType: 'credito' | 'contado';
  purchaseDate: Date;
  dueDate?: Date; // Only for 'credito'
  isPaid?: boolean; // New field: true if the credit purchase has been paid
  paymentDate?: Date; // New field: date when the credit purchase was paid
  userId: string;
  userName?: string;
  timestamp: Date;
}
