import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, firebaseConfigured, persistAuthLocally } from '../../app/firebase';
import { ensureOwnerMembership, subscribeStaffMembership } from '../lib/helpStore';
import { getSiteAccess } from '../../redesign/lib/siteAccess.js';

const HelpAuthContext = createContext(null);

export function HelpAuthProvider({ children }) {
  const [user, setUser] = useState(null); const [staff, setStaff] = useState(null); const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!auth || !firebaseConfigured) { setReady(true); return undefined; }
    let stopStaff = () => {};
    let active = true;
    const stopAuth = onAuthStateChanged(auth, async (next) => {
      stopStaff(); setUser(next); setStaff(null);
      if (next) {
        const access = await getSiteAccess(next).catch(() => null);
        if (!active) return;
        if (!access) {
          await signOut(auth).catch(() => {});
          setUser(null); setReady(true);
          return;
        }
        const membership = await ensureOwnerMembership(next);
        if (!active) return;
        if (membership) setStaff(membership);
        stopStaff = subscribeStaffMembership(next.uid, setStaff);
      }
      setReady(true);
    });
    return () => { active = false; stopAuth(); stopStaff(); };
  }, []);
  const value = useMemo(() => ({ user, staff, ready,
    login: async (email, password) => { try { await persistAuthLocally(); const credential = await signInWithEmailAndPassword(auth, email.trim(), password); const access = await getSiteAccess(credential.user); if (!access) { await signOut(auth); return { ok: false, error: 'This email needs an active Upet member invitation.' }; } return { ok: true }; } catch (error) { return { ok: false, error: error?.code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : error?.message || 'Sign-in failed.' }; } },
    loginWithGoogle: async () => { try { await persistAuthLocally(); const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' }); const credential = await signInWithPopup(auth, provider); const access = await getSiteAccess(credential.user); if (!access) { await signOut(auth); return { ok: false, error: 'This Google account needs an active Upet access invitation.' }; } return { ok: true }; } catch (error) { return { ok: false, error: error?.message || 'Google sign-in failed.' }; } },
    logout: () => signOut(auth), resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
  }), [user, staff, ready]);
  return <HelpAuthContext.Provider value={value}>{children}</HelpAuthContext.Provider>;
}

export const useHelpAuth = () => useContext(HelpAuthContext);
