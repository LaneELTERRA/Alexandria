// ============================================
// ALEXANDRIA — Sourcing Script v3
// Two-call approach: essay first, questions second
// Saves after every read — safe to interrupt anytime
// ============================================

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
  if (match) process.env.ANTHROPIC_API_KEY = match[1].trim();
}

const config = require('../config.js');
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY || API_KEY === 'paste-your-key-here') {
  console.error('ERROR: No API key found. Check your .env file.');
  process.exit(1);
}

const isUpdate = process.argv.includes('--update');
const BATCH_SIZE = isUpdate ? config.MONTHLY_BATCH : config.LAUNCH_BATCH;

const PHILOSOPHY_TOPICS = [
  "The Problem of Induction — Hume",
  "Kant's Categorical Imperative",
  "Plato's Allegory of the Cave",
  "Nietzsche and the Will to Power",
  "Descartes' Cogito and Radical Doubt",
  "Aristotle's Virtue Ethics",
  "Stoicism and the Dichotomy of Control",
  "Sartre on Bad Faith and Existentialism",
  "The Ship of Theseus — Identity and Change",
  "Utilitarianism — Bentham and Mill",
  "The Trolley Problem and Moral Philosophy",
  "Socrates and the Examined Life",
  "Leibniz and the Best of All Possible Worlds",
  "Spinoza's Pantheism",
  "Locke on Personal Identity",
  "Hegel's Dialectic",
  "Marx and Historical Materialism",
  "Wittgenstein and the Limits of Language",
  "Schopenhauer — The World as Will",
  "Free Will and Determinism",
  "Epicurus and the Philosophy of Pleasure",
  "Simone de Beauvoir and The Second Sex",
  "Albert Camus and the Absurd",
  "John Rawls and the Veil of Ignorance",
  "The Problem of Evil in Philosophy",
  "Phenomenology — Husserl and Heidegger",
  "Pragmatism — William James",
  "The Hard Problem of Consciousness",
  "Bertrand Russell on Logic",
  "The Dao De Jing — Laozi",
  "Buddhist Philosophy and Impermanence",
  "Confucius and the Analects",
  "The Social Contract — Rousseau",
  "Hobbes and the State of Nature",
  "Hannah Arendt on the Banality of Evil",
  "Karl Popper and Falsificationism",
  "Thomas Kuhn and Scientific Revolutions",
  "Foucault and Power Structures",
  "The Myth of Sisyphus — Camus",
  "Zeno's Paradoxes"
];

const SCIENCE_TOPICS = [
  "The Big Bang and the Origin of the Universe",
  "Quantum Entanglement Explained",
  "CRISPR and the Future of Gene Editing",
  "Dark Matter — What We Know",
  "The Theory of General Relativity",
  "How Black Holes Form and Behave",
  "The Double Slit Experiment",
  "DNA — Structure Function and Discovery",
  "The Standard Model of Particle Physics",
  "Entropy and the Arrow of Time",
  "How the Human Brain Forms Memories",
  "Carbon and the Chemistry of Life",
  "Plate Tectonics and Continental Drift",
  "The Periodic Table — A History",
  "The Uncertainty Principle",
  "Photosynthesis at the Molecular Level",
  "The Evolution of Stars",
  "Gravitational Waves",
  "The Human Immune System",
  "String Theory — Promise and Problems",
  "The Origin of Life on Earth",
  "Epigenetics — Beyond the Genetic Code",
  "How Vaccines Work",
  "The Chemistry of the Atmosphere",
  "Neutrinos — The Ghost Particles",
  "How the Moon Was Formed",
  "Stem Cells and Regenerative Medicine",
  "The Speed of Light and Why It Matters",
  "Antimatter — Mirror of the Universe",
  "How Antibiotics Work",
  "Chaos Theory",
  "Exoplanets and the Search for Life",
  "How the Sun Produces Energy",
  "Quantum Computing",
  "The Human Microbiome",
  "Climate Science and the Greenhouse Effect",
  "How the Eye Sees Color",
  "Radioactivity and Nuclear Decay",
  "Bioluminescence",
  "The Physics of Time Dilation"
];

