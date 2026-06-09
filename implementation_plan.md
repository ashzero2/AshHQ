# Implementation Plan

[Overview]
Comprehensive bug-fix, security hardening, and feature enhancement plan for AshHQ — a Next.js 16 personal command center application.

AshHQ is a single-user personal productivity dashboard built with Next.js 16 (App Router), React 19, Prisma (SQLite), Zustand, Tailwind CSS v4, and the Vercel AI SDK. It features a widget-based dashboard with tasks, calendar, finance tracking, habit tracking, notes, quick links, weather, AI chat, and a command palette. The app uses PIN-based authentication with cookie sessions and is deployable via Docker.

After thorough codebase analysis, this plan addresses **32 issues** across 4 categories:
1. **Critical Bugs & Security Vulnerabilities** (8 items) — Issues that could cause crashes, data loss, or security breaches
2. **Corner Cases & Edge Case Handling** (10 items) — Missing validation, error boundaries, race conditions
3. **Important Missing Features** (8 items) — Essential features for a production-quality command center
4. **Code Quality & Architecture Improvements** (6 items) — Technical debt, DRY violations, performance

---

### CATEGORY 1: Critical Bugs & Security Vulnerabilities

**BUG-1: Insecure Session Token — Hashed PIN stored directly as cookie value**
- File: `src/lib/services/auth.ts` (lines 21, 58)
- The session cookie value IS the hashed PIN itself. If an attacker reads the cookie, they have the password hash permanently. The middleware (`src/middleware.ts`) only checks cookie existence, not validity against the database.
- Fix: Generate a random session token (crypto.randomUUID()), store it in a Session model in the DB, and validate against it.

**BUG-2: Middleware does NOT validate session against database**
- File: `src/middleware.ts` (lines 4-23)
- Middleware only checks if cookie exists (`session?.value`), never validates it. Any arbitrary cookie value passes authentication.
- Fix: Middleware should call an API route or check session validity. Since middleware can't use Prisma directly in edge runtime, add a lightweight API route for session validation, or use `isAuthenticated()` in page-level server components.

**BUG-3: API routes completely unprotected**
- File: `src/middleware.ts` (line 9) — `/api` is in `publicPaths`
- ALL API routes (including `/api/chat`) are publicly accessible without authentication. Anyone can use the AI chat endpoint, read weather data, and interact with the app's data through server actions.
- Fix: Remove `/api` from public paths, add authentication checks to API routes.

**BUG-4: PIN brute-force attack — No rate limiting**
- File: `src/lib/services/auth.ts` — `verifyPin()` has no rate limiting
- File: `src/app/login/page.tsx` — No failed attempt tracking
- An attacker can try unlimited PIN combinations. With the default 4-digit PIN, only 10,000 combinations are needed.
- Fix: Add rate limiting (max 5 attempts per minute), lockout after 10 failed attempts, add delay between attempts.

**BUG-5: Default PIN "1234" shown on login page**
- File: `src/app/login/page.tsx` (line 123) — `<p>Default PIN: 1234</p>`
- File: `src/lib/constants.ts` (line 94) — `export const DEFAULT_PIN = "1234"`
- The default PIN is hardcoded and displayed on the login page. In production, this is a security risk.
- Fix: Only show on first-time setup, force PIN change on first login.

**BUG-6: SHA-256 hash without salt for PIN storage**
- File: `src/lib/utils.ts` (lines 27-29) — `hashPin` uses bare SHA-256
- PIN is hashed with SHA-256 without any salt. Identical PINs produce identical hashes. Rainbow table attacks are trivial for 4-digit PINs.
- Fix: Use bcrypt or scrypt with per-user salt, or at minimum use HMAC with a server secret.

**BUG-7: `createHash` from `crypto` imported in shared utility file**
- File: `src/lib/utils.ts` (line 4) — `import { createHash } from "crypto"`
- This is a Node.js-only module imported in a utility file that may be bundled for client-side use. `cn()`, `formatCurrency()`, `formatDate()`, `formatRelativeTime()` are used in client components.
- Fix: Split `hashPin` into a server-only file (`src/lib/server-utils.ts`), keep client-safe utils in `src/lib/utils.ts`.

