import React from 'react';
import { motion } from 'motion/react';
import styles from '../PublicProfile.module.css';

const layouts = new Set(['focus', 'stack', 'minimal', 'canvas', 'portfolio']);
export default function ProfileLayout({ profile, reduceMotion, tilt, onPointerMove, onPointerLeave, children }) {
  const layout = layouts.has(profile.layout) ? profile.layout : 'focus';
  return <motion.article className={styles.card} data-layout={layout} data-card-effect={profile.cardEffect || 'none'} data-avatar-shape={profile.avatarShape || 'circle'} data-avatar-decoration={profile.avatarDecoration || 'none'} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}
    initial={reduceMotion ? false : { opacity: 0, y: 14, scale: .985 }}
    animate={{ opacity: 1, y: 0, scale: 1, rotateX: reduceMotion ? 0 : tilt.x, rotateY: reduceMotion ? 0 : tilt.y }}
    transition={{ duration: reduceMotion ? 0 : .45, ease: 'easeOut' }}>
    {children}
  </motion.article>;
}
