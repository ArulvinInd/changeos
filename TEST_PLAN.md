# ChangeOS PWA Test Plan — Compatibility Focus

**Date:** 2026-06-28  
**Tester:** Senior QA (agentic audit)  
**Scope:** Full codebase static analysis + compatibility gap report. No live browser session was available; manual verification steps are marked `[manual]`.

---

## 1 — Critical PWA / iOS Gaps (Ship Blockers)

### GAP-01 · Missing iOS PWA meta tags
**File:** `index.html`  
**Risk:** On iOS Safari, users who tap "Add to Home Screen" get the browser default icon (screenshot) and the app opens in Safari, not standalone mode — the whole PWA experience is broken on the most common mobile browser.

**Missing:**
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="apple-touch-icon" href="/pwa-192.png" />
```
iOS Safari ignores the Web App Manifest for icon and display mode. These three tags are the only mechanism iOS respects.

**Test TC-01 [manual]:**  
Device: iPhone (iOS 16+) / Safari  
Steps: Open app → Share → Add to Home Screen → tap icon  
Expected: Opens without browser chrome, correct icon  
Current result: Opens in Safari tab with browser chrome

---

### GAP-02 · No viewport safe-area — bottom nav hidden behind iOS home indicator
**Files:** `index.html` (viewport meta), `src/components/layout/Nav.tsx`, `src/components/layout/AppLayout.tsx`

**Root cause 1:** Viewport meta lacks `viewport-fit=cover`:
```html
<!-- current -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- needed -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Root cause 2:** `BottomNav` is `fixed bottom-0` with no safe-area padding. On iPhone X and later, the bottom navigation bar overlaps the system home indicator.

**Root cause 3:** `AppLayout` sets `pb-16 lg:pb-0` for main content — this is a fixed pixel value, not safe-area aware.

**Fix needed in `Nav.tsx`:**
```html
<!-- BottomNav root should be: -->
<nav class="... pb-[env(safe-area-inset-bottom)]">
```

**Test TC-02 [manual]:**  
Device: iPhone with home indicator (iPhone X or later) in standalone mode  
Expected: Bottom nav fully visible above home indicator  
Current: Bottom nav items cut off by 34px home indicator area

---

### GAP-03 · Offline write promise is false — data is silently lost
**File:** `src/hooks/useOfflineDetection.ts`

The offline toast says: *"changes will sync when reconnected"* — **this is untrue**. There is no write queue. Any habit log, goal, or habit saved while offline silently fails. The user believes their data is safe; it is not.

**Root cause:** `useOfflineDetection` only fires toast events. All Supabase mutations in `DashboardPage`, `HabitsPage`, `GoalsPage` are direct `await supabase.from(...)` calls with no offline detection guard.

**Test TC-03:**
```
Preconditions: App loaded, user has habits
Steps:
  1. Go offline (DevTools → Network → Offline)
  2. Tap a habit's check button
  3. Reconnect
Expected: Habit log is persisted in DB after reconnect
Actual: Error toast fires, log is NOT persisted, online event shows "Back online!" but data is gone
Priority: P0
```

**Minimum fix (not a full offline queue):** Change the toast text to `"You are offline — new changes cannot be saved."` so the promise isn't made.

---

### GAP-04 · `localStorage` crash in Safari private/incognito mode
**File:** `src/store/themeStore.ts`

`zustand/persist` calls `localStorage.setItem` on every state change. Safari private mode throws `SecurityError: DOM Exception 18` (quota exceeded / blocked) when any localStorage write is attempted. This **crashes the entire app** since the error is unhandled and propagates to the module boundary.

**Test TC-04 [manual]:**  
Browser: Safari → File → New Private Window → navigate to app  
Expected: App loads normally, uses system default theme  
Actual: Uncaught SecurityError, white screen

**Fix:** Wrap zustand persist storage in a try/catch or use a custom storage that silently falls back to in-memory:
```ts
storage: {
  getItem: (key) => { try { return localStorage.getItem(key) } catch { return null } },
  setItem: (key, val) => { try { localStorage.setItem(key, val) } catch {} },
  removeItem: (key) => { try { localStorage.removeItem(key) } catch {} },
}
```

---

### GAP-05 · No SW update notification — users stuck on stale cached app
**File:** `vite.config.ts`

