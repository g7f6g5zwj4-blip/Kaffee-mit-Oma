/*
 * Oma Hildegard's portrait, drawn as inline SVG.
 * All facial expressions live in the same SVG as separate layers;
 * switching an expression cross-fades the layers (see .expr in style.css).
 *
 * Expressions: appalled, disappointed, skeptical, pleased, proud, caring
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
    appalled: 'looks appalled',
    disappointed: 'looks disappointed',
    skeptical: 'looks skeptical',
    pleased: 'looks pleased',
    proud: 'is beaming with pride',
    caring: 'looks at you kindly'
  };

  const stroke = `stroke="${LINE}" stroke-linecap="round" stroke-linejoin="round"`;
  const brow = `fill="none" ${stroke} stroke-width="3.2"`;
  const line = `fill="none" ${stroke} stroke-width="3"`;

  const cheeks = (opacity) => `
      <ellipse cx="71" cy="114" rx="7.5" ry="4.5" fill="${CHEEK}" opacity="${opacity}"/>
      <ellipse cx="129" cy="114" rx="7.5" ry="4.5" fill="${CHEEK}" opacity="${opacity}"/>`;

  const EXPRESSION_LAYERS = {
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

    skeptical: `
      <path d="M70 76 Q81 67 92 75" ${brow}/>
      <path d="M108 83 L130 79" ${brow}/>
      <circle cx="82" cy="96" r="3.2" fill="${LINE}"/>
      <circle cx="83" cy="95" r="1" fill="#fff"/>
      <path d="M112 97 L124 96" ${line}/>
      <path d="M91 125 Q98 127 110 121" ${line}/>`,

    pleased: `
      <path d="M72 80 Q81 75 90 79" ${brow}/>
      <path d="M110 79 Q119 75 128 80" ${brow}/>
      <circle cx="82" cy="96" r="3.3" fill="${LINE}"/>
      <circle cx="83.2" cy="94.8" r="1.1" fill="#fff"/>
      <circle cx="118" cy="96" r="3.3" fill="${LINE}"/>
      <circle cx="119.2" cy="94.8" r="1.1" fill="#fff"/>
      <path d="M89 120 Q100 130 111 120" ${line}/>
      ${cheeks(0.55)}`,

    proud: `
      <path d="M71 77 Q81 70 91 76" ${brow}/>
      <path d="M109 76 Q119 70 129 77" ${brow}/>
      <path d="M76 98 Q82 90 88 98" ${line}/>
      <path d="M112 98 Q118 90 124 98" ${line}/>
      <path d="M87 118 Q100 137 113 118 Z" fill="#8a3a3a" ${stroke} stroke-width="2.5"/>
      <ellipse cx="100" cy="125" rx="5" ry="2.4" fill="#e58b86"/>
      ${cheeks(0.75)}
      <path d="M152 50 L154.5 57.5 L162 60 L154.5 62.5 L152 70 L149.5 62.5 L142 60 L149.5 57.5 Z" fill="#f2c14e" stroke="#c9952a" stroke-width="1"/>
      <path d="M46 62 L47.8 67.2 L53 69 L47.8 70.8 L46 76 L44.2 70.8 L39 69 L44.2 67.2 Z" fill="#f2c14e" stroke="#c9952a" stroke-width="1"/>`,

    caring: `
      <path d="M72 80 Q82 75 91 78" ${brow}/>
      <path d="M109 78 Q118 75 128 80" ${brow}/>
      <path d="M76 96 Q82 100.5 88 96" ${line}/>
      <path d="M112 96 Q118 100.5 124 96" ${line}/>
      <path d="M93 122 Q100 126.5 107 122" ${line}/>
      ${cheeks(0.45)}
      <path d="M150 74 C150 69 143 67 143 73 C143 77 150 81 150 81 C150 81 157 77 157 73 C157 67 150 69 150 74 Z" fill="#d77f7f" opacity="0.9"/>`
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

      <!-- face -->
      <ellipse cx="100" cy="98" rx="42" ry="46" fill="${SKIN}" ${stroke} stroke-width="2.5"/>
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

  /** Switch Oma's face. Layers cross-fade, and she gives a little bounce. */
  function setExpression(name) {
    if (!root || !EXPRESSION_LAYERS[name]) return;
    const svg = root.querySelector('.oma-svg');
    if (!svg || svg.dataset.expression === name) return;

    svg.dataset.expression = name;
    svg.querySelectorAll('.expr').forEach((g) => {
      g.classList.toggle('is-active', g.dataset.expr === name);
    });
    const title = svg.querySelector('title');
    if (title) title.textContent = `Oma Hildegard ${LABELS[name]}`;

    svg.classList.remove('pop');
    void svg.getBoundingClientRect(); // restart the animation
    svg.classList.add('pop');
  }

  return { mount, setExpression, expressions: Object.keys(EXPRESSION_LAYERS) };
})();