**BUG-8: AI Chat widget doesn't use streaming properly**
- File: `src/components/widgets/ai-chat-widget.tsx` — Uses manual fetch + text reader instead of the AI SDK's `useChat` hook
- The widget manually implements streaming with `getReader()` which is error-prone and doesn't handle edge cases (abort, retry, error recovery).
- Fix: Use `useChat` from `ai/react` which handles streaming, error states, and abort natively.

---

### CATEGORY 2: Corner Cases & Edge Case Handling

**EDGE-1: No error boundaries — Any widget crash kills entire dashboard**
- File: `src/app/page.tsx` — No `ErrorBoundary` wrapping widgets
- If any widget throws (e.g., database connection fails, null data), the entire dashboard crashes with a white screen.
- Fix: Add React Error Boundary wrapper around each widget in `WidgetWrapper`.

**EDGE-2: Finance view redefines `cn()` locally**
- File: `src/components/features/finance/finance-view.tsx` (lines 303-305)
- Defines a local `cn()` function that shadows the imported one from `@/lib/utils`. This is a DRY violation and inconsistent behavior.
- Fix: Import `cn` from `@/lib/utils` instead of redefining it.

**EDGE-3: Calendar event form doesn't validate endTime > startTime**
- File: `src/components/features/calendar/calendar-events.tsx` — `handleCreate`
- File: `src/lib/validations.ts` — `CreateEventSchema` has no cross-field validation
- Users can create events where endTime is before startTime, causing display bugs.
- Fix: Add `.refine()` to `CreateEventSchema` to validate `endTime > startTime`.

**EDGE-4: No loading states for dashboard widgets**
- File: `src/app/page.tsx` — Widgets are async server components without Suspense
- If database is slow, the entire page hangs with no visual feedback.
- Fix: Wrap each widget in `<Suspense fallback={<WidgetSkeleton />}>`.

**EDGE-5: Task form doesn't validate dueDate is in the future**
- File: `src/components/features/tasks/task-form.tsx` / `src/lib/validations.ts`
- Users can set due dates in the past when creating new tasks.
- Fix: Add optional validation or at least a visual warning for past due dates.

**EDGE-6: Weather widget fails silently when API key missing**
- File: `src/components/widgets/weather-widget.tsx` — Uses SWR to fetch, but error state could be more informative
- Fix: Show a setup prompt linking to settings when weather is not configured.

**EDGE-7: Habit streak calculation only looks at last 30 days of logs**
- File: `src/lib/services/habits.ts` (line 15) — `gte: format(subDays(new Date(), 30), "yyyy-MM-dd")`
- If a user has a 45-day streak, it will be incorrectly calculated as max 30. The `calculateCurrentStreak` and `calculateLongestStreak` functions only receive 30 days of data.
- Fix: For streak calculation, fetch all logs (or at least extend to 365 days). For display optimization, limit separately.

**EDGE-8: Command palette uses hardcoded zinc colors instead of theme tokens**
- File: `src/components/command-palette.tsx` — Uses `bg-zinc-900`, `border-zinc-800`, etc.
- Breaks completely in light theme — white text on white background.
- Fix: Replace hardcoded zinc colors with theme-aware CSS variables (`bg-surface`, `border-outline`, etc.)

**EDGE-9: Mobile sidebar doesn't close on navigation**
- File: `src/components/layout/sidebar.tsx` — Nav links don't call `setSidebarOpen(false)`
- On mobile, after clicking a nav item, the sidebar stays open covering the content.
- Fix: Add `onClick={() => setSidebarOpen(false)}` to each nav link on mobile viewport.

**EDGE-10: No pagination for transactions, tasks, notes**
- File: `src/lib/services/finance.ts` — `getTransactions()` returns all
- File: `src/lib/services/tasks.ts` — `getTasks()` returns all
- File: `src/lib/services/notes.ts` — `getNotes()` returns all
- As data grows, pages will become increasingly slow loading all records at once.
- Fix: Add cursor-based or offset pagination with configurable page sizes.

