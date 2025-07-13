
// Most authentication logic is handled directly in AuthContext.tsx and LoginPage.tsx
// This file can be used for more complex or reusable auth operations if needed.

import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

/**
 * Fetches the user profile from Firestore, including their role.
 * @param userId The UID of the user.
 * @returns UserProfile object or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;

  try {
    const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const firebaseUser = auth.currentUser; // Get base Firebase user info
      if (!firebaseUser) return null; // Should not happen if userId is valid and user is logged in

      const customData = userDocSnap.data();
      return {
        ...firebaseUser, // Spread standard FirebaseUser properties
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || customData.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
        photoURL: firebaseUser.photoURL || customData.photoURL || null,
        role: customData.role || UserRole.CASHIER, // Default role
        // ... any other custom fields
      } as UserProfile;
    } else {
      // If user doc doesn't exist but user is authenticated (e.g. new social sign-in)
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        return {
             ...firebaseUser,
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            photoURL: firebaseUser.photoURL || null,
            role: UserRole.CASHIER, // Assign a default role
        } as UserProfile
      }
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Example: Function to check if user is admin (could be expanded for other roles)
export const isAdmin = async (userId: string): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile?.role === UserRole.ADMIN;
};

// Other potential auth-related services:
// - Password reset request
// - Email verification handling
// - User account deletion with data cleanup
// - Role management functions (assign/remove roles - requires admin privileges and secure backend logic)
