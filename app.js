// ============================================
// ALEXANDRIA — App Logic v2
// Sequential quiz, knowledge library, impressum
// ============================================

'use strict';

// ── State ─────────────────────────────────────────────────────
const STATE = {
  reads: [],
  challenges: [],
  currentRead: null,
  currentChallenge: null,
  currentDomain: 'philosophy',
  readSource: 'random',
  // Quiz state
  quizCurrentIndex: 0,
  quizAnswers: [],       // array of {selected, correct} per question
  quizDone: false,
  // Challenge state
  highlights: [],
  activeTag: null,
  // User data
  coins: 0,
  streak: 0,
  totalReads: 0,
  lastReadDate: null,
  knowledgeLibrary: [], // array of {id, title, domain, category, passedAt}
  nightMode: false,
  language: 'en'
};

// ── Storage ────────────────────────────────────────────────────
function saveStorage() {
  localStorage.setItem('alex_coins', STATE.coins);
  localStorage.setItem('alex_streak', STATE.streak);
  localStorage.setItem('alex_reads', STATE.totalReads);
  localStorage.setItem('alex_lastread', STATE.lastReadDate || '');
  localStorage.setItem('alex_night', STATE.nightMode ? '1' : '0');
  localStorage.setItem('alex_lang', STATE.language);
  localStorage.setItem('alex_library', JSON.stringify(STATE.knowledgeLibrary));
}

function loadStorage() {
  STATE.coins = parseInt(localStorage.getItem('alex_coins') || '0');
  STATE.streak = parseInt(localStorage.getItem('alex_streak') || '0');
  STATE.totalReads = parseInt(localStorage.getItem('alex_reads') || '0');
  STATE.lastReadDate = localStorage.getItem('alex_lastread') || null;
  STATE.nightMode = localStorage.getItem('alex_night') === '1';
  STATE.language = localStorage.getItem('alex_lang') || 'en';
  try {
    STATE.knowledgeLibrary = JSON.parse(localStorage.getItem('alex_library') || '[]');
  } catch(e) { STATE.knowledgeLibrary = []; }
}

// ── Streak ─────────────────────────────────────────────────────
function updateStreak() {
  const today = new Date().toDateString();
  if (STATE.lastReadDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  STATE.streak = STATE.lastReadDate === yesterday ? STATE.streak + 1 : 1;
  STATE.lastReadDate = today;
}

// ── Navigation ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('screen-' + id);
  if (target) target.classList.remove('hidden');
  const scroll = target ? target.querySelector('.scroll-area') : null;
  if (scroll) scroll.scrollTop = 0;
}

// ── Night mode ─────────────────────────────────────────────────
function applyNightMode() {
  document.body.classList.toggle('night', STATE.nightMode);
  document.getElementById('night-toggle').textContent = STATE.nightMode ? '☀' : '☽';
  const col = STATE.nightMode ? '#7eb8d4' : '#8b1a1a';
  document.querySelectorAll('#logo-svg polygon, #logo-svg line, #logo-svg circle').forEach(el => {
    if (el.hasAttribute('stroke')) el.setAttribute('stroke', col);
    if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') el.setAttribute('fill', col);
  });
}

// ── Coin / stats display ───────────────────────────────────────
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
  setTimeout(() => t.classList.remove('show'), 2400);
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
  } catch(e) {
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
    list.innerHTML = `<div class="empty-state"><p>No reads available yet.</p></div>`;
    return;
  }
  reads.forEach(read => {
    const passed = STATE.knowledgeLibrary.some(l => l.id === read.id);
    const card = document.createElement('div');
    card.className = 'read-card';
    card.innerHTML = `
      <div class="card-cat">${read.domain} · ${read.category || ''}${passed ? ' ✓' : ''}</div>
      <div class="card-title">${read.title}</div>
      <div class="card-meta">${read.readTimeMinutes ? '~' + read.readTimeMinutes + ' min read' : ''}</div>
    `;
    card.addEventListener('click', () => { STATE.readSource = 'topic'; openRead(read); });
    list.appendChild(card);
  });
}

