import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { Category } from '../types';

const categoryCollection = collection(db, FIRESTORE_COLLECTIONS.CATEGORIES);

export const getCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(categoryCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (categoryName: string) => {
  return await addDoc(categoryCollection, { name: categoryName });
};

export const updateCategory = async (id: string, newName: string) => {
  const categoryDoc = doc(db, FIRESTORE_COLLECTIONS.CATEGORIES, id);
  return await updateDoc(categoryDoc, { name: newName });
};

export const deleteCategory = async (id: string) => {
  const categoryDoc = doc(db, FIRESTORE_COLLECTIONS.CATEGORIES, id);
  return await deleteDoc(categoryDoc);
};