---

### CATEGORY 3: Important Missing Features

**FEAT-1: Data Export/Import & Backup**
- There is no way to export or backup data. For a personal command center, this is critical.
- Features needed: Export all data as JSON, Import from JSON backup, Scheduled auto-backup option.
- New files: `src/app/api/export/route.ts`, `src/app/api/import/route.ts`
- New UI: Add Export/Import section to Settings page.

**FEAT-2: Pomodoro / Focus Timer**
- Essential for a productivity command center. Every major competitor (TickTick, Super Productivity, Flowry) includes this.
- Features: Configurable work/break intervals, Integration with tasks (focus on a specific task), Session history tracking.
- New files: `src/components/widgets/pomodoro-widget.tsx`, `src/components/features/pomodoro/pomodoro-view.tsx`
- New Prisma model: `FocusSession`

**FEAT-3: Recurring Tasks**
- Currently tasks are one-off only. Recurring tasks (daily, weekly, monthly) are essential for a life command center.
- Add `recurrence` field to Task model (NONE, DAILY, WEEKLY, MONTHLY, YEARLY).
- Add auto-generation logic for recurring task instances.

**FEAT-4: Task Due Date Reminders / Notifications**
- No notification system exists. Overdue tasks have no alerts.
- Features: Browser notification API integration, PWA push notifications, Visual badge counts for overdue items.
- Enhance service worker to support push notifications.

**FEAT-5: Global Search Across All Modules**
- Command palette only navigates pages. No search across tasks, notes, events, transactions.
- Features: Full-text search across all models, Search from command palette, Keyboard shortcut (Cmd+K already exists, enhance it).
- New file: `src/lib/services/search.ts`

**FEAT-6: Daily Journal / Log**
- Missing from the personal command center. A daily journal/log is a core feature in apps like Notion Life OS, Origami, and Super Productivity.
- Features: Daily entry with rich text, Mood tracking, Daily review/reflection prompts, Integration with AI chat for journaling.
- New Prisma model: `JournalEntry`
- New files: `src/app/journal/page.tsx`, `src/components/features/journal/journal-view.tsx`, `src/lib/services/journal.ts`

**FEAT-7: Dashboard Widget Customization (Drag & Drop)**
- `react-grid-layout` is installed as a dependency but NOT used. Dashboard layout is hardcoded in `src/app/page.tsx`.
- `dashboardLayout` field exists in Settings model but is never read for rendering.
- Features: Drag-and-drop widget rearrangement, Widget show/hide toggles, Persist layout to database.

**FEAT-8: Offline Support Enhancement**
- Service worker is minimal — only caches `/` and `/login`.
- For a personal command center, robust offline support is important.
- Features: Cache all static assets, Queue mutations for sync when online, Show offline indicator.

---

### CATEGORY 4: Code Quality & Architecture Improvements

**QUAL-1: No test files exist**
- Zero test coverage. No unit tests, integration tests, or E2E tests.
- Add: Jest + React Testing Library for unit tests, Playwright for E2E.

**QUAL-2: `swr` dependency installed but unused**
- `swr` is in package.json but only the weather widget uses it (via manual fetch, not SWR).
- Fix: Either use SWR properly for client-side data fetching or remove the dependency.

**QUAL-3: `recharts` dependency installed but unused**
- `recharts` is in package.json but the finance chart is a custom implementation (`MonthlyBarChart` in finance-view.tsx).
- Fix: Either use Recharts for proper charts or remove the dependency.

**QUAL-4: AIProvider enum missing GEMINI**
- File: `src/lib/types.ts` (lines 32-35) — `AIProvider` only has OPENAI and OLLAMA
- But settings-view.tsx and validations.ts support GEMINI as a provider.
- Fix: Add `GEMINI = "GEMINI"` to the `AIProvider` enum.

