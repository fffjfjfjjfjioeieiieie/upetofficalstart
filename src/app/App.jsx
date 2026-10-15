import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import ProfilePreview from '../profiles/lamp/ProfilePreview.jsx';
import DomeShowcase from '../profiles/dome/DomeShowcase.jsx';
import SadlizzeProfile from '../profiles/sadlizze/SadlizzeProfile.jsx';
import ProfileBackground from '../shared/ProfileBackground.jsx';
import LampShop from '../shop/LampShop.jsx';
import SadlizzeShop from '../shop/SadlizzeShop.jsx';
import AuthGate from './AuthGate.jsx';
import FounderGate, { isApprovedFounder } from './FounderGate.jsx';
import { resolveAppRoute } from './AppRouter.jsx';
import { claimUsername as saveClaimedUsername, getAccountForUser, isUsernameAvailable, normalizeUsername } from '../data/accountStore.js';
import {
  auth,
  firebaseConfigured,
  persistAuthLocally,
} from './firebase.js';

const ProfileEditor = React.lazy(() => import('../studio/ProfileStudio.jsx'));
const Dashboard = React.lazy(() => import('../dashboard/Dashboard.jsx'));
const PublicProfileRoute = React.lazy(() => import('../profiles/PublicProfileRoute.jsx'));
const isApprovedAdmin = isApprovedFounder;


function getHeaderAccountName(user, preferredUsername = '') {
  return preferredUsername || user?.displayName?.split(/\s+/)[0] || user?.email?.split('@')[0] || 'Account';
}

