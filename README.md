# AshHQ

A personal command center — self-hosted, PIN-protected, and designed to run on a VPS in a single Docker container. Manages tasks, habits, finance, notes, links, journal, and calendar from one place.

## Features

- **Tasks** — create, prioritize (Low / Medium / High / Urgent), filter, and track. Recurring tasks spawn on a schedule (daily, weekly, monthly, yearly).
- **Habits** — daily check-ins with streaks and a 30-day completion heatmap.
- **Finance** — income/expense tracking with category breakdowns, monthly charts, and recurring expenses (auto-approve or manual).
- **Notes** — pinnable markdown notes with full-text search.
- **Links** — bookmarks organized by category with search.
- **Journal** — dated entries with mood tracking.
- **Calendar** — event scheduling.
- **Analytics** — aggregated stats across habits, tasks, finance, and focus sessions with CSS bar charts.
- **Pomodoro** — focus timer with session logging.
- **AI Chat** — supports OpenAI, Gemini (free), and Ollama (local).
- **Telegram bot** — query tasks/habits/finance and create items from Telegram. Pluggable channel architecture (add Discord/Slack by implementing one interface).
- **Themes** — dark, light, and system.
- **Dashboard** — drag-and-drop widget grid, fully customizable layout.
- **Offline banner** — detects network loss and warns gracefully.
- **Keyboard shortcuts** — `⌘K` / `Ctrl+K` command palette, Escape to close dialogs.

## Tech Stack

- **Next.js 16** (App Router, server actions, `force-dynamic`)
- **Prisma 6** + **SQLite** (single file, easy backup)
- **Tailwind CSS v4** with CSS custom properties theming
- **next-themes** for dark/light/system switching
- **Zustand** for client state, **SWR** for data fetching
- **Sonner** for toasts, **cmdk** for command palette
- **date-fns** for date math, **node-cron** for scheduler
- **AI SDK** (`@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`)

---

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone <repo>
cd ashhq

npm install

# Copy and edit environment variables
cp .env.example .env.local

# Run migrations and seed the database
DATABASE_URL="file:./prisma/ashhq.db" npx prisma migrate deploy
DATABASE_URL="file:./prisma/ashhq.db" npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default PIN is `1234` — change it immediately in Settings → Change PIN.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path. Use `file:./prisma/ashhq.db` locally. |
| `SESSION_SECRET` | Yes | Long random string used to sign session tokens. |
| `OPENAI_API_KEY` | No | Can also be set in the Settings UI. |
| `GEMINI_API_KEY` | No | Can also be set in the Settings UI. |
| `WEATHER_API_KEY` | No | OpenWeatherMap key. Can be set in Settings UI. |
| `OLLAMA_BASE_URL` | No | Defaults to `http://localhost:11434`. |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token from @BotFather. Env var takes precedence over Settings UI. |
| `TELEGRAM_CHAT_ID` | No | Your Telegram user/chat ID from @userinfobot. |
| `TELEGRAM_ENABLED` | No | Set to `false` to disable Telegram even if token/chat ID are set. Defaults to `true`. |
| `SCHEDULER_SECRET` | No | Bearer secret for `POST /api/scheduler`. If unset, the endpoint is open. |

---

## Deployment

### Option 1 — Docker (recommended)

The included `Dockerfile` builds a multi-stage image. The database lives in a named volume at `/data/ashhq.db`. On first boot the seed script runs automatically.

**Quick start:**

```bash
# Clone and configure
git clone <repo>
cd ashhq
cp docker-compose.yml docker-compose.override.yml  # edit secrets here

# Set a real SESSION_SECRET in docker-compose.yml, then:
docker compose up -d
```

**docker-compose.yml** — edit before deploying:

```yaml
services:
  ashhq:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ashhq-data:/data
    environment:
      - DATABASE_URL=file:/data/ashhq.db
      - SESSION_SECRET=replace-with-a-long-random-string
      # - OPENAI_API_KEY=sk-...
      # - GEMINI_API_KEY=...
      # - WEATHER_API_KEY=...
      # - SCHEDULER_SECRET=some-secret

volumes:
  ashhq-data:
```

**Rebuild after pulling changes:**

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

**Backup the database:**

```bash
docker cp ashhq:/data/ashhq.db ./ashhq-backup-$(date +%Y%m%d).db
```

### Option 2 — Reverse proxy (Nginx + SSL)

Run the container on port 3000 and proxy through Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Get a certificate with Certbot:

```bash
sudo certbot --nginx -d yourdomain.com
```

### Option 3 — Bare metal with systemd

Use the included `deploy.sh` script with a systemd service for zero-downtime redeploys.

**1. Create the systemd service** at `/etc/systemd/system/ashhq.service`:

```ini
[Unit]
Description=AshHQ
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ashhq
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/var/www/ashhq/.env

[Install]
WantedBy=multi-user.target
```

