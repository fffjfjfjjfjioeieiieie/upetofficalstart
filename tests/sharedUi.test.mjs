import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/shared/ui/Button.js';
import { IconButton } from '../src/shared/ui/IconButton.js';

test('Button defaults to a non-submitting button', () => {
  const markup = renderToStaticMarkup(createElement(Button, null, 'Save'));
  assert.match(markup, /^<button /);
  assert.match(markup, /type="button"/);
});

test('Button preserves an explicit submit type', () => {
  const markup = renderToStaticMarkup(createElement(Button, { type: 'submit' }, 'Publish'));
  assert.match(markup, /type="submit"/);
});

test('Button asChild does not leak button-only attributes', () => {
  const markup = renderToStaticMarkup(
    createElement(Button, { asChild: true }, createElement('a', { href: '/explore' }, 'Explore')),
  );
  assert.match(markup, /^<a /);
  assert.doesNotMatch(markup, /type="button"/);
});

test('IconButton exposes its accessible name and title', () => {
  const markup = renderToStaticMarkup(createElement(IconButton, { label: 'Close' }, '×'));
  assert.match(markup, /aria-label="Close"/);
  assert.match(markup, /title="Close"/);
});

test('shared tokens retain active compatibility aliases and reduced-motion values', async () => {
  const tokens = await readFile(new URL('../src/shared/styles/tokens.css', import.meta.url), 'utf8');
  const activeStyles = await readFile(new URL('../src/redesign/index.css', import.meta.url), 'utf8');

  for (const token of ['--background', '--foreground', '--primary', '--muted', '--border', '--ring', '--radius']) {
    assert.match(tokens, new RegExp(`${token}:`));
  }
  assert.match(tokens, /prefers-reduced-motion:\s*reduce/);
  assert.match(activeStyles, /@import "\.\.\/shared\/styles\/tokens\.css"/);
  assert.doesNotMatch(activeStyles, /--background:\s*208 100% 98%/);
});
