'use strict';
/* Графика подарков «Тихо»: 10 предметов, цветовые модели, фоны и узоры. Всё рисуется в SVG. */
const TihoGifts = (() => {
  // Цвета предмета: a — основной, b — тень, c — блик, d — акцент
  const MODELS = {
    'Изумруд': ['#2FD98C', '#128A55', '#B4F7D6', '#FFD66B'],
    'Мята': ['#7EE8C4', '#2E9E7E', '#E0FFF4', '#FF9EC7'],
    'Сапфир': ['#4C8DFF', '#2350B8', '#C7DBFF', '#FFD66B'],
    'Рубин': ['#FF4D6A', '#B3203A', '#FFC7D0', '#FFD66B'],
    'Аметист': ['#A970FF', '#6B3CC4', '#E6D4FF', '#7EF0D0'],
    'Золото': ['#FFC83D', '#C2861A', '#FFF2C2', '#FF7A59'],
    'Неон': ['#39FF88', '#00A6C8', '#E6FFF1', '#FF3DF0'],
    'Полночь': ['#3A4668', '#151B2E', '#8C9CC4', '#9BE7FF'],
  };
  const BASE = {
    heart: ['#FF4D6A', '#B3203A', '#FFC7D0', '#FFD66B'],
    star: ['#FFC83D', '#C2861A', '#FFF2C2', '#FF7A59'],
    flower: ['#FF8DB8', '#C24A7C', '#FFE0EC', '#FFD34D'],
    cake: ['#FF9EBF', '#C95F86', '#FFF4E3', '#FFD34D'],
    box: ['#2FD98C', '#128A55', '#B4F7D6', '#FFC83D'],
    cat: ['#F2A65A', '#B86A28', '#FFE3C2', '#FF8DB8'],
    rocket: ['#E9EEF5', '#9AA7B8', '#FFFFFF', '#FF5A5A'],
    trophy: ['#FFC83D', '#C2861A', '#FFF2C2', '#FF7A59'],
    gem: ['#5EE3F0', '#1E8FB0', '#E3FBFF', '#B48CFF'],
    crown: ['#FFC83D', '#C2861A', '#FFF2C2', '#FF4D6A'],
  };
  const BACKDROPS = {
    'Лес': ['#2A7A55', '#0B2418'], 'Океан': ['#2A78AE', '#0B2033'], 'Закат': ['#F08A55', '#5A1F3A'],
    'Графит': ['#4A525B', '#15181C'], 'Сирень': ['#8D6BCB', '#2B1E47'], 'Песок': ['#E2C38A', '#6B5230'],
    'Изумрудная ночь': ['#139167', '#03140D'], 'Северное сияние': ['#35E39A', '#3B1E6B'],
  };
  const SYM = {
    'Звёзды': 'M0-5 1.5-1.5 5-1.5 2.2.8 3.2 4.5 0 2.3-3.2 4.5-2.2.8-5-1.5-1.5-1.5Z',
    'Листья': 'M-4 4C-4-2 0-5 5-5 5 0 2 4-4 4Z',
    'Сердца': 'M0 4.5C-4.5 1.5-5-1.5-3.2-3.3-1.8-4.6 0-3.6 0-2.4 0-3.6 1.8-4.6 3.2-3.3 5-1.5 4.5 1.5 0 4.5Z',
    'Молнии': 'M1-5-3 1h2.5L-1 5 3-1H.5Z',
    'Искры': 'M0-5C.6-1.2 1.2-.6 5 0 1.2.6.6 1.2 0 5-.6 1.2-1.2.6-5 0-1.2-.6-.6-1.2 0-5Z',
    'Луны': 'M2-4.5A4.8 4.8 0 1 0 2 4.5 3.8 3.8 0 1 1 2-4.5Z',
    'Короны': 'M-5 3-4-3-1.5 0 0-4 1.5 0 4-3 5 3Z',
    'Ключи': 'M-1.5-1A2.8 2.8 0 1 1-1.5 1L4 1V3H2.5V1.6',
  };
  const SPOTS = [[16, 18, 1.1, -15], [84, 20, .9, 20], [12, 54, .8, 10], [88, 56, 1, -20], [20, 86, .9, 25], [80, 86, 1.1, -10], [50, 10, .7, 0], [50, 92, .7, 0]];

  const OBJ = {
    heart: ([a, b, c]) => `<path d="M50 82C21 63 14 47 22 34c8-12 23-10 28 2 5-12 20-14 28-2 8 13 1 29-28 48Z" fill="${a}"/>
      <path d="M50 82C70 68 82 55 80 42c-3 10-14 23-30 34Z" fill="${b}" opacity=".45"/>
      <ellipse cx="33" cy="38" rx="8" ry="4.5" fill="${c}" opacity=".75" transform="rotate(-35 33 38)"/>`,
    star: ([a, b, c]) => `<path d="M50 14l10.6 22 24 3.3-17.4 16.6 4.3 23.8L50 68.4 28.5 79.7l4.3-23.8L15.4 39.3l24-3.3Z" fill="${a}" stroke="${b}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 27l6 12.5 13.6 1.9-9.9 9.4 2.4 13.5L50 57.9" fill="${c}" opacity=".5"/>`,
    flower: ([a, b, c, d]) => `<path d="M50 60c0 14 0 22 1 28" stroke="#2E9E6A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="62" cy="78" rx="9" ry="4.5" fill="#3BC07F" transform="rotate(-30 62 78)"/>
      ${[0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="50" cy="28" rx="10" ry="15" fill="${a}" transform="rotate(${r} 50 44)"/>`).join('')}
      ${[30, 150, 270].map((r) => `<ellipse cx="50" cy="30" rx="4" ry="8" fill="${c}" opacity=".55" transform="rotate(${r} 50 44)"/>`).join('')}
      <circle cx="50" cy="44" r="10" fill="${d}"/><circle cx="47" cy="41" r="3" fill="#fff" opacity=".6"/>
      <circle cx="50" cy="44" r="10" fill="none" stroke="${b}" stroke-width="2" opacity=".5"/>`,
    cake: ([a, b, c, d]) => `<ellipse cx="50" cy="80" rx="34" ry="6" fill="${b}" opacity=".6"/>
      <rect x="22" y="52" width="56" height="26" rx="6" fill="${a}"/>
      <rect x="22" y="64" width="56" height="5" fill="${b}" opacity=".35"/>
      <path d="M22 56c0-6 4-8 8-8h40c4 0 8 2 8 8v2c-3 0-4 4-7 4s-4-4-7-4-4 5-7 5-4-5-7-5-4 4-7 4-4-4-7-4-4 4-7 4-4-4-7-4Z" fill="${c}"/>
      <rect x="47" y="32" width="6" height="18" rx="2" fill="${d}"/>
      <path d="M50 20c4 4 4 8 0 10-4-2-4-6 0-10Z" fill="#FFB347"/><path d="M50 24c2 2 2 4 0 5-2-1-2-3 0-5Z" fill="#FFF2B0"/>`,
    box: ([a, b, c, d]) => `<rect x="24" y="46" width="52" height="36" rx="5" fill="${a}"/>
      <rect x="24" y="46" width="52" height="8" fill="${b}" opacity=".4"/>
      <rect x="20" y="38" width="60" height="12" rx="4" fill="${a}"/><rect x="20" y="38" width="60" height="4" rx="2" fill="${c}" opacity=".6"/>
      <rect x="45" y="38" width="10" height="44" fill="${d}"/>
      <path d="M50 38c-6-12-20-14-20-6 0 6 10 7 20 6Z" fill="${d}"/><path d="M50 38c6-12 20-14 20-6 0 6-10 7-20 6Z" fill="${d}"/>
      <path d="M50 38c-5-8-13-9-14-5" stroke="${b}" stroke-width="1.5" fill="none" opacity=".5"/>`,
    cat: ([a, b, c, d]) => `<path d="M27 40 24 16l18 12ZM73 40l3-24-18 12Z" fill="${a}"/>
      <path d="M29 34 28 22l8 6ZM71 34l1-12-8 6Z" fill="${d}" opacity=".8"/>
      <circle cx="50" cy="54" r="27" fill="${a}"/>
      <path d="M50 27c-4 6-4 10 0 12 4-2 4-6 0-12ZM38 30c-2 5-1 8 2 9M62 30c2 5 1 8-2 9" fill="none" stroke="${b}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>
      <ellipse cx="50" cy="64" rx="14" ry="10" fill="${c}"/>
      <ellipse cx="39" cy="51" rx="5" ry="6.5" fill="#10201A"/><ellipse cx="61" cy="51" rx="5" ry="6.5" fill="#10201A"/>
      <circle cx="40.5" cy="48.5" r="2" fill="#fff"/><circle cx="62.5" cy="48.5" r="2" fill="#fff"/>
      <path d="M46.5 60h7L50 64Z" fill="${d}"/><path d="M50 64c0 3-3 4-5 3M50 64c0 3 3 4 5 3" stroke="#10201A" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M22 60l14 2M22 66l14-1M78 60l-14 2M78 66l-14-1" stroke="${b}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`,
    rocket: ([a, b, c, d]) => `<path d="M42 72c-2 8 2 14 8 18 6-4 10-10 8-18Z" fill="#FFB347"/><path d="M46 72c-1 5 1 9 4 11 3-2 5-6 4-11Z" fill="#FFF2B0"/>
      <path d="M38 58 26 70l2 6 12-6ZM62 58l12 12-2 6-12-6Z" fill="${d}"/>
      <path d="M50 12c14 10 18 28 14 52H36c-4-24 0-42 14-52Z" fill="${a}"/>
      <path d="M50 12c14 10 18 28 14 52h-8c3-22 0-38-6-52Z" fill="${b}" opacity=".45"/>
      <path d="M44 20c-4 8-5 18-4 30" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
      <circle cx="50" cy="40" r="8" fill="#163A5C" stroke="${d}" stroke-width="3"/><circle cx="47.5" cy="37.5" r="2.5" fill="#9BE7FF"/>
      <rect x="36" y="62" width="28" height="6" rx="3" fill="${d}"/>`,
    trophy: ([a, b, c]) => `<path d="M30 26c-12 0-14 18 4 24M70 26c12 0 14 18-4 24" stroke="${a}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M28 18h44c0 26-8 38-22 40-14-2-22-14-22-40Z" fill="${a}"/>
      <path d="M58 18h14c0 26-8 38-22 40 6-6 9-18 8-40Z" fill="${b}" opacity=".45"/>
      <path d="M36 24c0 12 3 20 8 26" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="45" y="57" width="10" height="12" fill="${b}"/>
      <rect x="32" y="68" width="36" height="8" rx="2" fill="${a}"/><rect x="28" y="76" width="44" height="8" rx="3" fill="${b}"/>
      <path d="M50 28l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" fill="${c}" opacity=".9"/>`,
    gem: ([a, b, c, d]) => `<path d="M30 24h40l14 16-34 44-34-44Z" fill="${a}"/>
      <path d="M16 40h68L50 84Z" fill="${b}" opacity=".55"/>
      <path d="M30 24l8 16h24l8-16Z" fill="${c}" opacity=".75"/>
      <path d="M38 40 50 84 62 40Z" fill="${a}"/><path d="M38 40l12 44" stroke="${c}" stroke-width="1.5" opacity=".6"/>
      <path d="M30 24 16 40h22ZM70 24l14 16H62Z" fill="${d}" opacity=".35"/>
      <path d="M30 24h40l14 16-34 44-34-44Z" fill="none" stroke="#fff" stroke-width="1.5" opacity=".5" stroke-linejoin="round"/>
      <path d="M36 28l3 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    crown: ([a, b, c, d]) => `<path d="M18 36l14 14 18-26 18 26 14-14-6 36H24Z" fill="${a}"/>
      <path d="M50 24l18 26 14-14-6 36H58c4-14 2-34-8-48Z" fill="${b}" opacity=".4"/>
      <rect x="22" y="70" width="56" height="12" rx="3" fill="${b}"/><rect x="22" y="70" width="56" height="4" rx="2" fill="${c}" opacity=".5"/>
      <circle cx="18" cy="35" r="5" fill="${a}"/><circle cx="50" cy="22" r="6" fill="${a}"/><circle cx="82" cy="35" r="5" fill="${a}"/>
      <circle cx="50" cy="58" r="6" fill="${d}"/><circle cx="34" cy="62" r="4" fill="${d}"/><circle cx="66" cy="62" r="4" fill="${d}"/>
      <circle cx="48" cy="56" r="2" fill="#fff" opacity=".7"/>
      <path d="M28 44l6 6" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  };

  let uid = 0;
  /* opts: { model, backdrop, symbol } — имена атрибутов коллекционного подарка */
  function svg(type, opts = {}) {
    const id = 'g' + (++uid);
    const colors = (opts.model && MODELS[opts.model]) || BASE[type] || BASE.box;
    const draw = OBJ[type] || OBJ.box;
    let bg = '';
    if (opts.backdrop) {
      const [c1, c2] = BACKDROPS[opts.backdrop] || BACKDROPS['Лес'];
      bg = `<defs><radialGradient id="${id}" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs><rect width="100" height="100" fill="url(#${id})"/>`;
    }
    const sym = opts.symbol && SYM[opts.symbol]
      ? SPOTS.map(([x, y, s, r]) => `<path d="${SYM[opts.symbol]}" transform="translate(${x} ${y}) rotate(${r}) scale(${s})" fill="#fff" opacity=".22"/>`).join('') : '';
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${bg}${sym}<ellipse cx="50" cy="90" rx="24" ry="4" fill="#000" opacity=".18"/><g>${draw(colors)}</g></svg>`;
  }
  function el(type, opts) {
    const t = document.createElement('template');
    t.innerHTML = svg(type, opts).trim();
    return t.content.firstChild;
  }
  return { svg, el, MODELS, BACKDROPS, SYM };
})();
