import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { LockKeyhole, ChevronDown, Moon, Sun, X } from 'lucide-react';
import ProfilePreview from '../profiles/lamp/ProfilePreview.jsx';
import FriendProfile from '../profiles/dome/FriendProfile.jsx';
import SadlizzeProfile from '../profiles/sadlizze/SadlizzeProfile.jsx';
import ProfileBackground from '../shared/ProfileBackground.jsx';
import LampShop from '../shop/LampShop.jsx';
import SadlizzeShop from '../shop/SadlizzeShop.jsx';
import Dashboard from '../dashboard/Dashboard.jsx';
import Friends from '../dashboard/Friends.jsx';
import { claimUsername as saveClaimedUsername, getAccountForUser, isUsernameAvailable } from '../data/accountStore.js';
import {
  auth,
  firebaseConfigured,
  persistAuthLocally,
} from './firebase.js';

function getHeaderAccountName(user, preferredUsername = '') {
  try {
    return preferredUsername
      || window.localStorage.getItem('userpet-username')
      || user?.displayName?.split(/\s+/)[0]
      || user?.email?.split('@')[0]
      || 'Account';
  } catch {
    return preferredUsername || user?.displayName?.split(/\s+/)[0] || 'Account';
  }
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
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
    'auth/unauthorized-domain': 'Add this website domain under Firebase Authentication → Settings → Authorized domains.',
  };
  return knownErrors[error?.code]
    || error?.message
    || 'Authentication could not finish. Check your Firebase Authentication settings and try again.';
}

