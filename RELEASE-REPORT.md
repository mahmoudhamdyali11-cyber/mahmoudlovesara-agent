# RELEASE REPORT — Mahmoud & Sara

## Final Status

- **PASS** — Source package preparation and repository documentation are included in the release candidate.
- **PASS** — The last verified production build for the core release passed Eve build, TypeScript and source-quality checks.
- **PASS** — Supabase photo Storage was verified private, with public read removed and an authenticated album-owner read policy present.
- **NOT VERIFIED** — A full manual production acceptance run across interactive app features, cloud flows and physical-device layouts has not been completed.
- **NOT VERIFIED** — A successful real user request through the Eve agent and a Slack round-trip have not been demonstrated.

Package version: **1.0.0**. The exact archived source commit and generated-at time are written into `RELEASE-METADATA.json` inside the ZIP. The release packaging workflow is authoritative for the commit-specific results.

## What Was Fixed / Delivered

- Hardened dynamic image source validation and CSS URL construction in the canonical HTML.
- Changed the Supabase `photos` Storage bucket to private and removed its public read policy; restricted Storage reads to authenticated album owners.
- Changed the UI to use expiring signed URLs for cloud photos.
- Prevented the local UI from silently removing a photo after a cloud delete error.
- Made cloud-photo exports self-contained by embedding image bytes in exported JSON.
- Hardened import handling by validating image sources, removing stale cloud identifiers and rejecting imports over 100 photos.
- Added a manifest and SVG icon, plus description and metadata tags.
- Added CI checks for inline JavaScript syntax, URL safety behavior, TypeScript, Eve build and patch whitespace.
- Pinned pnpm to 10.34.7 for reproducible installs.
- Aligned the migration filename with the version already recorded in Supabase history.
- Added `PROJECT-MASTER.html` as a byte-for-byte copy of the canonical UI and provided the architecture/development workflow guide.
- Added a repeatable release ZIP workflow that records the exact source SHA and checks ZIP integrity.

## What Was Verified

| Item | Status | Evidence |
|---|---|---|
| GitHub source exists and main revision was inspected | PASS | GitHub API tree and file contents |
| HTML / inline JavaScript source checks | PASS | `pnpm quality:html` in GitHub Actions |
| Image URL helper behavior checks | PASS | Automated assertions for unsafe and supported URL classes |
| TypeScript | PASS | `pnpm typecheck` in GitHub Actions |
| Eve build | PASS | `pnpm build` in GitHub Actions |
| Patch whitespace | PASS | `git diff --check` in CI |
| Production deployment state for the final documented main revision | PASS | Vercel deployment status recorded as READY |
| Supabase photo bucket visibility | PASS | Read-only database query returned `public = false` |
| Supabase Storage SELECT policy | PASS | Read-only policy query confirmed authenticated owner predicate |
| Photo row/object counts at privacy migration | PASS | Zero photo table rows and zero objects before and after migration |
| Tracked high-confidence credential-pattern scan | PASS | Release workflow scans common provider-token formats and tracked `.env*` paths |
| Master file equivalence | PASS | Release workflow runs `cmp index.html PROJECT-MASTER.html` |
| ZIP integrity | PASS | Release workflow runs `unzip -t` |

The Supabase publishable key embedded in the browser source is designed for public clients and is not a service-role key. This does not eliminate the requirement for correct RLS, Auth and Storage policies. The secret-pattern check is targeted and is not a complete secret-scanning audit.

## What Was Not Verified

| Item | Status | Why |
|---|---|---|
| All UI controls, forms and sections in a real browser | NOT VERIFIED | The release workflow is not a browser E2E suite |
| Android / Windows responsive behavior on physical devices | NOT VERIFIED | No live-device run recorded |
| Import/export round-trip with real user images | NOT VERIFIED | Source behavior inspected, but no live manual workflow completed |
| Cloud sign-in, upload, edit, reorder, delete and reload as an album owner | NOT VERIFIED | Storage policy was queried, but full authenticated UI transactions were not run |
| PWA installation and offline app-shell behavior | NOT VERIFIED | Manifest exists but no service worker is implemented |
| End-to-end Eve agent request and generated answer | NOT VERIFIED | No confirmed real agent run |
| Slack send/receive through the configured credential | NOT VERIFIED | Credential existence is configured by name only; runtime operation was not tested |
| Accessibility conformance, Core Web Vitals and performance on low-end phones | NOT VERIFIED | No automated accessibility or browser performance run |
| Comprehensive secret scanning | NOT VERIFIED | Only a high-confidence pattern scan was configured |

## Remaining Risks

1. The admin PIN is stored as a client-side hash and checked in JavaScript. This is not a security boundary and can be bypassed by a sufficiently technical visitor. It must not replace server-side authorization.
2. Supabase advisors reported that leaked-password protection is disabled, `public.is_photo_album_owner()` is a callable `SECURITY DEFINER` function, and `public.album_owners` has RLS enabled without direct policies. These warnings need a dedicated policy/function review before further security changes.
3. The deployed Eve channel permits `none()` browser auth only while Vercel SSO remains an effective protection. Do not disable SSO or add an unprotected custom domain without implementing app-level auth.
4. No service worker is included. Local storage works only to browser persistence limits and does not make external fonts/audio or backend services available offline.
5. Cloud photo URLs are time-limited, and private storage/auth needs live regression tests.
6. User-visible romantic milestone dates and personal content remain in source. Confirm they are correct before distributing the package to anyone else.
7. Firebase is not part of this project. The current integration path is Supabase + Vercel/Eve.

## Deployment Instructions

1. Extract `PROJECT-FINAL.zip` and verify it against `PROJECT-FINAL.zip.sha256` when both are provided.
2. Install Node.js 24.x and pnpm 10.34.7.
3. From the extracted project root, run:
   ~~~bash
   pnpm install --frozen-lockfile
   pnpm quality:html
   pnpm typecheck
   pnpm build
   ~~~
4. Run the Eve developer environment using `pnpm dev`; run the frontend local preview in a separate terminal with `python -m http.server 4173 --bind 127.0.0.1`.
5. For production, use the connected Vercel GitHub deployment pipeline on `main`, or the existing Eve deployment command `pnpm deploy` where appropriate for the agent. Confirm the resulting Vercel deployment is READY.
6. Keep the current Supabase schema and private Storage policies intact. The production migration `20261017002935_secure_private_photo_storage` has already been applied; do not rerun it against production.
7. Before accepting the release as fully verified, complete the manual checklist in `PROJECT-WORKFLOW.md`, especially owner sign-in, cloud photo CRUD, export/import, mobile/desktop review and a real Eve agent request.

## Final Version

**1.0.0 — PROJECT FINAL PACKAGE**

The package workflow records the precise source commit in `RELEASE-METADATA.json`. "PASS" above is limited to tests and checks explicitly run by CI or read-only queries; full browser acceptance remains **NOT VERIFIED**.
