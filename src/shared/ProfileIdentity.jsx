import React from 'react';
import styles from './ProfileIdentity.module.css';

export default function ProfileIdentity({ name, username, align = 'center', headingLevel = 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <header className={`${styles.identity} ${align === 'start' ? styles.start : ''}`}>
      <Heading id="lamp-profile-name">{name}</Heading>
      <span>@{username}</span>
    </header>
  );
}