const ADMIN_EMAILS = ['zurihcs@gmail.com', 'lampjustlamp123@gmail.com', 'iamjayvonlol@gmail.com'];
const isAdminUser = (user) => Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [claimedUsername, setClaimedUsername] = useState(() => {
    try {
      return window.localStorage.getItem('userpet-username') || '';
    } catch {
      return '';
    }
  });
  const isAdmin = isAdminUser(currentUser);
  const [theme, setTheme] = useState('dark');
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [loginOpen, setLoginOpen] = useState(() => window.location.pathname === '/create-account');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [lampMusicPlaying, setLampMusicPlaying] = useState(false);
  const [shopMusicAvailable, setShopMusicAvailable] = useState(false);
  const [claimUsername, setClaimUsername] = useState('');
  const [pendingClaimUsername, setPendingClaimUsername] = useState(() => (
    new URLSearchParams(window.location.search).get('username')?.toLowerCase() ?? ''
  ));
  const [claimMessage, setClaimMessage] = useState(null);
  const [claimingUsername, setClaimingUsername] = useState(false);
  const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,19}$/;
  const lampMusicPlayingRef = useRef(false);
  const lampMusicControlRef = useRef(null);
  lampMusicPlayingRef.current = lampMusicPlaying;

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
      setCurrentUser(isAdminUser(user) ? user : null);
      setAuthReady(true);
      if (isAdminUser(user)) {
        getAccountForUser(user).then((account) => {
          if (!active || auth.currentUser?.uid !== user.uid) return;
          if (!account?.username) {
            setClaimedUsername('');
            try { window.localStorage.removeItem('userpet-username'); } catch {}
            return;
          }
          try {
            window.localStorage.setItem('userpet-username', account.username);
          } catch {
            // Firestore remains authoritative if local storage is unavailable.
          }
          setClaimedUsername(account.username);
        }).catch(() => {
          // Fall back to the saved username or email if the profile is unavailable.
        });
      } else {
        setClaimedUsername('');
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
  }, [isAdmin, pathname]);

  const navigateTo = (path, { replace = false } = {}) => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    setPathname(path);
    window.scrollTo(0, 0);
  };

  const isLampShopPage = false;
  const isSadlizzeShopPage = false;
  const isShopPage = isLampShopPage || isSadlizzeShopPage;
  const accountName = getHeaderAccountName(currentUser, claimedUsername);
  const accountLabel = claimedUsername ? `@${claimedUsername}` : accountName;

  useEffect(() => {
    if ((pathname === '/dashboard' || pathname === '/friends' || pathname === '/welcome') && authReady && !isAdmin) navigateTo('/');
  }, [pathname, authReady, isAdmin]);
  const openLogin = (mode = 'login') => {
    setAuthMode(isAdmin ? mode : 'login');
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
    if (!auth || !firebaseConfigured) {
      setAuthError('Firebase web app settings are missing from .env.local.');
      return;
    }

    const normalizedEmail = email.trim();
    if (!ADMIN_EMAILS.includes(normalizedEmail.toLowerCase())) {
      setAuthError('This account does not have admin access.');
      return;
    }
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
    if (authMode === 'signup' && password.length < 6) {
      setAuthError('Choose a password with at least 6 characters.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setAuthError('Those passwords do not match.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      await persistAuthLocally();
      const credential = authMode === 'signup'
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password);

      if (!isAdminUser(credential.user)) {
        await signOut(auth);
        throw new Error('This account does not have admin access.');
      }

      // Set this immediately so protected routes do not redirect during Firebase's auth callback.
      setCurrentUser(credential.user);
      setAuthReady(true);
      setLoginOpen(false);
      setPassword('');
      setConfirmPassword('');

      if (isAdmin && pendingClaimUsername) {
        await claimAndOpenWelcome(credential.user, pendingClaimUsername);
      } else if (authMode === 'login') {
        navigateTo('/');
        try {
          const account = await getAccountForUser(credential.user);
          if (account?.username) {
            window.localStorage.setItem('userpet-username', account.username);
            setClaimedUsername(account.username);
            navigateTo('/');
          }
        } catch {
          // Login still succeeds if Firestore has not been enabled yet.
        }
      }
    } catch (authFailure) {
      setAuthError(getFriendlyAuthError(authFailure));
    } finally {
      setAuthLoading(false);
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
      setClaimingUsername(true);
      setClaimMessage(null);
      try {
        const available = await isUsernameAvailable(username);
        if (!available) {
          setClaimMessage({ type: 'error', text: `user.pet/${username} has already been claimed.` });
          return;
        }
      } catch (error) {
        const message = error?.code === 'permission-denied'
          ? 'Firestore rules need to be deployed before usernames can be checked.'
          : error?.message?.toLowerCase().includes('firestore api')
            ? 'Enable the Cloud Firestore API before claiming a username.'
            : 'Could not check that username right now. Please try again.';
        setClaimMessage({ type: 'error', text: message });
        return;
      } finally {
        setClaimingUsername(false);
      }

      setPendingClaimUsername(username);
      openLogin('signup');
      navigateTo(`/create-account?username=${encodeURIComponent(username)}`);
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
        <button className="close-button" onClick={closeAccountDialog} aria-label="Close account dialog">
          <X size={18} />
        </button>
        <div className="modal-icon"><LockKeyhole size={18} /></div>
        <p className="modal-kicker">{isAdmin ? 'your user.pet account' : 'user.pet team'}</p>
        <h2 id="login-title">{!isAdmin ? 'Admin login.' : authMode === 'signup' ? 'Create your account.' : 'Welcome back.'}</h2>
        <p className="modal-copy">
          {!isAdmin ? 'Sign in with your team email and password.' : pendingClaimUsername
            ? `Create an account or sign in to claim user.pet/${pendingClaimUsername}.`
            : 'Your account stays signed in on this device until you log out.'}
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
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
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
          {authMode === 'signup' && (
            <>
              <label htmlFor="account-confirm-password">Confirm password</label>
              <div className="password-row">
                <input
                  id="account-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Enter your password again"
                />
              </div>
            </>
          )}
          <button
            className="submit-button"
            type="submit"
            disabled={!firebaseConfigured || authLoading || !authReady}
          >
            {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>
        {isAdmin && <p className="auth-mode-switch">
          {authMode === 'signup' ? 'Already have an account?' : 'New to user.pet?'}{' '}
          <button
            type="button"
            onClick={() => {
              setAuthMode((mode) => mode === 'signup' ? 'login' : 'signup');
              setAuthError('');
            }}
          >
            {authMode === 'signup' ? 'Log in' : 'Create account'}
          </button>
        </p>}
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
            setClaimUsername(event.target.value.toLowerCase());
            if (claimMessage) setClaimMessage(null);
          }}
          aria-describedby={claimMessage ? 'claim-message' : undefined}
        />
        <button className="claim-button" type="submit" disabled={claimingUsername || claimUsername.trim().length < 3}>
          {claimingUsername ? 'Checking…' : 'Claim'}
        </button>
      </form>
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
      <button type="button" className="home-account-action" onClick={() => navigateTo('/friends')}>
        Friends
      </button>
    </section>
  );

  if (isAdmin && pathname === '/create-account') {
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

  if (isAdmin && pathname === '/dashboard') {
    return (
      <div className="page-shell dashboard-shell" data-theme={theme}>
        <Dashboard
          username={claimedUsername}
          user={currentUser}
          theme={theme}
          onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          onLogout={logout}
          onNavigate={navigateTo}
        />
        {loginDialog}
      </div>
    );
  }

  if (isAdmin && pathname === '/friends') {
    return (
      <div className="page-shell dashboard-shell" data-theme={theme}>
        <Friends
          username={claimedUsername}
          user={currentUser}
          theme={theme}
          onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          onLogout={logout}
          onNavigate={navigateTo}
        />
        {loginDialog}
      </div>
    );
  }

  if (isAdmin && pathname === '/welcome') {
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
    <div className={`page-shell${!isAdmin ? ' public-preview-shell' : ''}${isShopPage ? ' shop-page-shell' : ' home-page-shell'}${isSadlizzeShopPage ? ' sadlizze-shop-shell' : ''}`} data-theme={theme}>
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
        {isAdmin && <nav className="main-nav" aria-label="Main navigation">
          {['Explore', 'Marketplace', 'How it works'].map((label) => (
            <button key={label} type="button" className="header-placeholder nav-placeholder">
              {label}
            </button>
          ))}
        </nav>}
        <div className="header-actions">
          {currentUser ? (
            <>
              <button type="button" className="header-account" aria-label={`Signed in as ${accountLabel}`}>
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
                user.pet is currently unavailable, but we're cooking. Join the Discord instead?
              </p>
              <a className="discord-button" href="https://discord.gg/upet" target="_blank" rel="noopener noreferrer">Join the Discord <span aria-hidden="true">&#8599;</span></a>
            </section>

            <div className="profile-stage">
              {isAdmin && (currentUser && claimedUsername ? signedInHomeActions : usernameClaimForm)}
              <div className="profile-stage-inner">
                <div className="hero-layout">
                  <div className="profile-pair">
                    <ProfilePreview
                      musicControlRef={lampMusicControlRef}
                      onMusicStateChange={setLampMusicPlaying}
                    />
                    <FriendProfile active={!isShopPage} />
                    <SadlizzeProfile />
                  </div>
                </div>
              </div>
            </div>
          </main>

      </>

      <footer className="footer">
        <span className="footer-message"><span className="footer-brand">user.pet</span><span className="footer-tagline"> / building something worth opening</span></span>
        <span className="version">&gt;_ &nbsp;v0.1.0</span>
      </footer>

      {loginDialog}
    </div>
  );
}

export default App;
