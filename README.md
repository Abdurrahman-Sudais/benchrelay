# Benchrelay

An unpublished review website and interactive sample workspace for laboratory method-transfer preparation. Built with Vite, React, JavaScript, Tailwind CSS, and Lucide icons.

## Run it on your computer

1. Install Node.js 24 (version 24.15 or newer in the 24.x series).
2. Unzip this project and open a terminal in the `benchrelay` folder.
3. Install the exact locked dependencies:
   ```sh
   npm ci
   ```
4. Start the website:
   ```sh
   npm run dev
   ```
   Open the local address printed in the terminal.

## Build and check the review version

```sh
npm run build
npm test
npm run preview
```

Open the address printed by the preview command. `dist/` contains the finished website, including prerendered home, privacy, terms, brand, and 404 pages. Essential marketing and leadership content are present in the generated HTML before JavaScript runs. The `tests/` directory contains model and simulated-DOM checks; these do not verify browser layout or external email delivery.

## Deployment, when you approve it

No website has been published as part of this delivery.

1. Keep the default review build until you approve public launch. It includes `noindex, nofollow` on every page and `Disallow: /` in `robots.txt`. These directives discourage indexing; use your hosting provider's access controls if a review URL must remain private.
2. For Netlify, connect the source repository or upload the built `dist` folder. For a repository build, use `npm ci && npm run build` as the build command and `dist` as the publish directory. The included `_redirects` maps the legal and brand routes and serves `404.html` with a 404 response for unknown pages.
3. For Vercel, import the repository. `vercel.json` sets the build command and output directory. Keep `404.html` as the host's custom error document. For any other host, serve the generated directories and use `404.html` with HTTP status 404; do not rewrite unknown pages to the home page.
4. When ready, attach `benchrelay.top` in the host dashboard and apply the DNS records the host supplies. Production metadata uses `https://benchrelay.top`, without `www`.
5. To allow public indexing, set the build environment variable `BENCHRELAY_PUBLIC` to `1`, then rebuild and redeploy. For a local macOS/Linux build:
   ```sh
   BENCHRELAY_PUBLIC=1 npm run build
   ```
   On PowerShell:
   ```powershell
   $env:BENCHRELAY_PUBLIC="1"
   npm run build
   ```
   This changes the robots metadata and `robots.txt` together. The 404 page always remains noindex. Remove that variable to produce a review build again. Setting it in `.env` alone does not configure the Node prerender script: set it in the build environment.

## What needs configuration

- Contact uses `azeem@benchrelay.top`. “Open email draft” hands a draft to the visitor's email application; the visitor still needs to send it. “Copy message” has a selectable-text fallback. There is no submission backend, email delivery service, analytics, or account system.
- Demo records are fictional and remain in browser memory until reset or reload. Technical capabilities are read-only. Added references are explicitly unverified. Exports retain unresolved findings.
- The AWS architecture is proposed. None of those services are connected to the demonstration. Production authentication, storage, extraction, comparison, and review infrastructure require separate implementation.
- Privacy and Terms are review drafts. Confirm the legal operator details, hosting disclosures, and applicable legal requirements before public launch. No jurisdiction, registration, retention schedule, or data-residency promise has been invented.
- Real-browser desktop/mobile layout, keyboard/dialog behaviour, browser download behaviour, email-client handoff, DNS, and hosting response codes still need verification. No hosted deployment was made.

## Brand files

Open `/brand` for spacious screenshot areas and direct downloads. Editable SVG files and transparent PNG exports are in `public/brand/`. Favicon sizes are 16 and 32 pixels; the Apple touch icon is 180 pixels. `social-preview.png` is 1200 × 630. Logo wordmark letters are vector outlines so they do not depend on installed fonts.

The supplied assets are ready to use. To regenerate them, install the optional Python tools `cairosvg` and `fonttools`, ensure DejaVu Sans is available, and run `python3 scripts/assets.py`. Python is not needed to install or build the website.

## Project layout

- `src/App.jsx`: reusable website, route, form, workspace, and detail-panel components.
- `src/model.js`: immutable sample records, review actions, filtering, and export model.
- `src/styles.css`: responsive styles, focus states, and reduced-motion support.
- `scripts/prerender.mjs`: route HTML, metadata, sitemap, and indexing configuration.
- `public/brand/`: logo, favicon, avatar, and social-preview assets.
- `.env.example`: non-secret configuration notes.

No credentials are required. Never add secrets to browser code or `VITE_` variables. The source archive excludes installed packages, caches, and secrets; use `npm ci` to install dependencies.
