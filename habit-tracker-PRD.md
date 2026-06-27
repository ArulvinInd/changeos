# Product Requirements Document
## Personal Habit & Routine Tracker

**Version:** 1.0  
**Stack:** React (Vite) + Supabase + Supabase Edge Functions  
**Architecture:** Frontend-only (no separate backend server)

---

## 1. Overview

A personal web app that acts as a life operating system for building habits and routines. Users can define goals, track daily habits, build structured routines, visualise progress, and receive AI-powered coaching — all from a clean, fast, mobile-responsive interface.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase (PostgreSQL with RLS) |
| Client SDK | @supabase/supabase-js |
| AI Coach | Supabase Edge Functions → OpenAI API |
| Charts | Recharts |
| Email | Resend (via Edge Function) |
| Notifications | Web Push API (via Edge Function) |
| Hosting | Vercel or Netlify |

**Key principle:** All database access happens directly from React using the Supabase JS client. Row Level Security (RLS) policies on every table enforce that users can only access their own data. Server-side logic (AI, email, push notifications) is handled via Supabase Edge Functions called from React.

---

## 3. Authentication

- Email + password sign up / sign in
- Google OAuth
- Persistent sessions managed by Supabase Auth
- User profile: display name, avatar URL, timezone
- Protected routes: redirect to `/login` if no session

---

## 4. Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Today's habits, streaks, quick check-in |
| `/goals` | Goals | Manage goals and linked habits |
| `/routines` | Routines | Build and run daily routines |
| `/progress` | Progress | Charts, heatmaps, stats |
| `/coach` | AI Coach | Weekly review and AI insights |
| `/friends` | Friends | Accountability buddies |
| `/settings` | Settings | Preferences, notifications, theme |
| `/login` | Auth | Sign up / sign in |

---

## 5. Feature Specifications

### 5.1 Goals

A goal is a high-level intention (e.g. "Get Fit", "Read More") that groups related habits.

**Fields:**
- Title, description (optional)
- Category: Health | Learning | Career | Mindfulness | Finance | Relationships | Custom
- Icon (emoji), color (hex)
- Start date, target date (optional)
- Status: active | paused | completed | archived

**UI:**
- Grid of goal cards, each showing title, icon, color, and today's habit completion %
- Click a goal to see its detail view with linked habits and progress
- Add / edit via modal
- Archive or complete a goal without deleting its history

---

### 5.2 Habits

A habit is a recurring trackable action linked to a goal.

**Fields:**
- Title, goal (linked)
- Type:
  - `binary` — done or not done
  - `measurable` — numeric input with unit (e.g. 5 km, 8 glasses)
  - `timed` — duration in minutes
- Frequency: daily | specific days of week | X times per week
- Target value and unit (for measurable / timed)
- Difficulty: easy | medium | hard
- Reminder time (optional)
- Personal "why" note (optional)
- Status: active | paused | archived

---

### 5.3 Daily Check-In

The core daily interaction.

- Dashboard shows all active habits scheduled for today
- Each habit card shows: title, type, current streak, completion button
- `binary`: single tap to toggle complete
- `measurable`: tap opens numeric input
- `timed`: tap opens duration input or start/stop timer
- All completions stored in `habit_logs` with timestamp
- Users can log for up to 7 past days via a date picker
- **Quick Check-In Mode:** full-screen focus flow, one habit at a time, with swipe to complete

---

### 5.4 Streaks

- Current streak: consecutive days the habit was completed
- Longest streak: all-time best
- Grace day: one configurable missed day that doesn't break the streak (flagged visually)
- Streak shown as 🔥 with count on each habit card
- Milestone badges at: 3, 7, 14, 30, 60, 90, 180, 365 days
- Streak recalculated on each check-in and stored in `streaks` table

---

### 5.5 Routines

A routine groups habits into a scheduled time block.

**Fields:**
- Title (e.g. "Morning Routine", "Wind Down")
- Time of day: morning | afternoon | evening | custom
- Scheduled time, days of week
- Ordered list of habits with optional duration estimates

**UI:**
- Routine builder with drag-and-drop habit ordering
- Auto-calculates total estimated duration
- **Routine Focus Mode:** step-by-step full-screen view
  - One habit at a time with countdown timer
  - Progress bar through the routine
  - Completion summary with total time taken

---

### 5.6 Progress Dashboard

**Views:**

1. **Heatmap Calendar** — GitHub-style grid, colour intensity = daily completion %, filterable by habit or goal
2. **Weekly Bar Chart** — habits completed per day this week vs target
3. **Monthly Trend** — line chart of daily completion % over 30 / 60 / 90 days
4. **Streak Leaderboard** — personal ranking of habits by current streak
5. **Per-Habit Detail** — streak history, best/worst days of week, completion rate
6. **Summary Cards** — total completions, active streaks, best streak ever, this week vs last week

---

### 5.7 AI Coach

Powered by OpenAI API via Supabase Edge Functions (API key never exposed to client).

**Features:**

1. **Weekly Review** — auto-generated every Sunday: what went well, what was missed, suggestions for next week
2. **Pattern Detection** — e.g. "You tend to miss workouts on Fridays — want to reschedule?"
3. **Habit Suggestions** — based on goals, suggests habits the user hasn't added yet
4. **Difficulty Adjustment** — suggests increasing target if 100% for 3 weeks, or reducing if under 40% for 2 weeks
5. **Daily Nudge** — short motivational message on dashboard (optional, configurable)

**Implementation:**
- React calls a Supabase Edge Function with the user's habit data
- Edge Function calls OpenAI and returns the result
- Weekly review is cached in `ai_insights` table to avoid repeated API calls
- All AI content is dismissible and editable by the user

---

