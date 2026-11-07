import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse app instance if already initialized
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

export const GOOGLE_CONTACTS_SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
];

const provider = new GoogleAuthProvider();
GOOGLE_CONTACTS_SCOPES.forEach((scope) => provider.addScope(scope));

export interface GoogleContactPerson {
  resourceName: string;
  id: string;
  name: string;
  givenName?: string;
  familyName?: string;
  phone?: string;
  email?: string;
  organization?: string;
  avatarUrl?: string;
  etag?: string;
}

export interface GoogleSyncInfo {
  lastSyncTimestamp: number | null;
  totalContactCount: number;
  status: 'idle' | 'polling' | 'synced' | 'error' | 'unauthenticated';
  error: string | null;
}

// In-memory access token cache (MANDATORY: no localStorage / sessionStorage for token)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

type AuthCallback = (user: User | null, token: string | null) => void;
type SyncCallback = (info: GoogleSyncInfo) => void;

const authListeners: Set<AuthCallback> = new Set();
const syncListeners: Set<SyncCallback> = new Set();

function getInitialSyncInfo(): GoogleSyncInfo {
  try {
    const rawTime = localStorage.getItem('gkedit_contacts_last_sync');
    const rawCount = localStorage.getItem('gkedit_contacts_total_count');
    return {
      lastSyncTimestamp: rawTime ? parseInt(rawTime, 10) : null,
      totalContactCount: rawCount ? parseInt(rawCount, 10) : 0,
      status: cachedAccessToken ? 'idle' : 'unauthenticated',
      error: null,
    };
  } catch {
    return {
      lastSyncTimestamp: null,
      totalContactCount: 0,
      status: 'unauthenticated',
      error: null,
    };
  }
}

let currentSyncInfo: GoogleSyncInfo = getInitialSyncInfo();

