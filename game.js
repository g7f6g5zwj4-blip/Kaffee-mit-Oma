/*
 * "Where are my glasses?" - a hidden object mini game in Oma's living room.
 *
 * Find Oma's glasses, the TV remote and her old button phone in 45 seconds.
 * - Never calls the OpenAI API.
 * - Never changes the approval meter or the chat's message count.
 * - After a win, Oma posts a short fixed thank-you note in the chat (max 3 per visit).
 *
 * Desktop (1280px and wider): panel next to the chat.
 * Smaller screens: a "Help Oma find her glasses" button opens it as a full-screen pop-up.
 */
(function () {
  'use strict';

  // ---------- Settings ----------
  const ROUND_MS = 45000;
  const PENALTY_MS = 2000;
  const HINT_MS = 2200;
  const URGENT_MS = 10000;
  const MAX_CHAT_THANKS = 3;
  const BEST_KEY = 'omaApproved.glassesBestTime';
  const DESKTOP_QUERY = '(min-width: 1280px)';
  const TIMER_RING = 94.25; // circumference of the kitchen timer ring (r = 15)

  const ITEMS = [
    { id: 'glasses', label: "Oma's glasses" },
    { id: 'remote', label: 'The TV remote' },
    { id: 'phone', label: "Oma's phone" }
  ];

  /*
   * Hiding spots. x/y: where the item sits in the scene (viewBox 360 x 280).
   * rot: base rotation for the long items (remote, phone).
   * cover: something that has to be moved first (null = nothing to move).
   * hit: clickable area [x, y, width, height], big enough for fingers.
   */
  const SPOTS = [
    { id: 'cushion', x: 118, y: 162, rot: 80, cover: 'cushion', hit: [94, 130, 48, 46] },
    { id: 'newspaper', x: 146, y: 209, rot: 84, cover: 'newspaper', hit: [118, 194, 58, 26] },
    { id: 'fruit', x: 193, y: 203, rot: 70, cover: null, hit: [174, 186, 38, 30] },
    { id: 'plant', x: 250, y: 150, rot: 15, cover: null, hit: [226, 108, 48, 62] },
    { id: 'cat', x: 64, y: 252, rot: 90, cover: 'cat', hit: [22, 228, 72, 42] },
    { id: 'basket', x: 116, y: 243, rot: -10, cover: null, hit: [96, 224, 44, 48] },
    { id: 'shelf', x: 44, y: 106, rot: 85, cover: null, hit: [16, 82, 52, 34] },
    { id: 'blanket', x: 322, y: 244, rot: 75, cover: 'blanket', hit: [294, 214, 62, 58] },
    { id: 'tv', x: 300, y: 95, rot: 88, cover: null, hit: [280, 74, 64, 30] },
    { id: 'cup', x: 221, y: 209, rot: 80, cover: null, hit: [214, 192, 38, 26] }
  ];

  // ---------- Oma's lines (fixed texts, no API) ----------
  const LINES = {
    intro: [
      "Ach, where did I put them again? My glasses, the remote, my phone... Help me look, Schatz (darling)!"
    ],
    start: [
      "Heinz always found my things. Now it's your turn, Kind (child).",
      "Everything is gone again! Hilf mir (Help me), quickly!",
      "I put them somewhere safe. So safe that I can't find them.",
      "Look everywhere, Schatz (darling). Except my handbag, that's private."
    ],
    wrong: [
      "Not there, Kind! (Not there, child!)",
      "Ach, my knees hurt just watching you.",
      "Nein, nein (No, no), I would never put it there.",
      "Do you think I keep my glasses in the wallpaper?",
      "Langsam! (Slowly!) You're making me dizzy.",
      "Back in my day, children looked properly."
    ],
    empty: {
      cushion: [
        "Only crumbs under the cushion. Who eats on my sofa?!",
        "Nothing under there but a peppermint from 1997."
      ],
      newspaper: [
        "Just yesterday's crossword. I was stuck on 7 across.",
        "Nothing under the newspaper. Put it back neatly, please."
      ],
      blanket: [
        "Only my hot water bottle under there. Cold, too.",
        "Nothing under the blanket. I knitted it myself, you know."
      ],
      cat: [
        "Now Mausi is grumpy. And there's nothing under her!",
        "You woke up Mausi for nothing. Shame on you."
      ]
    },
    found: {
      glasses: [
        "Ah, now I can see how thin you are!",
        "My glasses! Ach, now I can see you properly. You look tired.",
        "There they are! Now I can finally read the TV guide."
      ],
      remote: [
        "Finally! Der Bergdoktor starts in five minutes!",
        "The remote! Now I can turn up the Volksmusik.",
        "Wunderbar (Wonderful), now I don't have to get up to change the channel!"
      ],
      phone: [
        "It's still not working. I think I deleted the internet again.",
        "My phone! Ach, fourteen missed calls from Frau Huber.",
        "Good, now I can call your mother and tell her you helped."
      ]
    },
    hint: [
      "Hmm, I think I was sitting over there...",
      "Warm, warmer... look there, Schatz (darling)!",
      "My memory isn't what it used to be, but try there."
    ],
    hurry: [
      "Schnell! (Quick!) My show starts soon!",
      "Hurry, Kind (child), the tea is getting cold!",
      "Tick tock! Even my kitchen timer is nervous."
    ],
    win: [
      "Wunderbar! (Wonderful!) You're a good child.",
      "Everything found! Du bist ein Schatz (You're a treasure).",
      "Ach, what would I do without you? Have some Kirschtorte."
    ],
    lose: [
      "Ach, never mind. I'll watch TV without my glasses again.",
      "Na ja (Oh well). I'll just guess who the murderer is.",
      "Never mind, Kind (child). Frau Huber will tell me everything anyway."
    ],
    chatThanks: [
      "Danke, Schatz! (Thank you, darling!) You found my glasses. Now, where were we?",
      "There they are! Ach, what would I do without you? So, where were we?",
      "Wunderbar (Wonderful), I can see again! Now tell me, where were we?"
    ]
  };

  // ---------- Small helpers ----------
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const lastLine = {};
  function pickLine(key, list) {
    if (list.length === 1) return list[0];
    let line;
    do {
      line = list[Math.floor(Math.random() * list.length)];
    } while (line === lastLine[key]);
    lastLine[key] = line;
    return line;
  }

  function readBest() {
    try {
      const value = parseFloat(window.localStorage.getItem(BEST_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch (e) {
      return null;
    }
  }

  function writeBest(seconds) {
    try {
      window.localStorage.setItem(BEST_KEY, String(seconds));
    } catch (e) {
      // the game works without saving
    }
  }

  // ---------- Item drawings (centred on 0,0) ----------
  function itemSvg(id) {
    if (id === 'glasses') {
      return `
        <path d="M-9.5 -1 L-13 -4 M9.5 -1 L13 -4" stroke="#7a4b2f" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="-5" cy="0" r="4.6" fill="rgba(215,235,242,0.75)" stroke="#7a4b2f" stroke-width="1.8"/>
        <circle cx="5" cy="0" r="4.6" fill="rgba(215,235,242,0.75)" stroke="#7a4b2f" stroke-width="1.8"/>
        <path d="M-0.6 -0.6 Q0 -2.4 0.6 -0.6" fill="none" stroke="#7a4b2f" stroke-width="1.6"/>
        <path d="M-7 -2 Q-5.5 -3.4 -4 -3" stroke="#fff" stroke-width="1" fill="none"/>`;
    }
    if (id === 'remote') {
      return `
        <rect x="-3.8" y="-10" width="7.6" height="20" rx="2.2" fill="#3f3b39" stroke="#1f1d1c" stroke-width="0.9"/>
        <circle cx="0" cy="-6.6" r="1.4" fill="#d9534f"/>
        <g fill="#b9b2aa">
          <circle cx="-1.6" cy="-2.6" r="0.9"/><circle cx="1.6" cy="-2.6" r="0.9"/>
          <circle cx="-1.6" cy="0.4" r="0.9"/><circle cx="1.6" cy="0.4" r="0.9"/>
          <circle cx="-1.6" cy="3.4" r="0.9"/><circle cx="1.6" cy="3.4" r="0.9"/>
        </g>
        <rect x="-1.8" y="6" width="3.6" height="1.6" rx="0.8" fill="#6fa86a"/>`;
    }
    // old button phone
    return `
      <rect x="1.8" y="-13" width="1.6" height="4.5" rx="0.8" fill="#4d565c"/>
      <rect x="-4.8" y="-9.5" width="9.6" height="19" rx="2.4" fill="#8e9aa3" stroke="#4d565c" stroke-width="0.9"/>
      <rect x="-3.2" y="-7.6" width="6.4" height="5" rx="0.8" fill="#b7d3a8" stroke="#4d565c" stroke-width="0.5"/>
      <g fill="#e9e4dc">
        <rect x="-3.2" y="-1" width="1.6" height="1.2" rx="0.3"/><rect x="-0.8" y="-1" width="1.6" height="1.2" rx="0.3"/><rect x="1.6" y="-1" width="1.6" height="1.2" rx="0.3"/>
        <rect x="-3.2" y="1.4" width="1.6" height="1.2" rx="0.3"/><rect x="-0.8" y="1.4" width="1.6" height="1.2" rx="0.3"/><rect x="1.6" y="1.4" width="1.6" height="1.2" rx="0.3"/>
        <rect x="-3.2" y="3.8" width="1.6" height="1.2" rx="0.3"/><rect x="-0.8" y="3.8" width="1.6" height="1.2" rx="0.3"/><rect x="1.6" y="3.8" width="1.6" height="1.2" rx="0.3"/>
        <rect x="-3.2" y="6.2" width="1.6" height="1.2" rx="0.3"/><rect x="-0.8" y="6.2" width="1.6" height="1.2" rx="0.3"/><rect x="1.6" y="6.2" width="1.6" height="1.2" rx="0.3"/>
      </g>`;
  }

  const slot = (id) => {
    const spot = SPOTS.find((s) => s.id === id);
    return `<g class="g-slot" data-slot="${id}" transform="translate(${spot.x} ${spot.y})"></g>`;
  };

  // ---------- The living room ----------
  function sceneSvg() {
    const hits = SPOTS.map((s) =>
      `<rect class="g-hit" data-spot="${s.id}" x="${s.hit[0]}" y="${s.hit[1]}" width="${s.hit[2]}" height="${s.hit[3]}" rx="8"/>`
    ).join('');

    return `
<svg class="g-svg" viewBox="0 0 360 280" role="img" aria-label="Oma's cluttered living room">
  <defs>
    <pattern id="g-wall" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="#f3e3cf"/>
      <rect width="12" height="24" fill="#efd6c8" opacity="0.6"/>
      <circle cx="6" cy="6" r="2.2" fill="#e2aaa3"/>
      <circle cx="18" cy="17" r="1.5" fill="#a9bb9c"/>
    </pattern>
    <pattern id="g-floor" width="44" height="12" patternUnits="userSpaceOnUse">
      <rect width="44" height="12" fill="#a8754f"/>
      <path d="M0 11.5 H44 M22 0 V12" stroke="#8a5a3b" stroke-width="1"/>
    </pattern>
    <pattern id="g-knit" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#f6e9d3"/>
      <path d="M0 0 L3 3 L6 0 M0 3 L3 6 L6 3" stroke="#d9a5a0" stroke-width="1" fill="none"/>
    </pattern>
    <pattern id="g-cushion-a" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#8fa682"/>
      <circle cx="4" cy="4" r="1.3" fill="#f3e6cf"/>
    </pattern>
    <pattern id="g-cushion-b" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#f6e9d3"/>
      <circle cx="3" cy="3" r="2" fill="#e2aaa3"/>
      <circle cx="8" cy="8" r="1.3" fill="#8fa682"/>
    </pattern>
  </defs>

  <!-- wall, skirting board, floor, rug -->
  <rect width="360" height="196" fill="url(#g-wall)"/>
  <ellipse cx="320" cy="20" rx="140" ry="90" fill="#ffd98a" opacity="0.16"/>
  <rect y="186" width="360" height="10" fill="#8a5a3b"/>
  <rect y="196" width="360" height="84" fill="url(#g-floor)"/>
  <ellipse cx="182" cy="248" rx="146" ry="27" fill="#d9a5a0" stroke="#b4615e" stroke-width="2" stroke-dasharray="4 3"/>
  <ellipse cx="182" cy="248" rx="124" ry="19" fill="none" stroke="#efd2cc" stroke-width="2"/>

  <!-- cuckoo clock -->
  <g transform="translate(153 10)">
    <path d="M0 0 L21 16 L-21 16 Z" fill="#5a3a26" stroke="#3a2418" stroke-width="1"/>
    <rect x="-15" y="15" width="30" height="28" rx="2" fill="#8a5a3b" stroke="#4a2e20" stroke-width="1.2"/>
    <circle cy="30" r="9" fill="#fbf3e4" stroke="#4a2e20" stroke-width="1"/>
    <path d="M0 30 V24 M0 30 L4 32" stroke="#4a2e20" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M-8 43 V55 M8 43 V51" stroke="#8a6a20" stroke-width="1" stroke-dasharray="1.5 1.5"/>
    <ellipse cx="-8" cy="58" rx="2.6" ry="4" fill="#6b4430"/>
    <ellipse cx="8" cy="54" rx="2.6" ry="4" fill="#6b4430"/>
    <g class="g-pendulum">
      <path d="M0 43 V60" stroke="#c99a3e" stroke-width="1.2"/>
      <circle cy="63" r="3.6" fill="#d4a845" stroke="#8a6a20" stroke-width="0.8"/>
    </g>
  </g>

  <!-- framed photo -->
  <rect x="230" y="34" width="34" height="28" rx="2" fill="#8a5a3b" stroke="#4a2e20" stroke-width="1.2"/>
  <rect x="234" y="38" width="26" height="20" fill="#cfe3e8"/>
  <path d="M234 54 L243 44 L249 50 L254 45 L260 52 V58 H234 Z" fill="#8fa682"/>

  <!-- bookshelf -->
  <rect x="8" y="36" width="64" height="160" rx="3" fill="#8a5a3b" stroke="#4a2e20" stroke-width="1.5"/>
  <rect x="14" y="44" width="52" height="32" fill="#5a3a26"/>
  <rect x="14" y="82" width="52" height="32" fill="#5a3a26"/>
  <rect x="14" y="120" width="52" height="32" fill="#5a3a26"/>
  <rect x="14" y="158" width="52" height="32" fill="#5a3a26"/>
  <g stroke="#3a2418" stroke-width="0.6">
    <rect x="15" y="50" width="6" height="26" fill="#b4615e"/>
    <rect x="21" y="54" width="5" height="22" fill="#8fa682"/>
    <rect x="26" y="48" width="7" height="28" fill="#e9c46a"/>
    <rect x="33" y="52" width="6" height="24" fill="#6d8fb3"/>
    <rect x="42" y="55" width="6" height="22" fill="#c98580" transform="rotate(-18 45 76)"/>
    <path d="M56 76 q-2 -8 3 -12 h4 q5 4 3 12 z" fill="#d9a5a0"/>
    <rect x="15" y="86" width="6" height="28" fill="#e2aaa3"/>
    <rect x="21" y="90" width="5" height="24" fill="#9fb592"/>
    <rect x="26" y="88" width="6" height="26" fill="#d9a441"/>
  </g>
  ${slot('shelf')}
  <g stroke="#3a2418" stroke-width="0.6">
    <rect x="53" y="86" width="6" height="28" fill="#b4615e"/>
    <rect x="59" y="90" width="6" height="24" fill="#6d8fb3"/>
    <rect x="15" y="124" width="7" height="28" fill="#8fa682"/>
    <rect x="22" y="128" width="6" height="24" fill="#e9c46a"/>
    <rect x="28" y="126" width="5" height="26" fill="#c98580"/>
    <path d="M44 152 q-1 -8 6 -9 q7 1 6 9 z" fill="#f3e6cf"/>
    <circle cx="50" cy="141" r="3" fill="#f3e6cf"/>
    <rect x="15" y="180" width="40" height="5" fill="#6d8fb3"/>
    <rect x="17" y="175" width="36" height="5" fill="#e2aaa3"/>
    <rect x="16" y="170" width="38" height="5" fill="#d9a441"/>
    <rect x="56" y="164" width="7" height="26" fill="#9fb592"/>
  </g>

  <!-- TV cabinet and old TV -->
  <rect x="272" y="150" width="82" height="46" rx="3" fill="#8a5a3b" stroke="#4a2e20" stroke-width="1.5"/>
  <rect x="277" y="156" width="35" height="34" rx="2" fill="#7a4d33" stroke="#4a2e20" stroke-width="0.8"/>
  <rect x="314" y="156" width="35" height="34" rx="2" fill="#7a4d33" stroke="#4a2e20" stroke-width="0.8"/>
  <circle cx="308" cy="173" r="1.5" fill="#d4a845"/>
  <circle cx="318" cy="173" r="1.5" fill="#d4a845"/>
  <path d="M313 100 L300 78 M313 100 L328 80" stroke="#3a2418" stroke-width="1.5"/>
  <circle cx="300" cy="78" r="1.6" fill="#3a2418"/>
  <circle cx="328" cy="80" r="1.6" fill="#3a2418"/>
  <rect x="280" y="100" width="66" height="50" rx="6" fill="#7a5a44" stroke="#3a2418" stroke-width="1.5"/>
  <rect x="286" y="106" width="44" height="38" rx="6" fill="#9fb3b0" stroke="#3a2418" stroke-width="1"/>
  <path d="M290 112 q6 -3 12 -2" stroke="#fff" opacity="0.6" stroke-width="2" fill="none" stroke-linecap="round"/>
  <circle cx="338" cy="114" r="3" fill="#d4a845" stroke="#3a2418" stroke-width="0.6"/>
  <circle cx="338" cy="125" r="3" fill="#d4a845" stroke="#3a2418" stroke-width="0.6"/>
  <rect x="334" y="133" width="8" height="7" rx="1" fill="#3a2418" opacity="0.5"/>
  <ellipse cx="316" cy="100" rx="16" ry="3" fill="#fffdf7"/>
  ${slot('tv')}
  <path d="M302 100 q-3 -8 2 -12 h6 q5 4 2 12 z" fill="#6d8fb3" stroke="#3a2418" stroke-width="0.8"/>
  <path d="M307 88 q-3 -6 -7 -7 M307 88 q2 -7 6 -8" stroke="#5f7a56" stroke-width="1.2" fill="none"/>
  <circle cx="300" cy="81" r="2.2" fill="#e2aaa3"/>
  <circle cx="313" cy="80" r="2.2" fill="#e9c46a"/>

  <!-- plant -->
  ${slot('plant')}
  <g fill="#7f9a76" stroke="#5f7a56" stroke-width="1">
    <ellipse cx="240" cy="140" rx="7" ry="22" transform="rotate(-25 240 140)"/>
    <ellipse cx="259" cy="136" rx="7" ry="24" transform="rotate(20 259 136)"/>
    <ellipse cx="249" cy="128" rx="6" ry="26"/>
    <ellipse cx="236" cy="158" rx="6" ry="16" transform="rotate(-55 236 158)"/>
    <ellipse cx="264" cy="156" rx="6" ry="16" transform="rotate(55 264 156)"/>
    <ellipse cx="252" cy="152" rx="5" ry="14" transform="rotate(10 252 152)"/>
  </g>
  <path d="M236 170 h28 l-4 26 h-20 z" fill="#c4704f" stroke="#7a3f2a" stroke-width="1"/>
  <rect x="234" y="166" width="32" height="6" rx="2" fill="#d27f5c" stroke="#7a3f2a" stroke-width="1"/>

  <!-- sofa with cushions -->
  <rect x="78" y="118" width="140" height="48" rx="14" fill="#c98580" stroke="#7a3f3a" stroke-width="1.5"/>
  <g fill="#b06f6a"><circle cx="106" cy="134" r="1.6"/><circle cx="134" cy="134" r="1.6"/><circle cx="162" cy="134" r="1.6"/><circle cx="190" cy="134" r="1.6"/></g>
  <rect x="80" y="160" width="136" height="26" rx="6" fill="#d99a92" stroke="#7a3f3a" stroke-width="1.5"/>
  <path d="M148 162 V184" stroke="#b77a73" stroke-width="1"/>
  <rect x="68" y="140" width="22" height="54" rx="9" fill="#c98580" stroke="#7a3f3a" stroke-width="1.5"/>
  <rect x="206" y="140" width="22" height="54" rx="9" fill="#c98580" stroke="#7a3f3a" stroke-width="1.5"/>
  <rect x="82" y="193" width="5" height="5" fill="#4a2e20"/>
  <rect x="209" y="193" width="5" height="5" fill="#4a2e20"/>
  ${slot('cushion')}
  <g transform="rotate(8 183 150)">
    <rect x="164" y="134" width="38" height="32" rx="9" fill="url(#g-cushion-b)" stroke="#7a3f3a" stroke-width="1.2"/>
  </g>
  <g class="g-cover g-cover-cushion" data-cover="cushion">
    <g transform="rotate(-6 118 152)">
      <rect x="98" y="136" width="40" height="32" rx="9" fill="url(#g-cushion-a)" stroke="#4f6b47" stroke-width="1.2"/>
      <circle cx="118" cy="152" r="2" fill="#4f6b47"/>
    </g>
  </g>

  <!-- magazines on the floor -->
  <g stroke="#9c8672" stroke-width="0.6">
    <rect x="12" y="206" width="34" height="5" rx="1" fill="#e2aaa3"/>
    <rect x="14" y="201" width="32" height="5" rx="1" fill="#f3e6cf" transform="rotate(-4 30 203)"/>
    <rect x="11" y="211" width="36" height="5" rx="1" fill="#9fb592"/>
  </g>

  <!-- sleeping cat (Mausi) -->
  ${slot('cat')}
  <g class="g-cover g-cover-cat" data-cover="cat">
    <path d="M84 258 Q100 254 94 242" stroke="#d48a45" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="64" cy="252" rx="25" ry="14" fill="#e0a25c" stroke="#9a5e2a" stroke-width="1.2"/>
    <path d="M58 240 q3 6 0 12 M68 239 q3 6 0 12 M78 241 q3 6 0 11" stroke="#c07a38" stroke-width="2" fill="none"/>
    <circle cx="42" cy="250" r="11" fill="#e0a25c" stroke="#9a5e2a" stroke-width="1.2"/>
    <path d="M34 243 L35 233 L42 240 Z M44 239 L51 233 L51 244 Z" fill="#e0a25c" stroke="#9a5e2a" stroke-width="1"/>
    <path d="M36 251 q2.5 2 5 0 M45 251 q2.5 2 5 0" stroke="#5b3a29" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M42.5 254 l1 1 l1 -1 z" fill="#c9706a"/>
    <text x="52" y="232" class="g-zzz">z</text>
    <text x="58" y="225" class="g-zzz g-zzz-small">z</text>
  </g>

  <!-- coffee table: newspaper, fruit bowl, coffee cup -->
  <rect x="124" y="226" width="6" height="36" fill="#6b4430"/>
  <rect x="234" y="226" width="6" height="36" fill="#6b4430"/>
  <rect x="114" y="214" width="136" height="12" rx="3" fill="#8a5a3b" stroke="#4a2e20" stroke-width="1.5"/>
  <rect x="118" y="215" width="128" height="3" fill="#a8754f"/>
  <ellipse cx="196" cy="214" rx="20" ry="4" fill="#fffdf7"/>
  ${slot('newspaper')}
  <g class="g-cover g-cover-newspaper" data-cover="newspaper">
    <path d="M120 215 L129 199 L174 201 L167 217 Z" fill="#f2ede2" stroke="#b9a99a" stroke-width="1"/>
    <path d="M133 202.5 L147 203 L145.4 207 L131.4 206.5 Z" fill="#b9a99a"/>
    <path d="M150 204 L166 205 M148 207 L164 208 M131 210 L161 211 M129 213 L158 214" stroke="#9c8672" stroke-width="1.1"/>
  </g>
  <circle cx="203" cy="202" r="6" fill="#b4413c" stroke="#7a2a20" stroke-width="1"/>
  <path d="M203 196 q1 -3 3 -3" stroke="#5f7a56" stroke-width="1.2" fill="none"/>
  ${slot('fruit')}
  <circle cx="184" cy="205" r="6" fill="#e2b04a" stroke="#9a7a20" stroke-width="1"/>
  <path d="M188 207 Q199 214 211 204" stroke="#f2d06b" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g fill="#8a5a8a"><circle cx="206" cy="208" r="2"/><circle cx="209" cy="207" r="2"/><circle cx="207.5" cy="210" r="2"/></g>
  <path d="M177 206 Q195 223 213 206 Z" fill="#e7d3b5" stroke="#9c8672" stroke-width="1.2"/>
  <ellipse cx="195" cy="206" rx="18" ry="2.4" fill="none" stroke="#9c8672" stroke-width="1"/>
  ${slot('cup')}
  <ellipse cx="236" cy="214" rx="11" ry="2.5" fill="#fffaf0" stroke="#9c8672" stroke-width="1"/>
  <path d="M228 202 h16 v7 q0 5 -8 5 q-8 0 -8 -5 z" fill="#fffaf0" stroke="#9c8672" stroke-width="1.2"/>
  <path d="M244 204 q5 0 4 4 q-1 3 -5 2" fill="none" stroke="#9c8672" stroke-width="1.2"/>
  <circle cx="236" cy="207" r="1.6" fill="#e2aaa3"/>
  <path d="M233 198 q-2 -3 0 -6 M238 198 q-2 -3 0 -6" stroke="#cfc8c0" stroke-width="1" fill="none"/>

  <!-- sewing basket -->
  <ellipse cx="116" cy="246" rx="19" ry="5" fill="#8a6a40"/>
  ${slot('basket')}
  <circle cx="106" cy="245" r="6" fill="#b4615e" stroke="#7a3f3a" stroke-width="0.8"/>
  <path d="M102 242 q4 3 8 1 M103 247 q4 -2 7 1" stroke="#7a3f3a" stroke-width="0.8" fill="none"/>
  <circle cx="127" cy="244" r="5.5" fill="#6d8fb3" stroke="#4a6585" stroke-width="0.8"/>
  <path d="M110 246 L100 228 M115 246 L108 226" stroke="#c9b394" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M97 246 Q99 268 116 268 Q133 268 135 246 Z" fill="#c9a26b" stroke="#8a6a40" stroke-width="1.2"/>
  <path d="M99 252 H133 M101 258 H131 M105 263 H127" stroke="#a8844f" stroke-width="1"/>
  <path d="M97 246 Q116 253 135 246" stroke="#8a6a40" stroke-width="2.5" fill="none"/>
  <path d="M135 258 Q150 266 158 262" stroke="#6d8fb3" stroke-width="1" fill="none"/>
  <circle cx="161" cy="262" r="4" fill="#6d8fb3" stroke="#4a6585" stroke-width="0.8"/>

  <!-- slippers -->
  <ellipse cx="170" cy="272" rx="9" ry="4" fill="#e2aaa3" stroke="#b4615e" stroke-width="1"/>
  <ellipse cx="188" cy="274" rx="9" ry="4" fill="#e2aaa3" stroke="#b4615e" stroke-width="1"/>

  <!-- armchair with knitted blanket -->
  <rect x="276" y="182" width="76" height="62" rx="16" fill="#7f9a76" stroke="#4f6b47" stroke-width="1.5"/>
  <g fill="#6a8562"><circle cx="296" cy="198" r="1.6"/><circle cx="314" cy="198" r="1.6"/><circle cx="332" cy="198" r="1.6"/></g>
  <rect x="278" y="232" width="72" height="26" rx="6" fill="#8fa682" stroke="#4f6b47" stroke-width="1.5"/>
  <rect x="264" y="214" width="22" height="56" rx="9" fill="#7f9a76" stroke="#4f6b47" stroke-width="1.5"/>
  <rect x="342" y="214" width="22" height="56" rx="9" fill="#7f9a76" stroke="#4f6b47" stroke-width="1.5"/>
  ${slot('blanket')}
  <g class="g-cover g-cover-blanket" data-cover="blanket">
    <path d="M298 222 Q322 214 348 222 L352 266 Q326 272 300 266 Z" fill="url(#g-knit)" stroke="#b4615e" stroke-width="1.2"/>
    <path d="M299 236 Q324 230 349 236 M300 252 Q325 246 351 252" stroke="#b4615e" stroke-width="3" fill="none" opacity="0.7"/>
    <path d="M304 267 v5 M311 268 v5 M318 269 v5 M325 269 v5 M332 269 v5 M339 268 v5 M346 267 v5" stroke="#b4615e" stroke-width="1.2" stroke-linecap="round"/>
  </g>

  <!-- hint highlight, feedback texts and clickable areas (on top) -->
  <g class="g-hint-layer"></g>
  <g class="g-fx"></g>
  <g class="g-hits">${hits}</g>
</svg>`;
  }

  // Small Oma face for the speech bubble. Her glasses appear once you find them.
  const AVATAR_SVG = `
<svg class="g-avatar-svg" viewBox="0 0 60 60" aria-hidden="true">
  <circle cx="30" cy="30" r="29" fill="#f3e3cf" stroke="#8a5a3b" stroke-width="2"/>
  <circle cx="30" cy="11" r="7" fill="#dcd7d1" stroke="#5b3a29" stroke-width="1.5"/>
  <ellipse cx="30" cy="30" rx="17" ry="16" fill="#cdc8c2" stroke="#5b3a29" stroke-width="1.5"/>
  <path d="M10 62 Q12 48 30 47 Q48 48 50 62 Z" fill="#86a07c" stroke="#5b3a29" stroke-width="1.5"/>
  <ellipse cx="30" cy="33" rx="14" ry="15" fill="#f6d3b5" stroke="#5b3a29" stroke-width="1.5"/>
  <path d="M16 31 C15 20 24 16 30 17 C36 16 45 20 44 31 C41 25 36 22 30 23 C24 22 19 25 16 31 Z" fill="#dcd7d1" stroke="#5b3a29" stroke-width="1.5"/>
  <g class="g-avatar-squint">
    <path d="M21 34 L27 34 M33 34 L39 34" stroke="#5b3a29" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <g class="g-avatar-glasses">
    <circle cx="24" cy="34" r="2" fill="#5b3a29"/><circle cx="36" cy="34" r="2" fill="#5b3a29"/>
    <circle cx="24" cy="34" r="5" fill="rgba(255,255,255,0.25)" stroke="#7a4b2f" stroke-width="1.5"/>
    <circle cx="36" cy="34" r="5" fill="rgba(255,255,255,0.25)" stroke="#7a4b2f" stroke-width="1.5"/>
    <path d="M29 33.5 Q30 32 31 33.5" stroke="#7a4b2f" stroke-width="1.5" fill="none"/>
  </g>
  <path d="M26 42 Q30 44 34 42" stroke="#5b3a29" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>`;

  const TIMER_SVG = `
<svg class="g-timer-svg" viewBox="0 0 48 52" aria-hidden="true">
  <rect x="19" y="1" width="10" height="7" rx="2.5" fill="#b4615e" stroke="#4a2e20" stroke-width="1.2"/>
  <circle cx="24" cy="29" r="21" fill="#fffaf0" stroke="#4a2e20" stroke-width="2"/>
  <circle cx="24" cy="29" r="15" fill="none" stroke="#efe2cc" stroke-width="5"/>
  <circle class="g-timer-ring" cx="24" cy="29" r="15" fill="none" stroke="#8fa682" stroke-width="5" stroke-dasharray="${TIMER_RING}" stroke-dashoffset="0" transform="rotate(-90 24 29)"/>
</svg>`;

  const MAGNIFIER_SVG = `
<svg viewBox="0 0 24 24" aria-hidden="true" class="g-hint-icon">
  <circle cx="10" cy="10" r="6.5" fill="rgba(255,255,255,0.4)" stroke="currentColor" stroke-width="2.2"/>
  <path d="M15 15 L21 21" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
</svg>`;

  // ---------- Build the panel ----------
  const panel = document.getElementById('game-panel');
  const openBtn = document.getElementById('game-open-btn');
  if (!panel) return;

  panel.innerHTML = `
<div class="g-inner">
  <div class="g-head">
    <h2 class="g-title">Where are my glasses?</h2>
    <button type="button" class="g-close" aria-label="Close the game">&times;</button>
  </div>

  <div class="g-oma">
    <div class="g-avatar">${AVATAR_SVG}</div>
    <p class="g-bubble" aria-live="polite"></p>
  </div>

  <div class="g-bar">
    <div class="g-timer" role="timer" aria-label="Time left">
      ${TIMER_SVG}
      <span class="g-time">45</span>
    </div>
    <ul class="g-checklist" aria-label="Things to find">
      ${ITEMS.map((item) => `
        <li data-item="${item.id}">
          <svg viewBox="-14 -14 28 28" class="g-check-icon" aria-hidden="true">${itemSvg(item.id)}</svg>
          <span class="g-check-label">${item.label}</span>
          <span class="g-check-box" aria-hidden="true"></span>
        </li>`).join('')}
    </ul>
    <button type="button" class="g-hint-btn" aria-label="Hint: show where one missing item is">${MAGNIFIER_SVG}<span>Hint</span></button>
  </div>

  <div class="g-stage">
    <div class="g-scene">${sceneSvg()}</div>
    <div class="g-overlay">
      <div class="g-card">
        <p class="g-card-title"></p>
        <p class="g-card-text"></p>
        <button type="button" class="g-play-btn">Start looking</button>
      </div>
    </div>
  </div>

  <p class="g-best"></p>
</div>`;

  const $ = (selector) => panel.querySelector(selector);
  const els = {
    svg: $('.g-svg'),
    bubble: $('.g-bubble'),
    avatar: $('.g-avatar'),
    timer: $('.g-timer'),
    time: $('.g-time'),
    ring: $('.g-timer-ring'),
    hintBtn: $('.g-hint-btn'),
    hintLayer: $('.g-hint-layer'),
    fx: $('.g-fx'),
    overlay: $('.g-overlay'),
    cardTitle: $('.g-card-title'),
    cardText: $('.g-card-text'),
    playBtn: $('.g-play-btn'),
    best: $('.g-best'),
    close: $('.g-close')
  };

  // ---------- Round state ----------
  let round = null;
  let tickTimer = null;
  let hintTimer = null;

  function say(text) {
    els.bubble.textContent = text;
    els.bubble.classList.remove('is-new');
    void els.bubble.offsetWidth; // restart the little pop animation
    els.bubble.classList.add('is-new');
  }

  function renderBest() {
    const best = readBest();
    els.best.textContent = best ? `Best time: ${best.toFixed(1)} s` : 'Best time: not set yet';
  }

  function remainingMs() {
    if (!round) return ROUND_MS;
    if (round.paused || round.state !== 'playing') return Math.max(0, round.remaining);
    return Math.max(0, round.endAt - Date.now());
  }

  function renderTimer() {
    const left = remainingMs();
    els.time.textContent = String(Math.ceil(left / 1000));
    els.ring.style.strokeDashoffset = String(TIMER_RING * (1 - left / ROUND_MS));
    els.timer.classList.toggle('is-urgent', !!round && round.state === 'playing' && left <= URGENT_MS);
  }

  function resetScene() {
    panel.querySelectorAll('.g-slot').forEach((g) => { g.innerHTML = ''; });
    panel.querySelectorAll('.g-cover').forEach((g) => g.classList.remove('is-moved'));
    panel.querySelectorAll('.g-checklist li').forEach((li) => li.classList.remove('is-found'));
    els.hintLayer.innerHTML = '';
    els.fx.innerHTML = '';
    els.avatar.classList.remove('has-glasses');
  }

  function placeItems() {
    const chosen = shuffle(SPOTS).slice(0, ITEMS.length);
    const placement = {};
    ITEMS.forEach((item, index) => {
      const spot = chosen[index];
      const angle = item.id === 'glasses' ? randomInt(-20, 20) : spot.rot + randomInt(-15, 15);
      const g = panel.querySelector(`.g-slot[data-slot="${spot.id}"]`);
      g.innerHTML = `<g class="g-item" data-item="${item.id}" transform="rotate(${angle})">${itemSvg(item.id)}</g>`;
      placement[spot.id] = item.id;
    });
    return placement;
  }

  function startRound() {
    clearInterval(tickTimer);
    clearTimeout(hintTimer);
    resetScene();

    round = {
      state: 'playing',
      placement: placeItems(),        // spotId -> itemId
      revealed: {},                    // spotId -> true once its cover was moved
      found: {},                       // itemId -> true
      endAt: Date.now() + ROUND_MS,
      remaining: ROUND_MS,
      paused: false,
      hintUsed: false,
      hurried: false
    };

    els.overlay.hidden = true;
    els.hintBtn.disabled = false;
    say(pickLine('start', LINES.start));
    if (!isPanelVisible()) pause();
    renderTimer();
    tickTimer = setInterval(tick, 100);
  }

  function tick() {
    if (!round || round.state !== 'playing' || round.paused) return;
    const left = remainingMs();
    if (!round.hurried && left <= URGENT_MS && left > 0) {
      round.hurried = true;
      say(pickLine('hurry', LINES.hurry));
    }
    renderTimer();
    if (left <= 0) endRound(false);
  }

  function pause() {
    if (round && round.state === 'playing' && !round.paused) {
      round.remaining = Math.max(0, round.endAt - Date.now());
      round.paused = true;
    }
  }

  function resume() {
    if (round && round.state === 'playing' && round.paused) {
      round.endAt = Date.now() + round.remaining;
      round.paused = false;
    }
  }

  // ---------- Clicks in the scene ----------
  function toScenePoint(event) {
    const matrix = els.svg.getScreenCTM();
    if (!matrix) return { x: 180, y: 140 };
    const point = els.svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const p = point.matrixTransform(matrix.inverse());
    return { x: p.x, y: p.y };
  }

  function floatText(text, x, y, kind) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    node.setAttribute('x', String(Math.max(18, Math.min(342, x))));
    node.setAttribute('y', String(Math.max(16, y)));
    node.setAttribute('class', `g-float${kind ? ` g-float-${kind}` : ''}`);
    node.textContent = text;
    els.fx.appendChild(node);
    setTimeout(() => node.remove(), 1100);
  }

  function spotCenter(spot) {
    return { x: spot.hit[0] + spot.hit[2] / 2, y: spot.hit[1] + spot.hit[3] / 2 };
  }

  function wrongClick(point) {
    round.endAt -= PENALTY_MS;
    floatText('−2 s', point.x, point.y, 'penalty');
    say(pickLine('wrong', LINES.wrong));
    renderTimer();
    if (remainingMs() <= 0) endRound(false);
  }

  function reveal(spot) {
    round.revealed[spot.id] = true;
    const cover = panel.querySelector(`.g-cover[data-cover="${spot.id}"]`);
    if (cover) cover.classList.add('is-moved');
    const center = spotCenter(spot);
    if (spot.id === 'cat') floatText('Mrrrow!', center.x, spot.hit[1] - 2, 'cat');
    if (!round.placement[spot.id]) say(pickLine(`empty-${spot.id}`, LINES.empty[spot.id]));
  }

  function collect(spot, itemId) {
    round.found[itemId] = true;
    const item = panel.querySelector(`.g-slot[data-slot="${spot.id}"] .g-item`);
    if (item) item.classList.add('is-collected');
    const li = panel.querySelector(`.g-checklist li[data-item="${itemId}"]`);
    if (li) li.classList.add('is-found');
    if (itemId === 'glasses') els.avatar.classList.add('has-glasses');
    els.hintLayer.innerHTML = '';
    say(pickLine(`found-${itemId}`, LINES.found[itemId]));

    if (ITEMS.every((it) => round.found[it.id])) endRound(true);
  }

  function onSceneClick(event) {
    if (!round || round.state !== 'playing' || round.paused) return;
    const point = toScenePoint(event);
    const hit = event.target.closest ? event.target.closest('[data-spot]') : null;
    if (!hit) {
      wrongClick(point);
      return;
    }

    const spot = SPOTS.find((s) => s.id === hit.dataset.spot);
    const itemId = round.placement[spot.id];

    if (spot.cover && !round.revealed[spot.id]) {
      reveal(spot);
    } else if (itemId && !round.found[itemId]) {
      collect(spot, itemId);
    } else {
      wrongClick(point);
    }
  }

  // ---------- Hint ----------
  function useHint() {
    if (!round || round.state !== 'playing' || round.paused || round.hintUsed) return;
    const missing = Object.keys(round.placement).filter((spotId) => !round.found[round.placement[spotId]]);
    if (missing.length === 0) return;

    round.hintUsed = true;
    els.hintBtn.disabled = true;
    const spot = SPOTS.find((s) => s.id === missing[Math.floor(Math.random() * missing.length)]);
    const c = spotCenter(spot);
    const r = Math.max(spot.hit[2], spot.hit[3]) / 2 + 4;
    els.hintLayer.innerHTML = `<circle class="g-hint-ring" cx="${c.x}" cy="${c.y}" r="${r}"/>`;
    say(pickLine('hint', LINES.hint));
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { els.hintLayer.innerHTML = ''; }, HINT_MS);
  }

  // ---------- End of a round ----------
  function endRound(won) {
    if (!round || round.state !== 'playing') return;
    clearInterval(tickTimer);
    clearTimeout(hintTimer);
    round.remaining = remainingMs();
    round.state = won ? 'won' : 'lost';
    els.hintBtn.disabled = true;
    renderTimer();

    if (won) {
      const seconds = Math.round((ROUND_MS - round.remaining) / 100) / 10;
      const best = readBest();
      const isNewBest = best === null || seconds < best;
      if (isNewBest) writeBest(seconds);
      renderBest();

      say(pickLine('win', LINES.win));
      showCard(
        'Wunderbar! (Wonderful!)',
        `You found everything in ${seconds.toFixed(1)} seconds.${isNewBest ? ' New best time!' : ''}`,
        'Play again'
      );
      postThanksToChat();
    } else {
      // Show where the missing things were.
      const rings = [];
      Object.keys(round.placement).forEach((spotId) => {
        if (round.found[round.placement[spotId]]) return;
        const spot = SPOTS.find((s) => s.id === spotId);
        const cover = panel.querySelector(`.g-cover[data-cover="${spotId}"]`);
        if (cover) cover.classList.add('is-moved');
        const c = spotCenter(spot);
        rings.push(`<circle class="g-hint-ring g-missed-ring" cx="${c.x}" cy="${c.y}" r="${Math.max(spot.hit[2], spot.hit[3]) / 2 + 4}"/>`);
      });
      els.hintLayer.innerHTML = rings.join('');

      const foundCount = ITEMS.filter((it) => round.found[it.id]).length;
      say(pickLine('lose', LINES.lose));
      showCard('Time\'s up!', `You found ${foundCount} of 3. The circles show where the rest were hiding.`, 'Play again');
    }
  }

  function showCard(title, text, buttonLabel) {
    els.cardTitle.textContent = title;
    els.cardText.textContent = text;
    els.playBtn.textContent = buttonLabel;
    els.overlay.hidden = false;
    els.overlay.classList.toggle('is-result', !!round && round.state !== 'playing');
  }

  // A short, fixed note from Oma in the chat. Display only: it is not sent to the AI,
  // does not count toward the 15 messages and does not change approval.
  function postThanksToChat() {
    const log = document.getElementById('chat-log');
    if (!log) return;
    if (log.querySelectorAll('.msg-game-thanks').length >= MAX_CHAT_THANKS) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'msg msg-oma msg-game-thanks';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const p = document.createElement('p');
    p.textContent = pickLine('chatThanks', LINES.chatThanks);
    bubble.appendChild(p);
    wrapper.appendChild(bubble);
    log.appendChild(wrapper);
    log.scrollTop = log.scrollHeight;
  }

  // ---------- Desktop panel vs. mobile pop-up ----------
  const desktopMq = window.matchMedia ? window.matchMedia(DESKTOP_QUERY) : null;
  const isDesktop = () => (desktopMq ? desktopMq.matches : true);
  const isPanelVisible = () => isDesktop() || panel.classList.contains('is-open');

  function openPopup() {
    panel.classList.add('is-open');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    document.body.classList.add('game-popup-open');
    resume();
    els.close.focus();
  }

  function closePopup() {
    panel.classList.remove('is-open');
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    document.body.classList.remove('game-popup-open');
    pause();
    renderTimer();
    if (openBtn) openBtn.focus();
  }

  function onLayoutChange() {
    if (isDesktop()) {
      panel.classList.remove('is-open');
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
      document.body.classList.remove('game-popup-open');
      resume();
    } else if (!panel.classList.contains('is-open')) {
      pause();
    }
  }

  // ---------- Wire everything up ----------
  els.svg.addEventListener('click', onSceneClick);
  els.hintBtn.addEventListener('click', useHint);
  els.playBtn.addEventListener('click', startRound);
  els.close.addEventListener('click', closePopup);
  if (openBtn) openBtn.addEventListener('click', openPopup);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) closePopup();
  });
  if (desktopMq) {
    if (desktopMq.addEventListener) desktopMq.addEventListener('change', onLayoutChange);
    else if (desktopMq.addListener) desktopMq.addListener(onLayoutChange);
  }

  // Start screen
  els.hintBtn.disabled = true;
  say(LINES.intro[0]);
  showCard(
    'Oma lost her things again!',
    'Find her glasses, the TV remote and her old phone in 45 seconds. Some things hide under cushions, newspapers, blankets or the cat: tap once to look, tap again to pick it up. Wrong taps cost 2 seconds.',
    'Start looking'
  );
  renderTimer();
  renderBest();
})();
