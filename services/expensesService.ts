import { collection, addDoc, onSnapshot, query, orderBy, Unsubscribe, Timestamp, where, doc, runTransaction, increment, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Expense, CashRegisterEntry } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const onExpensesUpdate = (callback: (expenses: Expense[]) => void, branchId?: string): Unsubscribe => {
  const expensesCollectionRef = collection(db, FIRESTORE_COLLECTIONS.EXPENSES);
  let q = query(expensesCollectionRef, orderBy('date', 'desc'));

  if (branchId) {
    q = query(expensesCollectionRef, where('branchId', '==', branchId), orderBy('date', 'desc'));
  }

  return onSnapshot(q, (querySnapshot) => {
    const expenses = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<Expense, 'id' | 'date'> & { date: Timestamp };
      return {
        id: docSnap.id,
        ...data,
        date: data.date.toDate(),
      } as Expense;
    });
    callback(expenses);
  });
};

export const addExpense = async (expenseData: Omit<Expense, 'id' | 'date' | 'timestamp'>): Promise<string> => {
  if (!expenseData.branchId) {
    throw new Error("Branch ID is required to add an expense.");
  }

  const summaryQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
    where('status', '==', 'open'),
    where('branchId', '==', expenseData.branchId) // Filter by branchId
  );
  const summarySnapshot = await getDocs(summaryQuery);
  const summaryRef = summarySnapshot.empty ? null : summarySnapshot.docs[0].ref;

  const expenseRef = doc(collection(db, FIRESTORE_COLLECTIONS.EXPENSES));

  await runTransaction(db, async (transaction) => {
    const now = new Date();
    // 1. Create the expense record
    transaction.set(expenseRef, {
      ...expenseData,
      date: now,
      timestamp: now,
    });

    // 2. Create a cash register entry for the expense
    const cashEntryRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_ENTRIES));
    const cashEntry: Omit<CashRegisterEntry, 'id'> = {
      type: 'expense',
      amount: expenseData.amount,
      concept: `Gasto: ${expenseData.concept}`,
      userId: expenseData.userId,
      userName: expenseData.userName,
      timestamp: now,
      branchId: expenseData.branchId, // Add branchId to cash register entry
    };
    transaction.set(cashEntryRef, cashEntry);

    // 3. Update the cash register summary
    if (summaryRef) {
      transaction.update(summaryRef, {
        totalExpense: increment(expenseData.amount),
        expectedBalance: increment(-expenseData.amount),
      });
    }
  });

  return expenseRef.id;
};

export const updateExpense = async (id: string, expenseData: Partial<Omit<Expense, 'id' | 'date' | 'timestamp'>>): Promise<void> => {
  const expenseRef = doc(db, FIRESTORE_COLLECTIONS.EXPENSES, id);

  await runTransaction(db, async (transaction) => {
    const expenseDoc = await transaction.get(expenseRef);
    if (!expenseDoc.exists()) {
      throw new Error("Expense not found.");
    }
    const oldExpense = expenseDoc.data() as Expense;

    const summaryQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
      where('status', '==', 'open'),
      where('branchId', '==', oldExpense.branchId)
    );
    const summarySnapshot = await getDocs(summaryQuery);
    const summaryRef = summarySnapshot.empty ? null : summarySnapshot.docs[0].ref;

    // 1. Update the expense record
    transaction.update(expenseRef, {
      ...expenseData,
      date: oldExpense.date, // Keep original date
      timestamp: oldExpense.timestamp, // Keep original timestamp
    });

    // 2. Update the cash register summary if amount changed
    if (summaryRef && expenseData.amount !== undefined && expenseData.amount !== oldExpense.amount) {
      const amountDifference = expenseData.amount - oldExpense.amount;
      transaction.update(summaryRef, {
        totalExpense: increment(amountDifference),
        expectedBalance: increment(-amountDifference),
      });
    }
  });
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenseRef = doc(db, FIRESTORE_COLLECTIONS.EXPENSES, id);

  await runTransaction(db, async (transaction) => {
    const expenseDoc = await transaction.get(expenseRef);
    if (!expenseDoc.exists()) {
      throw new Error("Expense not found.");
    }
    const expenseToDelete = expenseDoc.data() as Expense;

    const summaryQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
      where('status', '==', 'open'),
      where('branchId', '==', expenseToDelete.branchId)
    );
    const summarySnapshot = await getDocs(summaryQuery);
    const summaryRef = summarySnapshot.empty ? null : summarySnapshot.docs[0].ref;

    // 1. Delete the expense record
    transaction.delete(expenseRef);

    // 2. Revert the impact on the cash register summary
    if (summaryRef) {
      transaction.update(summaryRef, {
        totalExpense: increment(-expenseToDelete.amount),
        expectedBalance: increment(expenseToDelete.amount),
      });
    }
  });
};
