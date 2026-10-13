import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './SadlizzeShop.module.css';

export default function SadlizzeShop({ onBack }) {
  return (
    <section className={styles.shop} aria-labelledby="sadlizze-shop-title">
      <button className={styles.backButton} type="button" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden="true" /> Back home
      </button>
      <div className={styles.panel}>
        <header className={styles.header}>
          <img src="/love.png" alt="" aria-hidden="true" />
          <div>
            <h1 id="sadlizze-shop-title">sadlizze</h1>
            <p>@sadlizze</p>
          </div>
        </header>
        <div className={styles.emptyState}>Listings coming soon.</div>
      </div>
    </section>
  );
}
