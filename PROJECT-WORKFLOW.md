# PROJECT WORKFLOW — Mahmoud & Sara

## 1. Project Identity

- Product name: **MAHMOUD & SARA — Ultimate Love V7 / ألبوم الذكريات**.
- Repository: https://github.com/mahmoudhamdyali11-cyber/mahmoudlovesara-agent
- Production host: https://mahmoudlovesara-yafta.vercel.app
- Package version: **1.0.0** (release package version; not an assertion that every manual acceptance test has passed).
- Main technologies: single-document HTML/CSS/JavaScript frontend; Eve agent framework; Vercel deployment and AI Gateway; Supabase Auth, Postgres and Storage.
- Firebase: **not configured or used by the current repository**. Do not assume Firebase hosting, authentication, or database support exists.

This repository contains two related parts that should be kept distinct:
1. The romantic couple album experience rendered from the root HTML page.
2. An Eve agent runtime and its Vercel / Supabase / Slack connections. The presence of the agent configuration does not prove that a visitor-facing UI is connected to the agent.

## 2. Architecture

### Browser app

The canonical frontend is `index.html`. The release file `PROJECT-MASTER.html` is a byte-for-byte copy of that source at packaging time; it is not a rewritten implementation. The primary HTML contains most page markup, CSS and application JavaScript. The Supabase JavaScript client is bundled inline. GSAP and SortableJS are loaded from a CDN; typography is loaded from Google Fonts; the music player points to a remote Pixabay audio file.

Persistence uses:
- localStorage for preferences, points and a JSON-compatible photo state.
- IndexedDB for a larger local photo state.
- Supabase for authenticated album metadata and photo objects when cloud sign-in is available.

At startup, the app attempts the cloud load; when cloud loading does not yield photos, it falls back to IndexedDB and then localStorage. `DEFAULT_PHOTOS` is empty in the inspected release source. User photos stored in browser storage remain device/browser-specific until exported or uploaded to the authenticated cloud album.

### Cloud services

- Supabase project ref: `clldasxqjluqwojmmntr`.
- Browser API URL: https://clldasxqjluqwojmmntr.supabase.co.
- Browser uses a Supabase **publishable** key. This key is intended for public clients; it is not a service-role secret. Access must be enforced by Auth and Row Level Security.
- `public.photos` holds album metadata. Photo objects are stored in the Storage bucket named `photos`.
- The production `photos` bucket was verified as private. The public Storage read policy was removed and replaced with an authenticated album-owner read policy. The client requests signed photo URLs that expire after 24 hours.
- The `public.album_owners` table is the allowlist used by `public.is_photo_album_owner()`, which compares the authenticated JWT email against the allowlist.

### Eve / Vercel agent

- `agent/agent.ts` defines the model as `openai/gpt-6-astra`.
- The model configuration uses Vercel AI Gateway / deployment OIDC rather than a provider API key hard-coded in source.
- `agent/channels/eve.ts` configures Vercel OIDC, local development auth, and `none()` for browser requests. This is only acceptable while Vercel SSO protects the deployed endpoint. Do not add a custom domain or weaken SSO without replacing this with verified application-level authentication.
- `agent/channels/slack.ts` references the Vercel Connect credential name `slack/mahmoudlovesara-slack`. The credential itself must be configured in the connected Vercel account.
- `agent/connections/vercel.ts` and `agent/connections/supabase.ts` declare MCP connections for Vercel and Supabase. Their existence does not prove those external permissions or live agent actions have been tested.

## 3. File Structure

~~~text
.
├── index.html                            # Canonical couple album UI
├── PROJECT-MASTER.html                   # Single-file release copy of index.html
├── PROJECT-WORKFLOW.md                   # Architecture and operations guide
├── RELEASE-REPORT.md                     # Verification and remaining-risk report
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── manifest.webmanifest
├── icon.svg
├── scripts/quality-html.mjs
├── .github/workflows/quality.yml
├── .github/workflows/release-package.yml
├── agent/
│   ├── agent.ts
│   ├── instructions.md
│   ├── channels/eve.ts
│   ├── channels/slack.ts
│   ├── connections/supabase.ts
│   └── connections/vercel.ts
└── supabase/migrations/
    └── 20261017002935_secure_private_photo_storage.sql
~~~

The release ZIP is created from tracked Git files at a specific commit. It excludes the .git history, node_modules, local .env files, .vercel, .eve caches and other ignored build artifacts. Version, source commit, check results and build time are recorded in RELEASE-METADATA.json inside the generated archive.

## 4. Features and Pages

The frontend is a single long-form, scrollable page, not a multi-route SPA. The observed interface includes:

