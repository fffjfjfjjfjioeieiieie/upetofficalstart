import { readFile, readdir, stat } from 'node:fs/promises';
import { createRequire, isBuiltin } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

// Read-only inventory using the parser already installed by Vite's React plugin.
// This is evidence for review, never permission to delete unreachable modules.
const root = fileURLToPath(new URL('../', import.meta.url));
const extensions = ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.json', '.css'];
const relative = (file) => path.relative(root, file).split(path.sep).join('/');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? walk(path.join(directory, entry.name))
    : [path.join(directory, entry.name)]))).flat();
}

async function resolveLocal(file, specifier) {
  const base = specifier.startsWith('@/')
    ? path.join(root, 'src/redesign', specifier.slice(2))
    : path.resolve(path.dirname(file), specifier);
  for (const candidate of [base, ...extensions.map((ext) => base + ext), ...extensions.map((ext) => path.join(base, 'index' + ext))]) {
    try { if ((await stat(candidate)).isFile()) return relative(candidate); }
    catch { /* Try the next supported extension. */ }
  }
  return null;
}

function importsIn(source, file) {
  if (file.endsWith('.css')) {
    return { imports: [...source.matchAll(/@import\s+["']([^"']+)["']/g)].map((match) => match[1]), dynamicExpressions: 0 };
  }
  const ast = parse(source, { sourceType: 'unambiguous', plugins: ['jsx', 'typescript'] });
  const imports = new Set();
  let dynamicExpressions = 0;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) imports.add(node.source.value);
    if (node.type === 'ImportExpression' || (node.type === 'CallExpression' && (node.callee?.type === 'Import' || node.callee?.name === 'require'))) {
      const target = node.source || node.arguments[0];
      if (target?.type === 'StringLiteral') imports.add(target.value);
      else dynamicExpressions += 1;
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'start', 'end', 'comments', 'tokens'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast.program);
  return { imports: [...imports].sort(), dynamicExpressions };
}

const files = (await Promise.all(['src', 'server', 'api', 'discord-bot/src'].map((directory) => walk(path.join(root, directory)))))
  .flat().filter((file) => /\.(?:[cm]?js|jsx|tsx?|css)$/.test(file)).sort();
const graph = {};
const missing = [];
const parseErrors = [];
let dynamicExpressions = 0;
for (const file of files) {
  const local = [];
  const packages = [];
  let imports;
  try {
    const parsed = importsIn(await readFile(file, 'utf8'), file);
    imports = parsed.imports;
    dynamicExpressions += parsed.dynamicExpressions;
  } catch (error) {
    parseErrors.push({ file: relative(file), error: error.message });
    continue;
  }
  for (const specifier of imports) {
    if (specifier.startsWith('.') || specifier.startsWith('@/')) {
      const target = await resolveLocal(file, specifier);
      if (target) local.push(target);
      else missing.push({ file: relative(file), specifier, kind: 'local' });
    } else if (!isBuiltin(specifier) && !/^(?:https?:|data:)/.test(specifier)) {
      packages.push(specifier);
      try { createRequire(file).resolve(specifier); }
      catch {
        // Some installed ESM packages deliberately expose only `import`.
        try { import.meta.resolve(specifier); }
        catch { missing.push({ file: relative(file), specifier, kind: 'package' }); }
      }
    }
  }
  graph[relative(file)] = { local, packages };
}

const reachable = new Set();
function follow(file) {
  if (reachable.has(file)) return;
  reachable.add(file);
  graph[file]?.local.forEach(follow);
}
follow('src/main.jsx');
const report = {
  scannedFiles: files.length,
  localEdges: Object.values(graph).reduce((count, node) => count + node.local.length, 0),
  browserReachableFiles: reachable.size,
  dynamicExpressions,
  parseErrors,
  missing,
  graph,
};
console.log(JSON.stringify(process.argv.includes('--json') ? report : {
  ...report,
  graph: undefined,
  note: 'Use --json for every source module and import edge. Browser reachability is not a deletion or deployment-safety proof.',
}, null, 2));
if (parseErrors.length) process.exitCode = 1;
