/** Prints the emitted homepage section chunks and their byte sizes. */
import { readdir, stat } from 'node:fs/promises';

const names = await readdir('dist/assets');
const sections = names.filter((name) =>
  /^(?:Playground|EffectsRail|ProfileWall|BuildStory|DonationsSection|AnalyticsPeek|Manifesto|Roadmap|Faq|Closing)-/.test(
    name,
  ),
);
for (const name of sections.sort()) {
  const info = await stat(`dist/assets/${name}`);
  console.log(`${name.padEnd(42)} ${(info.size / 1024).toFixed(2)} kB`);
}
