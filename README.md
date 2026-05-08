# NeuroBench — Cognitive Performance Suite

A browser-based cognitive performance benchmarking tool with four tests that measure different aspects of your mental and motor speed. Features a dark, cyberpunk aesthetic with animated Three.js backgrounds on each test screen.

## Tests

### Reaction Speed
Measures raw neural response time. A countdown begins, then the zone turns green at a random delay (1–5 seconds). Click as fast as you can. False starts (clicking before green) are penalized and tracked. Shows last, best, and average reaction times across attempts.

### Typing Speed
60-second typing test with live WPM and accuracy tracking. Characters are highlighted correct (blue), wrong (red underline), or current (white with cursor). Reports final WPM, accuracy percentage, correct characters, and error count.

### Aim Trainer
Click 30 targets of varying sizes that spawn at random positions in the arena. Score is calculated from click speed per target (faster = more points). Shows average ms/click, best click, and total time.

### Sequence Memory
A Simon-style memory game. Watch the colored sequence light up, then repeat it. The sequence grows by one each round and the display speed increases. Game ends on a wrong button press and reports max level reached.

## Project Structure

```
NeuroBench/
├── index.html        # HTML structure and screen layouts
├── styles.css        # All CSS — variables, layout, animations
├── js/
│   ├── state.js      # TYPING_TEXTS constant and GameState (score tracking)
│   ├── utils.js      # countUp, lerp, rand helpers
│   ├── scene.js      # SceneManager class (Three.js wrapper)
│   ├── reaction.js   # Reaction Speed test logic
│   ├── typing.js     # Typing Speed test logic
│   ├── aim.js        # Aim Trainer test logic
│   ├── sequence.js   # Sequence Memory test logic
│   └── router.js     # Screen navigation and keyboard shortcuts
└── README.md
```

## Running Locally

Open `index.html` directly in a modern browser. No build step or server required — all dependencies are loaded from CDN.

**Dependencies (CDN):**
- [Three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) — 3D background animations
- [Syne](https://fonts.google.com/specimen/Syne) — display font
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — monospace font

> Note: Because the JS files use global scope (no ES modules), they must be loaded in the order listed in `index.html`: state → utils → scene → reaction → typing → aim → sequence → router.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Return to dashboard from any test |

## Scoring

| Test | Metric | Notes |
|------|--------|-------|
| Reaction | Milliseconds | Lower is better |
| Typing | WPM (words per minute) | Higher is better |
| Aim | Performance score | `Σ max(0, 1000 − ms_per_click) / 10` |
| Sequence | Level reached | Higher is better |

Session bests and averages are displayed on the dashboard. Scores persist for the duration of the browser session only (no localStorage).
