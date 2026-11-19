// Vice Sunset Cover Studio — the cover engine.
//
// Everything here is drawn by hand on a 2D canvas, from the user's own
// photos: no Rockstar artwork, logo or font, no network request, no image
// model. A cover is a poster grid of photo panels over a painted Vice City
// style sky (sunset gradient, a low sun, a skyline and palm silhouettes),
// finished with big condensed lettering, grain and a vignette.
//
// The engine is pure drawing: given a state object it paints any canvas at
// any size, so the on-screen preview and the exported PNG are the same
// picture, just at different resolutions.

export const LAYOUTS = {
  solo: { label: 'Solo', panels: 1 },
  duo: { label: 'Duo', panels: 2 },
  trio: { label: 'Trio', panels: 3 },
  grid: { label: 'Grid', panels: 4 },
  strip: { label: 'Strip', panels: 3 },
  mosaic: { label: 'Mosaic', panels: 5 },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#2b1055', '#7597de'],
    skyMid: '#ff7e5f',
    skyLow: '#feb47b',
    sun: '#ffd76e',
    tint: 'rgba(255, 94, 98, 0.20)',
    tint2: 'rgba(255, 159, 67, 0.12)',
    accent: '#ff5e8a',
    accent2: '#22d3ee',
    ink: '#1b1030',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#12082b', '#3b0f5e'],
    skyMid: '#c026d3',
    skyLow: '#0ea5e9',
    sun: '#f0abfc',
    tint: 'rgba(192, 38, 211, 0.28)',
    tint2: 'rgba(34, 211, 238, 0.14)',
    accent: '#e879f9',
    accent2: '#22d3ee',
    ink: '#0d0518',
  },
  golden: {
    label: 'Golden Hour',
    sky: ['#3a1c0d', '#b45309'],
    skyMid: '#f59e0b',
    skyLow: '#fde68a',
    sun: '#fff7cc',
    tint: 'rgba(245, 158, 11, 0.22)',
    tint2: 'rgba(255, 255, 255, 0.06)',
    accent: '#fbbf24',
    accent2: '#fb923c',
    ink: '#2b1503',
  },
  noir: {
    label: 'Noir Neon',
    sky: ['#0a0a0f', '#1f2937'],
    skyMid: '#374151',
    skyLow: '#6b7280',
    sun: '#e5e7eb',
    tint: 'rgba(0, 0, 0, 0.25)',
    tint2: 'rgba(255, 255, 255, 0.05)',
    accent: '#f43f5e',
    accent2: '#e5e7eb',
    ink: '#000000',
  },
  teal: {
    label: 'Palm Teal',
    sky: ['#042f2e', '#0f766e'],
    skyMid: '#14b8a6',
    skyLow: '#fda4af',
    sun: '#fef08a',
    tint: 'rgba(20, 184, 166, 0.20)',
    tint2: 'rgba(253, 164, 175, 0.12)',
    accent: '#2dd4bf',
    accent2: '#fda4af',
    ink: '#032e2c',
  },
  pop: {
    label: 'Vice Pop',
    sky: ['#2a0a4a', '#7c3aed'],
    skyMid: '#ec4899',
    skyLow: '#22d3ee',
    sun: '#fde047',
    tint: 'rgba(236, 72, 153, 0.22)',
    tint2: 'rgba(34, 211, 238, 0.14)',
    accent: '#f472b6',
    accent2: '#22d3ee',
    ink: '#1e0638',
  },
};

