// ============================================
// ALEXANDRIA — App Logic
// ============================================

'use strict';

// ── State ─────────────────────────────────────────────────────
const STATE = {
  reads: [],
  challenges: [],
  currentRead: null,
  currentChallenge: null,
  currentDomain: 'philosophy',
  readSource: 'random', // 'random' | 'topic'
  selectedAnswer: null,
  quizAnswered: false,
  highlights: [], // { range, type, text }
  activeTag: null,
  speech: null,
  speechWords: [],
  speechWordIndex: 0,
  coins: 0,
  streak: 0,
  totalReads: 0,
  lastReadDate: null,
  nightMode: false,
  language: 'en'
};

// ── Storage helpers ────────────────────────────────────────────
function saveStorage() {
  localStorage.setItem('alex_coins', STATE.coins);
  localStorage.setItem('alex_streak', STATE.streak);
  localStorage.setItem('alex_reads', STATE.totalReads);
  localStorage.setItem('alex_lastread', STATE.lastReadDate || '');
  localStorage.setItem('alex_night', STATE.nightMode ? '1' : '0');
  localStorage.setItem('alex_lang', STATE.language);
}

function loadStorage() {
  STATE.coins = parseInt(localStorage.getItem('alex_coins') || '0');
  STATE.streak = parseInt(localStorage.getItem('alex_streak') || '0');
  STATE.totalReads = parseInt(localStorage.getItem('alex_reads') || '0');
  STATE.lastReadDate = localStorage.getItem('alex_lastread') || null;
  STATE.nightMode = localStorage.getItem('alex_night') === '1';
  STATE.language = localStorage.getItem('alex_lang') || 'en';
}

// ── Streak logic ───────────────────────────────────────────────
function updateStreak() {
  const today = new Date().toDateString();
  if (STATE.lastReadDate === today) return; // already read today
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (STATE.lastReadDate === yesterday) {
    STATE.streak += 1;
  } else {
    STATE.streak = 1; // reset
  }
  STATE.lastReadDate = today;
}

// ── Navigation ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('screen-' + id);
  if (target) target.classList.remove('hidden');
  // scroll to top
  const scroll = target ? target.querySelector('.scroll-area') : null;
  if (scroll) scroll.scrollTop = 0;
}

// ── Night mode ─────────────────────────────────────────────────
function applyNightMode() {
  document.body.classList.toggle('night', STATE.nightMode);
  document.getElementById('night-toggle').textContent = STATE.nightMode ? '☀' : '☽';
  // update logo SVG stroke color
  const strokes = document.querySelectorAll('#logo-svg polygon, #logo-svg line, #logo-svg circle');
  const col = STATE.nightMode ? '#7eb8d4' : '#8b1a1a';
  strokes.forEach(el => {
    if (el.hasAttribute('stroke')) el.setAttribute('stroke', col);
    if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') el.setAttribute('fill', col);
  });
}

