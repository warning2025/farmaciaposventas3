import { collection, doc, runTransaction, query, where, getDocs, increment, Timestamp, writeBatch, getDoc, onSnapshot, Unsubscribe, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Sale, SaleItem, CashRegisterEntry } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const onSalesUpdate = (callback: (sales: Sale[]) => void, branchId?: string): Unsubscribe => {
  const salesCollectionRef = collection(db, FIRESTORE_COLLECTIONS.SALES);
  let q = query(salesCollectionRef, orderBy('date', 'desc'));

  if (branchId) {
    q = query(salesCollectionRef, where('branchId', '==', branchId), orderBy('date', 'desc'));
  }

  return onSnapshot(q, (querySnapshot) => {
    const sales = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<Sale, 'id' | 'date'> & { date: Timestamp };
      return {
        id: docSnap.id,
        ...data,
        date: data.date.toDate(),
      } as Sale;
    });
    callback(sales);
  });
};

/**
 * Retrieves all sales from the database.
 * @returns A promise that resolves to an array of sales.
 */
export const getAllSales = async (): Promise<Sale[]> => {
  const salesQuery = query(collection(db, FIRESTORE_COLLECTIONS.SALES));
  const querySnapshot = await getDocs(salesQuery);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
    } as Sale;
  });
};

/**
 * Deletes a sale and restores the stock of the products sold.
 * @param saleId The ID of the sale to delete.
 * @param items The items that were part of the sale.
 */
export const deleteSale = async (saleId: string, items: SaleItem[], saleTotal: number): Promise<void> => {
  const summaryQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
    where('status', '==', 'open')
  );
  const summarySnapshot = await getDocs(summaryQuery);
  const summaryRef = summarySnapshot.empty ? null : summarySnapshot.docs[0].ref;

  await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, FIRESTORE_COLLECTIONS.SALES, saleId);
    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) {
      throw new Error("Sale not found!");
    }

    // All reads must be before writes
    const productRefs = items.map(item => doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, item.productId));
    const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

    // Now, perform writes
    transaction.delete(saleRef);

    for (let i = 0; i < items.length; i++) {
      if (productDocs[i].exists()) {
        transaction.update(productRefs[i], {
          currentStock: increment(items[i].quantity)
        });
      }
    }

    if (summaryRef) {
      transaction.update(summaryRef, {
        totalIncome: increment(-saleTotal),
        expectedBalance: increment(-saleTotal),
      });
    }
  });
};

/**
 * Deletes multiple sales and restores the stock for all products involved.
 * @param salesToDelete An array of sales to be deleted.
 */
export const deleteSales = async (salesToDelete: Sale[]): Promise<void> => {
  const batch = writeBatch(db);
  let totalToDecrement = 0;

  // Get all product references first
  const productIds = new Set<string>();
  salesToDelete.forEach(sale => {
    sale.items.forEach(item => {
      productIds.add(item.productId);
    });
  });

  const productRefs = Array.from(productIds).map(id => doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, id));
  const productDocs = await Promise.all(productRefs.map(ref => getDoc(ref)));
  const existingProductIds = new Set(productDocs.filter(doc => doc.exists()).map(doc => doc.id));

  for (const sale of salesToDelete) {
    if (sale.id) {
      const saleRef = doc(db, FIRESTORE_COLLECTIONS.SALES, sale.id);
      batch.delete(saleRef);
      totalToDecrement += sale.finalTotal;

      for (const item of sale.items) {
        if (existingProductIds.has(item.productId)) {
          const productRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, item.productId);
          batch.update(productRef, {
            currentStock: increment(item.quantity)
          });
        }
      }
    }
  }

  // Update cash register summary
  if (totalToDecrement > 0) {
    const summaryQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
      where('status', '==', 'open')
    );
    const summarySnapshot = await getDocs(summaryQuery);
    if (!summarySnapshot.empty) {
      const summaryRef = summarySnapshot.docs[0].ref;
      batch.update(summaryRef, {
        totalIncome: increment(-totalToDecrement),
        expectedBalance: increment(-totalToDecrement),
      });
    }
  }

  await batch.commit();
};

/**
 * Creates a new sale and updates product stock in a single transaction.
 * @param saleData The sale data to add.
 * @param items The items included in the sale.
 * @returns The ID of the newly created sale.
 */
export const createSale = async (saleData: Omit<Sale, 'id' | 'date'>, items: SaleItem[]): Promise<string> => {
  const saleRef = doc(collection(db, FIRESTORE_COLLECTIONS.SALES));

  // Find the open cash register summary BEFORE the transaction
  const summaryQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
    where('status', '==', 'open')
  );
  const summarySnapshot = await getDocs(summaryQuery);
  const openSummaryDoc = summarySnapshot.empty ? null : summarySnapshot.docs[0];

  await runTransaction(db, async (transaction) => {
    // 1. Read all product documents first
    const productDocs = await Promise.all(
      items.map(item => transaction.get(doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, item.productId)))
    );

    // Ensure branchId is present in saleData
    if (!saleData.branchId) {
      throw new Error("Branch ID is required to create a sale.");
    }

    // 2. If there's an open summary, read it within the transaction to ensure consistency
    let summaryRef = null;
    if (openSummaryDoc) {
      summaryRef = doc(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES, openSummaryDoc.id);
      const summaryDoc = await transaction.get(summaryRef);
      if (!summaryDoc.exists() || summaryDoc.data().status !== 'open') {
        // If summary was closed between the initial read and now, don't update it.
        summaryRef = null;
      }
    }

    const now = new Date();
    // 3. Create the sale document
    transaction.set(saleRef, {
      ...saleData,
      date: now,
    });

    // 4. Update stock for each product in the sale
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productDoc = productDocs[i];
      if (!productDoc.exists()) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }
      const newStock = productDoc.data().currentStock - item.quantity;
      if (newStock < 0) {
        throw new Error(`Not enough stock for product ${productDoc.data().commercialName}.`);
      }
      const productRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, item.productId);
      transaction.update(productRef, { currentStock: newStock });
    }

    // 5. Create a cash register entry for the sale
    const cashEntryRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_ENTRIES));
    const cashEntry: Omit<CashRegisterEntry, 'id'> = {
      type: 'sale',
      amount: saleData.finalTotal,
      concept: `Venta #${saleRef.id.substring(0, 6)}`, // Short ID for concept
      userId: saleData.userId,
      userName: saleData.userName,
      timestamp: now,
      branchId: saleData.branchId, // Add branchId to cash register entry
    };
    transaction.set(cashEntryRef, cashEntry);
    
    // 6. Update the cash register summary if it's still open
    if (summaryRef) {
      transaction.update(summaryRef, {
        totalIncome: increment(saleData.finalTotal),
        expectedBalance: increment(saleData.finalTotal),
      });
    }
  });

  return saleRef.id;
};

export const updateSaleStatus = async (saleId: string, status: 'pending' | 'processing' | 'completed' | 'rejected'): Promise<void> => {
  const saleRef = doc(db, FIRESTORE_COLLECTIONS.SALES, saleId);
  await runTransaction(db, async (transaction) => {
    const saleDoc = await transaction.get(saleRef);
    if (!saleDoc.exists()) {
      throw new Error("Sale not found!");
    }
    transaction.update(saleRef, { status });
  });
};
