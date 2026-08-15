import { fromBase36, toBase36 } from './engine/v1/bigint.js';
import { hashCodePoints } from './engine/v1/hash.js';
import { generatePage } from './engine/v1/page.js';
import { locateText } from './engine/v1/search.js';
import { ENGINE_VERSION, MODULUS } from './engine/v1/seed.js';
import { COLUMNS, ROWS, codePointsToString, inspectCodePoints } from './engine/v1/unicode.js';
import { getLocal, putLocal } from './storage.js';

const $ = selector => document.querySelector(selector);
const homeView = $('#home-view');
const readerView = $('#reader-view');
const content = $('#page-content');
const notice = $('#notice');
let currentPage = null;
let displayMode = 'raw';
let activeHighlight = null;

function encodeSeed(seed) {
  const bytes = new TextEncoder().encode(seed);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeSeed(encoded) {
  const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.hidden = false;
  clearTimeout(showNotice.timeout);
  showNotice.timeout = setTimeout(() => { notice.hidden = true; }, 5000);
}

function setBusy(busy) {
  document.body.classList.toggle('busy', busy);
  document.querySelectorAll('button').forEach(button => { button.disabled = busy; });
}

function appendPageSegment(line, codePoints, highlighted) {
  if (codePoints.length === 0) return;
  if (displayMode === 'inspect' && line.childNodes.length > 0) {
    line.append(document.createTextNode(' '));
  }
  const text = displayMode === 'raw' ? codePointsToString(codePoints) : inspectCodePoints(codePoints);
  if (!highlighted) {
    line.append(document.createTextNode(text));
    return;
  }
  const mark = document.createElement('mark');
  mark.className = 'search-highlight';
  mark.textContent = text;
  line.append(mark);
}

function renderContent() {
  content.replaceChildren();
  for (let row = 0; row < ROWS; row += 1) {
    const line = document.createElement('div');
    line.className = 'page-row';
    const rowStart = row * COLUMNS;
    const rowEnd = rowStart + COLUMNS;
    const slice = currentPage.codePoints.slice(rowStart, rowEnd);
    const highlightStart = activeHighlight?.start ?? -1;
    const highlightEnd = highlightStart + (activeHighlight?.length ?? 0);

    if (highlightEnd <= rowStart || highlightStart >= rowEnd) {
      appendPageSegment(line, slice, false);
    } else {
      const localStart = Math.max(0, highlightStart - rowStart);
      const localEnd = Math.min(COLUMNS, highlightEnd - rowStart);
      appendPageSegment(line, slice.slice(0, localStart), false);
      appendPageSegment(line, slice.slice(localStart, localEnd), true);
      appendPageSegment(line, slice.slice(localEnd), false);
    }
    content.append(line);
  }
}

async function openPage(seed, pageId, pushHash = true, highlight = null) {
  setBusy(true);
  try {
    currentPage = await generatePage(seed, pageId);
    activeHighlight = highlight;
    homeView.hidden = true;
    readerView.hidden = false;
    $('#meta-seed').textContent = seed;
    $('#meta-page').textContent = toBase36(currentPage.pageId);
    $('#meta-engine').textContent = ENGINE_VERSION;
    $('#meta-hash').textContent = '计算中…';
    renderContent();
    content.querySelector('.search-highlight')?.scrollIntoView({ block: 'center' });
    if (pushHash) history.pushState(null, '', `#/v1/s/${encodeSeed(seed)}/p/${toBase36(currentPage.pageId)}`);
    $('#meta-hash').textContent = await hashCodePoints(currentPage.codePoints);
    const id = `${encodeSeed(seed)}:${toBase36(currentPage.pageId)}`;
    await putLocal('history', { id, seed, pageId: toBase36(currentPage.pageId), visitedAt: new Date().toISOString() });
    const note = await getLocal('notes', id);
    $('#note-input').value = note?.text || '';
  } catch (error) {
    showNotice(error.message || '页面生成失败', true);
  } finally {
    setBusy(false);
  }
}

async function route() {
  const match = location.hash.match(/^#\/v1\/s\/([A-Za-z0-9_-]+)\/p\/([0-9a-z]+)$/i);
  if (!match) {
    homeView.hidden = false;
    readerView.hidden = true;
    return;
  }
  try {
    await openPage(decodeSeed(match[1]), fromBase36(match[2]), false);
  } catch (error) {
    location.hash = '#/';
    showNotice('URL 中的种子或页码无效', true);
  }
}

$('#enter-form').addEventListener('submit', event => {
  event.preventDefault();
  const seed = $('#seed-input').value;
  if (seed.length === 0) return showNotice('Seed 不能为空', true);
  openPage(seed, 0n);
});

$('#random-seed').addEventListener('click', () => {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  $('#seed-input').value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
});

$('#prev-page').addEventListener('click', () => openPage(currentPage.seed, (currentPage.pageId - 1n + MODULUS) % MODULUS));
$('#next-page').addEventListener('click', () => openPage(currentPage.seed, (currentPage.pageId + 1n) % MODULUS));
$('#random-page').addEventListener('click', () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  openPage(currentPage.seed, value % MODULUS);
});

$('#raw-mode').addEventListener('click', () => {
  displayMode = 'raw';
  $('#raw-mode').classList.add('active');
  $('#inspect-mode').classList.remove('active');
  renderContent();
});

$('#inspect-mode').addEventListener('click', () => {
  displayMode = 'inspect';
  $('#inspect-mode').classList.add('active');
  $('#raw-mode').classList.remove('active');
  renderContent();
});

$('#search-form').addEventListener('submit', async event => {
  event.preventDefault();
  setBusy(true);
  try {
    const query = $('#search-input').value;
    const occurrence = Number($('#occurrence-input').value);
    const result = await locateText(currentPage.seed, query, occurrence);
    await putLocal('searches', {
      id: `${Date.now()}:${occurrence}`,
      seed: currentPage.seed,
      query,
      occurrenceIndex: occurrence,
      pageId: toBase36(result.pageId),
      searchedAt: new Date().toISOString(),
    });
    await openPage(currentPage.seed, result.pageId, true, {
      start: result.offset,
      length: Array.from(query).length,
    });
    showNotice(`逆向验证通过：目标文本位于第 ${result.offset + 1} 个 Unicode 标量值`);
  } catch (error) {
    showNotice(error.message || '搜索失败', true);
  } finally {
    setBusy(false);
  }
});

$('#favorite-page').addEventListener('click', async () => {
  const pageId = toBase36(currentPage.pageId);
  const id = `${encodeSeed(currentPage.seed)}:${pageId}`;
  const existing = await getLocal('favorites', id);
  if (existing) return showNotice('这个页面已经收藏过了');
  await putLocal('favorites', { id, seed: currentPage.seed, pageId, addedAt: new Date().toISOString() });
  showNotice('收藏已保存在本机 IndexedDB');
});

$('#save-note').addEventListener('click', async () => {
  const pageId = toBase36(currentPage.pageId);
  const id = `${encodeSeed(currentPage.seed)}:${pageId}`;
  await putLocal('notes', {
    id,
    seed: currentPage.seed,
    pageId,
    text: $('#note-input').value,
    updatedAt: new Date().toISOString(),
  });
  showNotice('备注已保存在本机 IndexedDB');
});

$('#export-page').addEventListener('click', () => {
  const header = `Unicode Babel Library\nEngine: ${ENGINE_VERSION}\nSeed: ${currentPage.seed}\nPage: ${toBase36(currentPage.pageId)}\n\n`;
  const blob = new Blob([header, currentPage.text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ubabel-${toBase36(currentPage.pageId)}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

$('#back-home').addEventListener('click', () => { location.hash = '#/'; });
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);
route();