// ── Coin display ───────────────────────────────────────────────
function updateCoinDisplay() {
  document.getElementById('coin-count').textContent = STATE.coins;
  document.getElementById('stat-coins').textContent = STATE.coins;
  document.getElementById('stat-streak').textContent = STATE.streak;
  document.getElementById('stat-reads').textContent = STATE.totalReads;
  document.querySelectorAll('.coin-count-mirror').forEach(el => el.textContent = STATE.coins);
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Load data ──────────────────────────────────────────────────
async function loadData() {
  try {
    const [rRes, cRes] = await Promise.all([
      fetch('data/reads.json'),
      fetch('data/challenges.json')
    ]);
    STATE.reads = await rRes.json();
    STATE.challenges = await cRes.json();
  } catch (e) {
    console.error('Failed to load data:', e);
    STATE.reads = [];
    STATE.challenges = [];
  }
}

// ── Read helpers ───────────────────────────────────────────────
function getReadsForDomain(domain) {
  return STATE.reads.filter(r => r.domain === domain);
}

function getRandomRead() {
  if (!STATE.reads.length) return null;
  return STATE.reads[Math.floor(Math.random() * STATE.reads.length)];
}

function getRandomChallenge() {
  if (!STATE.challenges.length) return null;
  return STATE.challenges[Math.floor(Math.random() * STATE.challenges.length)];
}

// ── Render topic list ──────────────────────────────────────────
function renderTopicList(domain) {
  const list = document.getElementById('topic-reads-list');
  const reads = getReadsForDomain(domain);
  list.innerHTML = '';

  if (!reads.length) {
    list.innerHTML = `<div class="empty-state"><p>No reads available yet.<br>Run the sourcing script to generate content.</p></div>`;
    return;
  }

  reads.forEach(read => {
    const card = document.createElement('div');
    card.className = 'read-card';
    card.innerHTML = `
      <div class="card-cat">${read.domain} · ${read.category || ''}</div>
      <div class="card-title">${read.title}</div>
      <div class="card-meta">${read.readTimeMinutes ? '~' + read.readTimeMinutes + ' min read' : ''}</div>
    `;
    card.addEventListener('click', () => {
      STATE.readSource = 'topic';
      openRead(read);
    });
    list.appendChild(card);
  });
}

// ── Open read ──────────────────────────────────────────────────
function openRead(read) {
  STATE.currentRead = read;
  STATE.selectedAnswer = null;
  STATE.quizAnswered = false;
  stopSpeech();

  document.getElementById('read-title').textContent = read.title;
  document.getElementById('read-category').textContent = read.category || read.domain;
  document.getElementById('read-time').textContent = read.readTimeMinutes ? '~' + read.readTimeMinutes + ' min read' : '';

  // Render body as paragraphs
  const body = document.getElementById('read-body');
  const paragraphs = read.body.split('\n').filter(p => p.trim().length > 0);
  body.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

  // Back button target
  document.getElementById('read-back-btn').setAttribute('data-target',
    STATE.readSource === 'topic' ? 'topic' : 'home');

  // Quiz — show first question
  renderQuiz(read.questions[0], 0);

  // Reset audio
  document.getElementById('audio-fill').style.width = '0%';
  document.getElementById('audio-label').textContent = 'Listen';
  document.getElementById('audio-play-btn').textContent = '▶';

  showScreen('read');
}

// ── Render quiz ────────────────────────────────────────────────
function renderQuiz(question, index) {
  if (!question) return;
  document.getElementById('quiz-question').textContent = question.q;

  const optContainer = document.getElementById('quiz-options');
  optContainer.innerHTML = '';

  question.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      if (STATE.quizAnswered) return;
      STATE.selectedAnswer = i;
      document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('quiz-submit-btn').disabled = false;
    });
    optContainer.appendChild(btn);
  });

  document.getElementById('quiz-submit-btn').disabled = true;
}

// ── Submit quiz ────────────────────────────────────────────────
function submitQuiz() {
  if (STATE.selectedAnswer === null || STATE.quizAnswered) return;
  const read = STATE.currentRead;
  const question = read.questions[0];
  const correct = question.correct;
  const selected = STATE.selectedAnswer;
  STATE.quizAnswered = true;

  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    else if (i === selected && selected !== correct) btn.classList.add('wrong-answer');
  });

  document.getElementById('quiz-submit-btn').disabled = true;
  document.getElementById('quiz-submit-btn').textContent = selected === correct ? '✓ CORRECT' : '✗ INCORRECT';

  if (selected === correct) {
    // Award coin + update stats
    STATE.coins += 1;
    STATE.totalReads += 1;
    updateStreak();
    saveStorage();
    updateCoinDisplay();
    setTimeout(() => showToast('⬡ +1 coin — well read'), 400);
  } else {
    setTimeout(() => showToast('Not quite — read on and try again next time'), 400);
  }
}

// ── Audio / Web Speech ─────────────────────────────────────────
function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  STATE.speech = null;
  document.getElementById('audio-play-btn').textContent = '▶';
  document.getElementById('audio-fill').style.width = '0%';
  document.getElementById('audio-label').textContent = 'Listen';
}

