// Vice Sunset Cover Studio — the editor.
//
// Wires the page: up to four photos, one per panel, each with its own zoom
// and focal point (drag the photo on the canvas to move it, scroll to zoom),
// a title / subtitle / tagline, five painted grades, five poster layouts
// and four export sizes. Everything runs in the browser, offline; photos
// never leave the machine. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).
import { drawCover, renderExport, defaultState, layoutRects, panelCount, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const state = defaultState();
let selected = 0;
let history = [];
let historyIndex = -1;
let historyTimer = null;

const $ = (id) => document.getElementById(id);
const titleInput = $('title');
const subtitleInput = $('subtitle');
const taglineInput = $('tagline');
const zoomInput = $('zoom');
const panXInput = $('panx');
const panYInput = $('pany');

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function snapshot() {
  return JSON.stringify({
    title: state.title, subtitle: state.subtitle, tagline: state.tagline,
    layout: state.layout, grade: state.grade, size: state.size,
    showSun: state.showSun, showPalms: state.showPalms, grain: state.grain,
    panels: state.panels.map((p) => ({ zoom: p.zoom, fx: p.fx, fy: p.fy, hasPhoto: !!p.photo })),
    selected,
  });
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = true;
}

function pushHistorySoon() {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(pushHistory, 400);
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  state.title = s.title; state.subtitle = s.subtitle; state.tagline = s.tagline;
  state.layout = s.layout; state.grade = s.grade; state.size = s.size;
  state.showSun = s.showSun; state.showPalms = s.showPalms; state.grain = s.grain;
  s.panels.forEach((p, i) => {
    state.panels[i].zoom = p.zoom; state.panels[i].fx = p.fx; state.panels[i].fy = p.fy;
  });
  selected = s.selected;
  syncControls();
  redraw();
}

function redraw() {
  // The preview canvas follows the chosen export ratio, at preview size.
  const size = SIZES[state.size] || SIZES.square;
  const scale = Math.min(1080 / size.w, 1080 / size.h, 1);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  drawCover(canvas, state);
  syncPanelList();
}

function syncControls() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  taglineInput.value = state.tagline;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  $('sun').checked = state.showSun;
  $('palms').checked = state.showPalms;
  $('grain').checked = state.grain;
  const p = state.panels[selected];
  zoomInput.value = p.zoom;
  panXInput.value = Math.round(p.fx * 100);
  panYInput.value = Math.round(p.fy * 100);
  $('zoomval').textContent = `${p.zoom.toFixed(2)}×`;
  $('panelname').textContent = `Panel ${selected + 1} of ${panelCount(state.layout)}`;
}

function syncPanelList() {
  const list = $('panels');
  list.innerHTML = '';
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-chip' + (i === selected ? ' active' : '');
    btn.textContent = state.panels[i].photo ? `▣ Panel ${i + 1}` : `＋ Panel ${i + 1}`;
    btn.addEventListener('click', () => { selected = i; syncControls(); redraw(); });
    list.appendChild(btn);
  }
  $('panelname').textContent = `Panel ${selected + 1} of ${n}`;
  const p = state.panels[selected];
  zoomInput.value = p.zoom;
  $('zoomval').textContent = `${p.zoom.toFixed(2)}×`;
}

function setPhoto(index, img, label) {
  state.panels[index].photo = img;
  state.panels[index].zoom = 1;
  state.panels[index].fx = 0.5;
  state.panels[index].fy = 0.45;
  selected = index;
  pushHistory();
  redraw();
  setStatus(label ? `Loaded ${label} into panel ${index + 1}.` : `Photo loaded into panel ${index + 1}.`);
}

async function loadFile(file, index) {
  if (!file || !file.type.startsWith('image/')) {
    setStatus('That file is not an image — try a JPG or PNG photo.');
    return;
  }
  try {
    const img = await loadImage(URL.createObjectURL(file));
    setPhoto(index, img, file.name);
  } catch {
    setStatus('Could not read that image. Try another file.');
  }
}

// --- Text, layout, grade, size -------------------------------------------

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); pushHistorySoon(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); pushHistorySoon(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); pushHistorySoon(); });

document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => {
  state.layout = b.dataset.layout;
  if (selected >= panelCount(state.layout)) selected = 0;
  pushHistory(); syncControls(); redraw();
}));
document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
  state.grade = b.dataset.grade;
  pushHistory(); syncControls(); redraw();
}));
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
  state.size = b.dataset.size;
  pushHistory(); syncControls(); redraw();
}));
$('sun').addEventListener('change', (e) => { state.showSun = e.target.checked; pushHistory(); redraw(); });
$('palms').addEventListener('change', (e) => { state.showPalms = e.target.checked; pushHistory(); redraw(); });
$('grain').addEventListener('change', (e) => { state.grain = e.target.checked; pushHistory(); redraw(); });

