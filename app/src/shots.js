// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone, full-bleed.
// `photo` picks the first sample (samples/<photo>.jpg), `caption` the title,
// `layout` and `grade` the look. window.__shotReady is set once painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'boulevard';
  const caption = query.get('caption') ?? 'Boulevard Queen';
  const layout = query.get('layout') ?? 'trio';
  const grade = query.get('grade') ?? 'sunset';
  await load(`samples/${photo}.jpg`, caption, layout, grade);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
