// Persistence layer. Single file so swapping localStorage -> Firestore later is one change.
// The API is intentionally tiny: listPlays, getPlay, savePlay, deletePlay, exportPlay, importPlay.

import { validatePlay, migratePlay } from './schema.js';

const STORAGE_KEY = 'courtside-plays-v1';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function listPlays() {
  const map = readAll();
  return Object.values(map)
    .map(migratePlay)
    .sort((a, b) => (b.meta?.updatedAt ?? 0) - (a.meta?.updatedAt ?? 0));
}

export function getPlay(id) {
  const map = readAll();
  const play = map[id];
  return play ? migratePlay(play) : null;
}

export function savePlay(play) {
  const migrated = migratePlay(play);
  const { ok, errors } = validatePlay(migrated);
  if (!ok) {
    // Throw : callers should handle and show the error, not silently corrupt storage.
    throw new Error('Invalid play: ' + errors.join('; '));
  }
  migrated.meta.updatedAt = Date.now();
  const map = readAll();
  map[migrated.meta.id] = migrated;
  writeAll(map);
  return migrated;
}

export function deletePlay(id) {
  const map = readAll();
  delete map[id];
  writeAll(map);
}

/**
 * Export a play to a pretty-printed JSON string the coach can save as a .json file.
 */
export function exportPlayJson(play) {
  return JSON.stringify(migratePlay(play), null, 2);
}

/**
 * Import a play from JSON text. Validates and assigns a new id if requested.
 */
export function importPlayJson(text, { newId = false } = {}) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('Not valid JSON');
  }
  const migrated = migratePlay(parsed);
  const { ok, errors } = validatePlay(migrated);
  if (!ok) throw new Error('Invalid play JSON: ' + errors.join('; '));
  if (newId) {
    migrated.meta = { ...migrated.meta, id: crypto.randomUUID() };
  }
  return migrated;
}

/**
 * Encode a play to a URL-safe base64 string so it can ride in a /share/:encoded route.
 * Uses a simple TextEncoder -> base64 pipeline; skips full compression for v1 since
 * plays are already small. Can add LZString later if share links get long.
 */
export function encodePlayForUrl(play) {
  const json = JSON.stringify(migratePlay(play));
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePlayFromUrl(encoded) {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const json = new TextDecoder().decode(bytes);
  return migratePlay(JSON.parse(json));
}
