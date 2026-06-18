// ============================================
// ALEXANDRIA — SOURCING SCRIPT
// Run: node sourcing/generate.js          (launch batch)
// Run: node sourcing/generate.js --update (monthly 30)
// ============================================

const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config.js');

const isUpdate = process.argv.includes('--update');
const BATCH_SIZE = isUpdate ? config.MONTHLY_BATCH : config.LAUNCH_BATCH;

// ── Topic pools ──────────────────────────────────────────────
const PHILOSOPHY_TOPICS = [
  "The Problem of Induction — Hume",
  "Kant's Categorical Imperative",
  "Plato's Allegory of the Cave",
  "Nietzsche and the Will to Power",
  "Descartes' Cogito and Radical Doubt",
  "Aristotle's Virtue Ethics",
  "Stoicism and the Dichotomy of Control",
  "Existentialism — Sartre on Bad Faith",
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
  "The Paradox of Free Will and Determinism",
  "Epicurus and the Philosophy of Pleasure",
  "Simone de Beauvoir and The Second Sex",
  "Albert Camus and the Absurd",
  "John Rawls and the Veil of Ignorance",
  "The Problem of Evil in Philosophy",
  "Phenomenology — Husserl and Heidegger",
  "Pragmatism — William James",
  "The Nature of Consciousness — Chalmers",
  "Bertrand Russell on Logic and Mathematics",
  "The Dao De Jing — Laozi's Philosophy",
  "Buddhist Philosophy and Impermanence",
  "Confucius and the Analects",
  "The Social Contract — Rousseau",
  "Hobbes and the State of Nature",
  "Hannah Arendt on the Banality of Evil",
  "Karl Popper and Falsificationism",
  "Thomas Kuhn and Scientific Revolutions",
  "Foucault and Power Structures",
  "Derrida and Deconstruction",
  "The Myth of Sisyphus",
  "Zeno's Paradoxes",
  "The Allegory of the Sun — Plato",
  "Aristotle's Metaphysics",
  "The Ethics of Stoic Cosmopolitanism",
  "Machiavelli and Political Realism",
  "Montaigne and the Essay as Philosophy",
  "Pascal's Wager",
  "Spinoza's Ethics",
  "The Frankfurt School — Critical Theory",
  "Judith Butler on Gender Performativity",
  "Peter Singer and Effective Altruism",
  "Derek Parfit on Personal Identity",
  "The Chinese Room Argument — Searle",
  "Nagel's What Is It Like to Be a Bat",
  "The Gettier Problem in Epistemology",
  "Functionalism vs Dualism in Philosophy of Mind",
  "Virtue Epistemology",
  "The Nature of Time — McTaggart",
  "Merleau-Ponty and Embodied Cognition",
  "The Analytic-Continental Divide",
  "Moral Relativism vs Universalism",
  "The Is-Ought Problem — Hume",
  "Social Constructivism",
  "The Problem of Other Minds",
  "Infinity in Philosophy and Mathematics",
  "The Meaning of Life — Philosophical Perspectives",
  "Death and Dying — Epicurus to Heidegger",
  "Philosophy of Language — Frege and Russell",
  "The Nature of Beauty — Aesthetics",
  "Environmental Ethics",
  "Animal Rights Philosophy — Singer and Regan",
  "Philosophy of Religion — Anselm's Ontological Argument",
  "The Hard Problem of Consciousness",
  "Compatibilism and Free Will",
  "Moral Luck — Nagel and Williams"
];