export const SIZES = {
  square: { label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  story: { label: 'Story · 1080 × 1920', w: 1080, h: 1920 },
  wide: { label: 'Wide · 1200 × 628', w: 1200, h: 628 },
};

/** A fresh, empty panel: no photo yet, centred, at natural zoom. */
export function blankPanel() {
  return { photo: null, zoom: 1, fx: 0.5, fy: 0.45 };
}

/** A fresh default state for the whole cover. */
export function defaultState() {
  return {
    title: 'VICE SUNSET',
    subtitle: 'A STORY IN NEON',
    tagline: 'Made with Vice Sunset Cover Studio',
    layout: 'mosaic',
    grade: 'pop',
    size: 'square',
    showSun: true,
    showPalms: true,
    grain: true,
    panels: [blankPanel(), blankPanel(), blankPanel(), blankPanel(), blankPanel()],
  };
}

/**
 * Panel rectangles for a layout, as fractions of the cover (x, y, w, h).
 * The title band at the bottom is kept clear of panels in every layout.
 */
export function layoutRects(layout, w, h) {
  // The mosaic layout has no bottom title band: its title block sits in
  // the middle of the panels, so the panels use the full height.
  const titleH = layout === 'mosaic' ? 0 : h * 0.24;
  const top = h * 0.03;
  const areaH = h - titleH - top - (layout === 'mosaic' ? h * 0.03 : 0);
  const gap = Math.max(6, w * 0.012);
  const x0 = w * 0.03;
  const x1 = w * 0.97;
  const aw = x1 - x0;
  if (layout === 'solo') return [{ x: x0, y: top, w: aw, h: areaH }];
  if (layout === 'duo') {
    const pw = (aw - gap) / 2;
    return [
      { x: x0, y: top, w: pw, h: areaH },
      { x: x0 + pw + gap, y: top, w: pw, h: areaH },
    ];
  }
  if (layout === 'strip') {
    const pw = (aw - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: x0 + i * (pw + gap), y: top, w: pw, h: areaH }));
  }
  if (layout === 'grid') {
    const pw = (aw - gap) / 2;
    const ph = (areaH - gap) / 2;
    return [
      { x: x0, y: top, w: pw, h: ph },
      { x: x0 + pw + gap, y: top, w: pw, h: ph },
      { x: x0, y: top + ph + gap, w: pw, h: ph },
      { x: x0 + pw + gap, y: top + ph + gap, w: pw, h: ph },
    ];
  }
  if (layout === 'mosaic') {
    // Mosaic: three panels across the top, two wide panels across the
    // bottom, and the central V title block overlapping the middle gap.
    const topH = areaH * 0.42;
    const botY = top + topH + gap;
    const botH = areaH - topH - gap;
    const third = (aw - gap * 2) / 3;
    const half = (aw - gap) / 2;
    return [
      { x: x0, y: top, w: third, h: topH },
      { x: x0 + third + gap, y: top, w: third, h: topH },
      { x: x0 + (third + gap) * 2, y: top, w: third, h: topH },
      { x: x0, y: botY, w: half, h: botH },
      { x: x0 + half + gap, y: botY, w: half, h: botH },
    ];
  }
  // trio: one tall hero panel on the left, two stacked on the right.
  const heroW = aw * 0.58;
  const sideW = aw - heroW - gap;
  const sideH = (areaH - gap) / 2;
  return [
    { x: x0, y: top, w: heroW, h: areaH },
    { x: x0 + heroW + gap, y: top, w: sideW, h: sideH },
    { x: x0 + heroW + gap, y: top + sideH + gap, w: sideW, h: sideH },
  ];
}

/** How many panels a layout actually shows. */
export function panelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS.trio).panels;
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawSky(ctx, w, h, grade, state) {
  const g = GRADES[grade] || GRADES.sunset;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  sky.addColorStop(0, g.sky[0]);
  sky.addColorStop(0.45, g.sky[1]);
  sky.addColorStop(0.72, g.skyMid);
  sky.addColorStop(1, g.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (state.showSun) {
    const sunX = w * 0.72;
    const sunY = h * 0.42;
    const sunR = w * 0.13;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
    glow.addColorStop(0, g.sun);
    glow.addColorStop(0.35, g.sun + '55');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - sunR * 2.4, sunY - sunR * 2.4, sunR * 4.8, sunR * 4.8);
    ctx.fillStyle = g.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    // Retro sun stripes: thin bands of sky colour across the lower half.
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = g.skyMid;
    for (let i = 0; i < 4; i++) {
      const y = sunY + sunR * (0.15 + i * 0.22);
      ctx.fillRect(sunX - sunR, y, sunR * 2, sunR * 0.07);
    }
    ctx.restore();
  }

  // Skyline silhouette along the horizon.
  const horizon = h * 0.76;
  ctx.fillStyle = g.ink;
  ctx.globalAlpha = 0.85;
  let x = 0;
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  while (x < w) {
    const bw = w * (0.05 + next() * 0.09);
    const bh = h * (0.04 + next() * 0.11);
    ctx.fillRect(x, horizon - bh, bw, bh + h * 0.03);
    x += bw + w * 0.008;
  }
  ctx.globalAlpha = 1;

  if (state.showPalms) {
    drawPalm(ctx, w * 0.06, horizon + h * 0.01, h * 0.11, -0.25, g.ink);
    drawPalm(ctx, w * 0.94, horizon + h * 0.01, h * 0.13, 0.3, g.ink);
  }
}