1. Cinematic introduction / entry animation and hero.
2. Couple identity cards for Mahmoud and Sara.
3. Relationship photo/timeline moments.
4. 3D-style album with animation options and navigation.
5. Filterable photo grid, favourites, lightbox and slideshow.
6. Anniversary / occasion countdown view with progress, daily challenge and guessing interactions.
7. Romantic minigames: heart catcher, image memory, love wheel, relationship quiz, and occasion/date matching.
8. Music player with play, pause, stop, next/previous, volume and close controls.
9. Settings for visual behavior, motion, album autoplay and related preferences.
10. Admin studio behind a client-side PIN UI gate, including image upload, image resize, metadata editing, sorting, save, JSON export/import, share link and reset.
11. Cloud sign-in and sign-out within the admin studio for authenticated cloud album operations.
12. Mobile bottom navigation, responsive layouts, touch/swipe handlers, status messages and online/offline indicator.

The release keeps the existing hard-coded relationship dates and occasions. Verify those personal values before repurposing or publicly redistributing the app.

## 5. Core Functions

Main frontend functions include:
- Rendering: `renderAll`, `renderTimeline`, `renderAlbum`, `setAlbumContent`, `renderGrid`, `renderAdmin`, `buildIntro`.
- Local state: `loadLocal`, `openDB`, `idbGet`, `idbSave`, `saveAll`.
- Cloud: `cloudInit`, `cloudSignIn`, `cloudSignOut`, `cloudLoadPhotos`, `cloudUpload`, `cloudDelete`, `cloudUpdate`, `signedStorageUrl`, `cloudSyncOrder`.
- Image safety and media: `safeImageSrc`, `cssImageUrl`, `setImg`, `setAmbient`, `resizeImage`, `blobToDataUrl`, `dataUrlToBlob`.
- Viewer/navigation: `openLb`, `openLbById`, `showLb`, `closeLb`, `stepLb`, `goAlbum`, slideshow and mobile navigation helpers.
- Games and occasions: memory matching, heart catcher, wheel, quiz, matching game, points/wallet and countdown rendering.
- Admin workflows: upload handling, metadata/order updates, export/import, share link and reset.

The agent-side capabilities are defined by Eve and its channel/connection integrations; they are separate from the browser album’s JavaScript functions.

## 6. Data Flow and Recovery

### Local-only usage
1. The browser loads the page and attempts cloud access.
2. If cloud photos are available to the signed-in album owner, cloud photo metadata and time-limited signed URLs are used.
3. Otherwise the app attempts IndexedDB, then localStorage.
4. When cloud integration is unavailable/uninitialized, image uploads are resized in the browser and stored locally. If the Supabase client is initialized but the user is signed out, the upload flow asks the user to sign in; it does not silently fall back to local upload.
5. Save updates browser stores. Export creates a portable JSON backup with image data embedded. Import validates image sources, strips stale cloud identifiers and enforces the 100-photo limit.

### Cloud usage
1. The owner signs in with Supabase email/password.
2. Supabase Auth supplies the session/JWT.
3. RLS checks the album-owner allowlist for the `photos` table and Storage object operations.
4. Photo bytes are stored in the private `photos` bucket; metadata is stored in `public.photos`.
5. The app creates signed URLs for display and can update photo metadata/order.

Always export a fresh JSON backup before resetting browser data, changing authentication settings, or performing schema/policy changes. Local browser data does not automatically move between devices.

## 7. Authentication, Roles and Secrets

- **Visitor/local user:** Can view the current page and use browser-local features. Browser data is not a cloud backup.
- **Supabase album owner:** Must authenticate; the allowlist / RLS predicate determines access to cloud album records and Storage operations.
- **Admin studio PIN:** The PIN digest is bundled in browser source and verified client-side. This is only a user-interface barrier, not trusted authentication. A user with source/devtools access can bypass a client-side gate. Never protect sensitive or server-authorized actions with this PIN alone.
- **Vercel Eve runtime:** Uses deployment OIDC / Vercel SSO boundaries. Browser auth `none()` must remain behind current SSO protection unless replaced by a proper application auth scheme.
- **Slack integration:** Requires the named Vercel Connect credential to be configured outside source control.

Do not commit .env files, real API provider keys, Supabase service-role keys, Slack bot tokens, private keys, or Vercel credentials. The HTML’s Supabase publishable key is intentionally public; it cannot replace RLS. The release workflow scans for common high-confidence credential patterns, but that is not a substitute for a complete secret scanner or account-level secret audit.

## 8. Dependencies

Pinned project dependencies from `package.json`:
- `eve` 0.66.0
- `ai` 7.0.112
- `@vercel/connect` 0.4.2
- `zod` 4.4.3
- TypeScript 7.0.2 and Node type definitions 24.13.2
- Node.js 24.x; pnpm 10.34.7

Browser-loaded resources include:
- GSAP 3.12.5 from cdnjs.
- SortableJS 1.15.2 from cdnjs.
- Cairo, Cinzel Decorative and Great Vibes via Google Fonts.
- Romantic piano audio hosted on Pixabay.
- Supabase JS is bundled inline in the HTML.

Some frontend appearance and media require external network access. Dependency and CDN availability is not verified by the local source checker.

## 9. Environment Requirements

