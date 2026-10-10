'use strict';
/* Стикеры «Тихо»: наборы «Тиша» (облачко-талисман) и «Котя». Всё — SVG, без внешних файлов. */
const TihoStickers = (() => {
  const INK = '#0B2418';
  const eye = {
    open: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="7" fill="${INK}"/><circle cx="${x + 1.8}" cy="${y - 2.6}" r="2" fill="#fff"/>`,
    happy: (x, y) => `<path d="M${x - 6} ${y + 2}q6-8 12 0" stroke="${INK}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    closed: (x, y) => `<path d="M${x - 6} ${y}q6 5 12 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    heart: (x, y) => `<path d="M${x} ${y + 6}c-7-4-9-8-7-11 2-3 6-2 7 1 1-3 5-4 7-1 2 3 0 7-7 11Z" fill="#FF4D6A"/>`,
    star: (x, y) => `<path d="M${x} ${y - 7}l2 5h5.5l-4.4 3.3 1.7 5.4L${x} ${y + 3.4}l-4.8 3.3 1.7-5.4-4.4-3.3H${x - 2}Z" fill="#FFC83D" stroke="#C2861A" stroke-width="1"/>`,
    wide: (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="${x}" cy="${y + 1}" r="3.4" fill="${INK}"/>`,
    sad: (x, y, s) => `<ellipse cx="${x}" cy="${y + 1}" rx="5" ry="6" fill="${INK}"/><circle cx="${x + 1.5}" cy="${y - 1.5}" r="1.8" fill="#fff"/><path d="M${x - 7} ${y - 8 + s * 3}l14 ${-s * 3}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    angry: (x, y, s) => `<ellipse cx="${x}" cy="${y + 1}" rx="5" ry="5.5" fill="${INK}"/><path d="M${x - 7} ${y - 9 - s * 3}l14 ${s * 6}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    wink: (x, y) => `<path d="M${x - 6} ${y}h12" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
  };
  const mouth = {
    smile: (x, y) => `<path d="M${x - 9} ${y - 2}q9 10 18 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    grin: (x, y) => `<path d="M${x - 11} ${y - 3}h22q-2 13-11 13t-11-13Z" fill="${INK}"/><path d="M${x - 6} ${y + 6}q6-5 12 0q-6 4-12 0Z" fill="#FF7A8A"/>`,
    laugh: (x, y) => `<path d="M${x - 13} ${y - 5}h26q-2 18-13 18t-13-18Z" fill="${INK}"/><path d="M${x - 7} ${y + 8}q7-6 14 0q-7 5-14 0Z" fill="#FF7A8A"/>`,
    frown: (x, y) => `<path d="M${x - 8} ${y + 4}q8-8 16 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    o: (x, y) => `<ellipse cx="${x}" cy="${y + 2}" rx="5.5" ry="7" fill="${INK}"/>`,
    small: (x, y) => `<path d="M${x - 4} ${y}q4 3 8 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    flat: (x, y) => `<path d="M${x - 7} ${y + 1}h14" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`,
    tongue: (x, y) => `<path d="M${x - 9} ${y - 2}q9 9 18 0" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M${x + 1} ${y + 2}q4 9 9 2" fill="#FF7A8A" stroke="${INK}" stroke-width="1.6"/>`,
    cat: (x, y) => `<path d="M${x} ${y - 3}c0 4-4 5-6 3M${x} ${y - 3}c0 4 4 5 6 3" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  };
  const cheeks = (y = 66) => `<ellipse cx="35" cy="${y}" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/><ellipse cx="85" cy="${y}" rx="6" ry="3.6" fill="#FF8FA3" opacity=".55"/>`;
  const heartAt = (x, y, s = 1, c = '#FF4D6A') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6C-7 2-9-2-7-5-5-8-1-7 0-4 1-7 5-8 7-5 9-2 7 2 0 6Z" fill="${c}"/>`;
  const sparkle = (x, y, s = 1, c = '#FFC83D') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-7C1-2 2-1 7 0 2 1 1 2 0 7-1 2-2 1-7 0-2-1-1-2 0-7Z" fill="${c}"/>`;
  const drop = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-6C3-1 4 1 4 3a4 4 0 0 1-8 0c0-2 1-4 4-9Z" fill="#7CC8FF"/>`;

  /* ---------- «Тиша»: облачко-талисман ---------- */
  const BODY = 'M60 20c25 0 44 16 44 38s-19 38-44 38c-6 0-12-1-18-3l-19 8 6-16C20 79 16 69 16 58c0-22 19-38 44-38Z';
  function tisha(face, extra = '', opts = {}) {
    const { tilt = 0, color = '#2FD98C', back = '' } = opts;
    return `${back}<g transform="rotate(${tilt} 60 60)"><path d="${BODY}" fill="${color}" stroke="#118A55" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 34c6-6 14-9 22-9" stroke="#B8F7D7" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>${face}</g>${extra}`;
  }
  const arm = (d) => `<path d="${d}" stroke="#118A55" stroke-width="9" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#2FD98C" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  const TISHA = {
    hi: { name: 'Привет', svg: () => tisha(eye.open(46, 52) + eye.open(74, 52) + mouth.grin(60, 68) + cheeks(),
      arm('M101 54c6-6 8-14 8-22') + '<path d="M106 18c3 2 5 5 6 9M113 24c2 1 3 3 3 5" stroke="#FFC83D" stroke-width="3" fill="none" stroke-linecap="round"/>') },
    ok: { name: 'Ок', svg: () => tisha(eye.wink(46, 52) + eye.open(74, 52) + mouth.smile(60, 68) + cheeks(),
      `<g transform="translate(98 66)"><rect x="-9" y="-2" width="18" height="16" rx="5" fill="#FFD6A5" stroke="${INK}" stroke-width="2.4"/><path d="M-4-2v-12a4 4 0 0 1 8 0v12" fill="#FFD6A5" stroke="${INK}" stroke-width="2.4"/></g>`) },
    love: { name: 'Люблю', svg: () => tisha(eye.heart(46, 52) + eye.heart(74, 52) + mouth.smile(60, 70) + cheeks(68),
      heartAt(100, 26, 1.1) + heartAt(18, 22, .8, '#FF8DB8') + heartAt(108, 50, .6)) },
    lol: { name: 'Ха-ха', svg: () => tisha(eye.happy(46, 50) + eye.happy(74, 50) + mouth.laugh(60, 66) + cheeks(62),
      drop(30, 50, .9) + drop(90, 50, .9), { tilt: -6 }) },
    sad: { name: 'Грустно', svg: () => tisha(eye.sad(46, 54, 1) + eye.sad(74, 54, -1) + mouth.frown(60, 72) + drop(40, 66, 1.1),
      '', { color: '#5FCFA0' }) },
    wow: { name: 'Ого', svg: () => tisha(eye.wide(46, 50) + eye.wide(74, 50) + mouth.o(60, 70),
      '<path d="M10 30l8 5M8 46h9M108 30l-8 5M110 46h-9" stroke="#FFC83D" stroke-width="3.4" stroke-linecap="round"/>' + drop(98, 26, .9)) },
    sleep: { name: 'Сплю', svg: () => tisha(eye.closed(46, 54) + eye.closed(74, 54) + mouth.small(60, 70) + cheeks(),
      `<g fill="none" stroke="#7CC8FF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M92 18h12l-12 12h12"/><path d="M104 38h8l-8 8h8"/></g>`, { tilt: 8 }) },
    angry: { name: 'Злюсь', svg: () => tisha(eye.angry(46, 54, 1) + eye.angry(74, 54, -1) + mouth.frown(60, 72),
      '<path d="M22 22c-4-4 2-8 0-12M98 22c4-4-2-8 0-12" stroke="#B8C4BE" stroke-width="4" fill="none" stroke-linecap="round"/>', { color: '#FF8A6B' }) },
    party: { name: 'Ура', svg: () => tisha(eye.happy(46, 54) + eye.happy(74, 54) + mouth.grin(60, 70) + cheeks(),
      sparkle(16, 30, 1, '#FF8DB8') + sparkle(106, 34, 1.2) + sparkle(98, 88, .8, '#7CC8FF') + '<rect x="12" y="66" width="6" height="3" rx="1" fill="#FFC83D" transform="rotate(30 15 67)"/><rect x="102" y="62" width="6" height="3" rx="1" fill="#FF4D6A" transform="rotate(-25 105 63)"/>',
      { back: '<path d="M60 4 74 26H46Z" fill="#FF4D6A" stroke="#B3203A" stroke-width="2.4" stroke-linejoin="round" transform="rotate(14 60 22)"/><circle cx="64" cy="4" r="4" fill="#FFC83D" transform="rotate(14 60 22)"/>' }) },
    think: { name: 'Хм…', svg: () => tisha(eye.open(46, 52) + `<path d="M68 52h12" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>` + mouth.flat(62, 70),
      arm('M40 92c4-6 10-14 16-16') + `<text x="98" y="34" font-family="Onest,Arial,sans-serif" font-weight="800" font-size="30" fill="#FFC83D" stroke="#C2861A" stroke-width="1">?</text>`) },
    cool: { name: 'Класс', svg: () => tisha(eye.star(46, 52) + eye.star(74, 52) + mouth.tongue(60, 68) + cheeks(),
      sparkle(104, 22, 1.1) + sparkle(14, 40, .8)) },
    thanks: { name: 'Спасибо', svg: () => tisha(eye.happy(46, 56) + eye.happy(74, 56) + mouth.smile(60, 72) + cheeks(70),
      heartAt(60, 8, 1) + heartAt(96, 20, .7, '#FF8DB8') + heartAt(24, 18, .7, '#FF8DB8'), { tilt: 10 }) },
  };

  /* ---------- «Котя» ---------- */
  function kot(face, extra = '', color = '#F2A65A') {
    return `<path d="M28 44 24 14l22 15ZM92 44l4-30-22 15Z" fill="${color}" stroke="#8A4A18" stroke-width="3" stroke-linejoin="round"/>
      <path d="M31 36l-1-13 9 7ZM89 36l1-13-9 7Z" fill="#FF8DB8"/>
      <ellipse cx="60" cy="66" rx="40" ry="36" fill="${color}" stroke="#8A4A18" stroke-width="3.4"/>
      <path d="M60 32c-4 6-4 10 0 12 4-2 4-6 0-12Z" fill="#B86A28" opacity=".55"/>
      <ellipse cx="60" cy="80" rx="18" ry="12" fill="#FFE3C2"/>
      <path d="M57 74h6l-3 3.5Z" fill="#FF8DB8"/>
      <path d="M16 72l18 2M16 80l18-1M104 72l-18 2M104 80l-18-1" stroke="#8A4A18" stroke-width="2" stroke-linecap="round" opacity=".7"/>
      ${face}${extra}`;
  }
  const KOT = {
    k_hi: { name: 'Мяу', svg: () => kot(eye.open(46, 62) + eye.open(74, 62) + mouth.cat(60, 80), sparkle(104, 24, 1)) },
    k_love: { name: 'Обожаю', svg: () => kot(eye.heart(46, 62) + eye.heart(74, 62) + mouth.cat(60, 80), heartAt(102, 24, 1) + heartAt(18, 26, .7, '#FF8DB8')) },
    k_lol: { name: 'Ржу', svg: () => kot(eye.happy(46, 60) + eye.happy(74, 60) + mouth.laugh(60, 82), drop(26, 60, .9) + drop(94, 60, .9)) },
    k_sad: { name: 'Печаль', svg: () => kot(eye.sad(46, 62, 1) + eye.sad(74, 62, -1) + mouth.frown(60, 84) + drop(40, 74, 1)) },
    k_wow: { name: 'Шок', svg: () => kot(eye.wide(46, 60) + eye.wide(74, 60) + mouth.o(60, 82), '<path d="M8 40l8 5M112 40l-8 5" stroke="#FFC83D" stroke-width="3.4" stroke-linecap="round"/>') },
    k_sleep: { name: 'Дремлю', svg: () => kot(eye.closed(46, 64) + eye.closed(74, 64) + mouth.cat(60, 80),
      '<g fill="none" stroke="#7CC8FF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M96 8h12l-12 12h12"/></g>') },
    k_angry: { name: 'Фрр', svg: () => kot(eye.angry(46, 62, 1) + eye.angry(74, 62, -1) + mouth.frown(60, 84), '', '#E58B4A') },
    k_cool: { name: 'Огонь', svg: () => kot(eye.star(46, 62) + eye.star(74, 62) + mouth.tongue(60, 80), sparkle(104, 22, 1.1)) },
  };

  const PACKS = [
    { id: 'tisha', name: 'Тиша', items: TISHA },
    { id: 'kotya', name: 'Котя', items: KOT },
  ];
  function svg(pack, id) {
    const p = PACKS.find((x) => x.id === pack);
    const it = p && p.items[id];
    if (!it) return null;
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="60" cy="112" rx="30" ry="4" fill="#000" opacity=".16"/>${it.svg()}</svg>`;
  }
  function el(pack, id) {
    const s = svg(pack, id);
    if (!s) return null;
    const t = document.createElement('template');
    t.innerHTML = s.trim();
    return t.content.firstChild;
  }
  const nameOf = (pack, id) => PACKS.find((x) => x.id === pack)?.items[id]?.name || 'Стикер';
  return { PACKS, svg, el, nameOf };
})();
