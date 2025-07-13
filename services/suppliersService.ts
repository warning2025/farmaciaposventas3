import { collection, addDoc, onSnapshot, query, orderBy, Unsubscribe, doc, updateDoc, deleteDoc, where, getDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Supplier, Purchase } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const onSuppliersUpdate = (callback: (suppliers: Supplier[]) => void): Unsubscribe => {
  const suppliersCollectionRef = collection(db, FIRESTORE_COLLECTIONS.SUPPLIERS);
  const q = query(suppliersCollectionRef, orderBy('name', 'asc'));

  return onSnapshot(q, (querySnapshot) => {
    const suppliers = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<Supplier, 'id'>;
      return {
        id: docSnap.id,
        ...data,
      } as Supplier;
    });
    callback(suppliers);
  });
};

export const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<string> => {
  const supplierRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.SUPPLIERS), supplierData);
  return supplierRef.id;
};

export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<void> => {
  const supplierRef = doc(db, FIRESTORE_COLLECTIONS.SUPPLIERS, id);
  await updateDoc(supplierRef, supplierData);
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const supplierRef = doc(db, FIRESTORE_COLLECTIONS.SUPPLIERS, id);
  await deleteDoc(supplierRef);
};

export const addPurchase = async (purchaseData: Omit<Purchase, 'id'>): Promise<string> => {
  const purchaseRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.PURCHASES), purchaseData);
  return purchaseRef.id;
};

export const updatePurchase = async (id: string, purchaseData: Partial<Purchase>): Promise<void> => {
  const purchaseRef = doc(db, FIRESTORE_COLLECTIONS.PURCHASES, id);
  await updateDoc(purchaseRef, purchaseData);
};

export const deletePurchase = async (purchaseId: string): Promise<void> => {
  const purchaseRef = doc(db, FIRESTORE_COLLECTIONS.PURCHASES, purchaseId);
  const batch = writeBatch(db);

  try {
    const purchaseSnap = await getDoc(purchaseRef);
    if (!purchaseSnap.exists()) {
      console.error("Intento de eliminar una compra que no existe.");
      return;
    }
    const purchaseData = purchaseSnap.data() as Purchase;

    if (purchaseData.paymentType === 'contado') {
      const supplierRef = doc(db, FIRESTORE_COLLECTIONS.SUPPLIERS, purchaseData.supplierId);
      const supplierSnap = await getDoc(supplierRef);
      const supplierName = supplierSnap.exists() ? supplierSnap.data().name : 'Desconocido';

      const concept = `Compra a Proveedor: ${supplierName} (Factura: ${purchaseData.invoiceNumber})`;
      
      const expensesRef = collection(db, FIRESTORE_COLLECTIONS.EXPENSES);
      const q = query(expensesRef, where("concept", "==", concept));
      const expenseQuerySnap = await getDocs(q);

      if (!expenseQuerySnap.empty) {
        const expenseDoc = expenseQuerySnap.docs[0];
        batch.delete(expenseDoc.ref);
      }
    }

    batch.delete(purchaseRef);

    await batch.commit();
  } catch (error) {
    console.error("Error al eliminar la compra y el gasto asociado:", error);
    throw error;
  }
};

export const onSupplierPurchasesUpdate = (supplierId: string | 'all', callback: (purchases: Purchase[]) => void): Unsubscribe => {
  const purchasesCollectionRef = collection(db, FIRESTORE_COLLECTIONS.PURCHASES);
  let q = query(purchasesCollectionRef, orderBy('timestamp', 'desc'));

  if (supplierId !== 'all') {
    q = query(purchasesCollectionRef, where('supplierId', '==', supplierId), orderBy('timestamp', 'desc'));
  }

  return onSnapshot(q, (querySnapshot) => {
    const purchases = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<Purchase, 'id'>;
      return {
        id: docSnap.id,
        ...data,
        purchaseDate: data.purchaseDate instanceof Date ? data.purchaseDate : (data.purchaseDate as any).toDate(), // Ensure it's a Date object
        dueDate: data.dueDate ? (data.dueDate instanceof Date ? data.dueDate : (data.dueDate as any).toDate()) : undefined, // Ensure it's a Date object
      } as Purchase;
    });
    callback(purchases);
  });
};