const SCIENCE_TOPICS = [
  "The Big Bang and the Origin of the Universe",
  "Quantum Entanglement Explained",
  "CRISPR and the Future of Gene Editing",
  "Dark Matter — What We Know and Don't Know",
  "The Theory of General Relativity",
  "How Black Holes Form and Behave",
  "The Double Slit Experiment",
  "DNA — Structure, Function, and Discovery",
  "The Standard Model of Particle Physics",
  "Entropy and the Arrow of Time",
  "How the Human Brain Forms Memories",
  "The Chemistry of Life — Carbon and Organic Molecules",
  "Plate Tectonics and Continental Drift",
  "The Periodic Table — A History",
  "Quantum Mechanics and the Uncertainty Principle",
  "Photosynthesis at the Molecular Level",
  "The Evolution of Stars — from Nebula to Supernova",
  "Gravitational Waves — Detection and Meaning",
  "The Human Immune System",
  "String Theory — Promise and Problems",
  "The Origin of Life on Earth",
  "Epigenetics — Beyond the Genetic Code",
  "How Vaccines Work",
  "The Chemistry of the Atmosphere",
  "Neutrinos — The Ghost Particles",
  "The Higgs Boson and the God Particle",
  "How the Moon Was Formed",
  "The Chemistry of Explosions",
  "Stem Cells and Regenerative Medicine",
  "The Speed of Light and Why It Matters",
  "Antimatter — Mirror of the Universe",
  "How Antibiotics Work and Why They're Failing",
  "The Mathematics of Chaos Theory",
  "Exoplanets and the Search for Life",
  "How Nuclear Reactions Power the Sun",
  "The Chemistry of Sleep",
  "Quantum Computing — How It Works",
  "The Microbiome — Bacteria and Human Health",
  "Climate Science — The Greenhouse Effect",
  "How the Eye Sees Color",
  "The Discovery of the Electron",
  "Radioactivity and Nuclear Decay",
  "How Cells Divide — Mitosis and Meiosis",
  "The Chemistry of Drugs and Neurotransmitters",
  "Mars — Geology, Atmosphere, and Possibility of Life",
  "How Sound Waves Work",
  "The Physics of Flight",
  "Nanotechnology — Science at the Smallest Scale",
  "How Crystals Form",
  "Bioluminescence — Chemistry of Living Light",
  "The Human Genome Project",
  "Supernovae and the Creation of Elements",
  "How Enzymes Work",
  "The Physics of Time Dilation",
  "Ocean Chemistry and Acidification",
  "How Viruses Replicate",
  "The Discovery of Penicillin",
  "Fermentation — Chemistry and Biology",
  "How the Ear Processes Sound",
  "Thermodynamics — The Four Laws",
  "The Chemistry of Fire",
  "How Telescopes Work",
  "Protein Folding and Misfolding",
  "The Physics of Superconductivity",
  "How Lightning Forms",
  "The Chemistry of Perfume",
  "How Birds Navigate Using Magnetism",
  "Plasma — The Fourth State of Matter",
  "The Science of Aging",
  "How Solar Panels Convert Light to Energy",
  "The Discovery of Oxygen",
  "How the Liver Processes Toxins",
  "Symmetry in Physics and Nature"
];

const CHALLENGE_TOPICS = [
  { topic: "Isaac Newton and the History of Gravity", flaws: ["misattribution of heliocentrism", "false claim about first law originality"] },
  { topic: "Charles Darwin and Natural Selection", flaws: ["survival of the fittest misquote", "claim evolution has a direction"] },
  { topic: "Albert Einstein's Theories", flaws: ["Einstein failed school myth", "misattributing E=mc2 meaning"] },
  { topic: "The Ancient Greeks and Democracy", flaws: ["claiming universal suffrage in Athens", "Socrates as founder of democracy"] },
  { topic: "The Renaissance and Scientific Revolution", flaws: ["Dark Ages as total intellectual void", "Church universally opposed all science"] },
  { topic: "Sigmund Freud and Psychology", flaws: ["Freud as founder of all psychology", "unconscious mind as Freud's sole discovery"] },
  { topic: "The Speed of Light as Universal Constant", flaws: ["nothing can travel faster than light in any medium", "light speed same in all materials"] },
  { topic: "The Human Brain and Intelligence", flaws: ["we only use 10% of our brain", "left brain right brain personality myth"] },
  { topic: "Plato and the Theory of Forms", flaws: ["Forms as physical objects", "Plato rejecting all empirical knowledge"] },
  { topic: "Karl Marx and Communism", flaws: ["Marx advocating violent revolution always", "Das Kapital as a political manifesto"] },
  { topic: "The Big Bang as an Explosion", flaws: ["Big Bang as explosion in space", "universe expanding into something"] },
  { topic: "Vaccines and Herd Immunity", flaws: ["herd immunity only through infection", "vaccines causing the disease they prevent"] },
  { topic: "Quantum Mechanics and Consciousness", flaws: ["observer effect requiring human consciousness", "quantum mechanics proving free will"] },
  { topic: "Nietzsche and Nihilism", flaws: ["Nietzsche as pure nihilist", "God is Dead as atheist celebration"] },
  { topic: "The Roman Empire and Its Fall", flaws: ["Rome fell solely due to barbarian invasion", "Christianity as sole cause of decline"] }
];

// ── API call ──────────────────────────────────────────────────
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.ANTHROPIC_API_KEY,
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

// ── Prompt builders ───────────────────────────────────────────
function buildReadPrompt(topic, domain) {
  const sourceList = domain === 'philosophy'
    ? 'Stanford Encyclopedia of Philosophy, Internet Encyclopedia of Philosophy, Project Gutenberg'
    : 'NASA, CERN, NIH, Chemguide, Quanta Magazine';

  return `You are generating content for ALEXANDRIA, a knowledge app. Your source authorities are: ${sourceList}. Wikipedia may only be used to cross-check structure, never as a primary source.

Generate a read on the topic: "${topic}"

STRICT RULES:
- Length: exactly 2000-2500 words
- Tone: intelligent but accessible — like a great essay, not a textbook
- Accuracy: only include information verifiable from the authority sources listed
- No hallucination: if uncertain about a fact, omit it
- Drop cap worthy opening — start with a compelling first sentence
- No headers or subheadings — flowing prose only
- Domain: ${domain}

Then generate exactly 3 multiple choice questions about the text. Each question must have exactly one unambiguously correct answer. A wrong answer must be clearly wrong to someone who read the text carefully.

Respond ONLY with valid JSON in this exact format, no preamble, no markdown:
{
  "title": "string",
  "category": "string (subcategory e.g. Epistemology, Particle Physics)",
  "domain": "${domain}",
  "readTimeMinutes": number,
  "body": "string (full essay text)",
  "sourceNote": "string (which authority source this is based on)",
  "questions": [
    {
      "q": "string",
      "options": ["string", "string", "string"],
      "correct": 0
    }
  ],
  "translations": {
    "de": {
      "title": "",
      "body": "",
      "questions": []
    }
  }
}`;
}