// ── Open read ──────────────────────────────────────────────────
function openRead(read) {
  STATE.currentRead = read;
  STATE.quizCurrentIndex = 0;
  STATE.quizAnswers = [];
  STATE.quizDone = false;
  stopSpeech();

  document.getElementById('read-title').textContent = read.title;
  document.getElementById('read-category').textContent = read.category || read.domain;
  document.getElementById('read-time').textContent = read.readTimeMinutes ? '~' + read.readTimeMinutes + ' min read' : '';

  const body = document.getElementById('read-body');
  const paragraphs = read.body.split('\n').filter(p => p.trim().length > 0);
  body.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

  document.getElementById('read-back-btn').setAttribute('data-target',
    STATE.readSource === 'topic' ? 'topic' : 'home');

  document.getElementById('audio-fill').style.width = '0%';
  document.getElementById('audio-label').textContent = 'Listen';
  document.getElementById('audio-play-btn').textContent = '▶';

  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-result').innerHTML = '';
  document.getElementById('study-again-btn').classList.add('hidden');

  renderCurrentQuestion();
  showScreen('read');
}

// ── Quiz: render current question ──────────────────────────────
function renderCurrentQuestion() {
  const read = STATE.currentRead;
  const questions = read.questions;
  const index = STATE.quizCurrentIndex;
  const container = document.getElementById('quiz-container');
  const submitBtn = document.getElementById('quiz-submit-btn');

  if (index >= questions.length) {
    showQuizResults();
    return;
  }

  const q = questions[index];
  container.innerHTML = `
    <div class="quiz-progress">${index + 1} / ${questions.length}</div>
    <div class="quiz-q" id="quiz-question">${q.q}</div>
    <div class="quiz-options" id="quiz-options"></div>
  `;

  const optContainer = container.querySelector('.quiz-options');
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      optContainer.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      btn.dataset.index = i;
      submitBtn.disabled = false;
      submitBtn.dataset.selected = i;
    });
    optContainer.appendChild(btn);
  });

  submitBtn.disabled = true;
  submitBtn.textContent = index < questions.length - 1 ? 'NEXT QUESTION' : 'SEE RESULTS';
  submitBtn.classList.remove('hidden');
}

// ── Quiz: confirm answer and advance ──────────────────────────
function confirmAnswer() {
  const read = STATE.currentRead;
  const questions = read.questions;
  const index = STATE.quizCurrentIndex;
  const submitBtn = document.getElementById('quiz-submit-btn');
  const selected = parseInt(submitBtn.dataset.selected);

  if (isNaN(selected)) return;

  const q = questions[index];
  const correct = q.correct;

  // Show correct/wrong on current options
  const opts = document.querySelectorAll('.quiz-opt');
  opts.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    else if (i === selected && selected !== correct) btn.classList.add('wrong-answer');
  });

  STATE.quizAnswers.push({ selected, correct, wasCorrect: selected === correct });
  STATE.quizCurrentIndex++;
  submitBtn.disabled = true;

  // Brief pause then advance
  setTimeout(() => {
    renderCurrentQuestion();
  }, 800);
}

// ── Quiz: show final results ───────────────────────────────────
function showQuizResults() {
  const answers = STATE.quizAnswers;
  const correctCount = answers.filter(a => a.wasCorrect).length;
  const total = answers.length;
  const passed = correctCount >= 2;

  const submitBtn = document.getElementById('quiz-submit-btn');
  submitBtn.classList.add('hidden');

  const resultEl = document.getElementById('quiz-result');
  resultEl.style.display = 'block';

  if (passed) {
    resultEl.innerHTML = `
      <div class="quiz-pass">
        <div class="quiz-pass-icon">✓</div>
        <div class="quiz-pass-title">Congratulations!</div>
        <div class="quiz-pass-sub">You passed — ${correctCount}/${total} correct</div>
        <div class="quiz-pass-coin">⬡ +1 coin earned</div>
      </div>
    `;
    // Award coin and add to library
    STATE.coins += 1;
    STATE.totalReads += 1;
    updateStreak();
    // Add to knowledge library if not already there
    const read = STATE.currentRead;
    if (!STATE.knowledgeLibrary.some(l => l.id === read.id)) {
      STATE.knowledgeLibrary.push({
        id: read.id,
        title: read.title,
        domain: read.domain,
        category: read.category || read.domain,
        passedAt: new Date().toISOString()
      });
    }
    saveStorage();
    updateCoinDisplay();
    setTimeout(() => showToast('⬡ +1 coin — added to your library'), 300);
  } else {
    resultEl.innerHTML = `
      <div class="quiz-fail">
        <div class="quiz-fail-icon">✗</div>
        <div class="quiz-fail-title">${correctCount}/${total} correct</div>
        <div class="quiz-fail-sub">2 correct answers needed to pass. Read again and try later.</div>
      </div>
    `;
    document.getElementById('study-again-btn').classList.remove('hidden');
  }
}