const CHALLENGE_TOPICS = [
  { topic: "Isaac Newton and the History of Gravity", flaws: ["misattribution of heliocentrism to Newton", "false claim Newton's first law had no precedent"] },
  { topic: "Charles Darwin and Natural Selection", flaws: ["survival of the fittest misattributed directly to Darwin", "claim evolution has a goal or direction"] },
  { topic: "Albert Einstein's Theories", flaws: ["Einstein failed school myth", "misrepresenting what E=mc2 actually means"] },
  { topic: "The Ancient Greeks and Democracy", flaws: ["claiming universal suffrage existed in Athens", "Socrates presented as founder of democracy"] },
  { topic: "Sigmund Freud and Psychology", flaws: ["Freud presented as sole founder of all psychology", "unconscious mind as Freud's unique discovery"] },
  { topic: "The Human Brain and Intelligence", flaws: ["we only use 10 percent of our brain", "left brain right brain personality types"] },
  { topic: "Plato and the Theory of Forms", flaws: ["Forms described as physical objects somewhere", "Plato rejecting all empirical observation entirely"] },
  { topic: "Quantum Mechanics and Consciousness", flaws: ["observer effect requires human consciousness", "quantum mechanics directly proves free will"] },
  { topic: "Nietzsche and Nihilism", flaws: ["Nietzsche presented as a pure nihilist", "God is Dead framed as atheist celebration"] },
  { topic: "Vaccines and Herd Immunity", flaws: ["herd immunity only achievable through natural infection", "vaccines cause the disease they prevent"] }
];

function callClaude(prompt, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens || 4000,
      messages: [{ role: "user", content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.content[0].text);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildEssayPrompt(topic, domain) {
  const sourceList = domain === 'philosophy'
    ? 'Stanford Encyclopedia of Philosophy, Internet Encyclopedia of Philosophy, Project Gutenberg'
    : 'NASA, CERN, NIH, Chemguide, Quanta Magazine';

  return `Write an essay for a knowledge app called ALEXANDRIA. Authority sources: ${sourceList}. Wikipedia is cross-reference only.

Topic: "${topic}"

STRICT RULES:
- Write EXACTLY 1000-1200 words. Stop at 1200.
- Tone: intelligent but accessible — like a great essay, not a textbook
- Only include facts verifiable from the authority sources listed
- No headers, no subheadings — flowing prose only
- Start with a compelling opening sentence
- Domain: ${domain}

Return ONLY the essay text. No title, no preamble, no commentary.`;
}

function buildQuestionsPrompt(topic, essayText) {
  return `Based on this essay about "${topic}", write exactly 3 multiple choice questions.

Essay:
${essayText.slice(0, 2000)}

RULES:
- Each question must have exactly ONE correct answer
- The other two options must be clearly wrong to someone who read the essay
- Questions must be answerable from the essay text only
- Keep questions and options short

Return ONLY this JSON, no preamble, no markdown backticks:
[
  {"q": "string", "options": ["string", "string", "string"], "correct": 0},
  {"q": "string", "options": ["string", "string", "string"], "correct": 1},
  {"q": "string", "options": ["string", "string", "string"], "correct": 2}
]`;
}

function buildChallengePrompt(item) {
  return `Write a CHALLENGE text for a knowledge app. The text must appear accurate but contain subtle flaws.

Topic: "${item.topic}"
Flaws to embed: ${item.flaws.join(' AND ')}

RULES:
- Write exactly 150-200 words
- Must sound like a legitimate encyclopedia entry
- Embed flaws naturally — not obviously wrong
- Mix accurate information with the flawed claims

Return ONLY this JSON, no preamble, no markdown:
{"title": "string", "body": "string", "flaws": [{"type": "wrong", "excerpt": "short exact phrase from your text", "explanation": "why this is wrong"}]}`;
}

const dataPath = path.join(__dirname, '../data/reads.json');
const challengePath = path.join(__dirname, '../data/challenges.json');

function loadJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch(e) { return []; }
}

function saveRead(read) {
  const existing = loadJSON(dataPath);
  existing.push(read);
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2));
}