function buildChallengePrompt(item) {
  return `You are generating a CHALLENGE text for ALEXANDRIA, a knowledge app. 

Topic: "${item.topic}"
Known flaws to embed: ${item.flaws.join(', ')}

STRICT RULES:
- Length: 200-350 words
- The text must appear coherent, well-written, and largely accurate
- Embed the listed flaws subtly — they should require thought to identify, not be obvious
- The text should read like a legitimate encyclopedia entry
- Do NOT make the flaws cartoonishly obvious
- Mix correct information with the flawed claims naturally

Respond ONLY with valid JSON, no preamble, no markdown:
{
  "title": "string",
  "body": "string",
  "flaws": [
    {
      "type": "wrong|misleading",
      "excerpt": "exact phrase from the text that is flawed",
      "explanation": "string explaining why this is wrong or misleading"
    }
  ]
}`;
}

// ── Sleep helper ──────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Main generation ───────────────────────────────────────────
async function generate() {
  console.log(`\n🏛  ALEXANDRIA — Sourcing Script`);
  console.log(`Mode: ${isUpdate ? 'Monthly update (30 reads)' : 'Launch batch (' + BATCH_SIZE + ' reads)'}`);
  console.log(`─────────────────────────────────\n`);

  // Load existing data
  const dataPath = path.join(__dirname, '../data/reads.json');
  const challengePath = path.join(__dirname, '../data/challenges.json');

  let existingReads = [];
  let existingChallenges = [];

  if (fs.existsSync(dataPath)) {
    existingReads = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  if (fs.existsSync(challengePath)) {
    existingChallenges = JSON.parse(fs.readFileSync(challengePath, 'utf8'));
  }

  // Build topic queue
  const allTopics = [];
  const half = Math.floor(BATCH_SIZE / 2);

  // Shuffle and pick
  const shuffledPhilo = [...PHILOSOPHY_TOPICS].sort(() => Math.random() - 0.5).slice(0, half);
  const shuffledSci = [...SCIENCE_TOPICS].sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE - half);

  shuffledPhilo.forEach(t => allTopics.push({ topic: t, domain: 'philosophy' }));
  shuffledSci.forEach(t => allTopics.push({ topic: t, domain: 'science' }));

  const newReads = [];
  const newChallenges = [];

  // Generate reads
  for (let i = 0; i < allTopics.length; i++) {
    const { topic, domain } = allTopics[i];
    console.log(`[${i + 1}/${allTopics.length}] Generating: ${topic}`);

    try {
      const raw = await callClaude(buildReadPrompt(topic, domain));
      const clean = raw.replace(/```json|```/g, '').trim();
      const read = JSON.parse(clean);
      read.id = `read_${Date.now()}_${i}`;
      read.generatedAt = new Date().toISOString();
      newReads.push(read);
      process.stdout.write(`  ✓ Done (${read.readTimeMinutes} min read)\n`);
    } catch (e) {
      console.log(`  ✗ Failed: ${e.message}`);
    }

    // Rate limit buffer
    await sleep(1200);
  }

  // Generate challenges (only on launch, or every 3 months)
  if (!isUpdate) {
    console.log(`\nGenerating challenge texts...\n`);
    for (let i = 0; i < CHALLENGE_TOPICS.length; i++) {
      const item = CHALLENGE_TOPICS[i];
      console.log(`[${i + 1}/${CHALLENGE_TOPICS.length}] Challenge: ${item.topic}`);
      try {
        const raw = await callClaude(buildChallengePrompt(item));
        const clean = raw.replace(/```json|```/g, '').trim();
        const challenge = JSON.parse(clean);
        challenge.id = `challenge_${Date.now()}_${i}`;
        newChallenges.push(challenge);
        process.stdout.write(`  ✓ Done\n`);
      } catch (e) {
        console.log(`  ✗ Failed: ${e.message}`);
      }
      await sleep(1200);
    }
  }

  // Save
  const allReads = [...existingReads, ...newReads];
  const allChallenges = [...existingChallenges, ...newChallenges];

  fs.writeFileSync(dataPath, JSON.stringify(allReads, null, 2));
  if (!isUpdate) {
    fs.writeFileSync(challengePath, JSON.stringify(allChallenges, null, 2));
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✓ ${newReads.length} reads generated`);
  console.log(`✓ ${newChallenges.length} challenges generated`);
  console.log(`✓ Total reads in library: ${allReads.length}`);
  console.log(`\nNext step: git add . && git commit -m "sourcing update" && git push origin main\n`);
}

generate().catch(console.error);
