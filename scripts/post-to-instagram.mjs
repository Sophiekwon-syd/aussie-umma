#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const API = 'https://graph.facebook.com/v21.0';

const REPO = process.env.GITHUB_REPOSITORY || 'Sophiekwon-syd/content-pipeline';
const REF = process.env.GITHUB_SHA || 'main';

const IG_TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
if (!IG_TOKEN || !IG_USER_ID) {
  console.error('IG_ACCESS_TOKEN and IG_USER_ID env vars are required.');
  process.exit(1);
}

const dateArgIdx = process.argv.indexOf('--date');
const date = dateArgIdx >= 0 ? process.argv[dateArgIdx + 1] : new Date().toISOString().slice(0, 10);
const baseDir = path.join('outputs', date);

let slugs;
try {
  slugs = (await fs.readdir(baseDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
} catch {
  console.log(`No outputs directory for ${date} — nothing to post.`);
  process.exit(0);
}
console.log(`Found ${slugs.length} topic(s): ${slugs.join(', ')}`);

const logPath = path.join(baseDir, 'instagram-log.json');
let posted = [];
try { posted = JSON.parse(await fs.readFile(logPath, 'utf8')); } catch {}

for (const slug of slugs) {
  if (posted.includes(slug)) { console.log(`[skip] ${slug} — already posted`); continue; }

  const imgDir = path.join(baseDir, slug, 'carousel', 'images');
  let files;
  try {
    files = (await fs.readdir(imgDir)).filter((f) => f.startsWith('card-') && f.endsWith('.png')).sort();
  } catch { console.log(`[skip] ${slug} — no images/`); continue; }
  if (!files.length) { console.log(`[skip] ${slug} — no PNGs`); continue; }

  console.log(`Posting ${slug}: ${files.length} images`);

  const urls = files.map((f) => `https://raw.githubusercontent.com/${REPO}/${REF}/${path.join(baseDir, slug, 'carousel', 'images', f)}`);

  const itemIds = [];
  for (const url of urls) {
    const res = await fetch(`${API}/${IG_USER_ID}/media?image_url=${encodeURIComponent(url)}&access_token=${IG_TOKEN}`, { method: 'POST' });
    const d = await res.json();
    if (d.id) { itemIds.push(d.id); console.log(`  image: ${d.id}`); }
    else { console.error(`  image fail: ${JSON.stringify(d)}`); }
  }
  if (!itemIds.length) { console.error(`[fail] ${slug}`); continue; }

  let caption = '호주 육아 정보 @aussie.umma\n\n#호주육아';
  try {
    const brief = await fs.readFile(path.join(baseDir, slug, 'brief.md'), 'utf8');
    const m = brief.match(/^# Topic: (.+)$/m);
    if (m) caption = `${m[1]}\n\n호주 육아 정보 @aussie.umma\n\n#호주육아 #호주도서관 #호주엄마`;
  } catch {}

  const cr = await fetch(`${API}/${IG_USER_ID}/media?caption=${encodeURIComponent(caption)}&media_type=CAROUSEL&children=${itemIds.join('%2C')}&access_token=${IG_TOKEN}`, { method: 'POST' });
  const cj = await cr.json();
  if (!cj.id) { console.error(`[fail] carousel: ${JSON.stringify(cj)}`); continue; }
  console.log(`  carousel: ${cj.id}`);

  const pr = await fetch(`${API}/${IG_USER_ID}/media_publish?creation_id=${cj.id}&access_token=${IG_TOKEN}`, { method: 'POST' });
  const pj = await pr.json();
  if (pj.id) { console.log(`  published: ${pj.id}`); posted.push(slug); }
  else { console.error(`  publish fail: ${JSON.stringify(pj)}`); }
}

await fs.writeFile(logPath, JSON.stringify(posted, null, 2));
console.log(`Done. Posted ${posted.length}.`);
