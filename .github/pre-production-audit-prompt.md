# Pre-Production Audit Prompt
## Personal Habit Tracker — Phase 1 Full Audit

---

## Your Role

You are acting as a senior product manager and lead engineer doing a pre-production audit of this application. Your job is to make independent, opinionated decisions about what to fix, what to improve, and what to ship. Do not ask for permission on obvious issues — find them, fix them, and explain what you did and why.

Work through this prompt top to bottom, completing every section before moving on. At the end, produce a written audit report summarising every change made.

---

## Step 1 — Codebase Familiarisation

Before touching anything:

- Read the full folder structure and understand how the project is organised
- Identify the state management approach (Context, Zustand, Redux, etc.)
- Identify how Supabase is initialised and where the client is used
- Identify all routes and which components render on each route
- Note any existing utility functions, custom hooks, and shared components
- List every `.env` variable the app depends on

Do not make any changes in this step. Just map the codebase.

---

## Step 2 — Bug Audit

Go through the entire application and find every bug. For each bug found, fix it immediately and log it in the audit report.

**Check specifically for:**

### Auth & Session
- [ ] Is the Supabase client initialised exactly once (not re-created on every render)?
- [ ] Are all routes protected — does navigating directly to `/dashboard` without a session redirect to `/login`?
- [ ] Is the session refreshed on page reload without a visible logout flash?
- [ ] Are auth errors (wrong password, email not confirmed) shown to the user with a clear message?

### Data & Supabase
- [ ] Does every Supabase query handle both the `data` and `error` return values?
- [ ] Are any queries using `select('*')`? Replace with explicit column lists.
- [ ] Do list queries have `.limit()` applied to prevent unbounded fetches?
- [ ] Is RLS enabled on every table? If any table has RLS disabled, flag it immediately.
- [ ] Is the `habit_logs` table protected from duplicate entries for the same `(habit_id, log_date)` combination?
- [ ] Are all date comparisons using the user's local timezone — not UTC?

### Streak Logic
- [ ] Is the current streak calculated correctly — does it account for the user's timezone?
- [ ] Does missing one day correctly break or pause the streak depending on grace day settings?
- [ ] Is the streak updated on every check-in, not just recalculated on page load?

### Forms & Validation
- [ ] Do all forms validate before submission — not just after?
- [ ] Are field-level error messages shown inline below each input?
- [ ] Are inputs cleared/reset after a successful form submission?
- [ ] Does the submit button disable during async submission to prevent double-submits?

### State & Re-renders
- [ ] Are there any `useEffect` hooks with missing or incorrect dependency arrays?
- [ ] Are there any memory leaks — Supabase subscriptions or event listeners not cleaned up on unmount?
- [ ] Is global state (habits list, auth user) fetched once and shared — or re-fetched on every component mount?

### Navigation
- [ ] Do all internal links use React Router `<Link>` — not `<a href>`?
- [ ] Does the browser back button work correctly on all pages?
- [ ] Is the active route highlighted in the navigation?

---

## Step 3 — UI & Visual Quality Audit

Review every page and component against these standards. Fix every issue found.

### Consistency
- [ ] Is the same spacing scale used throughout — no arbitrary margin/padding values?
- [ ] Are all buttons the same height, border-radius, and font size per their variant (primary, secondary, ghost)?
- [ ] Is the same color used for every primary action — no inconsistent accent colors?
- [ ] Are all page titles, section headers, and labels using a consistent type scale?

### Responsiveness
- [ ] Does every page look correct at 375px, 768px, and 1440px widths?
- [ ] Is there any horizontal scroll on mobile? Fix any overflow issues.
- [ ] Are touch targets at least 44×44px — especially the habit check-in buttons?
- [ ] Does the navigation switch correctly between mobile (bottom tab bar) and desktop (sidebar)?

