import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleUserRound,
  Clock3,
  Copy,
  Compass,
  LayoutDashboard,
  Moon,
  Palette,
  Plus,
  ShoppingBag,
  Sun,
  UserRound,
  UsersRound,
} from 'lucide-react';
import styles from './Dashboard.module.css';

const navigation = [
  { label: 'dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'profile', icon: UserRound, profilePath: true },
  { label: 'customize', icon: Palette, path: '/customize' },
  { label: 'friends', icon: UsersRound, path: '/friends' },
  { label: 'shop', icon: ShoppingBag },
  { label: 'marketplace', icon: Compass },
];

const quickActions = [
  { label: 'customize profile', detail: 'shape your page', icon: Palette, path: '/customize' },
  { label: 'edit profile', detail: 'name, bio and status', icon: UserRound, path: '/customize' },
  { label: 'create listing', detail: 'add something to your shop', icon: Plus },
  { label: 'view shop', detail: 'your public storefront', icon: ShoppingBag },
  { label: 'find friends', detail: 'grow your circle', icon: UsersRound, path: '/friends' },
];

function ComingSoonButton({ children, className = '', onClick, ...buttonProps }) {
  return (
    <button
      {...buttonProps}
      className={`${styles.actionButton} ${className}`.trim()}
      type="button"
      disabled={!onClick}
      title={onClick ? undefined : 'coming soon'}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function DashboardHeader({ activePage, username, onLogout, onNavigate, theme, onToggleTheme }) {
  const handle = username || 'your username';

  return (
    <header className={styles.topNav}>
      <button className={styles.brand} type="button" onClick={() => onNavigate('/')} aria-label="user.pet home">
        <span className="brand-logo"><img src={theme === 'light' ? '/upetlogoleftlightmode.png' : '/upetlogoleft.png'} alt="user.pet" /></span>
      </button>

      <nav className={styles.navigation} aria-label="dashboard navigation">
        {navigation.map(({ label, icon: Icon, path, profilePath }) => {
          if (profilePath && username && username !== 'your username') path = `/${username}`;
          const active = activePage === label;
          return (
            <button
              key={label}
              type="button"
              className={`${styles.navItem}${active ? ` ${styles.navItemActive}` : ''}`}
              aria-current={active ? 'page' : undefined}
              disabled={!path}
              title={path ? undefined : 'coming soon'}
              onClick={path ? () => onNavigate(path) : undefined}
            >
              <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.accountArea}>
        <span className={styles.accountHandle}>@{handle}</span>
        <button
          className={styles.themeButton}
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === 'dark' ? 'light mode' : 'dark mode'}</span>
        </button>
        <button className={styles.logoutButton} type="button" onClick={onLogout}>log out</button>
      </div>
    </header>
  );
}

export default function Dashboard({ username, user, onLogout, onNavigate, theme, onToggleTheme }) {
  const [copyProfileStatus, setCopyProfileStatus] = useState('idle');
  const handle = username || 'your username';
  const isDome = username === 'dome';
  const displayName = isDome ? 'dome' : user?.displayName?.trim() || 'add a display name';
  const avatarUrl = isDome ? '/domespfp.png' : user?.photoURL;
  const profileUrl = `https://user.pet/${handle}`;

  const copyProfileUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = profileUrl;
        temporaryInput.style.position = 'fixed';
        temporaryInput.style.opacity = '0';
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand('copy');
        temporaryInput.remove();
        if (!copied) throw new Error('Clipboard copy was not available.');
      }
      setCopyProfileStatus('copied');
      setTimeout(() => setCopyProfileStatus('idle'), 1600);
    } catch {
      setCopyProfileStatus('failed');
      setTimeout(() => setCopyProfileStatus('idle'), 2000);
    }
  };

  return (
    <div className={styles.dashboardPage} data-theme={theme}>
      <DashboardHeader
        activePage="dashboard"
        username={handle}
        onLogout={onLogout}
        onNavigate={onNavigate}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className={styles.main}>
        <section className={styles.pageIntro} aria-labelledby="dashboard-title">
          <p className={styles.eyebrow}><span /> your user.pet</p>
          <h1 id="dashboard-title">dashboard</h1>
          <p className={styles.welcome}>welcome back, <span>@{handle}</span>.</p>
        </section>

        <div className={styles.dashboardGrid}>
          <section className={`${styles.panel} ${styles.profileOverview}`} aria-labelledby="profile-overview-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionIndex}>01 / your space</p>
                <h2 id="profile-overview-title">profile overview</h2>
              </div>
              <span className={styles.setupLabel}><span /> starter profile</span>
            </div>

            <div className={styles.identityRow}>
              <div className={styles.avatar} aria-label="profile avatar placeholder">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" />
                  : <CircleUserRound size={34} strokeWidth={1.2} aria-hidden="true" />}
                <span className={styles.avatarEditMark}>+</span>
              </div>
              <div className={styles.identityCopy}>
                <span className={styles.profileHandle}>@{handle}</span>
                <strong>{displayName}</strong>
                <span className={styles.identityHint}>your profile, your way</span>
              </div>
              <div className={styles.statusBadge}><span /> status not set</div>
            </div>

            <div className={styles.profileDetails}>
              <div className={styles.detailBlock}>
                <span>bio</span>
                <p>{isDome ? 'what is disssss?' : 'add a little about yourself...'}</p>
              </div>
              <div className={`${styles.detailBlock} ${styles.profileUrlBlock}`}>
                <span>profile url</span>
                <div className={styles.profileUrlRow}>
                  <p className={styles.profileUrl}>{profileUrl}</p>
                  <button
                    className={styles.copyProfileUrl}
                    type="button"
                    onClick={copyProfileUrl}
                    aria-label={copyProfileStatus === 'copied' ? 'Profile URL copied' : copyProfileStatus === 'failed' ? 'Could not copy profile URL' : 'Copy profile URL'}
                    title={copyProfileStatus === 'copied' ? 'copied' : 'copy profile URL'}
                  >
                    {copyProfileStatus === 'copied' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copyProfileStatus === 'copied' ? 'copied' : copyProfileStatus === 'failed' ? 'failed' : 'copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.profileFooter}>
              <div className={styles.profileNote}><span className={styles.noteDot} /> your profile starts here</div>
              <div className={styles.buttonGroup}>
                <ComingSoonButton className={styles.secondaryButton} onClick={username ? () => onNavigate(`/${username}`) : undefined}>view profile <ArrowUpRight size={14} /></ComingSoonButton>
                <ComingSoonButton className={styles.primaryButton} onClick={username ? () => onNavigate('/customize') : undefined}>customize <ArrowRight size={14} /></ComingSoonButton>
              </div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.customizationPanel}`} aria-labelledby="customization-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionIndex}>02 / make it yours</p>
                <h2 id="customization-title">your canvas</h2>
              </div>
              <span className={styles.previewLabel}>preview</span>
            </div>

            <div className={styles.previewStage}>
              <div className={styles.previewGlow} />
              <div className={styles.previewCard}>
                <div className={styles.previewCover}>
                  <span className={styles.coverOrb} />
                  <span className={styles.coverLine} />
                  <span className={styles.coverMark}>background</span>
                </div>
                <div className={styles.previewIdentity}>
                  <div className={styles.previewAvatar}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" />
                      : <CircleUserRound size={28} strokeWidth={1.25} aria-hidden="true" />}
                  </div>
                  <div>
                    <strong>@{handle}</strong>
                    <span>your bio goes here</span>
                  </div>
                  <span className={styles.previewStatus} />
                </div>
                <div className={styles.previewElements}>
                  <span>profile elements</span>
                  <i /><i /><i />
                </div>
              </div>
              <span className={styles.previewCorner}>user.pet / 01</span>
            </div>

            <div className={styles.customizationCopy}>
              <div>
                <h3>customize your profile</h3>
                <p>build a page that feels like yours, from the background up.</p>
              </div>
              <ComingSoonButton className={styles.previewAction} aria-label="Customize your profile" onClick={() => onNavigate('/customize')}>
                <ArrowUpRight size={17} />
              </ComingSoonButton>
            </div>
          </section>

          <section className={styles.quickActions} aria-labelledby="quick-actions-title">
            <div className={styles.quickHeading}>
              <div>
                <p className={styles.sectionIndex}>03 / jump back in</p>
                <h2 id="quick-actions-title">quick actions</h2>
              </div>
              <span className={styles.quietMeta}>your next move</span>
            </div>
            <div className={styles.quickActionList}>
              {quickActions.map(({ label, detail, icon: Icon, path }, index) => (
                <ComingSoonButton
                  key={label}
                  className={styles.quickAction}
                  onClick={path ? () => onNavigate(path) : undefined}
                >
                  <span className={styles.actionNumber}>0{index + 1}</span>
                  <span className={styles.actionIcon}><Icon size={17} strokeWidth={1.7} aria-hidden="true" /></span>
                  <span className={styles.actionCopy}><strong>{label}</strong><small>{detail}</small></span>
                  <ArrowUpRight className={styles.actionArrow} size={15} aria-hidden="true" />
                </ComingSoonButton>
              ))}
            </div>
          </section>

          <section className={`${styles.panel} ${styles.shopPanel}`} aria-labelledby="shop-overview-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionIndex}>04 / make room for more</p>
                <h2 id="shop-overview-title">your shop</h2>
              </div>
              <ShoppingBag className={styles.headingIcon} size={18} strokeWidth={1.5} aria-hidden="true" />
            </div>

            <div className={styles.shopEmpty}>
              <div className={styles.shopGlyph}><ShoppingBag size={22} strokeWidth={1.35} aria-hidden="true" /></div>
              <div>
                <h3>your shop is waiting to be built.</h3>
                <p>when you're ready, make a place for the things you want to share.</p>
              </div>
            </div>
            <div className={styles.shopActions}>
              <ComingSoonButton className={styles.secondaryButton}>manage shop <ArrowUpRight size={14} /></ComingSoonButton>
              <ComingSoonButton className={styles.primaryButton}><Plus size={15} /> create listing</ComingSoonButton>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.activityPanel}`} aria-labelledby="activity-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionIndex}>05 / your corner of the internet</p>
                <h2 id="activity-title">recent activity</h2>
              </div>
              <Clock3 className={styles.headingIcon} size={17} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className={styles.activityEmpty}>
              <span className={styles.activityGlyph}><Clock3 size={17} strokeWidth={1.5} aria-hidden="true" /></span>
              <p>nothing here yet.</p>
              <span>your updates will find a home here.</span>
            </div>
          </section>
        </div>

        <footer className={styles.dashboardFooter}>
          <span>user.pet <i /> your space, still taking shape</span>
          <span>made yours <span className={styles.footerAccent}>·</span></span>
        </footer>
      </main>
    </div>
  );
}
