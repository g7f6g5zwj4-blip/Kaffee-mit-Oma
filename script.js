/*
 * Oma Approved? - browser logic
 * Chat, oven dial (temperature + mood), approval meter, confession cards and the ending with the recipe.
 */
(function () {
  'use strict';

  // ---------- Settings ----------
  const MAX_USER_MESSAGES = 15;
  const MAX_INPUT_CHARS = 300;
  const START_APPROVAL = 30;

  const OPENING_MESSAGE = 'Ah, there you are! Sit down, sit down. Have you eaten? Tell me, what are you doing with your life these days?';

  // Each setting sends its temperature to the server; the server adds the matching mood instruction.
  const OVEN_LEVELS = {
    1: { temperature: 0.2, name: 'Sunday Church Oma', angle: -55 },
    2: { temperature: 0.8, name: 'Everyday Oma', angle: 0 },
    3: { temperature: 1.4, name: 'Eierlikör Oma', angle: 55 }
  };
  const DEFAULT_LEVEL = 2;

  const CONFESSION_CARDS = [
    "I quit my job to become an influencer",
    "I'm vegan now",
    "I moved in with my boyfriend",
    "I only eat avocado toast",
    "I work from home in my pyjamas"
  ];

  // One face per 10 approval points. At 0 she ragequits.
  const MOODS = [
    { max: 9, expression: 'fuming', label: 'Fuming' },
    { max: 19, expression: 'furious', label: 'Furious' },
    { max: 29, expression: 'appalled', label: 'Appalled' },
    { max: 39, expression: 'disappointed', label: 'Disappointed' },
    { max: 49, expression: 'unimpressed', label: 'Unimpressed' },
    { max: 59, expression: 'skeptical', label: 'Skeptical' },
    { max: 69, expression: 'warming', label: 'Warming up to you' },
    { max: 79, expression: 'pleased', label: 'Pleased' },
    { max: 89, expression: 'delighted', label: 'Delighted' },
    { max: 99, expression: 'proud', label: 'Proud' },
    { max: 100, expression: 'beaming', label: 'Beaming with pride' }
  ];

  const THINKING_LINES = [
    'Oma is putting on her glasses',
    'Oma is pouring more tea',
    'Oma is looking for her hearing aid',
    'Oma is thinking about it',
    'Oma is sighing quietly'
  ];

  const ENDINGS = {
    nap: {
      message: "Ach, look at the clock! Fifteen stories, and my eyes are getting heavy... Oma needs her nap now. But you don't leave this house without my Kirschtorte recipe. Here, I wrote it down for you.",
      status: 'Oma is napping. Zzz…',
      endText: 'Oma is napping in her armchair. The TV is still on.'
    },
    goodbye: {
      message: "Already going? Na gut (Alright then). Come here, let me look at you... You don't leave this house without my Kirschtorte recipe. Here, I wrote it down for you.",
      status: 'Oma is waving from the window',
      endText: 'Oma is waving from the window until you turn the corner.'
    },
    ragequit: {
      message: "Das reicht! (That's enough!) I have never been so insulted in my own living room. Here, take my Kirschtorte recipe, maybe baking will teach you some decency. And now raus! (Out!) My crime series is starting.",
      status: 'Oma has stormed off',
      endText: 'Oma stormed off to her armchair and turned the TV up very loud. Maybe be a bit nicer next time.',
      angry: true
    }
  };

  const ERROR_MESSAGES = {
    default: "My phone isn't working again... try once more.",
    rateLimit: 'Langsam, langsam! (Slow down, slow down!) My old ears cannot keep up. Wait a few minutes and try once more.'
  };

  // ---------- State ----------
  const state = {
    history: [],     // [{ role: 'user' | 'assistant', content }], sent to the server
    approval: START_APPROVAL,
    userCount: 0,
    level: DEFAULT_LEVEL,
    serious: false,
    busy: false,
    closing: false,  // the visit is about to end (nap or ragequit), no more messages
    ended: false
  };

  // ---------- Elements ----------
  const $ = (id) => document.getElementById(id);
  const els = {
    portrait: $('oma-portrait'),
    log: $('chat-log'),
    form: $('chat-form'),
    input: $('msg'),
    send: $('send-btn'),
    charCount: $('char-count'),
    cards: $('cards'),
    cardsArea: $('cards-area'),
    goodbye: $('goodbye-btn'),
    patienceText: $('patience-text'),
    endPanel: $('end-panel'),
    endText: $('end-text'),
    again: $('again-btn'),
    meterTrack: $('meter-track'),
    meterFill: $('meter-fill'),
    meterValue: $('approval-value'),
    meterDelta: $('meter-delta'),
    meterMood: $('meter-mood'),
    knobBtn: $('knob-btn'),
    knob: $('knob'),
    notches: Array.from(document.querySelectorAll('.notch')),
    moodName: $('mood-name'),
    moodTemp: $('mood-temp'),
    ovenLight: $('oven-light'),
    infoBtn: $('info-btn'),
    info: $('oven-info')
  };

  // ---------- Helpers ----------
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function toApprovalChange(value) {
    const number = Math.round(Number(value));
    return Number.isFinite(number) ? clamp(number, -10, 10) : 0;
  }

  function moodFor(approval) {
    return MOODS.find((mood) => approval <= mood.max) || MOODS[MOODS.length - 1];
  }

  const prefersFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  function scrollLogToBottom() {
    els.log.scrollTop = els.log.scrollHeight;
  }

  // ---------- Messages ----------
  function addMessage(role, text, options) {
    const opts = options || {};
    const wrapper = document.createElement('div');
    wrapper.className = `msg msg-${role}`;
    if (opts.serious) wrapper.classList.add('is-serious');
    if (opts.error) wrapper.classList.add('is-error');
    if (opts.angry) wrapper.classList.add('is-angry');

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const p = document.createElement('p');
    p.textContent = text;
    bubble.appendChild(p);

    if (opts.ovenLevel) {
      const tag = document.createElement('span');
      tag.className = 'oven-tag';
      tag.textContent = `oven ${opts.ovenLevel} · temperature ${OVEN_LEVELS[opts.ovenLevel].temperature}`;
      bubble.appendChild(tag);
    }

    wrapper.appendChild(bubble);
    els.log.appendChild(wrapper);
    scrollLogToBottom();
    return wrapper;
  }

  function showThinking() {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg msg-oma is-thinking';
    const line = THINKING_LINES[Math.floor(Math.random() * THINKING_LINES.length)];
    wrapper.innerHTML = '<div class="bubble"><p><span class="thinking-text"></span><span class="dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></p></div>';
    wrapper.querySelector('.thinking-text').textContent = line;
    els.log.appendChild(wrapper);
    scrollLogToBottom();
    return wrapper;
  }

  function addRecipeCard() {
    const r = OMA_RECIPE;
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.setAttribute('aria-label', r.title);

    const band = document.createElement('div');
    band.className = 'recipe-band';
    card.appendChild(band);

    const body = document.createElement('div');
    body.className = 'recipe-body';

    const title = document.createElement('h3');
    title.textContent = r.title;
    body.appendChild(title);

    const intro = document.createElement('p');
    intro.className = 'recipe-intro';
    intro.textContent = `"${r.intro}"`;
    body.appendChild(intro);

    const cols = document.createElement('div');
    cols.className = 'recipe-cols';
    r.ingredients.forEach((group) => {
      const section = document.createElement('div');
      const h4 = document.createElement('h4');
      h4.textContent = group.heading;
      const ul = document.createElement('ul');
      group.items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      section.appendChild(h4);
      section.appendChild(ul);
      cols.appendChild(section);
    });
    body.appendChild(cols);

    const stepsHeading = document.createElement('h4');
    stepsHeading.textContent = 'How to make it';
    body.appendChild(stepsHeading);

    const ol = document.createElement('ol');
    ol.className = 'recipe-steps';
    r.steps.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      ol.appendChild(li);
    });
    body.appendChild(ol);

    const outro = document.createElement('p');
    outro.className = 'recipe-outro';
    outro.textContent = `"${r.outro}"`;
    body.appendChild(outro);

    const sign = document.createElement('p');
    sign.className = 'recipe-sign';
    sign.textContent = '– Oma Hildegard ♥';
    body.appendChild(sign);

    card.appendChild(body);
    els.log.appendChild(card);
    els.log.scrollTo({ top: card.offsetTop - 16, behavior: 'smooth' });
    return card;
  }

  // ---------- Approval meter ----------
  function renderMeter(change) {
    const approval = state.approval;
    const mood = moodFor(approval);
    const hue = Math.round(5 + (approval / 100) * 95); // faded rose -> muted green

    els.meterFill.style.width = `${approval}%`;
    els.meterFill.style.setProperty('--meter-hue', hue);
    els.meterValue.textContent = approval;
    els.meterTrack.setAttribute('aria-valuenow', String(approval));
    els.meterTrack.setAttribute('aria-valuetext', `${approval} out of 100, ${mood.label}`);
    els.meterMood.textContent = state.serious ? 'Listening closely' : mood.label;

    Oma.setExpression(state.serious ? 'caring' : mood.expression);

    if (change) {
      els.meterDelta.textContent = change > 0 ? `+${change}` : `−${Math.abs(change)}`;
      els.meterDelta.classList.toggle('is-down', change < 0);
      els.meterDelta.classList.remove('show');
      void els.meterDelta.offsetWidth; // restart the animation
      els.meterDelta.classList.add('show');
    }
  }

  function applyApproval(change, serious) {
    state.serious = serious;
    const delta = serious ? 0 : change;
    state.approval = clamp(state.approval + delta, 0, 100);
    renderMeter(delta);
  }

  // ---------- Patience counter ----------
  function renderPatience() {
    const left = MAX_USER_MESSAGES - state.userCount;
    els.patienceText.textContent = `Oma's patience: ${left} ${left === 1 ? 'cup' : 'cups'} of tea left`;
  }

  // ---------- Oven dial ----------
  function setLevel(level) {
    const oven = OVEN_LEVELS[level];
    if (!oven) return;
    state.level = level;

    els.knob.style.transform = `rotate(${oven.angle}deg)`;
    els.notches.forEach((notch) => {
      notch.setAttribute('aria-pressed', String(Number(notch.dataset.level) === level));
    });
    els.moodName.lastChild.textContent = oven.name;
    els.moodTemp.textContent = `temperature ${oven.temperature}`;
    els.ovenLight.dataset.level = String(level);
    els.knobBtn.setAttribute('aria-label', `Turn the oven knob (currently ${level}, ${oven.name})`);
  }

  function bindDial() {
    els.notches.forEach((notch) => {
      notch.addEventListener('click', () => setLevel(Number(notch.dataset.level)));
    });
    els.knobBtn.addEventListener('click', () => setLevel(state.level === 3 ? 1 : state.level + 1));
    els.knobBtn.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        setLevel(Math.min(3, state.level + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        setLevel(Math.max(1, state.level - 1));
      }
    });
    els.infoBtn.addEventListener('click', () => {
      const open = els.info.hidden;
      els.info.hidden = !open;
      els.infoBtn.setAttribute('aria-expanded', String(open));
    });
  }

  // ---------- Confession cards ----------
  function renderCards() {
    els.cards.innerHTML = '';
    CONFESSION_CARDS.forEach((text) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'card-btn';
      button.textContent = text;
      button.addEventListener('click', () => {
        if (state.ended) return;
        els.input.value = text;
        updateInputUi();
        els.input.focus();
        els.input.setSelectionRange(text.length, text.length);
      });
      els.cards.appendChild(button);
    });
  }

  // ---------- Input ----------
  function updateInputUi() {
    const length = els.input.value.length;
    els.charCount.textContent = `${length}/${MAX_INPUT_CHARS}`;
    els.charCount.classList.toggle('near-limit', length >= MAX_INPUT_CHARS - 30);

    els.input.style.height = 'auto';
    els.input.style.height = `${Math.min(els.input.scrollHeight, 130)}px`;

    els.send.disabled = state.busy || state.closing || state.ended || els.input.value.trim().length === 0;
  }

  function setBusy(busy) {
    state.busy = busy;
    els.goodbye.disabled = busy || state.closing || state.ended;
    updateInputUi();
  }

  // ---------- Talking to Oma ----------
  async function sendMessage(rawText) {
    const text = rawText.trim().slice(0, MAX_INPUT_CHARS);
    if (!text || state.busy || state.closing || state.ended) return;
    if (state.userCount >= MAX_USER_MESSAGES) {
      endVisit('nap');
      return;
    }

    const ovenLevel = state.level;
    let endReason = null;
    const userEl = addMessage('user', text);
    state.history.push({ role: 'user', content: text });
    els.input.value = '';
    setBusy(true);

    const thinking = showThinking();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.history,
          temperature: OVEN_LEVELS[ovenLevel].temperature,
          approval: state.approval
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok || !data || typeof data.reply !== 'string' || !data.reply.trim()) {
        const error = new Error('Oma could not answer');
        error.status = response.status;
        throw error;
      }

      thinking.remove();
      const serious = data.serious_mode === true;
      const reply = data.reply.trim();

      state.history.push({ role: 'assistant', content: reply });
      state.userCount += 1;

      addMessage('oma', reply, { serious, ovenLevel });
      applyApproval(serious ? 0 : toApprovalChange(data.approval_change), serious);
      renderPatience();

      if (!serious && state.approval <= 0) {
        endReason = 'ragequit';
      } else if (state.userCount >= MAX_USER_MESSAGES) {
        endReason = 'nap';
      }
      if (endReason) {
        state.closing = true;
        els.input.disabled = true;
      }
    } catch (error) {
      thinking.remove();
      // Take the failed message out of the history so a retry doesn't send it twice.
      state.history.pop();
      userEl.classList.add('is-failed');
      const note = document.createElement('span');
      note.className = 'failed-note';
      note.textContent = 'Oma didn’t hear this one';
      userEl.querySelector('.bubble').appendChild(note);

      addMessage('oma', error.status === 429 ? ERROR_MESSAGES.rateLimit : ERROR_MESSAGES.default, { error: true });
      if (!els.input.value) els.input.value = text;
    } finally {
      setBusy(false);
      if (endReason) {
        window.setTimeout(() => endVisit(endReason), 1400);
      } else if (prefersFinePointer) {
        els.input.focus();
      }
    }
  }

  // ---------- Ending ----------
  function endVisit(reason) {
    if (state.ended) return;
    const ending = ENDINGS[reason] || ENDINGS.goodbye;

    state.ended = true;
    els.input.disabled = true;
    els.goodbye.disabled = true;
    els.cardsArea.classList.add('is-disabled');
    els.cards.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    setBusy(false);

    addMessage('oma', ending.message, { angry: ending.angry });
    els.patienceText.textContent = ending.status;

    window.setTimeout(() => {
      addRecipeCard();
      els.form.hidden = true;
      els.cardsArea.hidden = true;
      els.endText.textContent = ending.endText;
      els.endPanel.hidden = false;
    }, 900);
  }

  // ---------- Start / restart ----------
  function startVisit() {
    state.history = [{ role: 'assistant', content: OPENING_MESSAGE }];
    state.approval = START_APPROVAL;
    state.userCount = 0;
    state.serious = false;
    state.busy = false;
    state.closing = false;
    state.ended = false;

    els.log.innerHTML = '';
    els.input.value = '';
    els.input.disabled = false;
    els.form.hidden = false;
    els.cardsArea.hidden = false;
    els.cardsArea.classList.remove('is-disabled');
    els.cards.querySelectorAll('button').forEach((button) => { button.disabled = false; });
    els.endPanel.hidden = true;
    els.goodbye.disabled = false;

    renderPatience();
    renderMeter(0);
    updateInputUi();
    addMessage('oma', OPENING_MESSAGE);
  }

  // ---------- Init ----------
  function init() {
    Oma.mount(els.portrait, moodFor(START_APPROVAL).expression);
    renderCards();
    bindDial();
    setLevel(DEFAULT_LEVEL);

    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(els.input.value);
    });
    els.input.addEventListener('input', updateInputUi);
    els.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        sendMessage(els.input.value);
      }
    });
    els.goodbye.addEventListener('click', () => {
      if (!state.busy) endVisit('goodbye');
    });
    els.again.addEventListener('click', () => {
      startVisit();
      if (prefersFinePointer) els.input.focus();
    });

    startVisit();
  }

  init();
})();