// ── Audio / Web Speech ─────────────────────────────────────────
function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  document.getElementById('audio-play-btn').textContent = '▶';
  document.getElementById('audio-fill').style.width = '0%';
  document.getElementById('audio-label').textContent = 'Listen';
}

function toggleSpeech() {
  if (!window.speechSynthesis) { showToast('Speech not supported'); return; }
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
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') || v.name.includes('Karen') ||
    v.name.includes('Daniel') || (v.lang === 'en-GB' && v.localService)
  );
  if (preferred) utterance.voice = preferred;

  const wordCount = read.body.split(' ').length;
  const totalSeconds = wordCount / 2.5;
  let elapsed = 0;
  const interval = setInterval(() => {
    if (!window.speechSynthesis.speaking) { clearInterval(interval); return; }
    elapsed += 0.5;
    document.getElementById('audio-fill').style.width = Math.min((elapsed / totalSeconds) * 100, 98) + '%';
    document.getElementById('audio-label').textContent = Math.max(0, Math.round(totalSeconds - elapsed)) + 's left';
  }, 500);

  utterance.onstart = () => {
    document.getElementById('audio-play-btn').textContent = '■';
    document.getElementById('audio-label').textContent = 'Playing...';
  };
  utterance.onend = () => {
    clearInterval(interval);
    document.getElementById('audio-play-btn').textContent = '▶';
    document.getElementById('audio-fill').style.width = '100%';
    document.getElementById('audio-label').textContent = 'Done';
  };
  utterance.onerror = () => clearInterval(interval);
  window.speechSynthesis.speak(utterance);
}

// ── Challenge ──────────────────────────────────────────────────
function openChallenge() {
  const challenge = getRandomChallenge();
  if (!challenge) { showToast('No challenges available yet'); return; }
  STATE.currentChallenge = challenge;
  STATE.highlights = [];
  STATE.activeTag = null;
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active-tag'));
  const body = document.getElementById('challenge-body');
  body.innerHTML = '';
  challenge.body.split('\n').filter(p => p.trim()).forEach(p => {
    const el = document.createElement('p');
    el.textContent = p;
    el.style.marginBottom = '16px';
    body.appendChild(el);
  });
  showScreen('challenge');
}

function setActiveTag(type) {
  STATE.activeTag = STATE.activeTag === type ? null : type;
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active-tag'));
  if (STATE.activeTag) document.querySelector(`.tag-btn.${type}`).classList.add('active-tag');
}

function handleChallengeSelection() {
  if (!STATE.activeTag) { showToast('Select a tag type first'); return; }
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !selection.toString().trim()) return;
  const selectedText = selection.toString().trim();
  try {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `hl-${STATE.activeTag}`;
    span.textContent = selectedText;
    span.dataset.type = STATE.activeTag;
    range.deleteContents();
    range.insertNode(span);
    STATE.highlights.push({ text: selectedText, type: STATE.activeTag });
    selection.removeAllRanges();
  } catch(e) {}
}

