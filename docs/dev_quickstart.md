# Developer Quickstart

A fast path to set up, test, and build Terms Guardian.

## Prerequisites

- Node.js 18+ and npm 9+
- Linux/macOS/WSL recommended

## Install

```bash
npm ci
```

## Run tests

- Full suite:

```bash
npm test
```

- Watch (interactive reruns):

```bash
npm run test:watch
```

- Minimal config (if you need faster iter):

```bash
npm run test:min
```

## Lint/Format (optional)

```bash
npm run lint
npm run format
```

## Build (development)

```bash
npm run build:dev
```

## Build (production)

```bash
npm run build
```

This outputs the MV3 extension bundle under `dist/`.

## Analyze bundle (optional)

```bash
ANALYZE=true npm run build
```

Generates `bundle-analysis.html` in project root.

## Load the extension in Chrome

1. Build with `npm run build`.
2. Open `chrome://extensions`.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the `dist/` folder.

## Troubleshooting

- If Jest hangs, try: `npm test -- --runInBand --detectOpenHandles`.
- Clear Jest cache if needed:

```bash
npm run test:clear
```

- For Windows users, prefer WSL for consistent tooling.
