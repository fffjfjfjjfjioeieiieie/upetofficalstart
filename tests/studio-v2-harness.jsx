import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { createEmptyProfileDocumentV2, createProfileDraftV2 } from '../src/shared/contracts/profileV2.js';
import StudioV2 from '../src/features/studio/v2/StudioV2.jsx';
import '../src/redesign/index.css';

const profile = createEmptyProfileDocumentV2({ ownerUid: 'visual-only', username: 'preview-user', nowMs: 1_000 });
profile.identity.displayName = 'Preview User';
profile.identity.bio = 'A private local fixture for checking the Studio shell. No account data is loaded or saved.';
profile.pages.push({ id: 'work', slug: 'work', title: 'Work', order: 1, visible: true, showInNavigation: true, blocks: [] });
const draft = createProfileDraftV2(profile, { nowMs: 1_000 });
createRoot(document.getElementById('root')).render(<MemoryRouter><div className="dark min-h-screen bg-background p-4 text-foreground md:p-8"><StudioV2 user={{ uid: 'visual-only', username: 'preview-user' }} firebaseUser={{ getIdToken: async () => 'visual-only' }} initialDraft={draft} /></div></MemoryRouter>);
