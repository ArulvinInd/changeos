# Agent UI Prompt — Personal Habit Tracker

## Core Instruction

Design a clean and professional user interface (UI) for a web application that is intuitive and accessible for all age groups. Ensure the application adheres to best practices in web development, maintains high performance, and is compatible across devices. Include smooth animations to enhance user experience, and provide comprehensive support for users encountering challenges.

---

## Design & Visual Standards

- Use a consistent design token system: define all colors, font sizes, spacing, border radii, and shadows as CSS variables or a Tailwind config — never hardcode values inline.
- Stick to a neutral base palette (white / slate) with a single user-chosen accent color applied consistently across CTAs, active states, and highlights.
- Typography: use Inter or Geist. Define a clear type scale (xs, sm, base, lg, xl, 2xl) and apply it consistently — no arbitrary font sizes.
- All interactive elements (buttons, inputs, cards) must have clear hover, focus, active, and disabled states.
- Every page must have a visual hierarchy: one primary action per screen, secondary actions de-emphasised.
- Dark mode: support light, dark, and system preference using `prefers-color-scheme` media query and a manual toggle stored in localStorage.

---

## Responsive & Cross-Device Compatibility

- Mobile-first: design for 375px viewport width and scale up. No horizontal scrolling on any screen size.
- Breakpoints: mobile (< 640px), tablet (640px–1024px), desktop (> 1024px).
- Touch targets must be at least 44×44px on mobile — buttons, checkboxes, and habit completion toggles must meet this minimum.
- Test all layouts at 375px, 768px, and 1440px before considering a component done.
- Navigation: use a bottom tab bar on mobile, a sidebar on desktop. Never hide critical actions behind a hamburger menu on desktop.
- Modals and drawers: full-screen on mobile, centred modal on desktop.

---

## Performance

- Lazy-load all routes using `React.lazy()` and `Suspense` — no monolithic bundle.
- Images: use WebP format, set explicit `width` and `height` attributes to avoid layout shift, and use `loading="lazy"` for below-the-fold images.
- Avoid unnecessary re-renders: wrap expensive components in `React.memo`, use `useCallback` for event handlers passed as props, and `useMemo` for derived data.
- Do not fetch data inside `useEffect` without a dependency array guard — always clean up subscriptions on unmount.
- Charts (Recharts): only render when the container is visible using an IntersectionObserver — do not render all charts on page load.
- Supabase queries: always select only the columns you need (never `select('*')` in production), and add `.limit()` to list queries.

---

## Animations & Micro-Interactions

- Use CSS transitions (not JavaScript) for simple state changes: hover effects, colour transitions, opacity fades.
- Use Framer Motion for page transitions and entrance animations — keep duration between 150ms and 300ms.
- Habit completion: trigger a satisfying animation on check-in (e.g. a subtle scale + colour fill on the checkbox, confetti burst on streak milestones).
- Streak flame icon: subtle pulse animation when a streak is active.
- Always respect `prefers-reduced-motion`: wrap all animations in a check and provide instant, no-motion fallbacks.
- Do not animate layout shifts — only animate opacity, transform (translate, scale), and color.

---

## Accessibility (A11y)

- All colour combinations must meet WCAG 2.1 AA contrast ratio (4.5:1 for text, 3:1 for UI components).
- Every interactive element must be keyboard-navigable with a visible focus ring (never `outline: none` without a custom replacement).
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`, `<label>` — never use `<div>` as a button.
- All form inputs must have an associated `<label>`. Use `aria-describedby` for helper text and error messages.
- Icons used as standalone actions (no text label) must have `aria-label` attributes.
- Modals must trap focus inside when open and return focus to the trigger element when closed.
- Habit check-in toggles must be `<button>` or `<input type="checkbox">` — never a styled `<div>`.
- Test with a screen reader (VoiceOver / NVDA) before marking any component done.

---

## Error Handling & User Support

- Every Supabase call must be wrapped in try/catch. On error, show an inline toast notification with a human-readable message — never expose raw error objects or stack traces to the user.
- Form validation: validate on blur (not just on submit). Show field-level error messages in red below the input, with an `aria-live="polite"` region so screen readers announce them.
- Empty states: every list, dashboard section, and chart must have a designed empty state with an illustration or icon, a short explanation, and a clear call-to-action (e.g. "No habits yet — add your first one").
- Loading states: every async operation must show a skeleton loader or spinner — never an empty or half-loaded UI.
- Offline detection: listen to the browser's `online`/`offline` events. Show a banner when the user is offline, and queue check-in actions to sync when reconnected.
- 404 page: include a custom not-found page with navigation back to the dashboard.
- Session expiry: if Supabase returns an auth error mid-session, redirect to `/login` with a toast saying "Your session expired — please sign in again."

---

## Common Pitfalls to Avoid

- **Streak calculation off-by-one:** always compare dates in the user's local timezone, not UTC. Use a date library (date-fns) and convert `new Date()` to the user's timezone before comparing with `log_date`.
- **Duplicate check-ins:** enforce a unique constraint in Supabase on `(habit_id, log_date)` and handle the duplicate error gracefully in the UI ("Already logged for today").
- **Missing RLS:** every Supabase table must have RLS enabled and at least one policy. Never ship a table with RLS disabled.
- **Stale streak data:** recalculate streaks server-side (in a Supabase Edge Function or database trigger) — do not rely solely on client-side calculation that could be skipped if the user doesn't open the app.
- **Layout shift on load:** always reserve space for dynamic content (charts, avatars, habit lists) with fixed height skeletons to prevent Cumulative Layout Shift (CLS).
- **Deep prop drilling:** use React Context or Zustand for global state (auth user, theme, habits list) — do not pass the same prop through more than 2 component levels.
- **No confirmation on destructive actions:** deleting a goal, habit, or account must always show a confirmation modal first with clear consequences ("This will delete all habit history for this goal").
- **Forgetting the timezone on date inputs:** `<input type="date">` returns a string in local time. Always parse it explicitly with date-fns `parseISO` and store as ISO 8601 in Supabase.
- **Inaccessible modals:** always use a focus trap inside modals (e.g. `focus-trap-react` library) and close on Escape key press.
- **Unhandled promise rejections:** always `await` async calls inside try/catch blocks. Unhandled rejections will silently fail and leave the user with no feedback.

---

*Use this prompt alongside the PRD (`habit-tracker-PRD.md`) for full product context.*
