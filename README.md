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
npm run test:backend
npm run preview
```

`npm run test:backend` runs the Python Lambda tests (standard library only, Python 3.10+). `vite preview` does not resolve clean URLs, so open `/app/` with a trailing slash there; Netlify, Vercel and Cloudflare serve `/app`.

Open the address printed by the preview command. `dist/` contains the finished website, including prerendered home, prototype (`/app`), privacy, terms, brand, and 404 pages. Essential marketing and leadership content are present in the generated HTML before JavaScript runs. The `tests/` directory contains model and simulated-DOM checks; these do not verify browser layout or external email delivery.

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

- Contact uses `azeem@benchrelay.top`. By default it opens an email draft; setting the HubSpot variables in `.env.example` makes it submit to HubSpot instead (see `docs/crm-plan.md`). “Open email draft” hands a draft to the visitor's email application; the visitor still needs to send it. “Copy message” has a selectable-text fallback. There is no submission backend, email delivery service, analytics, or account system.
- Home-page demo records are fictional and remain in browser memory until reset or reload. The prototype at `/app` saves its fictional state in `localStorage` (key `benchrelay-prototype-v1`) and has a reset button. Technical capabilities are read-only. Added references are explicitly unverified. Exports retain unresolved findings.
- The AWS architecture is proposed. None of those services are connected to the demonstration. Production authentication, storage, extraction, comparison, and review infrastructure require separate implementation.
- Privacy and Terms are review drafts. Confirm the legal operator details, hosting disclosures, and applicable legal requirements before public launch. No jurisdiction, registration, retention schedule, or data-residency promise has been invented.
- Real-browser desktop/mobile layout, keyboard/dialog behaviour, browser download behaviour, email-client handoff, DNS, and hosting response codes still need verification. No hosted deployment was made.

## Interactive prototype (`/app`)

A full method-transfer readiness workspace with fictional data. Use **Demo as** to switch person and role, and **Reset demo data** to restore the seed.

- **Method owner** (Mira Evans): dashboard, transfers, **New transfer**, and per transfer: *Requirements* (map to equipment, see unit-converted comparisons and calibration checks, ask the receiving lab, propose a disposition), *AI suggestions*, *Requests*, *Readiness* and *Activity*. Exports a JSON readiness checklist.
- **Receiving lab** (Leon Hart): requests addressed to the lab, and the equipment register (capability values with their source, calibration records). No access to assessments.
- **Expert reviewer** (Nia Brooks): review queue, approval of compensating measures, and the readiness decision with a written rationale. Independent of the method owner.
- **Administrator** (Ravi Kumar): aggregates, roles, policy (calibration margin, AI on/off), audit log with CSV export, permissions matrix.

Try this path: as Mira, open TR-017 → REQ-01 and remap it to OV-07 (250 °C). Confirm the AI mapping for REQ-07. Ask the lab for the REQ-03 gauge resolution and the REQ-06 logger calibration, then propose a compensating measure for REQ-05 uniformity. Switch to Leon and record the values. Switch to Nia, approve the measure and record readiness.

**Real:** the evaluation engine (`src/app/engine.js`), permissions, the gates, revocation, the audit log, exports and persistence. **Simulated:** document upload and extraction (values are typed), AI (a word-overlap rule with the Bedrock output shape) and sign-in.

## Website additions, backend and docs

- Home page: prototype call to action, benefits, use cases, safeguards, plans (`#pricing`: “Pricing on request”, with no invented prices) and FAQ. The early-access form adds role and transfer volume, consent, an optional updates box and a honeypot.
- `backend/lambdas/evaluate_readiness` and `suggest_mappings`, with `backend/tests/fixtures/cases.json` shared with `tests/engine.test.mjs`.
- `db/schema.sql`: PostgreSQL schema with row-level security and database-enforced gates. `db/test_rls.sql` verifies it on a scratch database: `createdb benchrelay_test && psql -v ON_ERROR_STOP=1 -d benchrelay_test -f db/schema.sql -f db/test_rls.sql`.
- `docs/architecture.md`, `docs/safeguards.md`, `docs/crm-plan.md`.

## QA for the StudyPatch-parity revision (29 October 2026)

All passing: `npm test` (16 Node tests: the original model, UI and production-client tests, plus shared fixtures, workflow and permissions, lead validation and the four-role prototype loop) and `npm run test:backend` (5 Python tests). `db/test_rls.sql` printed ALL CHECKS PASSED on PostgreSQL 16. Headless Chromium at 1440×900 and 390×844 on the home page, `/app/`, requirement and AI views, and `/privacy/`: no console or page errors and no horizontal overflow. Not claimed: screen-reader and real-device checks, live HubSpot submission, anything on AWS.

## Brand files

Open `/brand` for spacious screenshot areas and direct downloads. Editable SVG files and transparent PNG exports are in `public/brand/`. Favicon sizes are 16 and 32 pixels; the Apple touch icon is 180 pixels. `social-preview.png` is 1200 × 630. Logo wordmark letters are vector outlines so they do not depend on installed fonts.

The supplied assets are ready to use. To regenerate them, install the optional Python tools `cairosvg` and `fonttools`, ensure DejaVu Sans is available, and run `python3 scripts/assets.py`. Python is not needed to install or build the website.

## Project layout

- `src/App.jsx`: reusable website, route, form, workspace, and detail-panel components.
- `src/app/`: prototype (`engine.js` rules, `actions.js` permission-checked changes, `seed.js`, role views, `app.css`).
- `src/Sections.jsx`, `src/lead.js`: new home sections and lead-form logic.
- `src/model.js`: immutable sample records, review actions, filtering, and export model.
- `src/styles.css`: responsive styles, focus states, and reduced-motion support.
- `scripts/prerender.mjs`: route HTML, metadata, sitemap, and indexing configuration.
- `public/brand/`: logo, favicon, avatar, and social-preview assets.
- `.env.example`: non-secret configuration notes.

No credentials are required. Never add secrets to browser code or `VITE_` variables. The source archive excludes installed packages, caches, and secrets; use `npm ci` to install dependencies.
