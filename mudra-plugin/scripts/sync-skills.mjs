#!/usr/bin/env node
// Single source of truth = mudra-plugin/package.json "version".
// This script regenerates every derived artifact so nothing can drift:
//   1. .claude/skills/<skill>  ->  mudra-plugin/skills/<skill>   (canonical -> shipped)
//   2. nested mudra-master/{mudra-preview,mudra-xr} copies in BOTH trees
//   3. stamp `version:` into every SKILL.md frontmatter + marketplace.json
//   4. rebuild Skill download/<skill>.zip deterministically (no __MACOSX junk)
// Zero runtime deps — Node built-ins + the system `zip` (Info-ZIP).

import { readFileSync, writeFileSync, cpSync, rmSync, mkdirSync, readdirSync, existsSync, utimesSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const VER = JSON.parse(readFileSync(path.join(here, '..', 'package.json'), 'utf8')).version;

// Product skills ONLY. .claude/skills also holds speckit-*/gstack skills that must NOT ship.
const SKILLS = ['mudra-master', 'mudra-preview', 'mudra-xr'];
const NESTED = ['mudra-preview', 'mudra-xr']; // copies bundled inside mudra-master
const SRC = path.join(repo, '.claude', 'skills');         // canonical (you edit here)
const DST = path.join(repo, 'mudra-plugin', 'skills');    // generated (npx + plugin ship this)
const ZIPDIR = path.join(repo, 'Skill download');

const isJunk = (p) => /\.DS_Store$|\/\._|__MACOSX/.test(p);
const copyOpts = { recursive: true, force: true, filter: (src) => !isJunk(src) };

// 1. canonical -> shipped (whitelisted skills only)
for (const s of SKILLS) {
  const src = path.join(SRC, s);
  if (!existsSync(src)) throw new Error(`Missing canonical skill: ${src}`);
  rmSync(path.join(DST, s), { recursive: true, force: true });
  cpSync(src, path.join(DST, s), copyOpts);
}

// 2. regenerate the nested preview/xr copies inside mudra-master, in both trees,
//    so the leaf skill in .claude/skills is the one true source for the nested copy too.
for (const base of [SRC, DST]) {
  for (const leaf of NESTED) {
    const dst = path.join(base, 'mudra-master', leaf);
    rmSync(dst, { recursive: true, force: true });
    cpSync(path.join(base, leaf), dst, copyOpts);
  }
}

// 3a. stamp version: <VER> into every SKILL.md frontmatter (both trees, recursive)
const stampSkillFiles = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) stampSkillFiles(p);
    else if (e.name === 'SKILL.md') {
      const before = readFileSync(p, 'utf8');
      const after = before.replace(/^version:\s*.*$/m, `version: ${VER}`);
      if (after !== before) writeFileSync(p, after);
    }
  }
};
for (const base of [SRC, DST]) for (const s of SKILLS) stampSkillFiles(path.join(base, s));

// 3b. stamp version into the marketplace plugin entry
const mktPath = path.join(repo, '.claude-plugin', 'marketplace.json');
const mkt = JSON.parse(readFileSync(mktPath, 'utf8'));
const entry = mkt.plugins.find((p) => p.name === 'mudra');
if (!entry) throw new Error('No "mudra" plugin entry in marketplace.json');
entry.version = VER;
writeFileSync(mktPath, JSON.stringify(mkt, null, 2) + '\n');

// 4. deterministic ZIPs from the shipped tree, keeping the <skill>/ parent folder
//    so drag-to-import lands the skill at the top level (matches existing layout).
// Normalize mtimes to a fixed epoch first — cpSync resets them every run, and the
// archive embeds them, which would otherwise churn the ZIPs on each sync.
const FIXED = new Date('2021-01-01T00:00:00Z');
const normalizeMtimes = (dir) => {
  utimesSync(dir, FIXED, FIXED);
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) normalizeMtimes(p);
    else utimesSync(p, FIXED, FIXED);
  }
};

mkdirSync(ZIPDIR, { recursive: true });
for (const s of SKILLS) {
  const zip = path.join(ZIPDIR, `${s}.zip`);
  rmSync(zip, { force: true });
  normalizeMtimes(path.join(DST, s));
  // Info-ZIP `zip` on every platform. `-X` drops the extra fields (UID/GID and the
  // atime/mtime "UX/UT" timestamps) so the bytes are identical run-to-run; what remains
  // is the normalized DOS mtime. Running from DST keeps the <skill>/ parent prefix.
  // `zip` adds no __MACOSX/._ entries (that is a ditto/Finder behavior).
  execFileSync('zip', ['-X', '-r', '-q', zip, s], { cwd: DST, stdio: 'inherit' });
}

console.log(`✓ synced .claude/skills → mudra-plugin/skills, stamped v${VER}, rebuilt ${SKILLS.length} ZIPs`);
