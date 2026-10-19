import { useState } from 'react';

export default function Privacy() {
  const [optedOut, setOptedOut] = useState(() => localStorage.getItem('upet-analytics-optout') === 'yes');
  const [error, setError] = useState('');
  const change = async (value) => {
    localStorage.setItem('upet-analytics-optout', value ? 'yes' : 'no');
    window.dispatchEvent(new Event('upet-analytics-choice'));
    setOptedOut(value);
    if (value) {
      sessionStorage.removeItem('upet-diagnostic-test');
      try {
        const response = await fetch('/api/visitor', { method: 'PATCH', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' });
        if (!response.ok) throw new Error('Deletion failed.');
        setError('');
      } catch { setError('Optional diagnostic data could not be deleted. Please try again.'); }
    }
  };
  return <div className="mx-auto max-w-3xl px-5 pb-20 text-sm leading-7"><h1 className="mb-6 text-4xl font-bold">Visitor statistics and privacy</h1>
    <p>user.pet counts page visits to understand how the site is used and improve it. This runs without a persistent analytics identifier in your browser. We aggregate page routes, approximate country, device category, browser, referring website and campaign source. If you are signed in, we also count that page view in a site-wide signed-in total without storing your account in ordinary analytics. We estimate unique and active visitors from a short-lived statistical sketch; we do not store the underlying visitor IP or individual browsing history for ordinary visitors. Private Discord updates show a site-wide summary at most once every ten minutes, including popular public profiles.</p>
    <p className="mt-4">The aggregate statistics are kept for up to 90 days. A temporary salted hash of the request IP is used for abuse rate limiting. Vercel Web Analytics also provides aggregated traffic statistics. You can object to this optional statistics collection using the control below. The choice is saved in this browser.</p>
    <p className="mt-4">A signed-in administrator may explicitly start a 24-hour diagnostic test for their own browser. That separate test can record the browser's public IP, approximate city and region, ISP, ASN, VPN or proxy estimates, timezone, language and screen size. After the one-time Discord claim, a private embed displays those details and a preview of the administrator's public profile. The IP intelligence provider is proxycheck.io. Network and location results are estimates; they cannot reveal an exact home address or a residential IP hidden behind a VPN. Diagnostic lookups are restricted and audited, and the test data can be deleted early.</p>
    <p className="mt-4">For questions or data requests, contact <a className="underline" href="mailto:support@user.pet">support@user.pet</a>. The wider service policy is on the <a className="underline" href="https://help.user.pet/legal/privacy">Help Centre</a>.</p>
    <div className="mt-5"><button className="rounded-lg border px-4 py-2" onClick={() => change(!optedOut)}>{optedOut ? 'Allow visitor statistics' : 'Object to visitor statistics'}</button><p className="mt-2 text-muted-foreground">Current choice: {optedOut ? 'Opted out' : 'Statistics enabled'}</p>{error && <p role="alert" className="text-red-400">{error}</p>}</div>
  </div>;
}