function submitChallenge() {
  const challenge = STATE.currentChallenge;
  if (!challenge) return;
  const knownFlaws = challenge.flaws;
  let correct = 0, wrongTags = 0;
  const resultItems = [];

  knownFlaws.forEach(flaw => {
    const found = STATE.highlights.find(h =>
      h.text.toLowerCase().includes(flaw.excerpt.toLowerCase().slice(0, 20)) ||
      flaw.excerpt.toLowerCase().includes(h.text.toLowerCase().slice(0, 20))
    );
    if (found) {
      if (found.type === flaw.type) {
        correct++;
        resultItems.push({ type: 'good', label: 'Correctly identified', text: flaw.explanation });
      } else {
        resultItems.push({ type: 'missed', label: 'Wrong tag', text: `Tagged as "${found.type}" — it is actually "${flaw.type}". ${flaw.explanation}` });
      }
    } else {
      resultItems.push({ type: 'missed', label: 'Missed', text: flaw.explanation });
    }
  });

  STATE.highlights.forEach(h => {
    const matchesFlaw = knownFlaws.find(f =>
      f.excerpt.toLowerCase().includes(h.text.toLowerCase().slice(0, 20)) ||
      h.text.toLowerCase().includes(f.excerpt.toLowerCase().slice(0, 20))
    );
    if (!matchesFlaw && h.type !== 'correct') {
      wrongTags++;
      resultItems.push({ type: 'wrong-block', label: 'False flag', text: `"${h.text.slice(0, 60)}..." — this was accurate content.` });
    }
  });

  const total = knownFlaws.length;
  const passed = correct >= Math.ceil(total / 2) && wrongTags === 0;
  const scoreText = correct === total ? 'Perfect — you found every flaw.' :
    correct > 0 ? `You identified ${correct} of ${total} flaws.` :
    'No flaws correctly identified. Study the explanations below.';

  if (passed) {
    STATE.coins += 1;
    updateStreak();
    saveStorage();
    updateCoinDisplay();
  }

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
  document.getElementById('coin-reward').style.display = passed ? 'flex' : 'none';
  showScreen('results');
}

// ── Knowledge Library ──────────────────────────────────────────
function renderLibrary() {
  const list = document.getElementById('library-list');
  list.innerHTML = '';
  if (!STATE.knowledgeLibrary.length) {
    list.innerHTML = `<div class="empty-state"><p>No topics mastered yet.<br>Complete a read and pass the quiz to add topics here.</p></div>`;
    return;
  }
  // Sort newest first
  const sorted = [...STATE.knowledgeLibrary].sort((a, b) => new Date(b.passedAt) - new Date(a.passedAt));
  sorted.forEach(item => {
    const card = document.createElement('div');
    card.className = 'read-card';
    const date = new Date(item.passedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    card.innerHTML = `
      <div class="card-cat">${item.domain} · ${item.category} · Passed ${date}</div>
      <div class="card-title">${item.title}</div>
    `;
    list.appendChild(card);
  });
}

// ── Event listeners ────────────────────────────────────────────
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

document.getElementById('btn-library').addEventListener('click', () => {
  renderLibrary();
  showScreen('library');
});

document.getElementById('impressum-link').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('impressum');
});

document.querySelectorAll('[data-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    if (target === 'home') stopSpeech();
    showScreen(target);
  });
});

document.getElementById('read-back-btn').addEventListener('click', function() {
  stopSpeech();
  showScreen(this.getAttribute('data-target') || 'home');
});

document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    STATE.currentDomain = pill.getAttribute('data-domain');
    renderTopicList(STATE.currentDomain);
  });
});

document.getElementById('night-toggle').addEventListener('click', () => {
  STATE.nightMode = !STATE.nightMode;
  applyNightMode();
  saveStorage();
});

document.getElementById('audio-play-btn').addEventListener('click', toggleSpeech);

document.getElementById('quiz-submit-btn').addEventListener('click', confirmAnswer);

document.getElementById('study-again-btn').addEventListener('click', () => {
  // Scroll back to top of read
  const scroll = document.getElementById('read-scroll');
  if (scroll) scroll.scrollTop = 0;
});

document.getElementById('tag-wrong').addEventListener('click', () => setActiveTag('wrong'));
document.getElementById('tag-misleading').addEventListener('click', () => setActiveTag('misleading'));
document.getElementById('tag-correct').addEventListener('click', () => setActiveTag('correct'));

document.getElementById('challenge-body').addEventListener('mouseup', handleChallengeSelection);
document.getElementById('challenge-body').addEventListener('touchend', () => setTimeout(handleChallengeSelection, 100));

document.getElementById('challenge-submit-btn').addEventListener('click', submitChallenge);
document.getElementById('results-home-btn').addEventListener('click', () => showScreen('home'));

// ── Service worker ─────────────────────────────────────────────
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
