import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth, firebaseConfigured, persistAuthLocally } from '../../app/firebase.js';
import { isApprovedFounder } from '../../app/FounderGate.jsx';
import { claimUsername as claimFirebaseUsername, getAccountForUser, isUsernameAvailable } from '../../data/accountStore.js';
import { getProfileAnalytics, recordProfileEvent } from '../../data/analyticsStore.js';
import { uploadProfileAsset } from '../../data/mediaStore.js';
import { getEditableRedesign, listDirectoryProfiles, saveRedesignProfile } from './firebaseStore.js';
import { defaultProfile } from './profileModel.js';

export const ADMIN = { username: '', password: '' };
export const RESERVED = ['admin', 'explore', 'marketplace', 'legal', 'login', 'dashboard', 'business', 'business-verification', 'biz', 'api', 'settings', 'help', 'support', 'user', 'pet', 'claim', 'welcome', 'create-account', 'assets'];

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
  const [user, setUserState] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [ready, setReady] = useState(false);
  const [needsClaim, setNeedsClaim] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('upet_theme') || 'dark');
  const [storageError, setStorageError] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const dirty = useRef(false);
  const saveTimer = useRef(null);
  const registeringRef = useRef(false);
  const currentUserRef = useRef(null);
  currentUserRef.current = user;

  const refreshDirectory = useCallback(async () => {
    const profiles = await listDirectoryProfiles();
    setDirectory(profiles);
  }, []);

  const loadAccount = useCallback(async (authUser) => {
    const account = await getAccountForUser(authUser);
    if (!account?.username) {
      setNeedsClaim(true);
      setUserState(null);
      return null;
    }
    const profile = await getEditableRedesign(authUser, account.username);
    const analytics = await getProfileAnalytics(account.username).catch(() => null);
    if (analytics) {
      profile.views = analytics.views;
      profile.viewHistory = Object.entries(analytics.byDay || {}).map(([day, count]) => ({ day, count }));
    }
    const next = {
      uid: authUser.uid,
      username: account.username,
      email: authUser.email || '',
      role: 'founder',
      banned: false,
      createdAt: timestampMs(account.createdAt),
      twofa: { enabled: false, secret: '' },
      connections: profile.integrations || {},
      profile,
    };
    dirty.current = false;
    setNeedsClaim(false);
    setUserState(next);
    setDirectory((rows) => [next, ...rows.filter((row) => row.username !== next.username)]);
    return next;
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
        setFirebaseUser(null);
        setUserState(null);
        setNeedsClaim(false);
        setReady(true);
        return;
      }
      if (!isApprovedFounder(authUser)) {
        if (registeringRef.current && authUser.email?.toLowerCase() === 'whatdidido6969@gmail.com') return;
        await signOut(auth).catch(() => {});
        if (active) {
          setFirebaseUser(null);
          setUserState(null);
          setReady(true);
        }
        return;
      }
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

  useEffect(() => { refreshDirectory(); }, [refreshDirectory]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('upet_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!dirty.current || !firebaseUser || !user?.username) return undefined;
    clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await saveRedesignProfile(firebaseUser, user.username, currentUserRef.current.profile, { publish: true });
        dirty.current = false;
        setSaveState('saved');
        setStorageError(false);
        setDirectory((rows) => rows.map((row) => row.username === user.username ? { ...row, profile: saved } : row));
      } catch (error) {
        setSaveState('error');
        setStorageError(error?.message || 'Your changes could not be saved.');
      }
    }, 900);
    return () => clearTimeout(saveTimer.current);
  }, [firebaseUser, user]);

  const login = useCallback(async (email, password) => {
    if (!auth || !firebaseConfigured) return { ok: false, error: 'Firebase is not configured.' };
    try {
      await persistAuthLocally();
      const credential = await signInWithEmailAndPassword(auth, String(email || '').trim(), password || '');
      if (!isApprovedFounder(credential.user)) {
        if (credential.user.email?.toLowerCase() === 'whatdidido6969@gmail.com' && !credential.user.emailVerified) {
          await sendEmailVerification(credential.user).catch(() => {});
          await signOut(auth);
          return { ok: false, error: 'Verify your test account email first. We sent a new verification link.' };
        }
        await signOut(auth);
        return { ok: false, error: 'This email does not have admin access.' };
      }
      setFirebaseUser(credential.user);
      const loaded = await loadAccount(credential.user);
      return { ok: true, needsClaim: !loaded };
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) };
    }
  }, [loadAccount]);

  const register = useCallback(async (email, password) => {
    if (String(email || '').trim().toLowerCase() !== 'whatdidido6969@gmail.com') return { ok: false, error: 'Test account creation is available only for the invited email.' };
    if (!auth || !firebaseConfigured) return { ok: false, error: 'Firebase is not configured.' };
    try {
      registeringRef.current = true;
      await persistAuthLocally();
      const credential = await createUserWithEmailAndPassword(auth, String(email).trim().toLowerCase(), password || '');
      await sendEmailVerification(credential.user);
      await signOut(auth);
      return { ok: true };
    } catch (error) { return { ok: false, error: friendlyAuthError(error) }; }
    finally { registeringRef.current = false; }
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
    setFirebaseUser(null);
    setUserState(null);
    setNeedsClaim(false);
  }, []);

  const claimUsername = useCallback(async (rawUsername) => {
    if (!firebaseUser) return { ok: false, error: 'Sign in first.' };
    try {
      const result = await claimFirebaseUsername(firebaseUser, rawUsername);
      const loaded = await loadAccount(firebaseUser);
      if (loaded) await saveRedesignProfile(firebaseUser, result.username, loaded.profile, { publish: true });
      return { ok: true, username: result.username };
    } catch (error) {
      return { ok: false, error: error?.message || 'That username could not be claimed.' };
    }
  }, [firebaseUser, loadAccount]);

  const setProfile = useCallback((path, value) => {
    setUserState((current) => {
      if (!current) return current;
      const next = clone(current);
      setAtPath(next.profile, path, value);
      if (path === 'integrations' || path.startsWith('integrations.')) next.connections = next.profile.integrations;
      dirty.current = true;
      return next;
    });
  }, []);

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
    try { return !(await isUsernameAvailable(name, firebaseUser)); }
    catch { return true; }
  }, [firebaseUser]);

  const recordView = useCallback((username) => recordProfileEvent(username, 'view'), []);
  const renameUser = useCallback(() => ({ ok: false, error: 'Usernames are permanent after they are claimed.' }), []);
  const deleteUser = useCallback(() => ({ ok: false, error: 'Contact support@user.pet to delete an account.' }), []);
  const adminSet = useCallback(() => {}, []);
  const switchTo = useCallback(() => {}, []);

  const db = useMemo(() => ({ users: Object.fromEntries(directory.map((entry) => [entry.username, entry])) }), [directory]);
  const session = useMemo(() => ({ current: user?.username || null, accounts: user ? [user.username] : [] }), [user]);
  const value = {
    db, user, session, theme, ready, needsClaim, saveState, storageError,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
    login,
    register,
    logout,
    claimUsername,
    setProfile,
    setUser,
    changePassword,
    resetPassword,
    adminSet,
    deleteUser,
    renameUser,
    isTaken,
    recordView,
    switchTo,
    refreshDirectory,
  };
  return createElement(Ctx.Provider, { value }, children);
}

export const useStore = () => useContext(Ctx);

export async function fileToDataUrl(file, _max = 900, kind = 'image') {
  if (!auth?.currentUser) throw new Error('Sign in before uploading files.');
  const normalizedKind = file?.type?.startsWith('audio/') ? 'audio' : kind;
  return uploadProfileAsset(auth.currentUser, normalizedKind, file);
}

export { defaultProfile };
