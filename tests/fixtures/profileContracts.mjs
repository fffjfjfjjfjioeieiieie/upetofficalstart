import { createProfileDocument } from '../../src/shared/profileSchema.js';

export const flatLegacyProfile = {
  uid: 'legacy-owner',
  username: 'night-sky',
  displayName: 'Night Sky',
  bio: 'A legacy flat profile fixture.',
  location: 'Offline',
  avatarUrl: '/fixtures/night-avatar.png',
  backgroundUrl: '/fixtures/night-background.jpg',
  audioUrl: '/fixtures/original-demo.mp3',
  trackTitle: 'Original Demo',
  trackArtist: 'Fixture Artist',
  links: [
    { label: 'Portfolio', url: 'https://example.com/portfolio', analyticsKey: 'keep-me' },
    { label: 'Journal', url: 'https://example.com/journal', futureStyle: { glow: 0.7 } },
  ],
  badges: ['early-user'],
  futureRootField: {
    nested: ['this', 'must', 'survive'],
    enabled: true,
  },
};

export const schemaV1PublicEnvelope = {
  schemaVersion: 1,
  ownerUid: 'schema-owner',
  username: 'schema-user',
  status: 'published',
  revision: 7,
  envelopeExtension: { retained: 'yes' },
  published: {
    schemaVersion: 1,
    identity: {
      displayName: 'Schema User',
      subtitle: 'version one',
      bio: 'A versioned legacy profile.',
      location: 'The archive',
      avatar: 'https://cdn.example/avatar.png',
      banner: 'https://cdn.example/banner.png',
      badges: ['verified'],
      showViews: true,
      showLocation: true,
      showStatus: true,
      statusText: 'online',
      showBanner: true,
      futureIdentityField: 'preserve',
    },
    theme: {
      layout: 'canvas',
      futureMaterial: { shader: 'fixture-only', uniforms: { speed: 0.5 } },
    },
    blocks: [
      {
        id: 'heading-one',
        type: 'heading',
        enabled: true,
        order: 0,
        style: { align: 'left' },
        content: { text: 'Hello archive' },
        unknownBlockField: { retain: true },
      },
      {
        id: 'gallery-one',
        type: 'gallery',
        enabled: true,
        order: 1,
        style: { columns: 3 },
        content: { assets: ['/fixtures/one.jpg', '/fixtures/two.jpg'] },
      },
    ],
    audio: {
      enabled: true,
      tracks: [
        { id: 'track-a', title: 'First Fixture', artist: 'Original Artist', url: '/fixtures/first.mp3', cover: '/fixtures/first.jpg', waveformCache: [0.1, 0.2] },
        { id: 'track-b', title: 'Second Fixture', artist: 'Original Artist', url: '/fixtures/second.mp3', cover: '' },
      ],
      activeTrackId: 'track-b',
      futurePlayerSetting: 'preserve',
    },
    effects: {
      background: 'stars',
      futureEffectSetting: { density: 42 },
    },
    seo: { title: 'Schema fixture', description: 'A schema-v1 fixture.' },
    unknownPublishedField: { nested: { value: 9 } },
  },
};

export const redesignPublicEnvelope = {
  schemaVersion: 1,
  ownerUid: 'redesign-owner',
  username: 'redesign-user',
  status: 'published',
  publishedRevision: 12,
  published: {
    schemaVersion: 1,
    redesign: {
      username: 'redesign-user',
      alias: 'redesign-user',
      displayName: 'Redesign User',
      bio: 'A current redesign profile fixture.',
      location: 'Studio',
      shownBadges: ['founder'],
      media: {
        avatar: { src: 'https://cdn.example/redesign-avatar.png', type: 'image', x: 50, y: 50 },
        banner: { src: '', type: '' },
        background: { src: 'https://cdn.example/redesign-background.webm', type: 'video' },
        cursor: { src: '' },
      },
      card: { layout: 'banner', accent: '#6cc4ff', futureCardField: 'preserve' },
      effects: { background: 'aurora', backgroundAmount: 73 },
      links: [
        { id: 'site', label: 'Website', url: 'https://example.com', platform: 'website' },
      ],
      audio: {
        sourceType: 'upload',
        src: 'https://cdn.example/original-track.flac',
        title: 'Timed Original',
        artist: 'Fixture Artist',
        cover: 'https://cdn.example/original-cover.png',
        rightsConfirmed: true,
        lyrics: {
          enabled: true,
          offsetMs: -250,
          alignment: 'left',
          textEffect: 'glow',
          futureDisplayOption: { intensity: 4 },
          lines: [
            { id: 'line-one', time: 1.25, endTime: 3.5, synced: true, text: 'First original line', speaker: 'A' },
            { id: 'line-two', time: 0, endTime: null, synced: false, text: 'Untimed original line', annotation: 'keep' },
          ],
        },
      },
      shop: {
        connected: true,
        enabled: false,
        products: [{ id: 'product-fixture', name: 'Preserved product', priceMinor: 1200 }],
      },
      futurePanel: {
        mode: 'unreleased',
        values: [1, 2, 3],
      },
    },
    unknownPublishedField: 'still here',
  },
  unknownEnvelopeField: ['keep', 'this'],
};

// Keep the sparse archival fixture above as a preservation test. This second
// v1 record also exercises the full current schema and actual classic renderer.
const defaultV1 = createProfileDocument({ username: 'complete-schema' });
export const completeSchemaV1PublicEnvelope = {
  ...schemaV1PublicEnvelope,
  username: 'complete-schema',
  published: {
    ...defaultV1,
    ...schemaV1PublicEnvelope.published,
    identity: { ...defaultV1.identity, ...schemaV1PublicEnvelope.published.identity },
    theme: { ...defaultV1.theme, ...schemaV1PublicEnvelope.published.theme },
    audio: { ...defaultV1.audio, ...schemaV1PublicEnvelope.published.audio },
    effects: { ...defaultV1.effects, ...schemaV1PublicEnvelope.published.effects },
  },
};

export const profileContractFixtures = Object.freeze([
  ['flat legacy', flatLegacyProfile],
  ['schema-v1 envelope', schemaV1PublicEnvelope],
  ['complete schema-v1 envelope', completeSchemaV1PublicEnvelope],
  ['redesign envelope', redesignPublicEnvelope],
]);