function notifySyncListeners() {
  syncListeners.forEach((fn) => {
    try {
      fn({ ...currentSyncInfo });
    } catch (e) {
      console.error('Error in sync listener:', e);
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    cachedAccessToken = null;
    currentSyncInfo = {
      ...currentSyncInfo,
      status: 'unauthenticated',
    };
    notifySyncListeners();
  } else if (cachedAccessToken && currentSyncInfo.status === 'unauthenticated') {
    currentSyncInfo = {
      ...currentSyncInfo,
      status: 'idle',
    };
    notifySyncListeners();
  }
  authListeners.forEach((fn) => fn(user, cachedAccessToken));
});

export const googleContactsService = {
  subscribeAuth(callback: AuthCallback): () => void {
    authListeners.add(callback);
    // Initial call
    callback(auth.currentUser, cachedAccessToken);
    return () => authListeners.delete(callback);
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  async signIn(): Promise<{ user: User; accessToken: string }> {
    if (isSigningIn) {
      throw new Error('Sign-in already in progress');
    }
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('No access token returned from Google Auth');
      }
      cachedAccessToken = credential.accessToken;
      authListeners.forEach((fn) => fn(result.user, cachedAccessToken));
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      throw err;
    } finally {
      isSigningIn = false;
    }
  },

  async signOut(): Promise<void> {
    await signOut(auth);
    cachedAccessToken = null;
    currentSyncInfo = {
      lastSyncTimestamp: null,
      totalContactCount: 0,
      status: 'unauthenticated',
      error: null,
    };
    try {
      localStorage.removeItem('gkedit_contacts_last_sync');
      localStorage.removeItem('gkedit_contacts_total_count');
    } catch {}
    notifySyncListeners();
    authListeners.forEach((fn) => fn(null, null));
  },

  getSyncInfo(): GoogleSyncInfo {
    return { ...currentSyncInfo };
  },

  subscribeSync(callback: SyncCallback): () => void {
    syncListeners.add(callback);
    callback({ ...currentSyncInfo });
    return () => syncListeners.delete(callback);
  },

  recordSync(count: number, timestamp: number = Date.now()): void {
    currentSyncInfo = {
      lastSyncTimestamp: timestamp,
      totalContactCount: count,
      status: 'synced',
      error: null,
    };
    try {
      localStorage.setItem('gkedit_contacts_last_sync', String(timestamp));
      localStorage.setItem('gkedit_contacts_total_count', String(count));
    } catch {}
    notifySyncListeners();
  },

  /**
   * Polls the Google People API to retrieve the latest sync metadata and total contacts count
   */
  async pollSync(): Promise<GoogleSyncInfo> {
    if (!cachedAccessToken) {
      currentSyncInfo = {
        ...currentSyncInfo,
        status: 'unauthenticated',
        error: 'Not authenticated with Google. Connect account to enable synchronization.',
      };
      notifySyncListeners();
      return { ...currentSyncInfo };
    }

    currentSyncInfo = {
      ...currentSyncInfo,
      status: 'polling',
      error: null,
    };
    notifySyncListeners();

    try {
      const url = new URL('https://people.googleapis.com/v1/people/me/connections');
      url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,photos,organizations');
      url.searchParams.set('pageSize', '150');
      url.searchParams.set('sortOrder', 'FIRST_NAME_ASCENDING');

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        if (res.status === 401) {
          cachedAccessToken = null;
          authListeners.forEach((fn) => fn(auth.currentUser, null));
          currentSyncInfo = {
            ...currentSyncInfo,
            status: 'unauthenticated',
            error: 'Google authorization expired. Please sign in again.',
          };
          notifySyncListeners();
          throw new Error('Google authorization expired. Please sign in again.');
        }
        const errMsg = errBody?.error?.message || `Failed to fetch Google Contacts (${res.status})`;
        currentSyncInfo = {
          ...currentSyncInfo,
          status: 'error',
          error: errMsg,
        };
        notifySyncListeners();
        throw new Error(errMsg);
      }

      const data = await res.json();
      const connections: any[] = data.connections || [];
      const totalCount = typeof data.totalPeople === 'number'
        ? data.totalPeople
        : (typeof data.totalItems === 'number' ? data.totalItems : connections.length);

      const now = Date.now();
      currentSyncInfo = {
        lastSyncTimestamp: now,
        totalContactCount: totalCount,
        status: 'synced',
        error: null,
      };

      try {
        localStorage.setItem('gkedit_contacts_last_sync', String(now));
        localStorage.setItem('gkedit_contacts_total_count', String(totalCount));
      } catch {}

      notifySyncListeners();
      return { ...currentSyncInfo };
    } catch (err: any) {
      if (currentSyncInfo.status !== 'unauthenticated') {
        currentSyncInfo = {
          ...currentSyncInfo,
          status: 'error',
          error: err?.message || 'Sync failed',
        };
        notifySyncListeners();
      }
      throw err;
    }
  },

  /**
   * Fetches real Google Contacts using the Google People API
   */
  async fetchContacts(): Promise<GoogleContactPerson[]> {
    if (!cachedAccessToken) {
      throw new Error('Not authenticated with Google. Please sign in first.');
    }

    currentSyncInfo = {
      ...currentSyncInfo,
      status: 'polling',
      error: null,
    };
    notifySyncListeners();

    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,photos,organizations');
    url.searchParams.set('pageSize', '150');
    url.searchParams.set('sortOrder', 'FIRST_NAME_ASCENDING');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      if (res.status === 401) {
        cachedAccessToken = null;
        authListeners.forEach((fn) => fn(auth.currentUser, null));
        currentSyncInfo = {
          ...currentSyncInfo,
          status: 'unauthenticated',
          error: 'Google authorization expired. Please sign in again.',
        };
        notifySyncListeners();
        throw new Error('Google authorization expired. Please sign in again.');
      }
      const errMsg = errBody?.error?.message || `Failed to fetch Google Contacts (${res.status})`;
      currentSyncInfo = {
        ...currentSyncInfo,
        status: 'error',
        error: errMsg,
      };
      notifySyncListeners();
      throw new Error(errMsg);
    }

    const data = await res.json();
    const connections: any[] = data.connections || [];
    const totalCount = typeof data.totalPeople === 'number'
      ? data.totalPeople
      : (typeof data.totalItems === 'number' ? data.totalItems : connections.length);

    const now = Date.now();
    currentSyncInfo = {
      lastSyncTimestamp: now,
      totalContactCount: totalCount,
      status: 'synced',
      error: null,
    };

    try {
      localStorage.setItem('gkedit_contacts_last_sync', String(now));
      localStorage.setItem('gkedit_contacts_total_count', String(totalCount));
    } catch {}
    notifySyncListeners();

    return connections.map((conn) => {
      const primaryName = conn.names?.[0];
      const displayName = primaryName?.displayName || 'Unnamed Contact';
      const givenName = primaryName?.givenName;
      const familyName = primaryName?.familyName;

      const primaryPhone = conn.phoneNumbers?.[0]?.value || '';
      const primaryEmail = conn.emailAddresses?.[0]?.value || '';
      const primaryPhoto = conn.photos?.[0]?.url || '';
      const primaryOrg = conn.organizations?.[0];
      const organization = primaryOrg?.name || primaryOrg?.title || primaryOrg?.department || '';

      const id = conn.resourceName ? conn.resourceName.replace('people/', '') : 'gc_' + Date.now();

      return {
        resourceName: conn.resourceName,
        id,
        name: displayName,
        givenName,
        familyName,
        phone: primaryPhone,
        email: primaryEmail,
        organization,
        avatarUrl: primaryPhoto,
        etag: conn.etag,
      };
    });
  },

  /**
   * Creates a new real contact in Google Contacts via Google People API
   */
  async createContact(params: {
    name: string;
    phone?: string;
    email?: string;
  }): Promise<GoogleContactPerson> {
    if (!cachedAccessToken) {
      throw new Error('Not authenticated with Google. Please sign in first.');
    }

    const nameParts = params.name.trim().split(' ');
    const givenName = nameParts[0] || params.name.trim();
    const familyName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const body: any = {
      names: [
        {
          givenName,
          familyName,
          displayName: params.name.trim(),
        },
      ],
    };

    if (params.phone?.trim()) {
      body.phoneNumbers = [
        {
          value: params.phone.trim(),
          type: 'mobile',
        },
      ];
    }

    if (params.email?.trim()) {
      body.emailAddresses = [
        {
          value: params.email.trim(),
          type: 'home',
        },
      ];
    }

    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.message || `Failed to create contact in Google Contacts (${res.status})`);
    }

    const created = await res.json();
    return {
      resourceName: created.resourceName,
      id: created.resourceName ? created.resourceName.replace('people/', '') : 'gc_' + Date.now(),
      name: created.names?.[0]?.displayName || params.name.trim(),
      givenName,
      familyName,
      phone: params.phone,
      email: params.email,
      avatarUrl: created.photos?.[0]?.url,
    };
  },

  /**
   * Deletes a contact from Google Contacts (Requires user confirmation)
   */
  async deleteContact(resourceName: string): Promise<void> {
    if (!cachedAccessToken) {
      throw new Error('Not authenticated with Google.');
    }

    const res = await fetch(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.message || `Failed to delete contact in Google Contacts`);
    }
  },
};
