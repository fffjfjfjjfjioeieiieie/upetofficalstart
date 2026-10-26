import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { createEmptyProfileDocumentV2 } from '../src/shared/contracts/profileV2.js';
import { createPublicProfileProjectionV2 } from '../src/shared/contracts/publicProfileV2.js';
import { createStudioBlock } from '../src/features/studio/v2/studioDocumentOps.js';
import ProfileRenderer from '../src/features/profiles/renderer/ProfileRenderer.jsx';
import { ProfileCard } from '../src/redesign/components/ProfileCard.jsx';
import { redesignFromDocument } from '../src/redesign/lib/profileModel.js';
import { profileContractFixtures } from './fixtures/profileContracts.mjs';
import '../src/redesign/index.css';

const profile = createEmptyProfileDocumentV2({ ownerUid: 'local-fixture', username: 'local-artist', nowMs: 1 });
profile.status = 'published';
profile.identity.displayName = 'Local Artist';
profile.identity.bio = 'Original synthetic renderer fixture. No user account is loaded.';
profile.pages[0].blocks = ['heading', 'text', 'divider'].map((type, order) => createStudioBlock(type, { id: type, order }));
profile.pages[0].blocks[0].data.text = '<script>Rendered as text</script>';
profile.pages[0].blocks[1].data.text = 'Readable on mobile. Shared content and geometry power the Studio preview.';
profile.pages[0].blocks[1].layout.mobile = { x: 0, y: 70, width: 100, height: 90, rotation: 0 };
profile.pages[0].blocks[2].layout.mobile = { x: 0, y: 175, width: 100, height: 38, rotation: 0 };
profile.pages[0].blocks.push({ ...createStudioBlock('text', { id: 'future', order: 3 }), type: 'future-widget', data: { text: 'Never shown to visitors' } });
const projection = createPublicProfileProjectionV2(profile);

function Harness() {
  const [viewport, setViewport] = useState('desktop');
  return <MemoryRouter><main className="dark min-h-screen bg-background p-4 text-foreground md:p-8">
    <h1 className="mb-3 text-xl font-bold">Local profile compatibility fixtures</h1>
    <p className="mb-5 text-sm text-muted-foreground">Synthetic data only. Media URLs are intentionally blocked by browser verification.</p>
    <button className="mb-5 rounded-lg border p-2" onClick={() => setViewport(viewport === 'desktop' ? 'mobile' : 'desktop')}>Viewport: {viewport}</button>
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section data-testid="v2-public"><h2>V2 public projection</h2><ProfileRenderer source={projection} viewport={viewport} /></section>
      <section data-testid="v2-owner"><h2>V2 owner preview</h2><ProfileRenderer source={profile} audience="owner" viewport={viewport} /></section>
      {profileContractFixtures.map(([name, source]) => <section key={name} data-testid={`legacy-${source.username}`}><h2>{name}</h2><ProfileRenderer source={source} legacyRenderer={(original) => <ProfileCard p={redesignFromDocument(original.published || original, original.username)} />} /></section>)}
    </div>
  </main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Harness />);
