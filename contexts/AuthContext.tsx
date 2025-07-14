
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, UserRole, AuthContextType } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore to get role and other custom data
        const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let userProfileData: UserProfile = {
          ...firebaseUser,
          uid: firebaseUser.uid, // ensure uid is present
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email?.split('@')[0] || 'U'}&background=random`,
          role: 'Admin', // Por ahora establecemos Admin como rol por defecto para pruebas
        };

        if (userDocSnap.exists()) {
          const customData = userDocSnap.data();
          userProfileData = {
            ...userProfileData,
            role: customData.role || UserRole.CASHIER,
            branchAssignments: customData.branchAssignments || {},
            // ... any other custom fields
          };
        }
        // Specific hardcoded admin roles based on UID for initial setup
        if (firebaseUser.uid === "CbaGzOUXC6bWRny43duYHRfutqL2" || firebaseUser.uid === "MlvF9HRsqZX1xEdBog1IqlWC1zW2" || firebaseUser.uid === "goILrDSXG8Mr9mTpp8Ok5bpK67P2" || firebaseUser.uid === "2IexObRvMlQXgtB5Y8fgOcLsNSX2") {
          userProfileData.role = UserRole.ADMIN;
        }

        setCurrentUser(userProfileData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
