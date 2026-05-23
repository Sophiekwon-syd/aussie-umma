#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const API = 'https://graph.facebook.com/v21.0';
const IG_TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const REPO = process.env.GITHUB_REPOSITORY || 'Sophiekwon-syd/aussie-umma';
const REF = process.env.GITHUB_SHA || 'main';
const DELAY_BETWEEN_POSTS_MS = 60_000;
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_TRIES = 36;

if (!IG_TOKEN || !IG_USER_ID) {
  console.error('IG_ACCESS_TOKEN and IG_USER_ID env vars are required.');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const date = args.date || new Date().toISOString().slice(0, 10);
const baseDir = path.join('outputs', date);

const runLog = JSON.parse(await fs.readFile(path.join(baseDir, 'run-log.json'), 'utf8'));
const config = JSON.parse(await fs.readFile('config.json', 'utf8'));

const logPath = path.join(baseDir, 'instagram-log.json');
const existingResults = await readExistingResults(logPath);
const alreadyPostedSlugs = new Set(existingResults.map((r) => r.slug));
if (alreadyPostedSlugs.size > 0) {
  console.log(`Found existing instagram-log.json with ${alreadyPostedSlugs.size} posted slug(s): ${[...alreadyPostedSlugs].join(', ')}`);
}

const results = [...existingResults];
let topicIndex = 0;
let postedThisRun = 0;

for (const topic of runLog.topics) {
  topicIndex += 1;

  if (topic.status !== 'success') {
    console.log(`[skip] ${topic.topic} — status=${topic.status}`);
    continue;
  }

  const slug = path.basename(topic.carousel_file, '.html');

  if (alreadyPostedSlugs.has(slug)) {
    console.log(`[skip] ${slug} — already posted (in instagram-log.json)`);
    continue;
  }
  const imgDir = path.join(baseDir, 'images');
  const files = (await fs.readdir(imgDir))
    .filter((f) => f.startsWith(`${slug}-`) && f.endsWith('.png'))
    .sort();

  if (files.length !== 10) {
    console.error(`[skip] ${slug} — expected 10 images, found ${files.length}`);
    continue;
  }

  const urls = files.map(
    (f) => `https://raw.githubusercontent.com/${REPO}/${REF}/${baseDir}/images/${f}`,
  );

  const copyPath = path.join(baseDir, path.basename(topic.copy_file));
  const copy = JSON.parse(await fs.readFile(copyPath, 'utf8'));
  const caption = buildCaption(copy, topic, config);

  console.log(`\n[${topicIndex}/${runLog.topics.length}] ${topic.topic}`);
  console.log(`  slug=${slug}  images=${urls.length}`);

  if (postedThisRun > 0) {
    console.log(`  pausing ${DELAY_BETWEEN_POSTS_MS / 1000}s before next post...`);
    await sleep(DELAY_BETWEEN_POSTS_MS);
  }

  const childIds = [];
  for (let i = 0; i < urls.length; i++) {
    const id = await createContainer({ image_url: urls[i], is_carousel_item: 'true' });
    console.log(`  item ${String(i + 1).padStart(2, '0')}: container=${id}`);
    childIds.push(id);
  }

  const carouselId = await createContainer({
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
  });
  console.log(`  carousel: container=${carouselId}`);

  await waitForReady(carouselId);

  const postId = await publish(carouselId);
  console.log(`  PUBLISHED: ${postId}`);

  results.push({
    topic: topic.topic,
    slug,
    carousel_container_id: carouselId,
    ig_media_id: postId,
    image_urls: urls,
    posted_at: new Date().toISOString(),
  });
  postedThisRun += 1;
}

if (postedThisRun === 0) {
  console.log(`\nNo new posts to publish — all eligible topics already in ${logPath}.`);
} else {
  await fs.writeFile(
    logPath,
    JSON.stringify(
      { date, last_run_at: new Date().toISOString(), repo: REPO, ref: REF, results },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${logPath} — ${postedThisRun} new post(s) this run, ${results.length} total.`);
}

async function readExistingResults(p) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.results) ? parsed.results.filter((r) => r.ig_media_id) : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function buildCaption(copy, topicEntry, config) {
  const cover = copy.cards.find((c) => c.type === 'cover') || {};
  const headline = stripHtml(cover.headline_accent ? `${cover.headline} ${cover.headline_accent}` : cover.headline || topicEntry.topic);
  const subtitle = stripHtml(cover.subtitle || '');
  const cta = config.content?.cta_text || '';
  const handle = config.brand?.account || '';
  const tags = '#호주육아 #호주맘 #한국엄마 #호주생활 #육아정보 #aussiemum #aussieumma';
  return [headline, subtitle, '', [cta, handle].filter(Boolean).join(' '), '', tags]
    .filter((line) => line !== undefined)
    .join('\n');
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, '').trim();
}

async function createContainer(params) {
  const body = new URLSearchParams({ ...params, access_token: IG_TOKEN });
  const r = await fetch(`${API}/${IG_USER_ID}/media`, { method: 'POST', body });
  const j = await r.json();
  if (!r.ok || !j.id) {
    throw new Error(`createContainer failed: ${JSON.stringify(j)}`);
  }
  return j.id;
}

async function publish(creationId) {
  const body = new URLSearchParams({ creation_id: creationId, access_token: IG_TOKEN });
  const r = await fetch(`${API}/${IG_USER_ID}/media_publish`, { method: 'POST', body });
  const j = await r.json();
  if (!r.ok || !j.id) {
    throw new Error(`publish failed: ${JSON.stringify(j)}`);
  }
  return j.id;
}

async function waitForReady(id) {
  for (let i = 0; i < POLL_MAX_TRIES; i++) {
    const r = await fetch(`${API}/${id}?fields=status_code&access_token=${IG_TOKEN}`);
    const j = await r.json();
    if (j.status_code === 'FINISHED') return;
    if (j.status_code === 'ERROR' || j.status_code === 'EXPIRED') {
      throw new Error(`container ${id} reached terminal state ${j.status_code}: ${JSON.stringify(j)}`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`container ${id} not FINISHED after ${POLL_MAX_TRIES} polls`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
