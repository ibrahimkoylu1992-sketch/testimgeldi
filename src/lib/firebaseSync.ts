import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Push a single record to Cloud Firestore
export async function pushRecordToCloud(
  collectionName: 'users' | 'exams' | 'results' | 'quizzes' | 'subscriptionRequests' | 'supportTickets',
  id: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, collectionName, id), cleanData, { merge: true });
  } catch (error) {
    console.warn(`[Cloud Sync] Error pushing to ${collectionName}/${id}:`, error);
  }
}

// Delete a single record from Cloud Firestore
export async function deleteRecordFromCloud(
  collectionName: 'users' | 'exams' | 'results' | 'quizzes' | 'subscriptionRequests' | 'supportTickets',
  id: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.warn(`[Cloud Sync] Error deleting from ${collectionName}/${id}:`, error);
  }
}

// Fetch all documents from a Cloud Firestore collection
export async function fetchCollectionFromCloud<T = any>(
  collectionName: 'users' | 'exams' | 'results' | 'quizzes' | 'subscriptionRequests' | 'supportTickets'
): Promise<T[]> {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    snapshot.forEach((d) => {
      items.push({ ...(d.data() as T), id: d.id });
    });
    return items;
  } catch (error) {
    console.warn(`[Cloud Sync] Error fetching ${collectionName}:`, error);
    return [];
  }
}
