import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function uploadToCloud(content: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const backupRef = doc(db, 'user_backups', user.uid);
  
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Cloud sync timeout. Please check your internet connection.')), 10000)
  );

  await Promise.race([
    setDoc(backupRef, {
      data: content,
      updatedAt: new Date().toISOString()
    }),
    timeout
  ]);
}

export async function downloadFromCloud(): Promise<any | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const backupRef = doc(db, 'user_backups', user.uid);
  
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Cloud sync timeout. Please check your internet connection.')), 15000)
  );

  try {
    const docSnap = await Promise.race([
      getDoc(backupRef),
      timeout
    ]) as any;

    if (docSnap && docSnap.exists() && docSnap.data()) {
      const docData = docSnap.data();
      if (docData.data) {
        if (typeof docData.data === 'string') {
          try {
            return JSON.parse(docData.data);
          } catch (e) {
            console.error('Failed to parse backup string', e);
            return null;
          }
        }
        // If it's already an object
        return docData.data;
      }
    }
  } catch (error) {
    console.warn('Cloud download error:', error);
    throw error;
  }
  return null;
}

export async function getCloudBackupMeta(): Promise<{ updatedAt: string } | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const backupRef = doc(db, 'user_backups', user.uid);
  
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  );
  
  try {
    const docSnap = await Promise.race([
      getDoc(backupRef),
      timeout
    ]) as any;
    
    if (docSnap && docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.updatedAt) {
        return { updatedAt: data.updatedAt };
      }
    }
  } catch (e) {
    console.warn('Failed to get cloud backup meta:', e);
  }
  return null;
}
