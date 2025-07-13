import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FIRESTORE_COLLECTIONS } from '../constants';

export interface Presentation {
  id?: string;
  name: string;
}

const presentationsCollectionRef = collection(db, FIRESTORE_COLLECTIONS.PRESENTATIONS);

/**
 * Adds a new presentation to the database.
 * @param presentation The presentation data to add.
 * @returns A promise that resolves to the ID of the newly created presentation.
 */
export const addPresentation = async (presentation: Omit<Presentation, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(presentationsCollectionRef, presentation);
    return docRef.id;
  } catch (error) {
    console.error("Error adding presentation: ", error);
    throw error;
  }
};

/**
 * Retrieves all presentations from the database.
 * @returns A promise that resolves to an array of presentations.
 */
export const getPresentations = async (): Promise<Presentation[]> => {
  try {
    const querySnapshot = await getDocs(presentationsCollectionRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Presentation, 'id'>
    }));
  } catch (error) {
    console.error("Error fetching presentations: ", error);
    throw error;
  }
};

/**
 * Updates an existing presentation in the database.
 * @param id The ID of the presentation to update.
 * @param presentation The updated presentation data.
 * @returns A promise that resolves when the update is complete.
 */
export const updatePresentation = async (id: string, presentation: Partial<Omit<Presentation, 'id'>>): Promise<void> => {
  try {
    const presentationDocRef = doc(db, FIRESTORE_COLLECTIONS.PRESENTATIONS, id);
    await updateDoc(presentationDocRef, presentation as DocumentData);
  } catch (error) {
    console.error("Error updating presentation: ", error);
    throw error;
  }
};

/**
 * Deletes a presentation from the database.
 * @param id The ID of the presentation to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deletePresentation = async (id: string): Promise<void> => {
  try {
    const presentationDocRef = doc(db, FIRESTORE_COLLECTIONS.PRESENTATIONS, id);
    await deleteDoc(presentationDocRef);
  } catch (error) {
    console.error("Error deleting presentation: ", error);
    throw error;
  }
};