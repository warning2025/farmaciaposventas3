import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  getDocs,
  increment,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { NursingRecord, CashRegisterEntry } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const onNursingRecordsUpdate = (callback: (records: NursingRecord[]) => void, branchId?: string): Unsubscribe => {
  const recordsCollectionRef = collection(db, FIRESTORE_COLLECTIONS.NURSING_RECORDS);
  let q = query(recordsCollectionRef, orderBy('date', 'desc'));

  if (branchId) {
    q = query(recordsCollectionRef, where('branchId', '==', branchId), orderBy('date', 'desc'));
  }

  return onSnapshot(q, (querySnapshot) => {
    const records = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<NursingRecord, 'id' | 'date'> & { date: Timestamp };
      return {
        id: docSnap.id,
        ...data,
        date: data.date.toDate(),
      } as NursingRecord;
    });
    callback(records);
  });
};

export const createNursingRecord = async (recordData: Omit<NursingRecord, 'id' | 'date'>): Promise<string> => {
  if (!recordData.branchId) {
    throw new Error("Branch ID is required to create a nursing record.");
  }

  const summaryQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
    where('status', '==', 'open')
  );
  const summarySnapshot = await getDocs(summaryQuery);
  const summaryRef = summarySnapshot.empty ? null : summarySnapshot.docs[0].ref;

  const newRecordRef = doc(collection(db, FIRESTORE_COLLECTIONS.NURSING_RECORDS));

  await runTransaction(db, async (transaction) => {
    const now = new Date();
    // 1. Create the nursing record
    transaction.set(newRecordRef, {
      ...recordData,
      date: now,
    });

    // 2. Create a cash register entry for the income
    const cashEntryRef = doc(collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_ENTRIES));
    const cashEntry: Omit<CashRegisterEntry, 'id'> = {
      type: 'income',
      amount: recordData.cost,
      concept: `Servicio de enfermería: ${recordData.serviceType} - ${recordData.patientName}`,
      userId: recordData.userId,
      userName: recordData.userName,
      timestamp: now,
      branchId: recordData.branchId, // Add branchId to cash register entry
    };
    transaction.set(cashEntryRef, cashEntry);

    // 3. Update the cash register summary
    if (summaryRef) {
      transaction.update(summaryRef, {
        totalIncome: increment(recordData.cost),
        expectedBalance: increment(recordData.cost),
      });
    }
  });

  return newRecordRef.id;
};

export const deleteNursingRecord = async (recordId: string, cost: number): Promise<void> => {
  const summaryQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.CASH_REGISTER_SUMMARIES),
    where('status', '==', 'open')
  );
  const summarySnapshot = await getDocs(summaryQuery);
  const summaryRef = summarySnapshot.empty ? null : summarySnapshot.docs[0].ref;

  const recordRef = doc(db, FIRESTORE_COLLECTIONS.NURSING_RECORDS, recordId);

  await runTransaction(db, async (transaction) => {
    transaction.delete(recordRef);

    if (summaryRef) {
      transaction.update(summaryRef, {
        totalIncome: increment(-cost),
        expectedBalance: increment(-cost),
      });
    }
  });
};

export const deleteNursingRecords = async (recordsToDelete: NursingRecord[]): Promise<void> => {
  const batch = writeBatch(db);
  let totalToDecrement = 0;

  for (const record of recordsToDelete) {
    if (record.id) {
      const recordRef = doc(db, FIRESTORE_COLLECTIONS.NURSING_RECORDS, record.id);
      batch.delete(recordRef);
      totalToDecrement += record.cost;
    }
  }

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