- Node.js 24.x.
- pnpm 10.34.7.
- Access to the GitHub repository and its Actions runner.
- A connected Vercel project for the Eve agent and production deployment.
- Supabase project with the expected `photos` and `album_owners` tables, Storage bucket and matching RLS policies.
- Supabase owner accounts present in the `album_owners` allowlist.
- Vercel Connect authorization/credentials for the configured Vercel, Supabase and Slack integrations.
- HTTPS or localhost for browser API/PWA-related behavior. Opening the HTML directly as file:// is not an equivalent production test.

## 10. Build, Run and Deploy

Install:
~~~bash
pnpm install --frozen-lockfile
~~~

Quality checks:
~~~bash
pnpm quality:html
pnpm typecheck
pnpm build
~~~

Run the Eve agent development environment:
~~~bash
pnpm dev
~~~

Start a local static preview of the browser app, in a separate terminal, from the project root:
~~~bash
python -m http.server 4173 --bind 127.0.0.1
~~~
Then open http://127.0.0.1:4173/. This is a local preview only and does not replace a Vercel/HTTPS integration test.

Start the Eve agent:
~~~bash
pnpm start
~~~

Deploy the Eve agent with its configured Vercel deployment context:
~~~bash
pnpm deploy
~~~

Production deployments are also configured to build from GitHub main through Vercel. Check the Vercel deployment record and GitHub Actions result after each release. The release workflow packages the exact commit as a ZIP artifact; download the project-final-package artifact from the corresponding GitHub Actions run.

Supabase migration status:
~~~bash
supabase migration list
~~~
The production migration `20261017002935_secure_private_photo_storage` has already been applied. Do not manually reapply it. For a separate dev database, follow the Supabase CLI workflow and check the target project before applying migrations.

## 11. Testing Workflow

The repository quality pipeline runs:
1. `git diff --check`.
2. Tracked high-confidence credential-pattern check in the release workflow.
3. `pnpm quality:html`, including manifest / source checks, inline JavaScript syntax validation and behavioral checks for image URL validation.
4. `pnpm typecheck`.
5. `pnpm build`.
6. A comparison that ensures `PROJECT-MASTER.html` matches `index.html`.
7. ZIP integrity validation after packaging.

This is source/build validation, not automated browser end-to-end testing. No dedicated browser test suite, lint script or `evals/` suite is present in the inspected source tree. Therefore a successful build cannot prove every button, route, cloud request, mobile gesture, or external integration works in a live browser.

Manual release acceptance still requires: sign-in and sign-out; upload and render a cloud image; edit/reorder/delete a cloud image; export/import a backup; reload data; test with local/offline mode; test keyboard/touch navigation; inspect Android and Windows browser layouts; test all games and music; and send a real request through the Eve agent and Slack if the integration is intended to be active.

## 12. PWA and Single-file Boundaries

`PROJECT-MASTER.html` is the complete current HTML/CSS/JavaScript UI in one file. It preserves existing UI and logic; it does not bundle server credentials or replace backend services.

A standards-based installable PWA still needs the sibling `manifest.webmanifest` and `icon.svg` to be served at the expected paths. This repository does not contain a service worker registration, so complete offline app-shell caching is not implemented. A single HTML file also cannot securely replace Supabase Auth, private Storage signed URLs, the Eve runtime, Slack credentials, or Vercel OIDC. Full cloud/PWA behavior must be tested on a hosted HTTPS origin with the sibling project assets and backend intact.

## 13. Known Risks and Remaining Tasks

1. **NOT VERIFIED:** Full live-browser end-to-end testing on mobile and desktop has not been completed by the release workflow.
2. **NOT VERIFIED:** A real production Eve agent request and Slack round-trip have not been demonstrated; there were no recorded agent runs in the inspected recent production window.
3. The admin PIN is a client-side gate, not real authorization. Replace it with server-enforced authorization before treating admin functions as sensitive.
4. Supabase security advisories previously reported leaked-password protection disabled, a callable `SECURITY DEFINER` owner-check function, and RLS enabled without direct policies on `public.album_owners`. Review these with the current ownership model before modifying them.
5. No service worker exists; offline behavior is limited to what the browser stores locally and does not guarantee offline media, fonts, or agent access.
6. Signed photo URLs expire. The page refreshes the cloud list after a long hidden period, but long-running sessions and failed network refreshes need live testing.
7. Share-link behavior is a URL/query mode, not a self-contained transfer of private photo bytes. Confirm expected sharing/access semantics with the intended users.
8. The page remains a large monolithic HTML document. Modularization, browser performance measurement, automated E2E tests, accessibility checks and a full secret scanner remain future engineering work.
9. The `pnpm eval` script exists in package.json but no `evals/` directory is tracked; it is not a currently verified testing path.
10. Firebase is absent from this project. If Firebase is required in the future, it is a new integration and must not be represented as already connected.

## 14. Release Workflow

The versioned release workflow validates tracked source, runs quality checks and builds, confirms the master copy is identical to the canonical HTML, creates a ZIP from tracked files, writes source/version/check metadata into that ZIP, checks ZIP integrity and uploads `project-final-package`.

Use the SHA-256 sidecar generated alongside the archive to validate the downloaded ZIP before extracting it. Keep the ZIP and report associated with the exact source commit recorded in `RELEASE-METADATA.json`.
