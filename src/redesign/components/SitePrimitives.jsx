import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import styles from './SitePrimitives.module.css';

export function SiteNavShell({ children, className = '', ...props }) {
  return <nav className={`glass flex w-full max-w-4xl items-center justify-between rounded-full py-2 pl-4 pr-2 shadow-[0_10px_40px_-12px_hsl(var(--primary)/.45)] ${className}`} {...props}>{children}</nav>;
}

export function SiteKicker({ children, className = '', dot = true, ...props }) {
  return <p className={`${styles.kicker} ${className}`} {...props}>{dot && <span className={styles.dot}/>} {children}</p>;
}

export const SiteAction = forwardRef(function SiteAction({ to, href, variant = 'primary', className = '', children, type = 'button', ...props }, ref) {
  const Component = to ? Link : href ? 'a' : 'button';
  return <Component ref={ref} {...(to ? { to } : href ? { href } : { type })} className={`${styles.action} ${variant === 'primary' ? styles.primary : styles.secondary} ${className}`} {...props}>{children}</Component>;
});

export function BrowserChrome({ address, className = '', trailing = <ArrowUpRight size={15}/> }) {
  return <div className={`${styles.chrome} ${className}`}><span className={styles.dots} aria-hidden="true"><i/><i/><i/></span><span className={styles.address}>{address}</span>{trailing}</div>;
}

export function SiteSectionHeading({ eyebrow, title, description, action, className = '' }) {
  return <header className={`${styles.sectionHeading} ${className}`}><div>{eyebrow && <SiteKicker dot={false}>{eyebrow}</SiteKicker>}<h2>{title}</h2>{description && <p className={styles.description}>{description}</p>}</div>{action}</header>;
}
