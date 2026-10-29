// Local-only UI smoke test. Firebase and HTTP APIs are mocked: no user data is accessed.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.UPET_PREVIEW_URL || 'http://127.0.0.1:5174';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname), 'Use a localhost Vite dev server, not production.');
const browser = await chromium.launch({ headless: true });
const mockStore = `
import React from '/node_modules/.vite/deps/react.js';
import { defaultProfile } from '/src/redesign/lib/profileModel.js';
const Ctx=React.createContext(null);
export const useStore=()=>React.useContext(Ctx);
export const fileToDataUrl=async()=>{throw new Error('Uploads are disabled in cleanup tests');};
export function StoreProvider({children}) {
  const [signedIn,setSignedIn]=React.useState(false);
  const [profile,setDraft]=React.useState(()=>{const base=defaultProfile('preview');return {...base,audio:{...base.audio,src:'/cleanup-test-tone.wav',title:'Preview audio',autoplay:false}};});
  const setProfile=React.useCallback((path,value)=>setDraft(old=>{const next=structuredClone(old);const keys=path.split('.');let target=next;for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)]=value;return next;}),[]);
  const updateProfile=React.useCallback(changes=>{for(const [path,value] of Object.entries(changes))setProfile(path,value);},[setProfile]);
  const user=signedIn?{uid:'local-preview',username:'preview',role:'founder',profile}:null;
  window.__cleanupProfile=profile;
  const value={user,ready:true,needsClaim:false,theme:'dark',toggleTheme:()=>{},session:{accounts:['preview']},db:{users:user?{preview:user}:{}},saveState:'saved',setProfile,updateProfile,
    login:async(email,password)=>{const ok=email==='preview@example.test'&&password==='local-test';if(ok)setSignedIn(true);return {ok,error:'Invalid local fixture credentials'};},
    refreshDirectory:React.useCallback(async()=>{},[]),recordView:React.useCallback(async()=>{},[]),logout:()=>setSignedIn(false)};
  return React.createElement(Ctx.Provider,{value},children);
}`;
// A generated silent WAV exercises HTML audio without accessing stored user files.
const wav = Buffer.alloc(44 + 8000 * 2 * 5);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
try {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('upet_theme', 'light');
  });
  const errors = [];
  let editorMock = false;
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (editorMock && url.pathname === '/src/redesign/lib/store.js') return route.fulfill({ contentType: 'application/javascript', body: mockStore });
    if (url.pathname === '/cleanup-test-tone.wav') return route.fulfill({ contentType: 'audio/wav', body: wav });
    if (url.pathname === '/src/app/firebase.js') return route.fulfill({ contentType: 'application/javascript', body: 'export const auth=null;export const firestore=null;export const firebaseConfigured=false;export const persistAuthLocally=()=>Promise.resolve();' });
    if (url.pathname.startsWith('/api/')) return route.fulfill({ contentType: 'application/json', body: JSON.stringify(url.pathname === '/api/top-profiles' ? { profiles: [] } : { ok: true, views: 0 }) });
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(origin);
    await page.getByTestId('hero-title').waitFor();
    assert.equal(await page.locator('html').evaluate((node) => node.classList.contains('dark')), true, 'The previous light preference should reset to dark once');
    assert.equal(await page.locator('a[href="/marketplace"],a[href="/dashboard/shop"]').count(), 0);
    assert.equal(await page.locator('body').evaluate((el) => el.scrollWidth <= innerWidth + 1), true, `Homepage overflow at ${width}px`);
    await page.locator('#features-title').scrollIntoViewIfNeeded();
    await page.locator('#editor-title').scrollIntoViewIfNeeded();
    // Render offscreen content for the screenshot only; production keeps its containment optimization.
    await page.addStyleTag({ content: 'section { content-visibility: visible !important; }' });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/upet-main-site-${width}.png`, fullPage: true });
  }
  await page.getByTestId('theme-toggle').click();
  assert.equal(await page.locator('html').evaluate((node) => node.classList.contains('dark')), false, 'Theme control should switch to light');
  await page.reload();
  await page.getByTestId('hero-title').waitFor();
  assert.equal(await page.locator('html').evaluate((node) => node.classList.contains('dark')), false, 'The new light choice should persist');
  await page.getByTestId('theme-toggle').click();
  assert.equal(await page.locator('html').evaluate((node) => node.classList.contains('dark')), true);
  await page.goto(`${origin}/marketplace`);
  await page.getByTestId('explore-page').waitFor();
  assert.equal(new URL(page.url()).pathname, '/explore');
  await page.goto(`${origin}/dashboard`);
  await page.waitForURL((url) => url.pathname === '/login' && url.searchParams.get('next') === '/dashboard', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('header-login-button').waitFor();
  await page.goto(`${origin}/dome/shop`);
  await page.waitForURL((url) => url.pathname === '/dome', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('profile-entry-screen').waitFor();
  await page.getByTestId('profile-entry-screen').click();
  await page.getByTestId('profile-entry-screen').waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('button', { name: /^Shop$/ }).count(), 0);
  await page.screenshot({ path: '/tmp/upet-main-site-profile.png', fullPage: true });
  await page.goto(`${origin}/help-preview`);
  await page.getByRole('search').waitFor();
  assert.equal(await page.getByRole('link', { name: 'Set up a shop', exact: true }).count(), 0);
  editorMock = true;
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${origin}/login?next=/dashboard/editor`);
  await page.getByTestId('login-email-input').fill('preview@example.test');
  await page.getByTestId('login-password-input').fill('local-test');
  await page.getByTestId('login-submit-button').click();
  await page.getByTestId('editor-page').waitFor();
  assert.equal(await page.getByTestId('sidebar-shop').count(), 0);
  await page.getByTestId('editor-tab-card').click();
  await page.getByTestId('card-display-name').fill('Edited locally');
  await page.waitForFunction(() => window.__cleanupProfile.displayName === 'Edited locally');
  await page.getByTestId('editor-tab-audio').click();
  await page.getByTestId('audio-title').fill('Local test track');
  await page.waitForFunction(() => window.__cleanupProfile.audio.title === 'Local test track');
  await page.getByTestId('editor-preview').getByTestId('profile-audio-toggle').click();
  await page.waitForFunction(() => [...document.querySelectorAll('audio')].some(audio => !audio.paused && audio.currentTime > 0));
  await page.getByTestId('editor-preview').getByTestId('profile-audio-toggle').click();
  await page.getByTestId('editor-tab-lyrics').click();
  await page.getByTestId('lyrics-paste').fill('[00:01.00]First line\n[00:03.00]Second line');
  await page.getByTestId('lyrics-import-replace').click();
  await page.waitForFunction(() => window.__cleanupProfile.audio.lyrics.lines.length === 2);
  assert.equal(await page.evaluate(() => window.__cleanupProfile.audio.lyrics.lines[0].text), 'First line');
  await page.getByTestId('editor-tab-card').click();
  assert.equal(await page.getByTestId('card-display-name').inputValue(), 'Edited locally');
  await page.screenshot({ path: '/tmp/upet-main-site-editor.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile homepage, retired redirects, anonymous guard, public profile, Help Centre, login form routing, live profile edits, audio playback/pause and synced lyric import. No runtime exceptions. Firebase/APIs/auth persistence mocked.');
} finally {
  await browser.close();
}
