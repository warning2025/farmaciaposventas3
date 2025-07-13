import { collection, onSnapshot, query, orderBy, Unsubscribe, doc, setDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserProfile, UserRole } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export const onUsersUpdate = (callback: (users: UserProfile[]) => void): Unsubscribe => {
  const usersCollectionRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
  const q = query(usersCollectionRef, orderBy('email', 'asc'));

  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        uid: docSnap.id,
        ...data,
      } as UserProfile;
    });
    callback(users);
  });
};

export const addUser = async (userData: { email: string, password?: string, role: UserRole, displayName?: string }): Promise<void> => {
  const auth = getAuth();
  let uid: string;

  if (userData.password) {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    uid = userCredential.user.uid;
  } else {
    // This case might be for users created via other providers or methods
    // For now, we assume a password is provided for new users.
    // If not, we need a way to get the UID. Let's throw an error for now.
    throw new Error("Password is required to create a new user.");
  }

  // Then, create the user profile in Firestore
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  await setDoc(userRef, {
    email: userData.email,
    role: userData.role,
    displayName: userData.displayName || userData.email, // Default display name to email
  });
};


export const updateUser = async (uid: string, userData: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  await setDoc(userRef, userData, { merge: true });
};

export const deleteUser = async (uid: string): Promise<void> => {
  // Note: This only deletes the Firestore record.
  // Deleting from Firebase Auth is a sensitive operation and requires re-authentication.
  // For this application, we'll just delete the profile data.
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  await deleteDoc(userRef);
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersCollectionRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
  const querySnapshot = await getDocs(usersCollectionRef);
  return querySnapshot.docs.map(docSnap => {
    return {
      uid: docSnap.id,
      ...docSnap.data(),
    } as UserProfile;
  });
};

export const assignUserToBranch = async (userId: string, branchId: string, role: UserRole): Promise<void> => {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error("User not found");
  }
  const userData = userDoc.data() as UserProfile;
  const branchAssignments = userData.branchAssignments || {};
  branchAssignments[branchId] = role;

  await setDoc(userRef, { branchAssignments }, { merge: true });
};

export const updateUserBranchAssignment = async (userId: string, branchId: string, newRole: UserRole): Promise<void> => {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error("User not found");
  }
  const userData = userDoc.data() as UserProfile;
  const branchAssignments = userData.branchAssignments || {};
  
  if (!branchAssignments[branchId]) {
    throw new Error(`User is not assigned to branch ${branchId}`);
  }
  
  branchAssignments[branchId] = newRole;
  await setDoc(userRef, { branchAssignments }, { merge: true });
};

export const removeUserBranchAssignment = async (userId: string, branchId: string): Promise<void> => {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error("User not found");
  }
  const userData = userDoc.data() as UserProfile;
  const branchAssignments = userData.branchAssignments || {};
  
  if (branchAssignments[branchId]) {
    delete branchAssignments[branchId];
  }
  
  await setDoc(userRef, { branchAssignments }, { merge: true });
};
