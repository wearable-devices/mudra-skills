#!/usr/bin/env node
// Read-only guardrail used by CI (and runnable locally as `npm run validate`).
// Asserts the single-source-of-truth invariants without touching the tree:
//   - package.json version is semver
//   - every SKILL.md (both trees) frontmatter version === package.json version
//   - .claude-plugin/marketplace.json is valid and its `mudra` entry version matches
//   - the three product skills exist and the CLI entry is present
// Exits non-zero with a consolidated list of problems.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const pkg = JSON.parse(readFileSync(path.join(here, '..', 'package.json'), 'utf8'));
const VER = pkg.version;
const SKILLS = ['mudra-master', 'mudra-preview', 'mudra-xr'];
const errors = [];

if (!/^\d+\.\d+\.\d+([-+].+)?$/.test(VER ?? '')) {
  errors.push(`package.json version is not semver: ${VER}`);
}

const frontmatterVersion = (file) => {
  const m = readFileSync(file, 'utf8').match(/^version:\s*(.+)$/m);
  return m ? m[1].trim() : null;
};

const checkTree = (root, label) => {
  for (const s of SKILLS) {
    const dir = path.join(root, s);
    if (!existsSync(dir)) { errors.push(`${label}: missing skill directory ${s}`); continue; }
    const walk = (d) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name === 'SKILL.md') {
          const v = frontmatterVersion(p);
          if (v !== VER) errors.push(`${label}: ${path.relative(repo, p)} has version "${v}", expected "${VER}"`);
        }
      }
    };
    walk(dir);
  }
};
checkTree(path.join(repo, 'mudra-plugin', 'skills'), 'shipped');
checkTree(path.join(repo, '.claude', 'skills'), 'canonical');

const mktPath = path.join(repo, '.claude-plugin', 'marketplace.json');
try {
  const mkt = JSON.parse(readFileSync(mktPath, 'utf8'));
  const entry = mkt.plugins?.find((p) => p.name === 'mudra');
  if (!entry) errors.push('marketplace.json: no "mudra" plugin entry');
  else if (entry.version !== VER) errors.push(`marketplace.json: version "${entry.version}", expected "${VER}"`);
} catch (e) {
  errors.push(`marketplace.json is not valid JSON: ${e.message}`);
}

if (!existsSync(path.join(here, '..', 'bin', 'cli.js'))) errors.push('bin/cli.js is missing');

if (errors.length) {
  console.error(`✗ validation failed (${errors.length}):\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ validation passed — package, all SKILL.md, and marketplace.json are at v${VER}`);