**2. Enable and start:**

```bash
sudo systemctl enable ashhq
sudo systemctl start ashhq
```

**3. Redeploy by running:**

```bash
./deploy.sh
```

The script pulls latest, installs deps, runs migrations, rebuilds, and restarts the systemd service.

---

## Configuration

All configuration is done through the Settings UI (`/settings`) after first login. No need to set environment variables for optional integrations.

### AI Provider

Choose between:
- **Gemini** — free tier, get a key at [aistudio.google.com](https://aistudio.google.com). Default model: `gemini-2.5-flash`.
- **OpenAI** — paste your `sk-...` key.
- **Ollama** — runs locally, set the base URL (default `http://localhost:11434`).

### Weather Widget

Get a free API key at [openweathermap.org](https://openweathermap.org/api). Set your city and preferred temperature unit (°C / °F). Use "Test Connection" to verify before saving.

### Telegram Bot

1. Message **@BotFather** on Telegram → `/newbot` → copy the token.
2. Message **@userinfobot** to get your chat ID.
3. Paste both into Settings → Telegram → enable → Save.
4. Register the webhook (required for commands to work):

```bash
curl -X POST https://yourdomain.com/api/channels/telegram/setup \
  -H "Content-Type: application/json"
```

**Available commands:**

| Command | Action |
|---|---|
| `/tasks` | List pending tasks |
| `/habits` | Today's habit check-in status |
| `/finance` | This month's income / expenses |
| `/addtask [title]` | Create a new task |
| `/addnote [title]` | Create a new note |
| `/help` | Show all commands |

### Recurring Tasks & Expenses

**Tasks** (`/tasks` → Recurring tab):
- Set frequency: Daily, Weekly (pick days), Monthly (pick day of month), Yearly.
- Set interval (e.g. "every 2 weeks").
- The scheduler spawns a new task instance automatically when `nextDueAt` passes.

**Expenses** (`/finance` → Recurring tab):
- Add bills, rent, subscriptions.
- Enable **Auto-approve** to record the transaction automatically when due.
- Or leave it off and use the ✓ (approve) / clock (snooze 7 days) buttons.

**Scheduler** runs hourly via `node-cron` (registered in `src/instrumentation.ts` — only active in Node.js runtime). You can also trigger it manually:

```bash
curl -X POST https://yourdomain.com/api/scheduler \
  -H "x-scheduler-secret: your-scheduler-secret"
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open command palette |
| `Escape` | Close any open dialog or panel |
| `Enter` / `Space` | Activate focused card or button |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── channels/[channelId]/webhook/  # Dynamic webhook (Telegram, future channels)
│   │   ├── scheduler/      # Manual scheduler trigger
│   │   ├── chat/           # AI streaming endpoint
│   │   ├── export/         # Full data export (JSON)
│   │   └── weather/        # Weather proxy
│   ├── analytics/
│   ├── finance/
│   ├── tasks/
│   └── ...
├── components/
│   ├── features/           # Feature-specific components (tasks, habits, finance…)
│   ├── layout/             # AppShell, Sidebar, Header
│   ├── ui/                 # Reusable primitives (ConfirmDialog, etc.)
│   └── widgets/            # Dashboard widgets (Pomodoro, Weather, AI Chat…)
├── hooks/                  # useDebounce, useOnlineStatus, useMediaQuery, useKeyboardShortcut
├── lib/
│   ├── channels/           # Pluggable notification system
│   │   ├── types.ts        # NotificationChannel interface
│   │   ├── notification-manager.ts
│   │   ├── channel-registry.ts
│   │   ├── telegram-channel.ts
│   │   └── command-router.ts
│   ├── services/           # All server actions (Prisma queries, business logic)
│   └── validations.ts      # Zod schemas
├── stores/                 # Zustand stores
└── instrumentation.ts      # node-cron scheduler registration
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## Adding a New Notification Channel

The notification system uses an adapter pattern. To add Discord:

1. Create `src/lib/channels/discord-channel.ts` implementing `NotificationChannel`.
2. Call `registerChannel(discordChannel)` in `notification-manager.ts`.
3. That's it — the webhook route, command routing, and `sendToAll()` work automatically.

---

## Data Export & Backup

Export everything as JSON from Settings → Data Management → Export backup. The export includes tasks, events, habits, notes, finance, journal entries, and links.

For database-level backups (Docker):

```bash
docker cp ashhq:/data/ashhq.db ./backup.db
```

---

## Security Notes

- The app is PIN-protected. PINs are hashed with bcrypt (cost factor 12).
- All server actions verify the session before touching the database.
- Session tokens are signed with `SESSION_SECRET` — set a strong value in production.
- Rate limiting is applied to login attempts (5 attempts per 15 minutes per IP).
- The app is designed for single-user, personal use on a trusted VPS behind HTTPS.