function getFriendlyAuthError(error) {
  const knownErrors = {
    'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account exists for that email. Create one first.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/operation-not-allowed': 'Enable Email/Password in Firebase Authentication sign-in providers.',
    'auth/too-many-requests': 'Firebase has temporarily blocked login attempts from this browser or device. Stop retrying for now and try again later.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
    'auth/unauthorized-domain': 'Add this website domain under Firebase Authentication → Settings → Authorized domains.',
  };
  return knownErrors[error?.code]
    || error?.message
    || 'Authentication could not finish. Check your Firebase Authentication settings and try again.';
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [claimedUsername, setClaimedUsername] = useState('');
  const [accountReady, setAccountReady] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [theme, setTheme] = useState('dark');
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [loginOpen, setLoginOpen] = useState(() => window.location.pathname === '/create-account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const authRequestPending = useRef(false);
  const [loginPauseUntil, setLoginPauseUntil] = useState(() => {
    try { return Number(window.sessionStorage.getItem('userpet-login-pause')) || 0; } catch { return 0; }
  });
  const [loginPauseSeconds, setLoginPauseSeconds] = useState(0);
  useEffect(() => {
    const updatePause = () => setLoginPauseSeconds(Math.max(0, Math.ceil((loginPauseUntil - Date.now()) / 1000)));
    updatePause();
    if (loginPauseUntil <= Date.now()) return undefined;
    const timer = window.setInterval(updatePause, 1000);
    return () => window.clearInterval(timer);
  }, [loginPauseUntil]);
  const [authReady, setAuthReady] = useState(false);
  const [lampMusicPlaying, setLampMusicPlaying] = useState(false);
  const [shopMusicAvailable, setShopMusicAvailable] = useState(false);
  const [claimUsername, setClaimUsername] = useState('');
  const [pendingClaimUsername, setPendingClaimUsername] = useState(() => (
    new URLSearchParams(window.location.search).get('username')?.toLowerCase() ?? ''
  ));
  const [claimMessage, setClaimMessage] = useState(null);
  const [claimingUsername, setClaimingUsername] = useState(false);
  const [claimAvailability, setClaimAvailability] = useState('');
  const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;
  const lampMusicPlayingRef = useRef(false);
  const lampMusicControlRef = useRef(null);
  lampMusicPlayingRef.current = lampMusicPlaying;

  useEffect(() => {
    if (!currentUser || pathname !== '/claim' || !claimUsername) { setClaimAvailability(''); return undefined; }
    try { normalizeUsername(claimUsername); }
    catch { setClaimAvailability('Use 3–20 letters, numbers, dots, underscores, or hyphens.'); return undefined; }
    setClaimAvailability('Checking availability…');
    let active = true;
    const timer = setTimeout(() => isUsernameAvailable(claimUsername, currentUser).then((available) => {
      if (active) setClaimAvailability(available ? 'Available' : 'This username is taken.');
    }).catch(() => { if (active) setClaimAvailability('Could not check availability. Try again.'); }), 350);
    return () => { active = false; clearTimeout(timer); };
  }, [claimUsername, currentUser, pathname]);

  useEffect(() => {
    setShopMusicAvailable(pathname === '/lamp/shop' && lampMusicPlayingRef.current);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/sadlizze/shop' && lampMusicPlayingRef.current) {
      lampMusicControlRef.current?.();
    }
  }, [pathname]);

  useLayoutEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && window.location.pathname !== '/create-account') setLoginOpen(false);
    };

    const syncViewport = () => {
      const height = window.innerHeight;
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    };

    const handleHistoryChange = () => {
      const nextPath = window.location.pathname;
      setPathname(nextPath);
      setPendingClaimUsername(new URLSearchParams(window.location.search).get('username')?.toLowerCase() ?? '');
      if (nextPath === '/create-account') {
        setAuthMode('login');
        setLoginOpen(true);
      } else {
        setLoginOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', syncViewport);
    window.addEventListener('popstate', handleHistoryChange);
    syncViewport();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('popstate', handleHistoryChange);
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return undefined;
    }

    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!active) return;
      if (user && !isApprovedAdmin(user)) {
        setCurrentUser(null);
        setClaimedUsername('');
        setAccountReady(true);
        signOut(auth).catch(() => {});
        setAuthReady(true);
        return;
      }
      setCurrentUser(user);
      setAuthReady(true);
      if (user) {
        setAccountReady(false);
        setAccountError('');
        getAccountForUser(user).then((account) => {
          if (!active || auth.currentUser?.uid !== user.uid) return;
          if (!account?.username) {
            setClaimedUsername('');
            setAccountReady(true);
            try { window.localStorage.removeItem('userpet-username'); } catch {}
            return;
          }
          try {
            window.localStorage.setItem('userpet-username', account.username);
          } catch {
            // Firestore remains authoritative if local storage is unavailable.
          }
          setClaimedUsername(account.username);
          setAccountReady(true);
        }).catch(() => { if (active) { setAccountError('Could not load your account. Check your connection and reload.'); setAccountReady(true); } });
      } else {
        setClaimedUsername('');
        setAccountReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useLayoutEffect(() => {
    const stage = document.querySelector('.public-preview-shell .profile-stage');
    if (!stage) return undefined;
    const fitShowcase = () => {
      const { width, height } = stage.getBoundingClientRect();
      const scale = Math.max(0.1, Math.min(1, (height - 16) / 460));
      const cardWidth = Math.min(340, Math.max(210, (Math.min(width + 8, 460) / scale + 20) / 2));
      stage.style.setProperty('--mobile-card-width', cardWidth + 'px');
      stage.style.setProperty('--mobile-pair-width', (cardWidth * 2 - 20) + 'px');
      stage.style.setProperty('--mobile-showcase-scale', String(scale));
    };
    const observer = new ResizeObserver(fitShowcase);
    observer.observe(stage);
    fitShowcase();
    return () => observer.disconnect();
  }, [currentUser, pathname]);

  const navigateTo = (path, { replace = false } = {}) => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    setPathname(window.location.pathname);
    window.scrollTo(0, 0);
  };

  const isLampShopPage = false;
  const isSadlizzeShopPage = false;
  const isShopPage = isLampShopPage || isSadlizzeShopPage;
  const accountName = getHeaderAccountName(currentUser, claimedUsername);
  const accountLabel = claimedUsername ? `@${claimedUsername}` : accountName;

  useEffect(() => {
    if ((pathname === '/dashboard' || pathname === '/welcome' || pathname === '/customize' || pathname === '/analytics' || pathname === '/settings' || pathname === '/claim') && authReady && !currentUser) navigateTo('/');
    if (authReady && accountReady && currentUser && !accountError && !claimedUsername && ['/dashboard', '/customize', '/analytics', '/settings'].includes(pathname)) navigateTo('/claim', { replace: true });
    if (authReady && accountReady && currentUser && claimedUsername && pathname === '/claim') navigateTo('/dashboard', { replace: true });
  }, [pathname, authReady, accountReady, currentUser, claimedUsername, accountError]);
  const openLogin = () => {
    setAuthError('');
    setLoginOpen(true);
  };

  const logout = async () => {
    if (!auth) {
      setCurrentUser(null);
      setClaimedUsername('');
      navigateTo('/');
      return;
    }

    try {
      await signOut(auth);
      try {
        window.localStorage.removeItem('userpet-username');
        setClaimedUsername('');
      } catch {
        // Firebase sign-out is authoritative if storage is unavailable.
      }
      navigateTo('/');
    } catch (authFailure) {
      setAuthError(getFriendlyAuthError(authFailure));
    }
  };

  const claimAndOpenWelcome = async (user, rawUsername) => {
    const username = rawUsername.trim().toLowerCase();
    setClaimingUsername(true);
    setClaimMessage(null);
    try {
      const result = await saveClaimedUsername(user, username);
      try {
        window.localStorage.setItem('userpet-username', result.username);
      } catch {
        // Firestore remains authoritative if local storage is unavailable.
      }
      setClaimedUsername(result.username);
      setAccountReady(true);
      navigateTo('/welcome', { replace: pathname === '/create-account' });
      setPendingClaimUsername('');
      return true;
    } catch (error) {
      const errorDetails = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
      const message = errorDetails.includes('firestore api') || errorDetails.includes('has not been used')
        ? 'Cloud Firestore is disabled for this Firebase project. Enable it in Google Cloud, then try again.'
        : error?.code === 'permission-denied'
          ? 'Firestore rules are not deployed yet. Try again after the database setup is finished.'
          : error?.code === 'failed-precondition' || error?.code === 'unavailable'
            ? 'The database is not ready yet. Enable Cloud Firestore in your Firebase project, then try again.'
            : error?.message || 'Could not claim that username right now. Please try again.';
      setClaimMessage({ type: 'error', text: message });
      setPendingClaimUsername('');
      return false;
    } finally {
      setClaimingUsername(false);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    if (authRequestPending.current || Date.now() < loginPauseUntil) return;
    if (!auth || !firebaseConfigured) {
      setAuthError('Firebase web app settings are missing from .env.local.');
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setAuthError('Enter your email address to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      setAuthError('Enter a valid email address, like name@example.com.');
      return;
    }
    if (!password) {
      setAuthError('Enter your password to continue.');
      return;
    }
    authRequestPending.current = true;
    setAuthLoading(true);
    setAuthError('');
    try {
      await persistAuthLocally();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!isApprovedAdmin(credential.user)) {
        await signOut(auth);
        throw new Error('This email does not have founder access.');
      }

      // Set this immediately so protected routes do not redirect during Firebase's auth callback.
      setCurrentUser(credential.user);
      setAuthReady(true);
      setLoginOpen(false);
      setPassword('');

      if (pendingClaimUsername) {
        await claimAndOpenWelcome(credential.user, pendingClaimUsername);
      } else {
        try {
          const account = await getAccountForUser(credential.user);
          if (account?.username) {
            window.localStorage.setItem('userpet-username', account.username);
            setClaimedUsername(account.username);
            setAccountReady(true);
            navigateTo('/dashboard');
          } else {
            setClaimedUsername('');
            setAccountReady(true);
            navigateTo('/claim');
          }
        } catch {
          // Login still succeeds if Firestore has not been enabled yet.
          navigateTo('/');
        }
      }
    } catch (authFailure) {
      if (authFailure?.code === 'auth/too-many-requests') {
        const pauseUntil = Date.now() + 60000;
        setLoginPauseUntil(pauseUntil);
        try { window.sessionStorage.setItem('userpet-login-pause', String(pauseUntil)); } catch {}
      }
      setAuthError(getFriendlyAuthError(authFailure));
    } finally {
      authRequestPending.current = false;
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setAuthError('Enter your email address first, then choose reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setAuthError('Password reset email sent. Check your inbox.');
    } catch (error) {
      setAuthError(getFriendlyAuthError(error));
    }
  };

  const claimUsernameForAccount = async (event) => {
    event.preventDefault();
    const username = claimUsername.trim().toLowerCase();

    if (!usernamePattern.test(username)) {
      setClaimMessage({
        type: 'error',
        text: 'Use 3 to 20 characters: letters, numbers, dots, underscores, or hyphens.',
      });
      return;
    }

    if (!firebaseConfigured) {
      setClaimMessage({ type: 'error', text: 'Username claiming is not configured yet.' });
      return;
    }

    if (!currentUser) {
      setClaimMessage(null);
      setPendingClaimUsername(username);
      openLogin();
      return;
    }

    await claimAndOpenWelcome(currentUser, username);
  };

  const closeAccountDialog = () => {
    setLoginOpen(false);
    if (pathname === '/create-account') {
      setPendingClaimUsername('');
      navigateTo('/');
    }
  };

  const loginDialog = loginOpen && (
    <div
      className={pathname === '/create-account' ? 'account-page-stage' : 'modal-backdrop'}
      role={pathname === '/create-account' ? 'main' : undefined}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && pathname !== '/create-account') setLoginOpen(false);
      }}
    >
      <section className="login-modal" role="dialog" aria-modal={pathname === '/create-account' ? undefined : true} aria-labelledby="login-title">
        <h2 id="login-title">Admin login.</h2>
        <p className="modal-copy">
          {pendingClaimUsername
            ? `Sign in with an approved founder account to claim user.pet/${pendingClaimUsername}.`
            : 'Sign in with an approved founder email and password.'}
        </p>

        {!firebaseConfigured && (
          <p className="form-error" role="status">Firebase web app settings are missing from .env.local.</p>
        )}
        {authError && <p id="account-auth-error" className="form-error" role="alert">{authError}</p>}
        {claimMessage && pendingClaimUsername && (
          <p className="form-error" role="status">{claimMessage.text}</p>
        )}
        <form className="email-auth-form" noValidate onSubmit={handleAuthSubmit}>
          <label htmlFor="account-email">Email</label>
          <div className="password-row">
            <input
              id="account-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="you@example.com"
            />
          </div>
          <label htmlFor="account-password">Password</label>
          <div className="password-row">
            <input
              id="account-password"
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="At least 6 characters"
            />
          </div>
          <button
            className="submit-button"
            type="submit"
            disabled={!firebaseConfigured || authLoading || !authReady || loginPauseSeconds > 0}
          >
            {loginPauseSeconds > 0 ? `Pause ${loginPauseSeconds}s` : authLoading ? 'Please wait...' : 'Log in'}
          </button>
        </form>
        <button className="auth-recovery" type="button" onClick={handlePasswordReset}>Forgot your password?</button>
      </section>
    </div>
  );

  const usernameClaimForm = (
    <section className="claim-section" aria-label="Claim your user.pet username">
      <form className="claim-form" onSubmit={claimUsernameForAccount}>
        <label className="claim-label" htmlFor="claim-username">Claim your user.pet/</label>
        <input
          id="claim-username"
          className="claim-input"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          maxLength={20}
          minLength={3}
          pattern="[a-z0-9][a-z0-9._-]{2,19}"
          placeholder="username"
          value={claimUsername}
          onChange={(event) => {
            setClaimUsername(event.target.value.trim().toLowerCase());
            if (claimMessage) setClaimMessage(null);
          }}
          aria-describedby={claimMessage ? 'claim-message' : undefined}
        />
        <button className="claim-button" type="submit" disabled={claimingUsername || claimAvailability === 'This username is taken.'}>
          {claimingUsername ? 'Checking…' : 'Claim'}
        </button>
      </form>
      <p className="claim-message" role="status" aria-live="polite">{claimAvailability || '\u00a0'}</p>
      {claimMessage && (
        <p id="claim-message" className={`claim-message claim-message-${claimMessage.type}`} role="status">
          {claimMessage.text}
        </p>
      )}
    </section>
  );

  const signedInHomeActions = (
    <section className="claim-section signed-in-home-actions" aria-label="Account shortcuts">
      <button
        type="button"
        className="home-account-action home-account-action-primary"
        onClick={() => navigateTo('/dashboard')}
      >
        Dashboard
      </button>
    </section>
  );

  const route = resolveAppRoute(pathname);
  if (route.kind === 'profile') {
    return <React.Suspense fallback={<div className="route-auth-loading" role="status">Opening user.pet/{route.username}…</div>}><PublicProfileRoute username={route.username} currentUser={currentUser} onNavigate={navigateTo} /></React.Suspense>;
  }

  if (pathname === '/create-account') {
    return (
      <div className="page-shell auth-page-shell" data-theme={theme}>
        <header className="topbar">
          <a className="brand" href="/" onClick={(event) => { event.preventDefault(); closeAccountDialog(); }}><span className="brand-logo"><img src={theme === 'light' ? '/upetlogoleftlightmode.png' : '/upetlogoleft.png'} alt="user.pet" /></span></a>
          <button className="header-logout" type="button" onClick={closeAccountDialog}>Back home</button>
        </header>
        {loginDialog}
      </div>
    );
  }

  if (currentUser && !accountReady && route.protected) return <AuthGate ready={false} user={currentUser} />;

  if (currentUser && accountError && route.protected) return <div className="route-auth-loading" role="alert">{accountError}</div>;

  if (currentUser && pathname === '/claim' && !claimedUsername) return <AuthGate ready={accountReady} user={currentUser}><FounderGate user={currentUser}><div className="page-shell auth-page-shell" data-theme={theme}><header className="topbar"><button type="button" className="header-logout" onClick={() => navigateTo('/')}>Back home</button></header><main className="claim-page"><div className="claim-panel"><span className="claim-eyebrow">FOUNDERS / FIRST STEP</span><h1>Claim your space.</h1><p>Choose the link that will become your public profile. You can build the page after claiming.</p>{usernameClaimForm}<small>Signed in as {currentUser.email}</small></div></main></div></FounderGate></AuthGate>;

  if (currentUser && claimedUsername && ['/dashboard', '/analytics', '/settings'].includes(pathname)) {
    return (
      <div className="page-shell dashboard-shell" data-theme={theme}>
        <AuthGate ready={authReady && accountReady} user={currentUser}><FounderGate user={currentUser}><React.Suspense fallback={<div className="route-auth-loading" role="status">Opening workspace…</div>}><Dashboard
          username={claimedUsername}
          user={currentUser}
          activePage={pathname.slice(1) || 'dashboard'}
          theme={theme}
          onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          onLogout={logout}
          onNavigate={navigateTo}
        /></React.Suspense></FounderGate></AuthGate>
        {loginDialog}
      </div>
    );
  }

  if (currentUser && claimedUsername && pathname === '/customize') {
    return <AuthGate ready={authReady && accountReady} user={currentUser}><FounderGate user={currentUser}><React.Suspense fallback={<div className="page-shell" data-theme={theme} />}><ProfileEditor username={claimedUsername} user={currentUser} onNavigate={navigateTo} theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} onLogout={logout} /></React.Suspense></FounderGate></AuthGate>;
  }

  if (currentUser && pathname === '/welcome') {
    return (
      <div className="page-shell welcome-shell" data-theme={theme}>
        <main className="welcome-screen">
          <button
            className="welcome-screen-action"
            type="button"
            onClick={() => navigateTo('/dashboard')}
            aria-label="Continue to your dashboard"
          >
            <span className="welcome-message">
              welcome, <span className="welcome-username">@{getHeaderAccountName(currentUser, claimedUsername)}</span>. let&apos;s get you started.
            </span>
            <span className="welcome-prompt">click anywhere</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={`page-shell${!currentUser ? ' public-preview-shell' : ''}${isShopPage ? ' shop-page-shell' : ' home-page-shell'}${isSadlizzeShopPage ? ' sadlizze-shop-shell' : ''}`} data-theme={theme}>
      {isLampShopPage && (
        <div className="shop-page-background" aria-hidden="true">
          <ProfileBackground src="/ok.mp4" />
        </div>
      )}
      <header className="topbar">
        <a
          className="brand"
          href={isShopPage ? '/' : '#home'}
          onClick={isShopPage ? (event) => {
            event.preventDefault();
            navigateTo('/');
          } : undefined}
          aria-label="user.pet home"
        >
          <span className="brand-logo"><img src={theme === 'light' ? '/upetlogoleftlightmode.png' : '/upetlogoleft.png'} alt="user.pet" /></span>
        </a>
        {currentUser && <nav className="main-nav" aria-label="Main navigation">
          {['Explore', 'Marketplace', 'How it works'].map((label) => (
            <button key={label} type="button" className="header-placeholder nav-placeholder" disabled title="Coming soon">
              {label}
            </button>
          ))}
        </nav>}
        <div className="header-actions">
          {currentUser ? (
            <>
              <button type="button" className="header-account" disabled title="Coming soon" aria-label={`Signed in as ${accountLabel}`}>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" />
                ) : (
                  <span className="header-account-initial" aria-hidden="true">
                    {getHeaderAccountName(currentUser, claimedUsername).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="header-account-name">{accountLabel}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <button type="button" className="header-logout" onClick={logout}>Log out</button>
            </>
          ) : (
            <button type="button" className="header-placeholder header-login-placeholder" onClick={() => openLogin('login')}>
              Admin login
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'light'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
          </button>
        </div>
      </header>

      <>
          {isShopPage && (
            <main className="shop-stage" key="shop-page">
              {isSadlizzeShopPage ? (
                <SadlizzeShop onBack={() => navigateTo('/')} />
              ) : (
                <LampShop
                  onBack={() => navigateTo('/')}
                  musicAvailable={shopMusicAvailable}
                  musicPlaying={lampMusicPlaying}
                  onMusicToggle={() => lampMusicControlRef.current?.()}
                />
              )}
            </main>
          )}
          <main key="home-persistent" className={`hero-stage${isShopPage ? ' hero-stage-persisted-hidden' : ''}`} id="home">
            <section className="hero-content" aria-labelledby="page-title">
              <h1 id="page-title">
                Buy Sell Flex with your <span className="headline-user">user</span><span className="headline-pet">.pet</span>
              </h1>
              <p className="hero-copy">
                {currentUser
                  ? 'user.pet is a customizable profile site with a bit of a twist. you have the option to sell whatever, whenever for FREE. how bout it?'
                  : "user.pet is currently unavailable, but we're cooking. Join the Discord instead?"}
              </p>
              {!currentUser && <a className="discord-button" href="https://discord.gg/upet" target="_blank" rel="noopener noreferrer">Join the Discord <span aria-hidden="true">&#8599;</span></a>}
            </section>

            <div className="profile-stage">
              {currentUser ? (claimedUsername ? signedInHomeActions : <button className="home-account-action home-account-action-primary" type="button" onClick={() => navigateTo('/claim')}>Claim your username</button>) : null}
              <div className="profile-stage-inner">
                <div className="hero-layout">
                  <div className="profile-pair">
                    <ProfilePreview
                      musicControlRef={lampMusicControlRef}
                      onMusicStateChange={setLampMusicPlaying}
                    />
                    <DomeShowcase active={!isShopPage} />
                    <SadlizzeProfile />
                  </div>
                </div>
              </div>
            </div>
          </main>

      </>

      <footer className="footer">
        <span className="footer-message"><span className="footer-brand">user.pet</span><span className="footer-tagline"> / building something worth opening</span></span>
        <span className="version">&gt;_ &nbsp;v0.1.01</span>
      </footer>

      {loginDialog}
    </div>
  );
}

export default App;
