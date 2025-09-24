# Chrome Web Store Release Checklist

This checklist helps you ship the extension confidently. Use it before every submission or update.

## 1) Prerequisites

- MV3 manifest validated (no deprecated keys)
- Icons present at 16/32/48/128px in `images/`
- No secrets or API keys in repo or bundles
- LICENSE and README up to date

## 2) Manifest and permissions

- `manifest.json` version bumped (semver)
- Only required permissions declared (host_permissions, storage, activeTab, contextMenus, sidePanel, notifications, etc.)
- Optional permissions gated behind user actions if applicable
- `background.service_worker` path correct and builds present
- `content_scripts`/`side_panel` entries match shipped files

## 3) Build, size, and source artifacts

- Production build succeeds (minified, source maps if desired)
- Bundle sizes within reasonable limits; no large unused assets
- No console errors or noisy logs in production build
- If publishing source, ensure it matches uploaded bundle (optional)

## 4) QA gates (must pass)

- Unit tests: 100% of current suite passing (Jest)
- Manual smoke on 3–5 ToS pages covering: detection, summary, rights index, readability, side panel
- User Rights Index shows 8 categories with sensible grades; no NaN/undefined
- Readability grade and explanation render correctly
- Cache behavior: first-run analysis stores; subsequent loads retrieve without errors
- Notifications/context menu operate without errors
- No unhandled promise rejections in console (content or service worker)

See also: `docs/qa/e2e-smoke.md` for a guided pass.

## 5) Store listing assets

- Title, short description, full description updated to reflect MVP
- Screenshots (1280x800 or 640x400) of side panel, rights index, readability
- 128x128 icon (already in `images/`), promotional tile if applicable
- Category and tags selected

## 6) Policies and privacy

- Privacy Policy URL published and accurate
- Terms of Use URL (optional) published
- Data practices disclosure: describes local analysis and any cloud usage clearly

## 7) Submission steps

- Login to CWS dashboard → Create new item or update existing
- Upload ZIP of `dist/` (or packaged build) produced by `webpack.prod.js`
- Fill/update listing metadata and policy URLs
- Select regions/visibility, pricing (free), and rollout
- Submit for review; note any permission changes in the submission notes

## 8) Post‑release monitoring

- Verify install and basic flow on clean Chrome profile
- Watch console for runtime errors; confirm service worker stays alive during analysis
- Track user feedback and crash reports (if any)
- Prepare hotfix plan for critical issues

## 9) Versioning and changelog

- Maintain `CHANGELOG.md` or release notes in CWS
- Tag release in VCS (e.g., `v1.0.0`)

Tip: copy this file into your release PR description and check items off as you validate them.
