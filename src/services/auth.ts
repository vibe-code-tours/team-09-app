// Firebase Auth + Google Sign-In Service
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

/**
 * Sign in with Google.
 * Returns the Firebase user credential.
 */
export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  await GoogleSignin.signIn();
  const googleAuth = await GoogleSignin.getTokens();

  const credential = GoogleAuthProvider.credential(
    googleAuth.idToken,
    googleAuth.accessToken
  );

  const userCredential = await signInWithCredential(auth, credential);
  return userCredential;
};

/**
 * Sign out from Firebase + Google.
 */
export const signOutUser = async () => {
  await GoogleSignin.signOut();
  await firebaseSignOut(auth);
};

/**
 * Subscribe to Firebase Auth state changes.
 */
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Migrate local data to Firebase user.
 * Re-assigns all entries, categories, settings from localUserId to firebaseUserId.
 */
export const migrateLocalData = async (
  localUserId: string,
  firebaseUserId: string
): Promise<void> => {
  // Dynamic imports to avoid circular dependency
  const { getDb } = await import('../db');
  const schema = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  const db = getDb();

  // Migrate all data from local user to Firebase user
  await db.update(schema.entries).set({ userId: firebaseUserId }).where(eq(schema.entries.userId, localUserId));
  await db.update(schema.categories).set({ userId: firebaseUserId }).where(eq(schema.categories.userId, localUserId));
  await db.update(schema.userSettings).set({ userId: firebaseUserId }).where(eq(schema.userSettings.userId, localUserId));
  await db.update(schema.dailyUsage).set({ userId: firebaseUserId }).where(eq(schema.dailyUsage.userId, localUserId));
  await db.update(schema.corrections).set({ userId: firebaseUserId }).where(eq(schema.corrections.userId, localUserId));

  // Delete the local user record
  await db.delete(schema.users).where(eq(schema.users.id, localUserId));

  console.log(`[Auth] Migrated data from ${localUserId} to ${firebaseUserId}`);
};
