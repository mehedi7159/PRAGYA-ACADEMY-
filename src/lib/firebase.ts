import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

const provider = new GoogleAuthProvider();

export const initAuth = (
  onAuthChange?: (user: User | null) => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (onAuthChange) onAuthChange(user);
  });
};

export const googleSignIn = async (): Promise<{ user: User } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    return { user: result.user };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const logout = async () => {
  await auth.signOut();
};