**QUAL-5: Docker healthcheck uses weather endpoint**
- File: `docker-compose.yml` (line 18) — `http://localhost:3000/api/weather`
- Weather endpoint returns 400 when not configured, making healthcheck always fail.
- Fix: Create a dedicated `/api/health` endpoint.

**QUAL-6: Missing `.env.example` file**
- No example environment file for new developers to know required/optional env vars.
- Fix: Create `.env.example` with documented variables.

---

[Types]
New and modified type definitions needed for bug fixes and new features.

### Modified Types (`src/lib/types.ts`)

1. **AIProvider enum** — Add missing GEMINI variant:
```typescript
export enum AIProvider {
  OPENAI = "OPENAI",
  OLLAMA = "OLLAMA",
  GEMINI = "GEMINI",  // NEW
}
```

2. **New Recurrence enum**:
```typescript
export enum Recurrence {
  NONE = "NONE",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}
```

3. **New FocusSession interface**:
```typescript
export interface FocusSession {
  id: string;
  taskId: string | null;
  duration: number; // minutes
  type: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  completedAt: Date;
  createdAt: Date;
}
```

4. **New JournalEntry interface**:
```typescript
export interface JournalEntry {
  id: string;
  date: string; // yyyy-MM-dd, unique
  content: string;
  mood: "GREAT" | "GOOD" | "OKAY" | "BAD" | "TERRIBLE" | null;
  createdAt: Date;
  updatedAt: Date;
}
```

5. **New SearchResult interface**:
```typescript
export interface SearchResult {
  type: "task" | "note" | "event" | "transaction" | "habit" | "link";
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
}
```

6. **Updated Task interface** — add recurrence:
```typescript
export interface Task {
  // ... existing fields
  recurrence: Recurrence;
  recurrenceParentId: string | null;
}
```