// --- Photos ---------------------------------------------------------------

$('photo').addEventListener('change', (e) => { loadFile(e.target.files[0], selected); e.target.value = ''; });
$('photo2').addEventListener('change', (e) => { loadFile(e.target.files[0], selected); e.target.value = ''; });
$('load-samples').addEventListener('click', async () => {
  try {
    const a = await loadImage('samples/boulevard.jpg');
    const b = await loadImage('samples/pier.jpg');
    state.panels[0].photo = a;
    state.panels[1].photo = b;
    state.panels[0].zoom = 1; state.panels[1].zoom = 1;
    pushHistory(); redraw();
    setStatus('Sample photos loaded — replace any panel with your own photo.');
  } catch {
    setStatus('Sample photos could not be loaded.');
  }
});
$('clear-panel').addEventListener('click', () => {
  state.panels[selected].photo = null;
  state.panels[selected].zoom = 1;
  pushHistory(); redraw();
  setStatus(`Panel ${selected + 1} cleared.`);
});

// --- Per-panel framing: sliders + drag / scroll on the canvas ------------

zoomInput.addEventListener('input', () => {
  state.panels[selected].zoom = Number(zoomInput.value);
  $('zoomval').textContent = `${state.panels[selected].zoom.toFixed(2)}×`;
  redraw(); pushHistorySoon();
});
panXInput.addEventListener('input', () => { state.panels[selected].fx = Number(panXInput.value) / 100; redraw(); pushHistorySoon(); });
panYInput.addEventListener('input', () => { state.panels[selected].fy = Number(panYInput.value) / 100; redraw(); pushHistorySoon(); });

function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < panelCount(state.layout); i++) {
    const p = rects[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

let dragging = false;
let dragStart = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  selected = i;
  syncControls();
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY, fx: state.panels[i].fx, fy: state.panels[i].fy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging || !dragStart) return;
  const p = state.panels[selected];
  const r = canvas.getBoundingClientRect();
  p.fx = Math.min(1, Math.max(0, dragStart.fx - ((e.clientX - dragStart.x) / r.width) * 0.6));
  p.fy = Math.min(1, Math.max(0, dragStart.fy - ((e.clientY - dragStart.y) / r.height) * 0.6));
  redraw();
});
canvas.addEventListener('pointerup', () => { if (dragging) pushHistory(); dragging = false; dragStart = null; syncControls(); });
canvas.addEventListener('wheel', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  e.preventDefault();
  selected = i;
  const p = state.panels[i];
  p.zoom = Math.min(3, Math.max(1, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  syncControls(); redraw(); pushHistorySoon();
}, { passive: false });

// --- Undo / redo / surprise ----------------------------------------------

$('undo').addEventListener('click', () => {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  applySnapshot(history[historyIndex]);
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = false;
});
$('redo').addEventListener('click', () => {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  applySnapshot(history[historyIndex]);
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = historyIndex >= history.length - 1;
});
$('surprise').addEventListener('click', () => {
  const grades = Object.keys(GRADES);
  const layouts = Object.keys(LAYOUTS);
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  if (selected >= panelCount(state.layout)) selected = 0;
  pushHistory(); syncControls(); redraw();
  setStatus(`Surprise: ${GRADES[state.grade].label} × ${LAYOUTS[state.layout].label}.`);
});

// --- Export ---------------------------------------------------------------

$('export').addEventListener('click', () => {
  const size = SIZES[state.size] || SIZES.square;
  const out = renderExport(state);
  out.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-cover-${size.w}x${size.h}.png — share it anywhere.`);
  }, 'image/png');
});

// --- Shot scenes ----------------------------------------------------------

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (sample, text, layout, grade) => {
    const a = await loadImage(sample);
    // The second panel gets the other sample photo, so every layout
    // shows two different photos even when the shot names only one.
    const other = sample.includes('pier') ? 'samples/boulevard.jpg' : 'samples/pier.jpg';
    const b = await loadImage(other);
    state.panels[0].photo = a;
    state.panels[1].photo = b;
    // In shot scenes every visible panel gets a photo: the third panel
    // reuses the first photo as a tighter detail crop.
    state.panels[2].photo = a;
    state.panels[2].zoom = 1.5;
    state.panels[2].fx = 0.35;
    state.panels[2].fy = 0.3;
    state.panels[3].photo = b;
    state.panels[3].zoom = 1.3;
    state.panels[4].photo = b;
    state.panels[4].zoom = 1.7;
    state.panels[4].fx = 0.22;
    state.panels[4].fy = 0.22;
    state.title = text;
    if (layout && LAYOUTS[layout]) state.layout = layout;
    if (grade && GRADES[grade]) state.grade = grade;
    syncControls();
    redraw();
  });
} else {
  syncControls();
  pushHistory();
  redraw();
  setStatus('Add a photo to a panel, write your title, export a PNG.');
}