function saveChallenge(challenge) {
  const existing = loadJSON(challengePath);
  existing.push(challenge);
  fs.writeFileSync(challengePath, JSON.stringify(existing, null, 2));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generate() {
  console.log(`\n🏛  ALEXANDRIA — Sourcing Script v3`);
  console.log(`Mode: ${isUpdate ? 'Monthly update' : 'Launch batch'} (${BATCH_SIZE} reads)`);
  console.log(`Two-call approach: essay first, questions second`);
  console.log(`Saves after every read — safe to interrupt anytime`);
  console.log(`─────────────────────────────────\n`);

  const existingReads = loadJSON(dataPath);
  console.log(`Already in library: ${existingReads.length} reads\n`);

  const half = Math.floor(BATCH_SIZE / 2);
  const shuffledPhilo = [...PHILOSOPHY_TOPICS].sort(() => Math.random() - 0.5).slice(0, half);
  const shuffledSci = [...SCIENCE_TOPICS].sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE - half);
  const allTopics = [
    ...shuffledPhilo.map(t => ({ topic: t, domain: 'philosophy' })),
    ...shuffledSci.map(t => ({ topic: t, domain: 'science' }))
  ];

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allTopics.length; i++) {
    const { topic, domain } = allTopics[i];
    console.log(`[${i + 1}/${allTopics.length}] ${topic}`);

    try {
      process.stdout.write(`  → Writing essay... `);
      const essayText = await callClaude(buildEssayPrompt(topic, domain), 2000);
      console.log(`✓ (${essayText.split(' ').length} words)`);
      await sleep(800);

      process.stdout.write(`  → Generating questions... `);
      const questionsRaw = await callClaude(buildQuestionsPrompt(topic, essayText), 1000);
      const questionsClean = questionsRaw.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(questionsClean);
      console.log(`✓`);

      const read = {
        id: `read_${Date.now()}_${i}`,
        title: topic,
        category: domain === 'philosophy' ? 'Philosophy' : 'Science',
        domain,
        readTimeMinutes: Math.round(essayText.split(' ').length / 200),
        body: essayText,
        questions,
        translations: { de: { title: '', body: '', questions: [] } },
        generatedAt: new Date().toISOString()
      };

      saveRead(read);
      successCount++;
      console.log(`  ✓ Saved. Library now has ${loadJSON(dataPath).length} reads.\n`);

    } catch (e) {
      failCount++;
      console.log(`  ✗ Failed: ${e.message.slice(0, 80)}\n`);
    }

    await sleep(1000);
  }

  console.log(`─────────────────────────────────`);
  console.log(`✓ ${successCount} reads generated and saved`);
  console.log(`✗ ${failCount} failed`);

  if (!isUpdate) {
    console.log(`\nGenerating ${CHALLENGE_TOPICS.length} challenge texts...\n`);
    for (let i = 0; i < CHALLENGE_TOPICS.length; i++) {
      const item = CHALLENGE_TOPICS[i];
      process.stdout.write(`[${i + 1}/${CHALLENGE_TOPICS.length}] ${item.topic}... `);
      try {
        const raw = await callClaude(buildChallengePrompt(item), 1000);
        const clean = raw.replace(/```json|```/g, '').trim();
        const challenge = JSON.parse(clean);
        challenge.id = `challenge_${Date.now()}_${i}`;
        saveChallenge(challenge);
        console.log(`✓ saved`);
      } catch (e) {
        console.log(`✗ failed: ${e.message.slice(0, 60)}`);
      }
      await sleep(800);
    }
  }

  console.log(`\n✓ All done. Now run:`);
  console.log(`git add . && git commit -m "Add content" && git push origin main\n`);
}

generate().catch(console.error);