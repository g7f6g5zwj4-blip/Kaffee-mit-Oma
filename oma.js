/*
 * Oma Hildegard's portrait, drawn as inline SVG.
 * All facial expressions live in the same SVG as separate layers;
 * switching an expression cross-fades the layers (see .expr in style.css).
 *
 * One expression per 10 approval points, from angriest to happiest:
 *   fuming, furious, appalled, disappointed, unimpressed, skeptical,
 *   warming, pleased, delighted, proud, beaming
 * Plus "caring" for serious, kind mode.
 */
const Oma = (function () {
  'use strict';

  const LINE = '#5b3a29';
  const SKIN = '#f6d3b5';
  const SKIN_SHADE = '#ecbf9c';
  const HAIR = '#dcd7d1';
  const HAIR_BACK = '#cdc8c2';
  const CHEEK = '#ee9c94';

  const LABELS = {
    fuming: 'is red in the face and fuming',
    furious: 'looks furious',
    appalled: 'looks appalled',
    disappointed: 'looks disappointed',
    unimpressed: 'looks unimpressed',
    skeptical: 'looks skeptical',
    warming: 'is warming up to you',
    pleased: 'looks pleased',
    delighted: 'looks delighted',
    proud: 'is beaming with pride',
    beaming: 'is overflowing with pride and love',
    caring: 'looks at you kindly'
  };

  // How red her face turns (0 = normal skin).
  const FLUSH = { fuming: 0.6, furious: 0.38, appalled: 0.14 };

  const stroke = `stroke="${LINE}" stroke-linecap="round" stroke-linejoin="round"`;
  const brow = `fill="none" ${stroke} stroke-width="3.2"`;
  const angryBrow = `fill="none" ${stroke} stroke-width="4"`;
  const line = `fill="none" ${stroke} stroke-width="3"`;

  const cheeks = (opacity) => `
      <ellipse cx="71" cy="114" rx="7.5" ry="4.5" fill="${CHEEK}" opacity="${opacity}"/>
      <ellipse cx="129" cy="114" rx="7.5" ry="4.5" fill="${CHEEK}" opacity="${opacity}"/>`;

  const dotEyes = (r) => `
      <circle cx="82" cy="96" r="${r}" fill="${LINE}"/>
      <circle cx="83.2" cy="94.8" r="1.1" fill="#fff"/>
      <circle cx="118" cy="96" r="${r}" fill="${LINE}"/>
      <circle cx="119.2" cy="94.8" r="1.1" fill="#fff"/>`;

  const happyEyes = `
      <path d="M76 98 Q82 90 88 98" ${line}/>
      <path d="M112 98 Q118 90 124 98" ${line}/>`;

  // The position lives on the wrapper <g>, so the CSS float animation on the <path>
  // can't override it (a CSS transform replaces an SVG transform attribute).
  const heart = (x, y, size, color) => {
    const s = size / 10;
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -3 C0 -8 -8 -9 -8 -3 C-8 2 0 7 0 7 C0 7 8 2 8 -3 C8 -9 0 -8 0 -3 Z" fill="${color}"/></g>`;
  };

  const sparkle = (x, y, r) => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z" fill="#f2c14e" stroke="#c9952a" stroke-width="1"/>`;

  // The cartoon "anger vein" on her forehead.
  const angerMark = `
      <g stroke="#c0392b" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d="M130 64 q4 0 4 -4"/><path d="M138 60 q0 4 4 4"/>
        <path d="M142 68 q-4 0 -4 4"/><path d="M134 72 q0 -4 -4 -4"/>
      </g>`;

  const EXPRESSION_LAYERS = {
    fuming: `
      <path d="M70 75 L93 85" ${angryBrow}/>
      <path d="M107 85 L130 75" ${angryBrow}/>
      <path d="M75 93 L89 97" ${line}/>
      <circle cx="84" cy="99.5" r="2.5" fill="${LINE}"/>
      <path d="M111 97 L125 93" ${line}/>
      <circle cx="116" cy="99.5" r="2.5" fill="${LINE}"/>
      <rect x="85" y="118" width="30" height="12" rx="3" fill="#fff" ${stroke} stroke-width="2.5"/>
      <path d="M85 124 L115 124 M92.5 118 L92.5 130 M100 118 L100 130 M107.5 118 L107.5 130" stroke="${LINE}" stroke-width="1.5"/>
      ${angerMark}
      <g class="steam">
        <circle cx="46" cy="80" r="7" fill="#fff" stroke="#cfc8c0" stroke-width="1.5"/>
        <circle cx="38" cy="66" r="5.5" fill="#fff" stroke="#cfc8c0" stroke-width="1.5"/>
        <circle cx="154" cy="80" r="7" fill="#fff" stroke="#cfc8c0" stroke-width="1.5"/>
        <circle cx="162" cy="66" r="5.5" fill="#fff" stroke="#cfc8c0" stroke-width="1.5"/>
      </g>`,

    furious: `
      <path d="M71 77 L92 83" ${angryBrow}/>
      <path d="M108 83 L129 77" ${angryBrow}/>
      <path d="M76 93 L88 95.5" ${line} stroke-width="2.6"/>
      <circle cx="83" cy="98.5" r="2.7" fill="${LINE}"/>
      <path d="M112 95.5 L124 93" ${line} stroke-width="2.6"/>
      <circle cx="117" cy="98.5" r="2.7" fill="${LINE}"/>
      <path d="M88 128 Q100 117 112 128" ${line} stroke-width="3.6"/>
      ${angerMark}`,

    appalled: `
      <path d="M70 76 Q81 66 92 74" ${brow}/>
      <path d="M108 74 Q119 66 130 76" ${brow}/>
      <circle cx="82" cy="96" r="6" fill="#fff" stroke="${LINE}" stroke-width="2"/>
      <circle cx="82" cy="97" r="2.4" fill="${LINE}"/>
      <circle cx="118" cy="96" r="6" fill="#fff" stroke="${LINE}" stroke-width="2"/>
      <circle cx="118" cy="97" r="2.4" fill="${LINE}"/>
      <ellipse cx="100" cy="126" rx="7" ry="9" fill="#7a3434" ${stroke} stroke-width="2.5"/>
      <path d="M147 68 Q153 77 147 82 Q141 77 147 68 Z" fill="#b8dcec" stroke="#5b8fa8" stroke-width="1.5"/>
      <path d="M151 50 l7 -7 M157 60 l9 -2 M49 50 l-7 -7 M43 60 l-9 -2" ${line} stroke-width="2.4"/>`,

    disappointed: `
      <path d="M71 81 L91 76" ${brow}/>
      <path d="M109 76 L129 81" ${brow}/>
      <path d="M75 95 L89 95" ${line} stroke-width="2.6"/>
      <path d="M77 96 Q82 101.5 87 96 Z" fill="${LINE}"/>
      <path d="M111 95 L125 95" ${line} stroke-width="2.6"/>
      <path d="M113 96 Q118 101.5 123 96 Z" fill="${LINE}"/>
      <path d="M89 128 Q100 119 111 128" ${line}/>
      <path d="M118 133 q4 -3 8 0 q4 -3 8 1" fill="none" stroke="#b9a99a" stroke-width="2" stroke-linecap="round"/>`,

    unimpressed: `
      <path d="M72 81 L91 81" ${brow}/>
      <path d="M109 81 L128 81" ${brow}/>
      <circle cx="82" cy="96" r="5" fill="#fff" stroke="${LINE}" stroke-width="1.8"/>
      <circle cx="82" cy="92.6" r="2.3" fill="${LINE}"/>
      <circle cx="118" cy="96" r="5" fill="#fff" stroke="${LINE}" stroke-width="1.8"/>
      <circle cx="118" cy="92.6" r="2.3" fill="${LINE}"/>
      <path d="M90 125 L108 123" ${line}/>`,

    skeptical: `
      <path d="M70 76 Q81 67 92 75" ${brow}/>
      <path d="M108 83 L130 79" ${brow}/>
      <circle cx="82" cy="96" r="3.2" fill="${LINE}"/>
      <circle cx="83" cy="95" r="1" fill="#fff"/>
      <path d="M112 97 L124 96" ${line}/>
      <path d="M91 125 Q98 127 110 121" ${line}/>`,

    warming: `
      <path d="M72 79 Q81 77 90 79" ${brow}/>
      <path d="M110 79 Q119 77 128 79" ${brow}/>
      ${dotEyes(3)}
      <path d="M93 124 Q101 126 108 121" ${line}/>`,

    pleased: `
      <path d="M72 80 Q81 75 90 79" ${brow}/>
      <path d="M110 79 Q119 75 128 80" ${brow}/>
      ${dotEyes(3.3)}
      <path d="M89 120 Q100 130 111 120" ${line}/>
      ${cheeks(0.55)}`,

    delighted: `
      <path d="M72 78 Q81 72 90 77" ${brow}/>
      <path d="M110 77 Q119 72 128 78" ${brow}/>
      ${happyEyes}
      <path d="M87 119 Q100 133 113 119" ${line}/>
      ${cheeks(0.65)}`,

    proud: `
      <path d="M71 77 Q81 70 91 76" ${brow}/>
      <path d="M109 76 Q119 70 129 77" ${brow}/>
      ${happyEyes}
      <path d="M87 118 Q100 137 113 118 Z" fill="#8a3a3a" ${stroke} stroke-width="2.5"/>
      <ellipse cx="100" cy="125" rx="5" ry="2.4" fill="#e58b86"/>
      ${cheeks(0.75)}
      ${sparkle(152, 60, 9)}
      ${sparkle(46, 69, 7)}`,

    beaming: `
      <path d="M71 76 Q81 68 91 75" ${brow}/>
      <path d="M109 75 Q119 68 129 76" ${brow}/>
      ${happyEyes}
      <path d="M76 103 q-2 5 1 7" fill="none" stroke="#8ec5df" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M124 103 q2 5 -1 7" fill="none" stroke="#8ec5df" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M85 116 Q100 141 115 116 Z" fill="#8a3a3a" ${stroke} stroke-width="2.5"/>
      <ellipse cx="100" cy="127" rx="6" ry="2.8" fill="#e58b86"/>
      ${cheeks(0.85)}
      <g class="hearts">
        ${heart(152, 58, 12, '#d75f5f')}
        ${heart(44, 66, 10, '#e07b7b')}
        ${heart(160, 88, 8, '#e07b7b')}
        ${heart(38, 92, 7, '#d75f5f')}
      </g>
      ${sparkle(140, 40, 6)}`,

    caring: `
      <path d="M72 80 Q82 75 91 78" ${brow}/>
      <path d="M109 78 Q118 75 128 80" ${brow}/>
      <path d="M76 96 Q82 100.5 88 96" ${line}/>
      <path d="M112 96 Q118 100.5 124 96" ${line}/>
      <path d="M93 122 Q100 126.5 107 122" ${line}/>
      ${cheeks(0.45)}
      ${heart(150, 74, 9, '#d77f7f')}`
  };

  function buildSvg(initial) {
    const layers = Object.keys(EXPRESSION_LAYERS).map((name) =>
      `<g class="expr${name === initial ? ' is-active' : ''}" data-expr="${name}">${EXPRESSION_LAYERS[name]}</g>`
    ).join('');

    return `
<svg class="oma-svg" viewBox="0 0 200 200" role="img" aria-labelledby="oma-svg-title" data-expression="${initial}">
  <title id="oma-svg-title">Oma Hildegard ${LABELS[initial]}</title>
  <defs>
    <clipPath id="oma-clip"><circle cx="100" cy="100" r="89"/></clipPath>
    <radialGradient id="oma-bg" cx="35%" cy="25%" r="85%">
      <stop offset="0" stop-color="#fff1d6"/>
      <stop offset="1" stop-color="#e5c6a6"/>
    </radialGradient>
    <pattern id="oma-blouse" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#fbf1e2"/>
      <circle cx="3" cy="3" r="2" fill="#e3a3a0"/>
      <circle cx="9" cy="9" r="1.7" fill="#d98c8c"/>
      <circle cx="9.5" cy="3.2" r="1" fill="#9fb592"/>
      <circle cx="3.2" cy="9.4" r="0.9" fill="#9fb592"/>
    </pattern>
    <pattern id="oma-knit" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#86a07c"/>
      <path d="M0 1 L4 5 L8 1 M0 5 L4 9 L8 5" stroke="#748e6a" stroke-width="1.2" fill="none"/>
    </pattern>
    <pattern id="oma-wallpaper" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="2.2" fill="#e2b3a5" opacity="0.6"/>
      <circle cx="16" cy="16" r="1.6" fill="#a9bb9c" opacity="0.6"/>
    </pattern>
  </defs>

  <!-- wooden oval frame -->
  <circle cx="100" cy="100" r="97" fill="#8a5a3b" stroke="#4a2e20" stroke-width="3"/>
  <circle cx="100" cy="100" r="93" fill="none" stroke="#a8754f" stroke-width="3" stroke-dasharray="1 6" stroke-linecap="round"/>
  <circle cx="100" cy="100" r="89" fill="url(#oma-bg)"/>

  <g clip-path="url(#oma-clip)">
    <rect x="0" y="0" width="200" height="200" fill="url(#oma-wallpaper)"/>
    <g class="oma-figure">
      <!-- bun and back hair -->
      <circle cx="100" cy="36" r="17" fill="${HAIR}" ${stroke} stroke-width="2.5"/>
      <path d="M90 35 Q100 25 110 35 Q101 41 94 37" fill="none" stroke="#aaa49d" stroke-width="2" stroke-linecap="round"/>
      <path d="M112 26 L121 20" stroke="#c99a3e" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="100" cy="92" rx="54" ry="52" fill="${HAIR_BACK}" ${stroke} stroke-width="2.5"/>

      <!-- cardigan, neck, blouse -->
      <path d="M22 212 C24 168 56 150 100 150 C144 150 176 168 178 212 Z" fill="url(#oma-knit)" ${stroke} stroke-width="2.5"/>
      <path d="M86 124 L86 152 Q100 160 114 152 L114 124 Z" fill="${SKIN_SHADE}" ${stroke} stroke-width="2"/>
      <path d="M79 151 L100 196 L121 151 Z" fill="url(#oma-blouse)" ${stroke} stroke-width="2"/>
      <path d="M100 157 L79 148 L83 166 Z" fill="#fffaf0" ${stroke} stroke-width="2"/>
      <path d="M100 157 L121 148 L117 166 Z" fill="#fffaf0" ${stroke} stroke-width="2"/>
      <circle cx="85" cy="181" r="2.6" fill="#f3e6cf" ${stroke} stroke-width="1.2"/>
      <circle cx="90" cy="195" r="2.6" fill="#f3e6cf" ${stroke} stroke-width="1.2"/>
      <!-- brooch -->
      <circle cx="134" cy="170" r="6.5" fill="#e2b04a" ${stroke} stroke-width="2"/>
      <circle cx="134" cy="170" r="2.8" fill="#b5413c"/>

      <!-- ears with pearl earrings -->
      <ellipse cx="58" cy="102" rx="7" ry="10" fill="#f2c6a5" ${stroke} stroke-width="2.5"/>
      <ellipse cx="142" cy="102" rx="7" ry="10" fill="#f2c6a5" ${stroke} stroke-width="2.5"/>
      <circle cx="58" cy="114" r="2.8" fill="#fffaf0" stroke="#bfb3a3" stroke-width="1"/>
      <circle cx="142" cy="114" r="2.8" fill="#fffaf0" stroke="#bfb3a3" stroke-width="1"/>

      <!-- face, and the red flush that fades in when she gets angry -->
      <ellipse cx="100" cy="98" rx="42" ry="46" fill="${SKIN}" ${stroke} stroke-width="2.5"/>
      <ellipse class="oma-flush" cx="100" cy="100" rx="40.5" ry="43.5" fill="#e0503c" style="opacity:${FLUSH[initial] || 0}"/>
      <path d="M66 91 L61 89 M66 97 L61 98 M134 91 L139 89 M134 97 L139 98" stroke="#d9a88a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M100 98 Q96 109 100 112 Q104 113 106 110" fill="none" stroke="#c98e6e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- front hair with a middle part and waves -->
      <path d="M57 96 C52 60 78 44 100 46 C122 44 148 60 143 96 C138 78 125 66 112 68 C107 61 93 61 88 68 C75 66 62 78 57 96 Z" fill="${HAIR}" ${stroke} stroke-width="2.5"/>
      <path d="M68 74 Q76 60 90 57" fill="none" stroke="#f4f1ed" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M118 58 Q128 62 133 70" fill="none" stroke="#b9b3ac" stroke-width="1.8" stroke-linecap="round"/>

      <!-- expressions (eyes, brows, mouth, extras) -->
      ${layers}

      <!-- glasses on top -->
      <g fill="rgba(255,255,255,0.22)" stroke="#7a4b2f" stroke-width="2.6">
        <circle cx="82" cy="96" r="13"/>
        <circle cx="118" cy="96" r="13"/>
      </g>
      <path d="M95 94 Q100 89.5 105 94" fill="none" stroke="#7a4b2f" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M69 93 L59 96 M131 93 L141 96" stroke="#7a4b2f" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M74 89 Q77 85.5 82 85" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
      <path d="M110 89 Q113 85.5 118 85" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
      <!-- glasses chain -->
      <path d="M59 97 Q54 128 64 152" fill="none" stroke="#d4a845" stroke-width="2" stroke-dasharray="0.5 4" stroke-linecap="round"/>
      <path d="M141 97 Q146 128 136 152" fill="none" stroke="#d4a845" stroke-width="2" stroke-dasharray="0.5 4" stroke-linecap="round"/>
    </g>
  </g>

  <circle cx="100" cy="100" r="89" fill="none" stroke="#c99a6b" stroke-width="2.5"/>
</svg>`;
  }

  let root = null;

  /** Draw Oma into a container element. */
  function mount(container, initial) {
    root = container;
    root.innerHTML = buildSvg(initial && EXPRESSION_LAYERS[initial] ? initial : 'disappointed');
  }

  /** Switch Oma's face. Layers cross-fade, her face flushes red when angry, and she gives a little bounce. */
  function setExpression(name) {
    if (!root || !EXPRESSION_LAYERS[name]) return;
    const svg = root.querySelector('.oma-svg');
    if (!svg || svg.dataset.expression === name) return;

    svg.dataset.expression = name;
    svg.querySelectorAll('.expr').forEach((g) => {
      g.classList.toggle('is-active', g.dataset.expr === name);
    });
    const flush = svg.querySelector('.oma-flush');
    if (flush) flush.style.opacity = String(FLUSH[name] || 0);
    const title = svg.querySelector('title');
    if (title) title.textContent = `Oma Hildegard ${LABELS[name]}`;

    svg.classList.remove('pop');
    void svg.getBoundingClientRect(); // restart the animation
    svg.classList.add('pop');
  }

  return { mount, setExpression, expressions: Object.keys(EXPRESSION_LAYERS) };
})();