function toggleSpeech() {
  if (!window.speechSynthesis) {
    showToast('Speech not supported on this device');
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    document.getElementById('audio-play-btn').textContent = '▶';
    document.getElementById('audio-label').textContent = 'Listen';
    return;
  }

  const read = STATE.currentRead;
  if (!read) return;

  const utterance = new SpeechSynthesisUtterance(read.body);
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  // Try to pick a natural voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') ||
    v.name.includes('Karen') ||
    v.name.includes('Daniel') ||
    v.name.includes('Google UK') ||
    (v.lang === 'en-GB' && v.localService)
  );
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => {
    document.getElementById('audio-play-btn').textContent = '■';
    document.getElementById('audio-label').textContent = 'Playing...';
  };

  utterance.onend = () => {
    document.getElementById('audio-play-btn').textContent = '▶';
    document.getElementById('audio-fill').style.width = '100%';
    document.getElementById('audio-label').textContent = 'Done';
  };

  // Approximate progress
  const wordCount = read.body.split(' ').length;
  const wordsPerSecond = 2.5;
  const totalSeconds = wordCount / wordsPerSecond;
  let elapsed = 0;
  const interval = setInterval(() => {
    if (!window.speechSynthesis.speaking) { clearInterval(interval); return; }
    elapsed += 0.5;
    const pct = Math.min((elapsed / totalSeconds) * 100, 98);
    document.getElementById('audio-fill').style.width = pct + '%';
    const remaining = Math.max(0, Math.round(totalSeconds - elapsed));
    document.getElementById('audio-label').textContent = remaining + 's left';
  }, 500);

  utterance.onerror = () => clearInterval(interval);
  utterance.onend = () => {
    clearInterval(interval);
    document.getElementById('audio-play-btn').textContent = '▶';
    document.getElementById('audio-fill').style.width = '100%';
    document.getElementById('audio-label').textContent = 'Done';
  };

  window.speechSynthesis.speak(utterance);
}

// ── Challenge ──────────────────────────────────────────────────
function openChallenge() {
  const challenge = getRandomChallenge();
  if (!challenge) {
    showToast('No challenges available yet');
    return;
  }

  STATE.currentChallenge = challenge;
  STATE.highlights = [];
  STATE.activeTag = null;

  // Deactivate all tag buttons
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active-tag'));

  // Render plain text
  const body = document.getElementById('challenge-body');
  body.innerHTML = '';
  const paragraphs = challenge.body.split('\n').filter(p => p.trim().length > 0);
  paragraphs.forEach(p => {
    const el = document.createElement('p');
    el.textContent = p;
    el.style.marginBottom = '16px';
    body.appendChild(el);
  });

  showScreen('challenge');
}

// Tag button selection
function setActiveTag(type) {
  STATE.activeTag = STATE.activeTag === type ? null : type;
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active-tag'));
  if (STATE.activeTag) {
    document.querySelector(`.tag-btn.${type}`).classList.add('active-tag');
  }
}

// Handle text selection in challenge
function handleChallengeSelection() {
  if (!STATE.activeTag) {
    showToast('Select a tag type first');
    return;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return;

  const selectedText = selection.toString().trim();
  const type = STATE.activeTag;

  // Wrap selection in highlight span
  try {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `hl-${type}`;
    span.textContent = selectedText;
    span.dataset.type = type;
    span.title = `Tagged as: ${type}`;

    range.deleteContents();
    range.insertNode(span);

    STATE.highlights.push({ text: selectedText, type });
    selection.removeAllRanges();
  } catch(e) {
    // Selection across elements — skip gracefully
  }
}

// ── Submit challenge ───────────────────────────────────────────
function submitChallenge() {
  const challenge = STATE.currentChallenge;
  if (!challenge) return;

  const userHighlights = STATE.highlights;
  const knownFlaws = challenge.flaws;

  let correct = 0;
  let wrongTags = 0;
  const missed = [];
  const resultItems = [];

  // Check each known flaw
  knownFlaws.forEach(flaw => {
    const found = userHighlights.find(h =>
      h.text.toLowerCase().includes(flaw.excerpt.toLowerCase().slice(0, 20)) ||
      flaw.excerpt.toLowerCase().includes(h.text.toLowerCase().slice(0, 20))
    );
    if (found) {
      if (found.type === flaw.type || (found.type === 'wrong' && flaw.type === 'wrong') || (found.type === 'misleading' && flaw.type === 'misleading')) {
        correct++;
        resultItems.push({ type: 'good', label: 'Correctly identified', text: flaw.explanation });
      } else {
        resultItems.push({ type: 'missed', label: 'Wrong tag', text: `You found this but tagged it as "${found.type}" — it is actually "${flaw.type}". ${flaw.explanation}` });
      }
    } else {
      missed.push(flaw);
      resultItems.push({ type: 'missed', label: 'Missed', text: flaw.explanation });
    }
  });

  // Check for false positives (tagged as wrong/misleading but correct content)
  userHighlights.forEach(h => {
    const matchesFlaw = knownFlaws.find(f =>
      f.excerpt.toLowerCase().includes(h.text.toLowerCase().slice(0, 20)) ||
      h.text.toLowerCase().includes(f.excerpt.toLowerCase().slice(0, 20))
    );
    if (!matchesFlaw && h.type !== 'correct') {
      wrongTags++;
      resultItems.push({ type: 'wrong-block', label: 'False flag', text: `"${h.text.slice(0, 60)}..." — this was accurate content.` });
    }
  });

  // Score
  const total = knownFlaws.length;
  const scoreText = correct === total
    ? `Perfect — you found every flaw.`
    : correct > 0
    ? `You identified ${correct} of ${total} flaws.${missed.length ? ' ' + missed.length + ' were missed.' : ''}`
    : `No flaws correctly identified. Study the explanations below.`;

  // Award coin if at least half correct and no false flags
  const passed = correct >= Math.ceil(total / 2) && wrongTags === 0;
  if (passed) {
    STATE.coins += 1;
    updateStreak();
    saveStorage();
    updateCoinDisplay();
  }

  // Render results
  document.getElementById('score-num').textContent = `${correct}/${total}`;
  document.getElementById('score-text').textContent = scoreText;

  const blocks = document.getElementById('result-blocks');
  blocks.innerHTML = '';
  resultItems.forEach(item => {
    const div = document.createElement('div');
    div.className = `result-block ${item.type}`;
    div.innerHTML = `<div class="result-label">${item.label}</div><div class="result-text">${item.text}</div>`;
    blocks.appendChild(div);
  });

  const reward = document.getElementById('coin-reward');
  reward.style.display = passed ? 'flex' : 'none';

  document.getElementById('results-home-btn').setAttribute('data-target', 'home');
  showScreen('results');
}

// ── Back button handler ────────────────────────────────────────
document.querySelectorAll('[data-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    if (target === 'home') stopSpeech();
    showScreen(target);
  });
});