### Empty & Loading States
- [ ] Every list must have an empty state: an icon, a short explanation, and a call-to-action. Add any that are missing.
- [ ] Every async operation must show a skeleton loader or spinner. Replace any blank/flashing UIs.
- [ ] Empty states must guide the user to act — not just say "Nothing here yet."

### Error States
- [ ] Failed API calls must show a toast or inline error — never a silent failure.
- [ ] Network errors must show a retry option.
- [ ] Form errors must be visible, specific, and positioned next to the relevant field.

### Dark Mode
- [ ] Does dark mode work on every page — no white flashes, no hardcoded `#ffffff` or `#000000` values?
- [ ] Are all card backgrounds, borders, and input fields correctly themed?

---

## Step 4 — Accessibility Audit

Fix every issue found. Accessibility is non-negotiable for production.

- [ ] Run the app with keyboard-only navigation. Can every action be completed without a mouse?
- [ ] Do all interactive elements have a visible focus ring?
- [ ] Are any `<div>` or `<span>` elements being used as buttons? Replace with `<button>`.
- [ ] Do all images have descriptive `alt` text? Decorative images should have `alt=""`.
- [ ] Do all form inputs have an associated `<label>`?
- [ ] Do all icon-only buttons have an `aria-label`?
- [ ] Is colour contrast WCAG AA compliant (4.5:1 for text, 3:1 for UI components)?
- [ ] Do modals trap focus inside when open and restore focus when closed?
- [ ] Are all animations disabled or instant when `prefers-reduced-motion` is set?

---

## Step 5 — Performance Audit

- [ ] Are all routes lazy-loaded with `React.lazy()` and `Suspense`?
- [ ] Are there any components re-rendering on every keystroke or state change that shouldn't be? Apply `React.memo` or restructure state.
- [ ] Are charts rendered lazily — only when their container is in the viewport?
- [ ] Are there any large dependencies imported globally that could be code-split?
- [ ] Are all images using WebP format with explicit dimensions set?
- [ ] Is there a `loading` state during the initial auth check so users don't see a flash of unauthenticated content?

---

## Step 6 — Production Readiness Checklist

Complete every item before signing off.

### Security
- [ ] No API keys, secrets, or Supabase service role keys are present in the frontend code or committed to version control
- [ ] All environment variables are prefixed with `VITE_` and documented in a `.env.example` file
- [ ] RLS is confirmed active on every Supabase table
- [ ] No `console.log` statements that expose user data or internal state remain in the codebase

### Reliability
- [ ] The app handles complete network failure gracefully — no white screens or unhandled exceptions
- [ ] Refreshing the page on any route works correctly — no 404s on direct navigation
- [ ] The app recovers cleanly after a Supabase session expires mid-use

### Code Quality
- [ ] No unused imports, dead code, or commented-out code blocks remain
- [ ] All components have consistent naming: PascalCase for components, camelCase for functions and variables
- [ ] No hardcoded user IDs, test emails, or placeholder text remains in production code

### User Experience
- [ ] Every destructive action (delete habit, delete goal, clear history) shows a confirmation dialog
- [ ] Success actions show a confirmation toast (e.g. "Habit saved", "Streak updated")
- [ ] The app has a custom 404 page with a link back to the dashboard
- [ ] The page `<title>` updates on every route change to reflect the current page

---

## Step 7 — Audit Report

When all steps are complete, write a structured report with the following sections:

1. **Bugs Fixed** — list each bug, where it was found, and how it was fixed
2. **UI Improvements Made** — list each visual change and the reason for it
3. **Accessibility Fixes** — list each issue and the fix applied
4. **Performance Changes** — list optimisations applied and expected impact
5. **Production Readiness** — confirm every checklist item is resolved or explain why it was deferred
6. **Recommendations** — anything you found that is outside the scope of this audit but should be addressed before or shortly after launch

---

*Run this audit against the Phase 1 codebase. Reference `habit-tracker-PRD.md` and `agent-ui-prompt.md` for full product context and design standards.*
