import { collection, getDocs, query, where, addDoc, doc, getDoc, writeBatch, limit, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Branch } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.BRANCHES));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
};

export const createBranch = async (branchData: Omit<Branch, 'id' | 'createdAt'>): Promise<string> => {
  const branchesQuery = query(collection(db, FIRESTORE_COLLECTIONS.BRANCHES));
  const querySnapshot = await getDocs(branchesQuery);
  const isFirstBranch = querySnapshot.empty;

  const newBranchRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.BRANCHES), {
    ...branchData,
    createdAt: new Date(),
    isMain: isFirstBranch,
  });
  return newBranchRef.id;
};

export const updateBranch = async (id: string, branchData: Partial<Omit<Branch, 'id' | 'createdAt'>>) => {
  const branchDoc = doc(db, FIRESTORE_COLLECTIONS.BRANCHES, id);
  return await updateDoc(branchDoc, branchData);
};

export const deleteBranch = async (id: string): Promise<void> => {
  const branchDocRef = doc(db, FIRESTORE_COLLECTIONS.BRANCHES, id);
  const branchDocSnap = await getDoc(branchDocRef);

  if (branchDocSnap.exists()) {
    const branchData = branchDocSnap.data() as Branch;
    const batch = writeBatch(db);

    // Delete the branch document
    batch.delete(branchDocRef);

    // Find the activation code associated with this branch (if any) and mark it as unused
    // Assuming branch name might be used as part of the activation code or there's a link
    // This part might need refinement if activation codes are not directly linked to branch names
    const codesRef = collection(db, FIRESTORE_COLLECTIONS.ACTIVATION_CODES);
    const q = query(codesRef, where("code", "==", branchData.name)); // Assuming branch name is the code
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const codeDocRef = doc(db, FIRESTORE_COLLECTIONS.ACTIVATION_CODES, querySnapshot.docs[0].id);
      batch.update(codeDocRef, { used: false });
    }

    await batch.commit();
  } else {
    throw new Error("Branch not found.");
  }
};

export const verifyActivationCode = async (code: string): Promise<boolean> => {
  const codesRef = collection(db, FIRESTORE_COLLECTIONS.ACTIVATION_CODES);
  const q = query(codesRef, where("code", "==", code), where("used", "==", false));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return false; // Code not found or already used
  }

  // Mark the code as used in a transaction to prevent race conditions
  const batch = writeBatch(db);
  const codeDocRef = doc(db, FIRESTORE_COLLECTIONS.ACTIVATION_CODES, querySnapshot.docs[0].id);
  batch.update(codeDocRef, { used: true });
  await batch.commit();

  return true;
};

// This function is for the developer admin panel to add new codes
export const generateActivationCode = async (code: string): Promise<void> => {
    const codesRef = collection(db, FIRESTORE_COLLECTIONS.ACTIVATION_CODES);
    const q = query(codesRef, where("code", "==", code));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error("This code already exists.");
    }

    await addDoc(codesRef, {
        code: code,
        used: false,
        createdAt: new Date(),
    });
};

export const getMainBranch = async (): Promise<Branch | null> => {
    const q = query(collection(db, FIRESTORE_COLLECTIONS.BRANCHES), where("isMain", "==", true), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Branch;
    }
    
    // Fallback to first created branch if none is marked as main
    const fallbackQuery = query(collection(db, FIRESTORE_COLLECTIONS.BRANCHES), orderBy("createdAt"), limit(1));
    const fallbackSnapshot = await getDocs(fallbackQuery);
    if (!fallbackSnapshot.empty) {
        return { id: fallbackSnapshot.docs[0].id, ...fallbackSnapshot.docs[0].data() } as Branch;
    }
    
    return null; // No branches found at all
};
