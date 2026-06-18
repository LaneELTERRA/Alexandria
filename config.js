// ============================================
// ALEXANDRIA — CONFIGURATION
// ============================================

// PASTE YOUR ANTHROPIC API KEY HERE ↓
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || require('fs').readFileSync('.env','utf8').match(/ANTHROPIC_API_KEY=(.+)/)[1].trim();
// Sourcing day (1 = 1st of every month)
const SOURCING_DAY = 1;

// Read length target (words)
const READ_LENGTH = 2200;

// Languages enabled — add 'de' to unlock German
const LANGUAGES_ENABLED = ['en'];

// Content batch sizes
const LAUNCH_BATCH = 80;
const MONTHLY_BATCH = 30;

// Sources — authority tier
const SOURCES = {
  philosophy: [
    { name: "Stanford Encyclopedia of Philosophy", url: "https://plato.stanford.edu", tier: "authority" },
    { name: "Internet Encyclopedia of Philosophy", url: "https://iep.utm.edu", tier: "authority" },
    { name: "Project Gutenberg", url: "https://www.gutenberg.org", tier: "primary" },
    { name: "Wikisource", url: "https://en.wikisource.org", tier: "primary" }
  ],
  science: [
    { name: "NASA", url: "https://www.nasa.gov", tier: "authority" },
    { name: "CERN", url: "https://home.cern", tier: "authority" },
    { name: "NIH", url: "https://www.nih.gov", tier: "authority" },
    { name: "Chemguide", url: "https://www.chemguide.co.uk", tier: "authority" }
  ],
  reference: [
    { name: "Quanta Magazine", url: "https://www.quantamagazine.org", tier: "reference" },
    { name: "ScienceDaily", url: "https://www.sciencedaily.com", tier: "reference" },
    { name: "Wikipedia", url: "https://en.wikipedia.org", tier: "cross-reference-only" }
  ]
};

// DO NOT EDIT BELOW THIS LINE
if (typeof module !== 'undefined') module.exports = {
  ANTHROPIC_API_KEY, SOURCING_DAY, READ_LENGTH,
  LANGUAGES_ENABLED, LAUNCH_BATCH, MONTHLY_BATCH, SOURCES
};