/** A simple palm silhouette: a curved trunk and seven drooping fronds. */
function drawPalm(ctx, x, y, size, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.08, -size * 0.55, size * 0.02, -size);
  ctx.stroke();
  ctx.translate(size * 0.02, -size);
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.95) + (i * Math.PI * 0.95) / 6;
    const len = size * (0.55 + (i % 2) * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(a) * len * 0.6, Math.sin(a) * len * 0.6 - size * 0.08,
      Math.cos(a) * len, Math.sin(a) * len + size * 0.28,
    );
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhotoPanel(ctx, rect, panel, grade) {
  const g = GRADES[grade] || GRADES.sunset;
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, Math.max(4, rect.w * 0.02));
  ctx.clip();
  if (panel.photo) {
    const img = panel.photo;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const base = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
    const pw = iw * base;
    const ph = ih * base;
    const dx = rect.x + rect.w / 2 - pw * panel.fx;
    const dy = rect.y + rect.h / 2 - ph * panel.fy;
    ctx.drawImage(img, dx, dy, pw, ph);
  } else {
    // Empty panel: a painted placeholder, so the cover still looks finished.
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, g.sky[1]);
    grad.addColorStop(1, g.skyMid);
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${Math.max(14, rect.w * 0.09)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('+ ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  // Grade tint + a warm wash from the bottom, the poster look.
  ctx.fillStyle = g.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const wash = ctx.createLinearGradient(0, rect.y + rect.h * 0.4, 0, rect.y + rect.h);
  wash.addColorStop(0, 'rgba(0,0,0,0)');
  wash.addColorStop(1, g.tint2);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // White poster border + thin dark keyline.
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, Math.max(4, rect.w * 0.02));
  ctx.lineWidth = Math.max(3, rect.w * 0.014);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

/**
 * The mosaic title block: a big downward V in a hot pink-to-purple
 * gradient with a white keyline, the title stacked inside it in our own
 * lettering. It is a geometric shape with original text — not a logo.
 */
function drawMosaicTitle(ctx, w, h, state) {
  const g = GRADES[state.grade] || GRADES.sunset;
  const cx = w / 2;
  const top = h * 0.34;
  const bottom = h * 0.68;
  const half = w * 0.27;
  // V shape.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - half, top);
  ctx.lineTo(cx + half, top);
  ctx.lineTo(cx, bottom);
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx - half, top, cx + half, bottom);
  grad.addColorStop(0, '#a855f7');
  grad.addColorStop(0.5, g.accent);
  grad.addColorStop(1, '#f97316');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(4, w * 0.006);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = g.ink;
  ctx.stroke();
  ctx.clip();
  // Halftone dots fading down the V.
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  const step = Math.max(10, w * 0.018);
  for (let y = top + step; y < bottom; y += step) {
    for (let x = cx - half; x < cx + half; x += step) {
      const r = 1 + ((y - top) / (bottom - top)) * 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  const title = (state.title || 'VICE SUNSET').trim().toUpperCase();
  const family = `'Arial Black', Impact, 'Helvetica Neue', sans-serif`;
  // Two lines if the title has a space: "VICE" over "SUNSET", like a
  // poster monogram; one line otherwise.
  const words = title.split(/\s+/);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (words.length > 1) {
    const first = words.slice(0, Math.ceil(words.length / 2)).join(' ');
    const second = words.slice(Math.ceil(words.length / 2)).join(' ');
    const size = fitFont(ctx, second, half * 1.5, h * 0.075, family);
    ctx.font = `900 ${size}px ${family}`;
    ctx.lineWidth = Math.max(3, size * 0.1);
    ctx.strokeStyle = g.ink;
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(first, cx, top + (bottom - top) * 0.32);
    ctx.fillText(first, cx, top + (bottom - top) * 0.32);
    ctx.strokeText(second, cx, top + (bottom - top) * 0.55);
    ctx.fillText(second, cx, top + (bottom - top) * 0.55);
  } else {
    const size = fitFont(ctx, title, half * 1.6, h * 0.075, family);
    ctx.font = `900 ${size}px ${family}`;
    ctx.lineWidth = Math.max(3, size * 0.1);
    ctx.strokeStyle = g.ink;
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(title, cx, top + (bottom - top) * 0.42);
    ctx.fillText(title, cx, top + (bottom - top) * 0.42);
  }
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = fitFont(ctx, sub, half * 1.4, h * 0.026, `'Helvetica Neue', Arial, sans-serif`);
    ctx.font = `700 ${subSize}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.lineWidth = Math.max(2, subSize * 0.16);
    ctx.strokeStyle = g.ink;
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(sub, cx, top + (bottom - top) * 0.76);
    ctx.fillText(sub, cx, top + (bottom - top) * 0.76);
  }
  ctx.restore();

  const tag = (state.tagline || '').trim();
  if (tag) {
    ctx.font = `${Math.max(11, h * 0.014)}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(tag, w / 2, h * 0.985);
  }
}

function drawTitleBlock(ctx, w, h, state) {
  const g = GRADES[state.grade] || GRADES.sunset;
  const bandY = h * 0.78;
  const bandH = h * 0.20;
  // A dark band grounds the lettering, like a poster title block.
  ctx.fillStyle = 'rgba(10, 6, 20, 0.55)';
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = g.accent;
  ctx.fillRect(w * 0.03, bandY, w * 0.10, Math.max(4, h * 0.008));

  const title = (state.title || 'VICE SUNSET').trim().toUpperCase();
  const family = `'Arial Black', Impact, 'Helvetica Neue', sans-serif`;
  const maxW = w * 0.94;
  let size = fitFont(ctx, title, maxW, h * 0.115, family);
  ctx.save();
  ctx.translate(w / 2, bandY + bandH * 0.52);
  ctx.rotate(-0.015);
  ctx.scale(0.92, 1);
  ctx.font = `900 ${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Gradient lettering with a hard outline and a long shadow.
  const grad = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.6);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, g.sun);
  grad.addColorStop(1, g.accent);
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = g.ink;
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = Math.max(3, size * 0.06);
  ctx.fillText(title, 0, 0);
  ctx.restore();

  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = fitFont(ctx, sub, maxW * 0.8, h * 0.032, `'Helvetica Neue', Arial, sans-serif`);
    ctx.font = `700 ${subSize}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = g.accent2;
    ctx.fillText(sub, w / 2, bandY + bandH * 0.86);
    // Small rules either side of the subtitle.
    const tw = ctx.measureText(sub).width;
    ctx.fillRect(w / 2 - tw / 2 - w * 0.06, bandY + bandH * 0.86 - subSize * 0.2, w * 0.04, 2);
    ctx.fillRect(w / 2 + tw / 2 + w * 0.02, bandY + bandH * 0.86 - subSize * 0.2, w * 0.04, 2);
  }

  const tag = (state.tagline || '').trim();
  if (tag) {
    ctx.font = `${Math.max(11, h * 0.014)}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(tag, w / 2, h * 0.985);
  }
}

function addGrain(ctx, w, h, seedBase) {
  let seed = seedBase;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const dots = Math.floor((w * h) / 900);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < dots; i++) {
    const s = 1 + next() * 2;
    ctx.fillRect(next() * w, next() * h, s, s);
  }
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < dots / 2; i++) {
    const s = 1 + next() * 2;
    ctx.fillRect(next() * w, next() * h, s, s);
  }
  ctx.restore();
  // Vignette.
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Paints the whole cover onto `canvas` at the canvas's own pixel size.
 * `state` is the object from defaultState(), with panel.photo set to an
 * <img> (or null) per panel.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = state.grade || 'sunset';
  drawSky(ctx, w, h, grade, state);
  const rects = layoutRects(state.layout || 'trio', w, h);
  const n = panelCount(state.layout || 'trio');
  for (let i = 0; i < n; i++) {
    drawPhotoPanel(ctx, rects[i], state.panels[i] || blankPanel(), grade);
  }
  if ((state.layout || 'trio') === 'mosaic') drawMosaicTitle(ctx, w, h, state);
  else drawTitleBlock(ctx, w, h, state);
  if (state.grain) addGrain(ctx, w, h, 1234567);
  return rects.slice(0, n);
}

/** Renders the cover at the named export size and returns the canvas. */
export function renderExport(state) {
  const size = SIZES[state.size] || SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}
