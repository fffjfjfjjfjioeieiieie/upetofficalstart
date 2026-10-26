import { useState } from 'react';

export default function Privacy() {
  const [optedOut, setOptedOut] = useState(() => localStorage.getItem('upet-analytics-optout') === 'yes');
  const change = (value) => {
    localStorage.setItem('upet-analytics-optout', value ? 'yes' : 'no');
    window.dispatchEvent(new Event('upet-analytics-choice'));
    setOptedOut(value);
  };
  return <div className="mx-auto max-w-3xl px-5 pb-20 text-sm leading-7"><h1 className="mb-6 text-4xl font-bold">Visitor statistics and privacy</h1>
    <p>user.pet records aggregate page-view totals, popular routes, referring sites, broad device and browser categories, and country-level traffic so we can understand how the site is used. These totals are not linked to a visitor, account, browser identifier, or network address. No individual browsing history is kept, and visitor statistics are not sent to Discord.</p>
    <p className="mt-4">Aggregate page totals are retained for up to 90 days. You can disable optional page statistics in this browser below. This preference stops future page counts from this browser; aggregate totals already recorded cannot be separated by browser.</p>
    <p className="mt-4">Vercel may process connection data to deliver and protect the website. user.pet reads the two-letter country code supplied by Vercel and immediately adds it to a daily country total. Raw IP addresses and full user-agent strings are never stored by user.pet analytics.</p>
    <p className="mt-4">For questions or data requests, contact <a className="underline" href="mailto:support@user.pet">support@user.pet</a>. The wider service policy is on the <a className="underline" href="https://help.user.pet/legal/privacy">Help Centre</a>.</p>
    <div className="mt-5"><button className="rounded-lg border px-4 py-2" onClick={() => change(!optedOut)}>{optedOut ? 'Allow page statistics' : 'Disable page statistics'}</button><p className="mt-2 text-muted-foreground">Current choice: {optedOut ? 'Disabled in this browser' : 'Enabled in this browser'}</p></div>
  </div>;
}
