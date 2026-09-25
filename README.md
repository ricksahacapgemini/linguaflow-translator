# LinguaFlow

A lightweight English-to-Spanish runtime translator built with React, TypeScript, and Vite.

## Run locally

Install Node.js 18+ first, then run:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```bash
npm run build
npm run preview
```

## Included

- Live translation as English is typed
- Common phrase matching plus word-level fallback translation
- Copy, clear, swap, and Spanish speech playback controls
- Responsive layout for desktop and mobile
- No API key or backend required

## Visitor count

The header shows a local visit count by default. It is stored only in the current browser and does not represent all visitors. For a shared count, configure an HTTPS service that accepts `POST /visit` and returns `{ "count": number }`, then set `VITE_VISITOR_STATS_URL` before building:

```bash
VITE_VISITOR_STATS_URL=https://your-visitor-service.example npm run build
```