// Dynamic back btn (read screen)
document.getElementById('read-back-btn').addEventListener('click', function() {
  stopSpeech();
  const target = this.getAttribute('data-target') || 'home';
  showScreen(target);
});

// ── Home button events ─────────────────────────────────────────
document.getElementById('btn-random').addEventListener('click', () => {
  const read = getRandomRead();
  if (!read) { showToast('No reads yet — run sourcing script first'); return; }
  STATE.readSource = 'random';
  openRead(read);
});

document.getElementById('btn-topic').addEventListener('click', () => {
  renderTopicList(STATE.currentDomain);
  showScreen('topic');
});

document.getElementById('btn-challenge').addEventListener('click', openChallenge);

// ── Topic pill events ──────────────────────────────────────────
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    STATE.currentDomain = pill.getAttribute('data-domain');
    renderTopicList(STATE.currentDomain);
  });
});

// ── Night mode toggle ──────────────────────────────────────────
document.getElementById('night-toggle').addEventListener('click', () => {
  STATE.nightMode = !STATE.nightMode;
  applyNightMode();
  saveStorage();
});

// ── Audio button ───────────────────────────────────────────────
document.getElementById('audio-play-btn').addEventListener('click', toggleSpeech);

// ── Quiz submit ────────────────────────────────────────────────
document.getElementById('quiz-submit-btn').addEventListener('click', submitQuiz);

// ── Challenge tag buttons ──────────────────────────────────────
document.getElementById('tag-wrong').addEventListener('click', () => setActiveTag('wrong'));
document.getElementById('tag-misleading').addEventListener('click', () => setActiveTag('misleading'));
document.getElementById('tag-correct').addEventListener('click', () => setActiveTag('correct'));

// ── Challenge text selection ───────────────────────────────────
document.getElementById('challenge-body').addEventListener('mouseup', handleChallengeSelection);
document.getElementById('challenge-body').addEventListener('touchend', () => {
  setTimeout(handleChallengeSelection, 100);
});

// ── Challenge submit ───────────────────────────────────────────
document.getElementById('challenge-submit-btn').addEventListener('click', submitChallenge);

// ── Results home button ────────────────────────────────────────
document.getElementById('results-home-btn').addEventListener('click', () => showScreen('home'));

// ── Register service worker ────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => console.log('SW failed:', e));
  });
}

// ── Init ───────────────────────────────────────────────────────
async function init() {
  loadStorage();
  applyNightMode();
  updateCoinDisplay();
  await loadData();
  showScreen('home');
}

init();
