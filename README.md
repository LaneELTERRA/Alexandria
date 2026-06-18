# 🏛 ALEXANDRIA

> Knowledge is the only light

A PWA (Progressive Web App) for daily philosophy and science reads, with audio, challenge mode, and a coin system. Fully offline after first load.

---

## Setup (one time)

### 1. Install tools
- [Git](https://git-scm.com) — download and install
- [Node.js LTS](https://nodejs.org) — download and install
- [VS Code](https://code.visualstudio.com) — recommended editor

### 2. GitHub
- Create account at [github.com](https://github.com)
- Create new repository called `alexandria`
- Go to repo Settings → Pages → Source: Deploy from branch → main → / (root) → Save

### 3. Anthropic API
- Create account at [console.anthropic.com](https://console.anthropic.com)
- Add ~$10 credit via credit/debit card
- Go to API Keys → Create Key → copy it

### 4. Configure
Open `config.js` and replace `"paste-your-key-here"` with your API key:
```js
const ANTHROPIC_API_KEY = "sk-ant-api03-your-key-here";
```

---

## First launch

```bash
# In terminal, navigate to your alexandria folder
node sourcing/generate.js
# Wait 5-10 minutes — generates 150 reads
```

Then push to GitHub:
```bash
git init
git add .
git commit -m "Alexandria launch"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/alexandria.git
git push -u origin main
```

Your app is live at: `https://YOURUSERNAME.github.io/alexandria`

---

## Add to iPhone home screen

1. Open Safari on your iPhone
2. Go to `https://YOURUSERNAME.github.io/alexandria`
3. Tap the Share button (box with arrow)
4. Tap "Add to Home Screen"
5. Name it **Alexandria**
6. Tap Add

The app icon (parchment background, red A) will appear on your home screen.

---

## Monthly sourcing (1st of every month)

```bash
node sourcing/generate.js --update
git add .
git commit -m "Monthly update"
git push origin main
```

That's it. All users get the new reads next time they connect.

---

## Unlock German (when ready)

In `config.js`, change:
```js
const LANGUAGES_ENABLED = ['en'];
```
to:
```js
const LANGUAGES_ENABLED = ['en', 'de'];
```
Then run a full sourcing day — German versions will generate automatically.

---

## Cost
- Launch batch: ~$6 one-time
- Monthly update: ~$1.50
- Hosting: free (GitHub Pages)
- Everything else: free forever
