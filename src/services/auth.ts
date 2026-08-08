// Firebase Auth + Google Sign-In Service
import { auth } from '../config/firebase';

// Only import Firebase modules when auth is available
let GoogleSignin: any = null;
let GoogleAuthProvider: any = null;
let signInWithCredential: any = null;
let firebaseSignOut: any = null;
let onAuthStateChanged: any = null;

const isFirebaseReady = Boolean(auth);

if (isFirebaseReady) {
  try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;

    const authModule = require('firebase/auth');
    GoogleAuthProvider = authModule.GoogleAuthProvider;
    signInWithCredential = authModule.signInWithCredential;
    firebaseSignOut = authModule.signOut;
    onAuthStateChanged = authModule.onAuthStateChanged;

    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  } catch (err) {
    console.warn('[Auth] Firebase modules not available:', err);
  }
}

/**
 * Sign in with Google.
 * Returns the Firebase user credential.
 */
export const signInWithGoogle = async () => {
  if (!isFirebaseReady || !auth || !GoogleSignin || !GoogleAuthProvider || !signInWithCredential) {
    throw new Error('Firebase Auth is not configured. Add EXPO_PUBLIC_FIREBASE_* env vars.');
  }
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
  if (!isFirebaseReady || !auth || !GoogleSignin || !firebaseSignOut) {
    return; // no-op when Firebase is not configured
  }
  await GoogleSignin.signOut();
  await firebaseSignOut(auth);
};

/**
 * Subscribe to Firebase Auth state changes.
 * Returns an unsubscribe function. If Firebase is not configured,
 * returns a no-op unsubscribe and immediately calls callback with null.
 */
export const subscribeToAuthState = (callback: (user: any) => void): (() => void) => {
  if (!isFirebaseReady || !auth || !onAuthStateChanged) {
    // Firebase not configured — immediately notify as unauthenticated
    callback(null);
    return () => {}; // no-op unsubscribe
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Migrate local data to Firebase user.
 * Re-assigns all entries, settings from localUserId to firebaseUserId.
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

  // Migrate all data from local user to Firebase user atomically.
  // Wrapped in a transaction so a crash mid-migration rolls back —
  // otherwise data splits between localUserId and firebaseUserId.
  await db.transaction(async (tx) => {
    await tx.update(schema.entries).set({ userId: firebaseUserId }).where(eq(schema.entries.userId, localUserId));
    await tx.update(schema.userSettings).set({ userId: firebaseUserId }).where(eq(schema.userSettings.userId, localUserId));
    await tx.update(schema.dailyUsage).set({ userId: firebaseUserId }).where(eq(schema.dailyUsage.userId, localUserId));
    await tx.update(schema.corrections).set({ userId: firebaseUserId }).where(eq(schema.corrections.userId, localUserId));

    // Delete the local user record
    await tx.delete(schema.users).where(eq(schema.users.id, localUserId));
  });

  console.log(`[Auth] Migrated data from ${localUserId} to ${firebaseUserId}`);
};
