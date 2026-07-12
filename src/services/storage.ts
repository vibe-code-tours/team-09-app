// Firestore Storage Service
import { collection, addDoc, query, orderBy, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Entry } from '../types';

export const saveEntry = async (userId: string, entry: Omit<Entry, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'users', userId, 'entries'), {
    ...entry,
    createdAt: Timestamp.now(),
    isPinned: false,
  });
  return docRef.id;
};

export const getEntries = async (userId: string): Promise<Entry[]> => {
  const q = query(collection(db, 'users', userId, 'entries'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Entry[];
};

export const getTodayEntries = async (userId: string): Promise<Entry[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, 'users', userId, 'entries'),
    where('createdAt', '>=', Timestamp.fromDate(today)),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Entry[];
};
