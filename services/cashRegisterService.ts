import { collection, getDocs, query, where, orderBy, serverTimestamp, Timestamp, doc, addDoc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CashRegisterEntry, CashRegisterSummary } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const onCurrentCashRegisterSummaryUpdate = (callback: (summary: CashRegisterSummary | null) => void, branchId?: string): Unsubscribe => {
  let q = query(collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES), where('status', '==', 'open'));

  if (branchId) {
    q = query(collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES), where('status', '==', 'open'), where('branchId', '==', branchId));
  }

  return onSnapshot(q, async (querySnapshot) => {
    if (querySnapshot.empty) {
      callback(null);
      return;
    }
    const summaryDoc = querySnapshot.docs[0];
    const summaryData = summaryDoc.data() as Omit<CashRegisterSummary, 'id' | 'timestampOpen' | 'timestampClose'> & { timestampOpen: Timestamp, timestampClose?: Timestamp };

    // Get total expenses
    let expensesQuery = query(collection(db, FIRESTORE_COLLECTIONS.EXPENSES), where('date', '>=', summaryData.timestampOpen.toDate()));
    if (branchId) {
      expensesQuery = query(collection(db, FIRESTORE_COLLECTIONS.EXPENSES), where('date', '>=', summaryData.timestampOpen.toDate()), where('branchId', '==', branchId));
    }
    const expensesSnapshot = await getDocs(expensesQuery);
    const totalExpense = expensesSnapshot.docs.reduce((acc, doc) => acc + doc.data().amount, 0);

    const summary = {
      id: summaryDoc.id,
      ...summaryData,
      totalExpense,
      timestampOpen: summaryData.timestampOpen.toDate(),
      timestampClose: summaryData.timestampClose?.toDate(),
    } as CashRegisterSummary;
    callback(summary);
  });
};

export const onCashRegisterEntriesUpdate = (
  summary: CashRegisterSummary | null,
  callback: (entries: CashRegisterEntry[]) => void
): Unsubscribe => {
  if (!summary) {
    callback([]);
    // Return a no-op unsubscribe function
    return () => {};
  }

  let entriesQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_ENTRIES),
    where('timestamp', '>=', summary.timestampOpen),
    orderBy('timestamp', 'desc')
  );

  if (summary.branchId) {
    entriesQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_ENTRIES),
      where('timestamp', '>=', summary.timestampOpen),
      where('branchId', '==', summary.branchId),
      orderBy('timestamp', 'desc')
    );
  }

  return onSnapshot(entriesQuery, (querySnapshot) => {
    const entries = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<CashRegisterEntry, 'id' | 'timestamp'> & { timestamp: Timestamp };
      return {
        id: docSnap.id,
        ...data,
        timestamp: data.timestamp.toDate(),
      } as CashRegisterEntry;
    });
    callback(entries);
  });
};

export const closeCashRegister = async (summaryId: string, actualBalance: number, userId: string, userName: string, branchId: string): Promise<void> => {
  try {
    const summaryRef = doc(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES, summaryId);
    const summaryDoc = await getDoc(summaryRef);
    if (!summaryDoc.exists()) {
      throw new Error('Cash register summary not found.');
    }
    const summary = summaryDoc.data() as CashRegisterSummary;
    const difference = actualBalance - summary.expectedBalance;
    await setDoc(summaryRef, {
      actualBalance,
      difference,
      userIdClose: userId,
      userNameClose: userName,
      timestampClose: serverTimestamp(),
      status: 'closed',
      branchId: branchId, // Ensure branchId is saved on close
    }, { merge: true });
  } catch (error) {
    console.error("Error closing cash register: ", error);
    throw error;
  }
};

export const openCashRegister = async (openingBalance: number, userId: string, userName: string, branchId: string): Promise<string> => {
  try {
    const summaryRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES), {
      openingBalance,
      totalIncome: 0,
      totalExpense: 0,
      expectedBalance: openingBalance,
      status: 'open',
      userIdOpen: userId,
      userNameOpen: userName,
      timestampOpen: serverTimestamp(),
      branchId: branchId, // Save branchId when opening cash register
    });
    return summaryRef.id;
  } catch (error) {
    console.error("Error opening cash register: ", error);
    throw error;
  }
};