### 5.8 Notifications & Reminders

- **Morning Briefing** — daily summary of today's habits (configurable time)
- **Evening Check-In** — reminder to log incomplete habits
- **Streak Alert** — warning if a habit isn't done and a streak is at risk
- **Routine Reminder** — notification at routine's scheduled time
- **Weekly Review** — Sunday evening notification linking to AI summary

**Delivery:**
- In-app notification bell
- Email (via Resend, triggered from Edge Function)
- Browser push notifications (Web Push API via Edge Function)

---

### 5.9 Social & Sharing

- **Public Profile** — optional shareable page at `/u/username` showing streaks and habits
- **Accountability Buddy** — invite a friend via email to follow a specific habit; friend gets weekly progress updates
- **Emoji Reactions** — buddy can send reactions / encouragement
- **Streak Share Card** — generate a shareable image for streak milestones (using Satori or html2canvas)

---

### 5.10 Settings

- Display name and avatar
- Timezone
- Theme: light | dark | system
- Accent colour
- Notification preferences (per channel, per type)
- Grace day toggle (global or per habit)
- Week start day: Monday | Sunday
- Data export (CSV of all habit logs)
- Account deletion

---

## 6. Database Schema

### users *(managed by Supabase Auth — extended via profiles table)*
| Column | Type |
|---|---|
| id | uuid (PK) |
| email | text |
| display_name | text |
| avatar_url | text |
| timezone | text |
| created_at | timestamptz |

### goals
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles, RLS |
| title | text | |
| description | text | nullable |
| category | text | enum-like |
| icon | text | emoji |
| color | text | hex |
| start_date | date | |
| target_date | date | nullable |
| status | text | active/paused/completed/archived |
| created_at | timestamptz | |

### habits
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles, RLS |
| goal_id | uuid | FK → goals |
| title | text | |
| type | text | binary/measurable/timed |
| frequency | text | daily/specific_days/x_per_week |
| specific_days | text[] | nullable |
| x_per_week | integer | nullable |
| target_value | float | nullable |
| unit | text | nullable |
| difficulty | text | easy/medium/hard |
| reminder_time | time | nullable |
| why | text | nullable |
| status | text | active/paused/archived |
| created_at | timestamptz | |

### habit_logs
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles, RLS |
| habit_id | uuid | FK → habits |
| log_date | date | the day this log is for |
| completed | boolean | |
| value | float | nullable |
| notes | text | nullable |
| logged_at | timestamptz | when it was logged |

### routines
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles, RLS |
| title | text | |
| time_of_day | text | morning/afternoon/evening/custom |
| scheduled_time | time | nullable |
| days | text[] | |
| color | text | |
| icon | text | |
| created_at | timestamptz | |

### routine_habits
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| routine_id | uuid | FK → routines |
| habit_id | uuid | FK → habits |
| order | integer | |
| estimated_minutes | integer | nullable |

### streaks
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles, RLS |
| habit_id | uuid | FK → habits |
| current_streak | integer | |
| longest_streak | integer | |
| last_completed_date | date | |
| grace_used | boolean | |
| updated_at | timestamptz | |

### ai_insights
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles, RLS |
| type | text | weekly_review/pattern/suggestion/nudge |
| content | text | |
| dismissed | boolean | |
| generated_at | timestamptz | |

---

## 7. Row Level Security (RLS) Policies

Enable RLS on all tables. Example policies:

```sql
-- habits: users can only access their own rows
CREATE POLICY "Users manage own habits"
ON habits FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Apply the same pattern to: goals, habit_logs, routines,
-- routine_habits (via join), streaks, ai_insights
```

---

## 8. Supabase Edge Functions

| Function | Trigger | Purpose |
|---|---|---|
| `generate-weekly-review` | Cron (Sunday 8pm) | Calls OpenAI, stores result in ai_insights |
| `detect-patterns` | Cron (nightly) | Analyses habit_logs, stores patterns in ai_insights |
| `suggest-habits` | On demand (React call) | Returns habit suggestions based on goals |
| `send-email` | On demand | Sends reminders / buddy updates via Resend |
| `send-push` | On demand | Sends browser push notifications |

---

## 9. Design Guidelines

- **Style:** Clean, minimal, motivating — not clinical
- **Colors:** Neutral base (white / slate) + user-chosen accent color
- **Typography:** Inter or Geist
- **Mobile-first:** Fully usable at 375px and up
- **Dark mode:** Full support
- **Animations:** Subtle micro-interactions — confetti on milestones, flame pulse on streaks
- **Icons:** Lucide React

---

## 10. Build Phases

### Phase 1 — Core Loop
- [ ] Supabase project setup (tables, RLS policies)
- [ ] Auth: sign up, sign in, Google OAuth, protected routes
- [ ] Create and manage goals and habits
- [ ] Dashboard with daily check-in
- [ ] Streak calculation and display

### Phase 2 — Routines & Progress
- [ ] Routine builder with drag-and-drop
- [ ] Routine focus mode
- [ ] Progress dashboard: heatmap, bar chart, stat cards
- [ ] Per-habit detail view

### Phase 3 — AI & Notifications
- [ ] Supabase Edge Functions setup
- [ ] Weekly review generation (cron)
- [ ] Pattern detection
- [ ] Email and push notifications
- [ ] Morning briefing and streak alerts

### Phase 4 — Social
- [ ] Public profile page
- [ ] Accountability buddy system
- [ ] Streak share image cards

---

## 11. Out of Scope (V1)

- Native mobile app (iOS / Android)
- Team or workplace goals
- Fitness tracker integrations (Apple Health, Fitbit)
- Habit marketplace or community templates

---

*PRD v1.0 — React + Supabase frontend-only architecture*
