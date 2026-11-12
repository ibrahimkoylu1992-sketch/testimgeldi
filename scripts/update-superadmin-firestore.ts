import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  console.log('Updating SuperAdmin in Firestore:', firebaseConfig.firestoreDatabaseId);

  // 1. Set superadmin document
  const superAdminData = {
    id: 'user_superadmin_admin',
    name: 'İbrahim Köylü',
    email: 'ibrahimkoylu1992@gmail.com',
    passwordHash: '123456',
    role: 'superadmin',
    school: 'testimgeldi Yönetim Merkezi',
    branch: 'Sistem Yöneticisi',
    phone: '+90 555 123 4567',
    createdAt: '2026-01-15T09:00:00.000Z',
    isActive: true,
    subscriptionStatus: 'lifetime',
    subscriptionStartDate: '2026-01-01T00:00:00.000Z',
    subscriptionEndDate: '2099-12-31T23:59:59.000Z',
    myBranches: ['Matematik', 'Geometri', 'Mantık & Muhakeme'],
    myClasses: ['8-A', '8-B', '12-Sayısal', '12-Eşit Ağırlık'],
    customBranches: ['Matematik', 'Geometri', 'Mantık & Muhakeme'],
    customClasses: ['8-A', '8-B', '12-Sayısal', '12-Eşit Ağırlık'],
    mySchools: ['Merkez Anadolu Lisesi', 'Cumhuriyet Ortaokulu', 'Gazi İmam Hatip Ortaokulu'],
    customSchools: ['Merkez Anadolu Lisesi', 'Cumhuriyet Ortaokulu', 'Gazi İmam Hatip Ortaokulu'],
  };

  await setDoc(doc(db, 'users', 'user_superadmin_admin'), superAdminData, { merge: true });
  console.log('✅ SuperAdmin updated to ibrahimkoylu1992@gmail.com with password 123456');

  // 2. Remove any other user document having email 'info@testimgeldi.com'
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    if (data.email && data.email.toLowerCase() === 'info@testimgeldi.com') {
      await deleteDoc(doc(db, 'users', docSnap.id));
      console.log(`🗑️ Deleted info@testimgeldi.com user document: ${docSnap.id}`);
    }
  }

  console.log('✅ Firestore user cleanup finished successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Update error:', err);
  process.exit(1);
});