7. **New Session interface** (for secure auth):
```typescript
export interface Session {
  id: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

[Files]
Complete list of file modifications, creations, and configuration changes.

### New Files to Create

| File Path | Purpose |
|---|---|
| `src/lib/server-utils.ts` | Server-only utilities (hashPin, session token generation) |
| `src/lib/services/search.ts` | Global search across all models |
| `src/lib/services/journal.ts` | Journal CRUD operations |
| `src/lib/services/pomodoro.ts` | Focus session CRUD and timer logic |
| `src/lib/services/export.ts` | Data export/import logic |
| `src/app/api/health/route.ts` | Health check endpoint |
| `src/app/api/export/route.ts` | Data export API endpoint |
| `src/app/api/import/route.ts` | Data import API endpoint |
| `src/app/journal/page.tsx` | Journal page |
| `src/components/features/journal/journal-view.tsx` | Journal entry editor/viewer |
| `src/components/widgets/pomodoro-widget.tsx` | Pomodoro timer widget for dashboard |
| `src/components/features/pomodoro/pomodoro-view.tsx` | Full pomodoro page view |
| `src/components/shared/error-boundary.tsx` | Reusable React error boundary |
| `src/components/shared/widget-skeleton.tsx` | Skeleton loading component for widgets |
| `.env.example` | Example environment variables file |

### Existing Files to Modify

| File Path | Changes |
|---|---|
| `prisma/schema.prisma` | Add Session, JournalEntry, FocusSession models; add recurrence fields to Task |
| `prisma/seed.ts` | Update seed for new schema, force PIN change flag |
| `src/middleware.ts` | Improve session validation, remove /api from public paths |
| `src/lib/utils.ts` | Remove `hashPin` and `createHash` import (move to server-utils.ts) |
| `src/lib/types.ts` | Add GEMINI to AIProvider, add new interfaces |
| `src/lib/validations.ts` | Add cross-field validation for events, new schemas |
| `src/lib/services/auth.ts` | Implement secure session tokens, rate limiting |
| `src/lib/services/habits.ts` | Fix 30-day log limit for streak calculation |
| `src/lib/services/tasks.ts` | Add recurring task support, pagination |
| `src/lib/services/finance.ts` | Add pagination |
| `src/lib/services/notes.ts` | Add pagination |
| `src/app/page.tsx` | Add Suspense boundaries, error boundaries, Pomodoro widget |
| `src/app/login/page.tsx` | Remove default PIN display, add rate limiting UI |
| `src/app/settings/page.tsx` | Add export/import section |
| `src/components/command-palette.tsx` | Fix hardcoded colors, add global search |
| `src/components/features/finance/finance-view.tsx` | Remove local cn() redefinition, import from utils |
| `src/components/features/settings/settings-view.tsx` | Add export/import UI, dashboard layout settings |
| `src/components/features/calendar/calendar-events.tsx` | Add endTime > startTime validation |
| `src/components/layout/sidebar.tsx` | Close sidebar on mobile navigation, add Journal nav |
| `src/components/dashboard/widget-wrapper.tsx` | Add error boundary integration |
| `src/components/widgets/ai-chat-widget.tsx` | Migrate to useChat hook |
| `src/components/widgets/weather-widget.tsx` | Better setup prompt for missing config |
| `src/app/api/chat/route.ts` | Add authentication check |
| `src/app/api/weather/route.ts` | Add authentication check |
| `docker-compose.yml` | Fix healthcheck endpoint |
| `public/sw.js` | Enhance caching strategy |
| `next.config.ts` | Add security headers |

[Functions]
Detailed function modifications and new functions.

### New Functions

| Function | File | Purpose |
|---|---|---|
| `generateSessionToken()` | `src/lib/server-utils.ts` | Generate cryptographically secure random session token |
| `hashPinSecure(pin, salt)` | `src/lib/server-utils.ts` | Hash PIN with salt using HMAC-SHA256 |
| `createSession(token)` | `src/lib/services/auth.ts` | Create session record in DB |
| `validateSession(token)` | `src/lib/services/auth.ts` | Validate session token against DB |
| `deleteExpiredSessions()` | `src/lib/services/auth.ts` | Cleanup expired sessions |
| `checkRateLimit(ip)` | `src/lib/services/auth.ts` | Check/enforce login rate limiting |
| `globalSearch(query)` | `src/lib/services/search.ts` | Search across all models |
| `getJournalEntries(page)` | `src/lib/services/journal.ts` | Get paginated journal entries |
| `getJournalByDate(date)` | `src/lib/services/journal.ts` | Get or create journal entry for date |
| `upsertJournalEntry(data)` | `src/lib/services/journal.ts` | Create/update journal entry |
| `createFocusSession(data)` | `src/lib/services/pomodoro.ts` | Log completed focus session |
| `getFocusStats(range)` | `src/lib/services/pomodoro.ts` | Get focus statistics for date range |
| `exportAllData()` | `src/lib/services/export.ts` | Export all user data as JSON |
| `importData(json)` | `src/lib/services/export.ts` | Import data from JSON backup |

### Modified Functions

| Function | File | Change |
|---|---|---|
| `verifyPin()` | `src/lib/services/auth.ts` | Add rate limiting, generate session token instead of using hash |
| `isAuthenticated()` | `src/lib/services/auth.ts` | Validate against Session model, not Settings.pin |
| `changePin()` | `src/lib/services/auth.ts` | Use salted hashing, invalidate all sessions |
| `getHabits()` | `src/lib/services/habits.ts` | Increase log fetch window from 30 to 365 days |
| `getTasks()` | `src/lib/services/tasks.ts` | Add pagination params (skip, take) |
| `getTransactions()` | `src/lib/services/finance.ts` | Add pagination params |
| `getNotes()` | `src/lib/services/notes.ts` | Add pagination params |
| `createTask()` | `src/lib/services/tasks.ts` | Handle recurrence field |
| `buildContextPrompt()` | `src/app/api/chat/route.ts` | Add auth check, expand context |
| `POST()` | `src/app/api/chat/route.ts` | Add authentication check |

### Removed Functions

| Function | File | Reason |
|---|---|---|
| `hashPin()` | `src/lib/utils.ts` | Moved to `src/lib/server-utils.ts` as `hashPinSecure()` |
| Local `cn()` | `src/components/features/finance/finance-view.tsx` | Use imported `cn` from `@/lib/utils` |

[Classes]
Component-level modifications (React components are the "classes" in this codebase).

### New Components

| Component | File | Purpose |
|---|---|---|
| `ErrorBoundary` | `src/components/shared/error-boundary.tsx` | Catch and display widget errors gracefully |
| `WidgetSkeleton` | `src/components/shared/widget-skeleton.tsx` | Loading skeleton for async widgets |
| `JournalView` | `src/components/features/journal/journal-view.tsx` | Journal entry editor with mood tracking |
| `PomodoroWidget` | `src/components/widgets/pomodoro-widget.tsx` | Dashboard timer widget |
| `PomodoroView` | `src/components/features/pomodoro/pomodoro-view.tsx` | Full pomodoro page |

### Modified Components

| Component | File | Changes |
|---|---|---|
| `WidgetWrapper` | `src/components/dashboard/widget-wrapper.tsx` | Wrap children in ErrorBoundary |
| `CommandPalette` | `src/components/command-palette.tsx` | Replace hardcoded zinc colors with theme tokens; add search functionality |
| `AiChatWidget` | `src/components/widgets/ai-chat-widget.tsx` | Migrate to `useChat` hook from `ai/react` |
| `FinanceView` | `src/components/features/finance/finance-view.tsx` | Remove local `cn()`, import from utils |
| `CalendarEvents` | `src/components/features/calendar/calendar-events.tsx` | Add time validation feedback |
| `Sidebar` | `src/components/layout/sidebar.tsx` | Close on mobile nav, add Journal link |
| `SettingsView` | `src/components/features/settings/settings-view.tsx` | Add export/import section, dashboard layout editor |
| `LoginPage` | `src/app/login/page.tsx` | Remove default PIN hint, add rate limit feedback |
| `DashboardPage` | `src/app/page.tsx` | Add Suspense boundaries, Pomodoro widget |

[Dependencies]
Dependency modifications needed.

### Dependencies to Add
- None required — all new features can be implemented with existing dependencies.

### Dependencies to Remove (optional cleanup)
- `swr` — Not actually used anywhere (weather widget uses raw fetch). Can remove or start using it.
- `recharts` — Not actually used (custom chart in finance). Can remove or replace custom chart.

### Dependencies to Consider
- `bcryptjs` — For proper password hashing (if replacing SHA-256 with bcrypt). Alternative: use Node.js `crypto.scrypt` which requires no new dependency.

[Testing]
Testing strategy for the implementation.

### Current State
- Zero test files exist in the project.
- No testing dependencies installed.

### Recommended Testing Approach (Phase 2 — not blocking this implementation)
1. **Unit Tests**: Add Jest + React Testing Library for service functions and components
2. **Integration Tests**: Test API routes with supertest
3. **E2E Tests**: Add Playwright for critical flows (login, create task, navigate)

### Validation Strategy for This Implementation
1. Manual testing of all security fixes (auth flow, session management)
2. Verify all widgets render with empty data states
3. Test error boundary recovery
4. Verify mobile responsive behavior (sidebar close on nav)
5. Test command palette in both light and dark themes
6. Verify streak calculation with >30 day data
7. Test data export/import round-trip

[Implementation Order]
Ordered sequence of implementation to minimize conflicts and ensure successful integration.

The implementation is divided into 3 phases. Phase 1 (Critical) should be done first as it fixes security issues and bugs. Phase 2 (Features) adds new functionality. Phase 3 (Polish) improves code quality.

### Phase 1: Critical Bugs & Security (Do First)

1. **Create `src/lib/server-utils.ts`** — Move `hashPin` out of client-bundled utils, create `generateSessionToken()`, `hashPinSecure()`.

2. **Fix `src/lib/utils.ts`** — Remove `createHash` import and `hashPin` function. Keep only client-safe utilities.

3. **Update `prisma/schema.prisma`** — Add `Session` model with token, expiresAt fields. Add `recurrence` field to Task. Add `JournalEntry` model. Add `FocusSession` model. Run migration.

4. **Fix `src/lib/services/auth.ts`** — Implement secure session management: random token generation, session DB storage, rate limiting (in-memory counter for PIN attempts), proper session validation.

5. **Fix `src/middleware.ts`** — Remove `/api` from public paths (keep `/_next`, `/login`, `/favicon.ico`, `/icons`, `/manifest.json`, `/sw.js`). For API routes, add auth check inside each route handler (since middleware runs in edge runtime and can't use Prisma).

6. **Add auth checks to API routes** — Add authentication verification to `src/app/api/chat/route.ts` and `src/app/api/weather/route.ts`.

7. **Fix `src/lib/types.ts`** — Add `GEMINI` to `AIProvider` enum, add new interfaces (Session, JournalEntry, FocusSession, SearchResult, Recurrence).

8. **Fix `src/lib/validations.ts`** — Add `.refine()` to `CreateEventSchema` for endTime > startTime. Add new schemas for JournalEntry, FocusSession.

9. **Fix `src/app/login/page.tsx`** — Remove hardcoded "Default PIN: 1234" text, add rate limiting UI feedback (show "Too many attempts, try again in X seconds").

10. **Create `src/app/api/health/route.ts`** — Simple health endpoint returning `{ status: "ok" }`.

11. **Fix `docker-compose.yml`** — Change healthcheck to use `/api/health`.

### Phase 2: Edge Cases & Features

12. **Create `src/components/shared/error-boundary.tsx`** — React error boundary component with fallback UI.

13. **Create `src/components/shared/widget-skeleton.tsx`** — Skeleton loading animations for widgets.

14. **Fix `src/app/page.tsx`** — Wrap each widget in `<Suspense>` with `<WidgetSkeleton />` fallback. Wrap each widget section with ErrorBoundary.

15. **Fix `src/components/features/finance/finance-view.tsx`** — Remove local `cn()` function (lines 303-305), import from `@/lib/utils`.

16. **Fix `src/components/command-palette.tsx`** — Replace all hardcoded `zinc-*` classes with theme-aware tokens (`bg-surface`, `border-outline`, `text-foreground`, etc.).

17. **Fix `src/components/layout/sidebar.tsx`** — Add `onClick={() => setSidebarOpen(false)}` to each nav link. Add Journal nav item.

18. **Fix `src/lib/services/habits.ts`** — Change log fetch window from 30 days to 365 days for streak calculation.

19. **Fix `src/components/widgets/ai-chat-widget.tsx`** — Migrate from manual fetch+reader to `useChat` hook from `ai/react`.

20. **Create `src/lib/services/search.ts`** — Implement `globalSearch()` that queries tasks, notes, events, transactions, habits, links.

21. **Enhance `src/components/command-palette.tsx`** — Add global search results section showing matches from all modules.

22. **Create `src/lib/services/journal.ts`** — CRUD for journal entries.

23. **Create `src/app/journal/page.tsx`** and `src/components/features/journal/journal-view.tsx` — Journal page with daily entries and mood tracking.

24. **Create `src/lib/services/export.ts`** — Export all data as JSON, import from JSON.

25. **Create `src/app/api/export/route.ts`** and `src/app/api/import/route.ts`** — API endpoints for data export/import.

26. **Update `src/components/features/settings/settings-view.tsx`** — Add Data Management section with Export/Import buttons.

### Phase 3: Polish & Enhancement

27. **Create `src/components/widgets/pomodoro-widget.tsx`** and `src/lib/services/pomodoro.ts` — Pomodoro timer widget and service.

28. **Update `src/app/page.tsx`** — Add Pomodoro widget to dashboard grid.

29. **Enhance `public/sw.js`** — Improve caching strategy to cache all static assets and critical pages.

30. **Add `next.config.ts` security headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

31. **Create `.env.example`** — Document all environment variables.

32. **Update `prisma/seed.ts`** — Add first-time setup flag, update for new schema.