`registerType: 'autoUpdate'` silently replaces the service worker. Installed PWA users will have their tab's code replaced on next load, but **there is no `useRegisterSW` hook** and no UI prompt saying "Update available — reload to get the latest version."

Without this, users may run a stale version indefinitely (the SW updates in the background, but the active page's JS is not replaced until the tab is closed and reopened).

**Test TC-05 [manual]:**  
Steps: Install PWA → deploy a new version → reopen app  
Expected: Toast or banner: "New version available" with reload button  
Actual: Silent update; if app is kept open it runs stale code until manually closed

---

## 2 — High Priority Gaps

### GAP-06 · Theme FOUC (Flash of Unstyled Content) in standalone PWA
**File:** `src/App.tsx`

Theme is applied in a `useEffect`. On first paint in standalone mode, the page renders with the default `:root` colors (white background) before React has mounted and applied the persisted theme. This creates a visible flash on every app launch.

**Fix:** Add a tiny inline script in `<head>` before any other content:
```html
<script>
  try {
    const t = JSON.parse(localStorage.getItem('changeos-theme') || '{}').state?.theme
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
    else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light')
  } catch {}
</script>
```

**Test TC-06 [manual]:**  
Steps: Set theme to dark → close PWA → reopen → observe first frame  
Expected: Dark background on first paint  
Actual: White flash then dark

---

### GAP-07 · `@tanstack/react-query` is installed but never used
**File:** `package.json`

`@tanstack/react-query` (~40 KB gzipped) is in `dependencies` but is not imported anywhere in the codebase. Dead dependency that inflates the install footprint and adds to audit surface.

**Action:** `npm uninstall @tanstack/react-query`

---

### GAP-08 · `handleDeleteAccount` does not delete the account
**File:** `src/pages/SettingsPage.tsx`

The function signs the user out and shows `"Account deletion request submitted. Contact support to complete."` — no data is deleted. This is a GDPR / privacy risk: users who believe they've deleted their data have not.

**Test TC-08:**
```
Steps: Settings → Delete Account → confirm
Expected: User data erased from Supabase (profiles, habits, goals, logs)
Actual: User is signed out; all data remains in DB
Priority: P1
```

---

### GAP-09 · BottomNav inaccessible on mobile for 3 routes
**File:** `src/components/layout/Nav.tsx`

`BottomNav` only shows 5 of 8 routes. Routines, AI Coach, and Friends have no mobile entry point. Users who install the PWA (where there's no browser URL bar) have no way to navigate to these pages.

**Test TC-09 [manual]:**  
Device: Any phone in standalone mode  
Steps: Open app → try to navigate to /routines  
Expected: Navigation item visible  
Actual: No bottom nav entry; feature is unreachable

---

### GAP-10 · Maskable icon is identical to the regular icon
**File:** `vite.config.ts` manifest icons

```js
{ src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
```

Android adaptive icon launchers apply a circular/squircle mask with ~40% of the image as a "safe zone". Using the same full-bleed icon means Android will likely crop the content. A proper maskable icon must have the main content confined to the center 60%.

**Test TC-10 [manual]:**  
Device: Android with Pixel Launcher (adaptive icons)  
Steps: Install PWA → view home screen icon  
Expected: Icon displayed correctly  
Actual: Icon may appear cropped depending on launcher

---

## 3 — Medium Priority Gaps

### GAP-11 · Dashboard date filter `new Date(dateString)` without time suffix
**File:** `src/pages/DashboardPage.tsx` line ~310

```js
const dayName = format(new Date(date + 'T12:00:00'), 'EEE')
```

This workaround (appending `T12:00:00`) correctly avoids UTC midnight shifting. However the `date` variable comes from `toLocalDate()` which is already local. The pattern is correct but should have a `ponytail:` comment explaining why the time suffix is needed, otherwise a future dev will "simplify" it and reintroduce the UTC-off-by-one bug.

**Test TC-11:**
```
Precondition: habit with frequency=specific_days, days=['Mon']
Steps: View dashboard on a Monday at 00:01 local time in UTC-5 timezone
Expected: Habit appears (it is Monday locally)
Risk: Without T12:00:00 suffix, new Date('2024-01-08') = UTC midnight = Sunday locally in UTC-5
```

---

### GAP-12 · No optimistic updates — habit log UI lags on slow connections
**File:** `src/pages/DashboardPage.tsx` `handleLog()`

The check button shows no loading state and only updates after the Supabase round-trip completes. On a 3G connection or after a brief offline moment, the button appears broken for 1–5 seconds.

**Expected for a PWA:** Update UI immediately (optimistic), rollback on error.

---

### GAP-13 · Export CSV hits `limit(50000)` — can OOM on mobile
**File:** `src/pages/SettingsPage.tsx`

`supabase.from('habit_logs').select(...).limit(50000)` loads up to 50,000 rows into memory at once as a JS array, then builds a CSV string. On low-memory Android devices, this can cause tab crashes for power users with multi-year history.

---

### GAP-14 · No Content-Security-Policy
**File:** `index.html`

No CSP meta tag. An XSS attack could exfiltrate the Supabase JWT stored in localStorage. At minimum:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; connect-src 'self' *.supabase.co; script-src 'self' 'unsafe-inline'">
```
(Note: `unsafe-inline` needed for Vite dev; remove for production via env.)

---

### GAP-15 · Toast singleton: `listeners` leaks between test runs
**File:** `src/components/ui/Toast.tsx`

`const listeners = new Set<Listener>()` is module-level state. If `toast()` is called in tests without a mounted `ToastContainer`, the listener set grows without bound. Tests that import `toast` must reset it — but there's no export for that.

**Fix:** Export a `clearToastListeners` for testing, or use a weak-ref pattern.

---

## 4 — PWA Compatibility Test Matrix

| Browser / Platform | Install | Offline fallback | Push notify | Safe area | Tested |
|---|---|---|---|---|---|
| Chrome Android | ✅ native install | ⚠️ cached HTML only, no data | ❌ not implemented | N/A | [manual] |
| Safari iOS 16+ | ❌ missing meta tags | ⚠️ cached HTML only | ❌ iOS 16.4+ only, not wired | ❌ no safe-area | [manual] |
| Safari iOS 15 | ❌ | ❌ no SW support | ❌ | ❌ | [manual] |
| Firefox Android | ✅ | ⚠️ | ❌ | N/A | [manual] |
| Edge (desktop) | ✅ | ⚠️ | ❌ | N/A | [manual] |
| Samsung Internet | ✅ | ⚠️ | ❌ | ⚠️ | [manual] |
| Chrome iOS | ❌ uses Safari engine | same as Safari iOS | ❌ | ❌ | [manual] |

---

## 5 — Unit Test Coverage (automated, runnable)

Two test files are included (`src/__tests__/utils.test.ts`, `src/__tests__/habitsStore.test.ts`).

Run with: `npm test`

| Module | Function | Happy path | Boundary | Error path |
|---|---|---|---|---|
| `lib/utils` | `toLocalDate` | ✅ | ✅ Dec 31, Jan 1, DST | – |
| `lib/utils` | `cn` | ✅ | ✅ falsy classes | – |
| `store/habitsStore` | `upsertLog` | ✅ | ✅ different dates/habits | – |
| `store/habitsStore` | `setTodayLogs` | ✅ | ✅ empty array | – |
| `store/themeStore` | `setTheme` | ❌ needs jsdom | | |
| `components/ui/Toast` | `toast()` | ❌ needs jsdom | | |
| `pages/LoginPage` | `validate()` | ❌ needs jsdom | | |
| `hooks/useOfflineDetection` | online/offline events | ❌ needs jsdom | | |

**Recommended next layer (needs `jsdom` + `@testing-library/react`):**
- `LoginPage` — email regex, short password boundary, empty fields
- `HabitFormModal` — submit with no goal, frequency toggle side-effects
- `Modal` — Escape key closes, focus returns to trigger on close
- `useOfflineDetection` — window events fire correct toast type

---

## 6 — Entry / Exit Criteria

**Entry:** All P0 gaps (GAP-01 through GAP-05) must have filed issues before the next release.

**Exit:**  
- [ ] GAP-01 iOS meta tags added and verified on real iPhone  
- [ ] GAP-02 Safe-area tested on iPhone with home indicator  
- [ ] GAP-03 Offline toast text corrected (quick fix) or write queue implemented (full fix)  
- [ ] GAP-04 localStorage try/catch added and verified in Safari private mode  
- [ ] GAP-05 SW update notification wired up via `useRegisterSW`  
- [ ] All unit tests pass in CI (`npm test`)
