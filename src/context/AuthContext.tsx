// AuthContext — Local-first user management with optional Firebase Auth
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { users, type User } from '../db/schema';
import { signInWithGoogle, signOutUser, subscribeToAuthState, migrateLocalData } from '../services/auth';

// Local device user ID — used when no Firebase Auth
const LOCAL_USER_ID = 'local-device-user';

interface AuthContextValue {
  /** Current user ID (either 'local-device-user' or Firebase Auth UID) */
  userId: string;
  /** Whether the current session is local-only (not signed in) */
  isLocalUser: boolean;
  /** The full user record from SQLite */
  user: User | null;
  /** Whether auth state has been resolved (false during initial load) */
  isReady: boolean;
  /** Sign in with Google — migrates local data to Firebase user */
  signIn: () => Promise<void>;
  /** Sign out — reverts to local-device-user */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string>(LOCAL_USER_ID);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Ensure local-device-user exists in SQLite
  const ensureLocalUser = useCallback(async () => {
    const db = getDb();
    const existing = await db.select().from(users).where(eq(users.id, LOCAL_USER_ID)).limit(1);

    if (existing.length === 0) {
      const now = new Date();
      await db.insert(users).values({
        id: LOCAL_USER_ID,
        displayName: 'Local User',
        createdAt: now,
        updatedAt: now,
      });
      console.log('[Auth] Created local-device-user');
    }

    const localUser = await db.select().from(users).where(eq(users.id, LOCAL_USER_ID)).limit(1);
    setUser(localUser[0] || null);
    setUserId(LOCAL_USER_ID);
  }, []);

  // Create/get Firebase user record in SQLite
  const ensureFirebaseUser = useCallback(async (firebaseUser: { uid: string; displayName?: string | null; email?: string | null }) => {
    const db = getDb();
    const existing = await db.select().from(users).where(eq(users.id, firebaseUser.uid)).limit(1);

    if (existing.length === 0) {
      const now = new Date();
      await db.insert(users).values({
        id: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    const fbUser = await db.select().from(users).where(eq(users.id, firebaseUser.uid)).limit(1);
    setUser(fbUser[0] || null);
    setUserId(firebaseUser.uid);
  }, []);

  // Initialize: ensure local user exists, then listen for Firebase Auth changes
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // First, ensure local user exists
      await ensureLocalUser();

      // Then subscribe to Firebase Auth state
      const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
        if (!mounted) return;

        if (firebaseUser) {
          // User is signed in with Firebase
          // Migrate local data if needed
          const currentUserId = userId;
          if (currentUserId === LOCAL_USER_ID && currentUserId !== firebaseUser.uid) {
            try {
              await migrateLocalData(LOCAL_USER_ID, firebaseUser.uid);
            } catch (err) {
              console.warn('[Auth] Migration skipped or failed:', err);
            }
          }
          await ensureFirebaseUser(firebaseUser);
        } else {
          // No Firebase Auth — stay with local user
          await ensureLocalUser();
        }

        setIsReady(true);
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    };

    init();
  }, [ensureLocalUser, ensureFirebaseUser, userId]);

  const signIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      // Auth state listener will handle the rest
    } catch (err) {
      console.error('[Auth] Sign-in failed:', err);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      // Auth state listener will revert to local user
    } catch (err) {
      console.error('[Auth] Sign-out failed:', err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        isLocalUser: userId === LOCAL_USER_ID,
        user,
        isReady,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context.
 * Must be used within <AuthProvider>.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
