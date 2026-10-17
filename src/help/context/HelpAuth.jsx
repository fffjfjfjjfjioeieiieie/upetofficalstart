import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, firebaseConfigured, persistAuthLocally } from '../../app/firebase';
import { ensureOwnerMembership, subscribeStaffMembership } from '../lib/helpStore';

const HelpAuthContext = createContext(null);

export function HelpAuthProvider({ children }) {
  const [user, setUser] = useState(null); const [staff, setStaff] = useState(null); const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!auth || !firebaseConfigured) { setReady(true); return undefined; }
    let stopStaff = () => {};
    return onAuthStateChanged(auth, async (next) => {
      stopStaff(); setUser(next); setStaff(null);
      if (next) {
        const membership = await ensureOwnerMembership(next);
        if (membership) setStaff(membership);
        stopStaff = subscribeStaffMembership(next.uid, setStaff);
      }
      setReady(true);
    });
  }, []);
  const value = useMemo(() => ({ user, staff, ready,
    login: async (email, password) => { try { await persistAuthLocally(); await signInWithEmailAndPassword(auth, email.trim(), password); return { ok: true }; } catch (error) { return { ok: false, error: error?.code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : error?.message || 'Sign-in failed.' }; } },
    logout: () => signOut(auth), resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
  }), [user, staff, ready]);
  return <HelpAuthContext.Provider value={value}>{children}</HelpAuthContext.Provider>;
}

export const useHelpAuth = () => useContext(HelpAuthContext);
