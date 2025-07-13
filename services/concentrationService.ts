import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface Concentration {
  id?: string;
  name: string;
}

const concentrationsCollectionRef = collection(db, FIRESTORE_COLLECTIONS.CONCENTRATIONS);

export const addConcentration = async (concentration: Omit<Concentration, 'id'>): Promise<string> => {
  const docRef = await addDoc(concentrationsCollectionRef, concentration);
  return docRef.id;
};

export const getConcentrations = async (): Promise<Concentration[]> => {
  const querySnapshot = await getDocs(concentrationsCollectionRef);
  return querySnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as Concentration[];
};

export const updateConcentration = async (id: string, concentration: Partial<Omit<Concentration, 'id'>>): Promise<void> => {
  const concentrationDocRef = doc(db, FIRESTORE_COLLECTIONS.CONCENTRATIONS, id);
  await updateDoc(concentrationDocRef, concentration);
};

export const deleteConcentration = async (id: string): Promise<void> => {
  const concentrationDocRef = doc(db, FIRESTORE_COLLECTIONS.CONCENTRATIONS, id);
  await deleteDoc(concentrationDocRef);
};