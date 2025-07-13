import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { CashRegisterEntry, CashRegisterSummary, Sale, Expense, NursingRecord } from '../types';

export const getReportData = async (reportType: string, startDate: string, endDate: string, branchId?: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include the entire end day

  let data: any[] = [];

  switch (reportType) {
    case 'sales':
      let salesQuery = query(
        collection(db, FIRESTORE_COLLECTIONS.SALES),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc')
      );
      if (branchId) {
        salesQuery = query(salesQuery, where('branchId', '==', branchId));
      }
      const salesSnapshot = await getDocs(salesQuery);
      data = salesSnapshot.docs.map(doc => {
        const saleData = doc.data() as Omit<Sale, 'id' | 'date'> & { date: Timestamp };
        return { id: doc.id, ...saleData, date: saleData.date.toDate() };
      });
      break;

    case 'nursing':
      let nursingQuery = query(
        collection(db, FIRESTORE_COLLECTIONS.NURSING_RECORDS),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc')
      );
      if (branchId) {
        nursingQuery = query(nursingQuery, where('branchId', '==', branchId));
      }
      const nursingSnapshot = await getDocs(nursingQuery);
      data = nursingSnapshot.docs.map(doc => {
        const nursingData = doc.data() as Omit<NursingRecord, 'id' | 'date'> & { date: Timestamp };
        return { id: doc.id, ...nursingData, date: nursingData.date.toDate() };
      });
      break;

    case 'expenses':
      let expensesQuery = query(
        collection(db, FIRESTORE_COLLECTIONS.EXPENSES),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc')
      );
      if (branchId) {
        expensesQuery = query(expensesQuery, where('branchId', '==', branchId));
      }
      const expensesSnapshot = await getDocs(expensesQuery);
      data = expensesSnapshot.docs.map(doc => {
        const expenseData = doc.data() as Omit<Expense, 'id' | 'date'> & { date: Timestamp };
        return { id: doc.id, ...expenseData, date: expenseData.date.toDate() };
      });
      break;

    case 'cashRegister': // New report type for cash register movements
      let cashRegisterSummariesQuery = query(
        collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
        where('timestampOpen', '>=', start),
        where('timestampOpen', '<=', end),
        orderBy('timestampOpen', 'desc')
      );
      if (branchId) {
        cashRegisterSummariesQuery = query(cashRegisterSummariesQuery, where('branchId', '==', branchId));
      }
      const summariesSnapshot = await getDocs(cashRegisterSummariesQuery);
      const summaries = summariesSnapshot.docs.map(doc => {
        const summaryData = doc.data() as Omit<CashRegisterSummary, 'id' | 'timestampOpen' | 'timestampClose'> & { timestampOpen: Timestamp, timestampClose?: Timestamp };
        return { id: doc.id, ...summaryData, timestampOpen: summaryData.timestampOpen.toDate(), timestampClose: summaryData.timestampClose?.toDate() };
      });

      // For each summary, get its entries
      const allEntries: CashRegisterEntry[] = [];
      for (const summary of summaries) {
        let entriesQuery = query(
          collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_ENTRIES),
          where('timestamp', '>=', summary.timestampOpen),
          where('timestamp', '<=', summary.timestampClose || new Date()), // If closed, use close timestamp, else current date
          orderBy('timestamp', 'desc')
        );
        if (branchId) {
          entriesQuery = query(entriesQuery, where('branchId', '==', branchId));
        }
        const entriesSnapshot = await getDocs(entriesQuery);
        entriesSnapshot.docs.forEach(doc => {
          const entryData = doc.data() as Omit<CashRegisterEntry, 'id' | 'timestamp'> & { timestamp: Timestamp };
          allEntries.push({ id: doc.id, ...entryData, timestamp: entryData.timestamp.toDate() });
        });
      }
      data = [...summaries, ...allEntries].sort((a, b) => {
        const dateA = (a as any).date || (a as any).timestamp || (a as any).timestampOpen;
        const dateB = (b as any).date || (b as any).timestamp || (b as any).timestampOpen;
        return dateB.getTime() - dateA.getTime();
      });
      break;

    case 'inventory':
      let productsCollectionRef = collection(db, FIRESTORE_COLLECTIONS.PRODUCTS);
      let productsQuery = query(productsCollectionRef); // Start with a base query
      if (branchId) {
        productsQuery = query(productsCollectionRef, where('branchId', '==', branchId));
      }
      const productsSnapshot = await getDocs(productsQuery);
      data = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      break;

    case 'suppliers':
      const suppliersSnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.SUPPLIERS));
      data = suppliersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      break;

    default:
      return [];
  }

  return data;
};
