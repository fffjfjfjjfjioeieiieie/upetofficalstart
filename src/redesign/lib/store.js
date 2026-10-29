import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth, firebaseConfigured, persistAuthLocally } from '../../app/firebase.js';
import { firestore } from '../../app/firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { isApprovedFounder } from '../../app/FounderGate.jsx';
import { getSiteAccess } from './siteAccess.js';
import { claimUsername as claimFirebaseUsername, getAccountForUser, isUsernameAvailable } from '../../data/accountStore.js';
import { getProfileAnalytics, recordProfileEvent } from '../../data/analyticsStore.js';
import { getEditableRedesign, listDirectoryProfiles, saveRedesignProfile, subscribeEditableRedesign } from './firebaseStore.js';
import { defaultProfile } from './profileModel.js';
import { RATE_LIMITS } from '../../shared/rateLimits.js';

export const ADMIN = { username: '', password: '' };
export const RESERVED = ['admin', 'explore', 'marketplace', 'legal', 'login', 'dashboard', 'business', 'business-verification', 'biz', 'api', 'settings', 'help', 'support', 'user', 'pet', 'claim', 'shop-auth', 'welcome', 'create-account', 'assets'];

const Ctx = createContext(null);

function clone(value) {
  return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function setAtPath(target, path, value) {
  const keys = String(path).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cursor = target;
  keys.slice(0, -1).forEach((key, index) => {
    const nextKey = keys[index + 1];
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = /^\d+$/.test(nextKey) ? [] : {};
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
}

function getAtPath(target, path) {
  return String(path).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
    .reduce((value, key) => value?.[key], target);
}

function timestampMs(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  const number = Number(value);
  return Number.isFinite(number) ? number : Date.now();
}

function friendlyAuthError(error) {
  const messages = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/network-request-failed': 'Check your connection and try again.',
    'auth/requires-recent-login': 'Sign out, sign back in, then try that again.',
    'auth/weak-password': 'Use a password with at least six characters.',
    'auth/email-already-in-use': 'An account already exists for this email. Log in instead.',
  };
  return messages[error?.code] || error?.message || 'Authentication could not finish.';
}

export function StoreProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [siteRole, setSiteRole] = useState('member');
  const [user, setUserState] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [ready, setReady] = useState(false);
  const [needsClaim, setNeedsClaim] = useState(false);
  // Reset the previous light preference once; the new key keeps future choices.
  const [theme, setTheme] = useState(() => localStorage.getItem('upet_theme_v2') === 'light' ? 'light' : 'dark');
  const [storageError, setStorageError] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const dirty = useRef(false);
  const editVersion = useRef(0);
  const saveTimer = useRef(null);
  const directoryRequest = useRef(null);
  const directoryLoadedAt = useRef(0);
  const accountLoad = useRef(null);
  const profileAnalyticsLoad = useRef(null);
  const currentUserRef = useRef(null);
  currentUserRef.current = user;

  const refreshDirectory = useCallback(async (force = false) => {
    if (directoryRequest.current) return directoryRequest.current;
    if (!force && Date.now() - directoryLoadedAt.current < 5 * 60 * 1000) return;
    directoryRequest.current = (async () => {
      const profiles = await listDirectoryProfiles();
      try {
        const response = await fetch('/api/top-profiles');
        if (!response.ok) throw new Error('Could not load profile views.');
        const payload = await response.json();
        const viewsByUsername = new Map((payload.profiles || []).map((entry) => [entry.username, Number(entry.views) || 0]));
        setDirectory(profiles.map((entry) => ({
          ...entry,
          profile: { ...entry.profile, views: viewsByUsername.get(entry.username) ?? 0 },
        })));
      } catch {
        setDirectory(profiles);
      }
      directoryLoadedAt.current = Date.now();
    })();
    try { await directoryRequest.current; }
    finally { directoryRequest.current = null; }
  }, []);

  const loadAccount = useCallback((authUser, force = false) => {
    const previous = accountLoad.current;
    if (!force && previous?.uid === authUser.uid) {
      if (previous.promise) return previous.promise;
      if (Date.now() - previous.loadedAt < 3000) return Promise.resolve(previous.result);
    }
    const promise = (async () => {
      const account = await getAccountForUser(authUser);
      if (!account?.username) {
        setNeedsClaim(true);
        setUserState(null);
        return null;
      }
      const profile = await getEditableRedesign(authUser, account.username);
      const next = {
        uid: authUser.uid,
        username: account.username,
        email: authUser.email || '',
        role: isApprovedFounder(authUser) ? 'founder' : 'member',
        banned: false,
        createdAt: timestampMs(account.createdAt),
        usernameChangedAt: account.usernameChangedAt ? timestampMs(account.usernameChangedAt) : 0,
        twofa: { enabled: false, secret: '' },
        connections: profile.integrations || {},
        profile,
      };
      dirty.current = false;
      setNeedsClaim(false);
      setUserState(next);
      setDirectory((rows) => {
        const listed = rows.find((row) => row.username === next.username);
        const views = Math.max(Number(next.profile.views) || 0, Number(listed?.profile?.views) || 0);
        return [{ ...next, profile: { ...next.profile, views } }, ...rows.filter((row) => row.username !== next.username)];
      });
      return next;
    })();
    accountLoad.current = { uid: authUser.uid, promise, loadedAt: 0, result: null };
    promise.then((result) => {
      if (accountLoad.current?.promise === promise) accountLoad.current = { uid: authUser.uid, promise: null, loadedAt: Date.now(), result };
    }, () => {
      if (accountLoad.current?.promise === promise) accountLoad.current = null;
    });
    return promise;
  }, []);

  useEffect(() => {
    if (!auth || !firebaseConfigured) {
      setReady(true);
      return undefined;
    }
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!active) return;
      if (!authUser) {
        accountLoad.current = null;
        setFirebaseUser(null);
        setUserState(null);
        setNeedsClaim(false);
        setReady(true);
        return;
      }
      let access = null;
      try { access = await getSiteAccess(authUser); } catch { access = null; }
      if (!access) {
        accountLoad.current = null;
        await signOut(auth).catch(() => {});
        if (active) {
          setFirebaseUser(null);
          setUserState(null);
          setReady(true);
        }
        return;
      }
      setSiteRole(access.role);
      setFirebaseUser(authUser);
      try {
        await loadAccount(authUser);
        if (active) setStorageError(false);
      } catch (error) {
        if (active) setStorageError(error?.message || 'Could not load your profile.');
      } finally {
        if (active) setReady(true);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadAccount]);

  useEffect(() => {
    if (!firebaseUser?.email || siteRole !== 'member' || !firestore) return undefined;
    return onSnapshot(doc(firestore, 'accessInvites', firebaseUser.email.trim().toLowerCase()), (snapshot) => {
      if (snapshot.exists() && snapshot.data().active === true && snapshot.data().role === 'member') return;
      signOut(auth).catch(() => {}).finally(() => {
        setFirebaseUser(null);
        setUserState(null);
        setNeedsClaim(false);
      });
    }, () => {});
  }, [firebaseUser?.uid, firebaseUser?.email, siteRole]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('upet_theme_v2', theme);
  }, [theme]);

  useEffect(() => {
    if (!dirty.current || !firebaseUser || !user?.username) return undefined;
    clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      const savingVersion = editVersion.current;
      try {
        const saved = await saveRedesignProfile(firebaseUser, user.username, currentUserRef.current.profile, { publish: true });
        const isLatest = savingVersion === editVersion.current;
        if (isLatest) {
          dirty.current = false;
          setSaveState('saved');
          setUserState((current) => current && current.uid === firebaseUser.uid
            ? { ...current, profile: saved, connections: saved.integrations || {} }
            : current);
        }
        setStorageError(false);
        setDirectory((rows) => rows.map((row) => row.username === user.username ? {
          ...row,
          profile: { ...saved, views: Math.max(Number(saved.views) || 0, Number(row.profile?.views) || 0) },
        } : row));
      } catch (error) {
        if (savingVersion === editVersion.current) setSaveState('error');
        setStorageError(error?.message || 'Your changes could not be saved.');
      }
    }, RATE_LIMITS.profileSaveDelayMs);
    return () => clearTimeout(saveTimer.current);
  }, [firebaseUser, user]);

  useEffect(() => {
    if (!firebaseUser?.uid || !user?.username || !firestore) return undefined;
    return subscribeEditableRedesign(firebaseUser, user.username, (profile) => {
      if (!profile || dirty.current) return;
      setUserState((current) => {
        if (!current || current.uid !== firebaseUser.uid || current.username !== user.username) return current;
        return { ...current, profile, connections: profile.integrations || {} };
      });
      setDirectory((rows) => rows.map((row) => row.username === user.username ? {
        ...row,
        profile: { ...profile, views: Math.max(Number(profile.views) || 0, Number(row.profile?.views) || 0) },
      } : row));
    }, (error) => setStorageError(error?.message || 'Live profile sync stopped.'));
  }, [firebaseUser?.uid, user?.username]);

  const login = useCallback(async (email, password) => {
    if (!auth || !firebaseConfigured) return { ok: false, error: 'Firebase is not configured.' };
    try {
      await persistAuthLocally();
      const credential = await signInWithEmailAndPassword(auth, String(email || '').trim(), password || '');
      const access = await getSiteAccess(credential.user);
      if (!access) {
        await signOut(auth);
        return { ok: false, error: 'This account has no active Upet access invitation.' };
      }
      setSiteRole(access.role);
      setFirebaseUser(credential.user);
      const loaded = await loadAccount(credential.user);
      return { ok: true, needsClaim: !loaded };
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) };
    }
  }, [loadAccount]);

  const loginWithGoogle = useCallback(async () => {
    if (!auth || !firebaseConfigured) return { ok: false, error: 'Firebase is not configured.' };
    try {
      await persistAuthLocally();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      const access = await getSiteAccess(credential.user);
      if (!access) {
        await signOut(auth);
        return { ok: false, error: 'This Google account has no active Upet access invitation.' };
      }
      setSiteRole(access.role);
      setFirebaseUser(credential.user);
      const loaded = await loadAccount(credential.user);
      return { ok: true, needsClaim: !loaded };
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) };
    }
  }, [loadAccount]);

  const register = useCallback(async (email, password) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email || '').trim().toLowerCase(), password: password || '' }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return { ok: false, error: result.error || 'Account creation failed.' };
      return { ok: true };
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) };
    }
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
    accountLoad.current = null;
    setFirebaseUser(null);
    setSiteRole('member');
    setUserState(null);
    setNeedsClaim(false);
  }, []);

  const claimUsername = useCallback(async (rawUsername) => {
    if (!firebaseUser) return { ok: false, error: 'Sign in first.' };
    try {
      const result = await claimFirebaseUsername(firebaseUser, rawUsername, siteRole);
      const loaded = await loadAccount(firebaseUser, true);
      if (loaded) await saveRedesignProfile(firebaseUser, result.username, loaded.profile, { publish: true });
      return { ok: true, username: result.username };
    } catch (error) {
      return { ok: false, error: error?.message || 'That username could not be claimed.' };
    }
  }, [firebaseUser, loadAccount, siteRole]);

  const updateProfile = useCallback((updates) => {
    setUserState((current) => {
      if (!current) return current;
      if (Object.entries(updates).every(([path, value]) => Object.is(getAtPath(current.profile, path), value))) return current;
      const next = clone(current);
      Object.entries(updates).forEach(([path, value]) => setAtPath(next.profile, path, value));
      if (Object.keys(updates).some((path) => path === 'integrations' || path.startsWith('integrations.'))) next.connections = next.profile.integrations;
      dirty.current = true;
      editVersion.current += 1;
      return next;
    });
  }, []);

  const setProfile = useCallback((path, value) => updateProfile({ [path]: value }), [updateProfile]);

  const setUser = useCallback((path, value) => {
    if (path === 'email' || path === 'password' || path === 'twofa') return;
    if (path === 'connections' || path.startsWith('connections.')) {
      setProfile(path.replace(/^connections/, 'integrations'), value);
      return;
    }
    setUserState((current) => {
      if (!current) return current;
      const next = clone(current);
      setAtPath(next, path, value);
      return next;
    });
  }, [setProfile]);

  const replaceProfile = useCallback((profile) => {
    setUserState((current) => {
      if (!current) return current;
      const nextProfile = clone(profile);
      dirty.current = true;
      editVersion.current += 1;
      return { ...current, profile: nextProfile, connections: nextProfile.integrations || {} };
    });
  }, []);

  const changePassword = useCallback(async (currentPassword, nextPassword) => {
    if (!auth?.currentUser?.email) return { ok: false, error: 'Sign in again first.' };
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, nextPassword);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) };
    }
  }, []);

  const resetPassword = useCallback(async (email = firebaseUser?.email) => {
    if (!auth || !email) return { ok: false, error: 'Enter your email first.' };
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) };
    }
  }, [firebaseUser]);

  const isTaken = useCallback(async (name) => {
    if (RESERVED.includes(String(name).toLowerCase())) return true;
    return !(await isUsernameAvailable(name, firebaseUser));
  }, [firebaseUser]);

  const recordView = useCallback((username) => recordProfileEvent(username, 'view'), []);
  const refreshProfileAnalytics = useCallback(async () => {
    const username = currentUserRef.current?.username;
    if (!username) return;
    const previous = profileAnalyticsLoad.current;
    if (previous?.username === username && previous.until > Date.now()) return previous.promise;
    const promise = (async () => {
      const analytics = await getProfileAnalytics(username);
      setUserState((current) => current?.username === username ? {
        ...current,
        profile: {
          ...current.profile,
          views: analytics.views,
          clicks: analytics.clicks,
          viewHistory: Object.entries(analytics.byDay || {}).map(([day, count]) => ({ day, count })),
        },
      } : current);
    })();
    profileAnalyticsLoad.current = { username, until: Date.now() + 5 * 60 * 1000, promise };
    try { await promise; }
    catch (error) {
      if (profileAnalyticsLoad.current?.promise === promise) profileAnalyticsLoad.current = null;
      throw error;
    }
  }, []);
  const renameUser = useCallback(async (rawUsername) => {
    if (!firebaseUser || !currentUserRef.current?.username) return { ok: false, error: 'Sign in again first.' };
    const current = currentUserRef.current;
    clearTimeout(saveTimer.current);
    try {
      if (dirty.current) {
        setSaveState('saving');
        await saveRedesignProfile(firebaseUser, current.username, current.profile, { publish: true });
        dirty.current = false;
      }
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/username', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawUsername }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Username could not be changed.');
      await loadAccount(firebaseUser, true);
      await refreshDirectory(true);
      setSaveState('saved');
      setStorageError(false);
      return { ok: true, username: result.username, nextChangeAt: result.nextChangeAt };
    } catch (error) {
      setSaveState(dirty.current ? 'error' : 'saved');
      return { ok: false, error: error?.message || 'Username could not be changed.' };
    }
  }, [firebaseUser, loadAccount, refreshDirectory]);
  const deleteUser = useCallback(() => ({ ok: false, error: 'Contact support@user.pet to delete an account.' }), []);
  const adminSet = useCallback(() => {}, []);
  const switchTo = useCallback(() => {}, []);

  const db = useMemo(() => ({ users: Object.fromEntries(directory.map((entry) => [entry.username, entry])) }), [directory]);
  const session = useMemo(() => ({ current: user?.username || null, accounts: user ? [user.username] : [] }), [user]);
  const value = {
    db, user, session, theme, ready, needsClaim, saveState, storageError,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
    login,
    loginWithGoogle,
    register,
    logout,
    claimUsername,
    setProfile,
    updateProfile,
    replaceProfile,
    setUser,
    changePassword,
    resetPassword,
    adminSet,
    deleteUser,
    renameUser,
    isTaken,
    recordView,
    refreshProfileAnalytics,
    switchTo,
    refreshDirectory,
  };
  return createElement(Ctx.Provider, { value }, children);
}

export const useStore = () => useContext(Ctx);

export async function fileToDataUrl(file, _max = 900, kind = 'image') {
  if (!auth?.currentUser) throw new Error('Sign in before uploading files.');
  const normalizedKind = file?.type?.startsWith('audio/') ? 'audio' : kind;
  const { uploadProfileAsset } = await import('../../data/mediaStore.js');
  return uploadProfileAsset(auth.currentUser, normalizedKind, file);
}

export { defaultProfile };
