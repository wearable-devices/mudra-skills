#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homeDir = process.env.HOME || process.env.USERPROFILE;
const SKILLS_DIR = path.join(homeDir, '.claude', 'skills');

const [,, command, ...args] = process.argv;

switch (command ?? 'add') {
  case 'add':    await add(args[0]); break;
  case 'remove':
  case 'rm':     remove(args[0]); break;
  case 'list':
  case 'ls':     list(); break;
  default:       printHelp(); break;
}

async function add(source) {
  let skillsSource;
  let tmpDir;

  if (!source) {
    skillsSource = path.resolve(__dirname, '..', 'skills');
  } else if (/^https?:\/\/|^git@/.test(source)) {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mudra-skills-'));
    console.log(`Fetching ${source}...`);
    try {
      execSync(`git clone --depth 1 "${source}" "${tmpDir}"`, { stdio: 'inherit' });
    } catch {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.error('git clone failed — is git installed and the URL reachable?');
      process.exit(1);
    }
    const nested = path.join(tmpDir, 'skills');
    skillsSource = fs.existsSync(nested) ? nested : tmpDir;
  } else {
    skillsSource = path.resolve(source);
    if (!fs.existsSync(skillsSource)) {
      console.error(`Path not found: ${skillsSource}`);
      process.exit(1);
    }
  }

  try {
    copySkills(skillsSource);
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function copySkills(skillsSource) {
  if (!fs.existsSync(skillsSource)) {
    console.error(`No skills directory found at: ${skillsSource}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(skillsSource, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.'));

  if (entries.length === 0) {
    console.error('No skill folders found.');
    process.exit(1);
  }

  fs.mkdirSync(SKILLS_DIR, { recursive: true });

  const installed = [];
  for (const entry of entries) {
    const src = path.join(skillsSource, entry.name);
    const skillFile = path.join(src, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const dest = path.join(SKILLS_DIR, entry.name);
    fs.mkdirSync(dest, { recursive: true });
    execSync(`cp -r "${src}/." "${dest}"`);
    installed.push(entry.name);
  }

  if (installed.length === 0) {
    console.error('No valid skills found (each skill needs a SKILL.md).');
    process.exit(1);
  }

  console.log('');
  console.log(`Installed ${installed.length} skill(s) to ${SKILLS_DIR}`);
  for (const name of installed) console.log(`  ✓ ${name}`);
  console.log('');
  console.log('Restart Claude Code (or run /reload-skills) to activate.');
  console.log('');
}

function remove(skillName) {
  if (!skillName) { console.error('Usage: mudra-skills remove <skill-name>'); process.exit(1); }
  const target = path.join(SKILLS_DIR, skillName);
  if (!fs.existsSync(target)) {
    console.error(`Skill not found: ${skillName}`);
    process.exit(1);
  }
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Removed skill: ${skillName}`);
}

function list() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log('No skills installed yet.');
    return;
  }
  const skills = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && fs.existsSync(path.join(SKILLS_DIR, e.name, 'SKILL.md')));

  if (skills.length === 0) {
    console.log('No skills installed yet.');
    return;
  }
  console.log(`Skills in ${SKILLS_DIR}:`);
  for (const s of skills) console.log(`  ${s.name}`);
}

function printHelp() {
  console.log(`
Usage:
  npx mudra-skills add [<github-url>]  Install skills (default: bundled)
  npx mudra-skills remove <name>       Remove a skill
  npx mudra-skills list                List installed skills
`);
}
