import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.ts'; // Adjust the path to your firebaseConfig
import { FIRESTORE_COLLECTIONS } from '../constants.ts';

const seedDatabase = async () => {
  const users = [
    {
      uid: 'goILrDSXG8Mr9mTpp8Ok5bpK67P2',
      email: 'admin@farmaciasantiago.com',
      role: 'ADMIN',
      displayName: 'Admin FarmaSantiago',
    },
    {
      uid: '2IexObRvMlQXgtB5Y8fgOcLsNSX2',
      email: 'elcreadorweb@gmail.com',
      role: 'ADMIN',
      displayName: 'El Creador Web',
    },
    {
      uid: 'CbaGzOUXC6bWRny43duYHRfutqL2',
      email: 'anotheradmin@example.com',
      role: 'ADMIN',
      displayName: 'Another Admin',
    },
    {
      uid: 'MlvF9HRsqZX1xEdBog1IqlWC1zW2',
      email: 'superadmin@example.com',
      role: 'ADMIN',
      displayName: 'Super Admin',
    },
  ];

  const usersCollectionRef = collection(db, FIRESTORE_COLLECTIONS.USERS);

  for (const user of users) {
    try {
      await setDoc(doc(usersCollectionRef, user.uid), user);
      console.log(`User ${user.email} successfully written!`);
    } catch (error) {
      console.error("Error writing user: ", error);
    }
  }
};

seedDatabase();
