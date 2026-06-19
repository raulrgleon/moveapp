# MovePilot AI

Your AI co-pilot for moving anywhere.

Professional MVP dashboard prototype built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

📖 **Documentación completa (español):** ver [DOCUMENTACION.md](./DOCUMENTACION.md) — arquitectura, páginas, APIs, IA, mapas, utilities y roadmap.

## Quick start

```bash
npm install
cp .env.example .env.local   # configure keys (see below)
npx prisma db push
npm run dev
```

Production:

```bash
npm run build
pm2 start ecosystem.config.cjs
```

Set `NEXT_PUBLIC_APP_URL` to your public HTTPS URL. Daily task reminders run via:

```bash
# crontab (08:00 UTC): scripts/cron-reminders.sh
# Requires CRON_SECRET in .env.local
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (server-side only) |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session signing secret (min 32 chars) |
| `WEATHERAPI_KEY` | Weather along route (optional) |
| `RENTCAST_API_KEY` | Housing market data (optional) |
| `CRON_SECRET` | Protects `/api/cron/reminders` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (`AC…`) |
| `TWILIO_PHONE_NUMBER` | Twilio SMS sender number (`+1…`) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token **or** use API key below |
| `TWILIO_API_KEY_SID` | Twilio API key SID (`SK…`) |
| `TWILIO_API_KEY_SECRET` | Twilio API key secret |
| `ADMIN_PASSWORD` | Used by `npm run seed:admin` only |

SMS reminders: configure Twilio vars, then run `npm run twilio:check`. Users enable SMS under **Settings → Notifications**. Admin can test via **Admin → Maintenance**.

Maps use **OpenStreetMap** tiles and **OSRM** routing — no API key required.

Open [http://localhost:3000](http://localhost:3000).

## Auth

Users register via `/onboarding` or `/login`. Admins use `/admin` after running:

```bash
ADMIN_PASSWORD='your-secure-password' npm run seed:admin
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login` | Login placeholder |
| `/onboarding` | Multi-step onboarding form |
| `/dashboard` | Overview dashboard |
| `/moving-plan` | AI moving plan |
| `/budget` | Budget planner |
| `/route` | Route planner |
| `/trucks` | Truck & trailer finder |
| `/vehicles` | Vehicle transport planning |
| `/utilities` | Home utilities & services at destination address |
| `/city-comparison` | City comparison |
| `/checklist` | Moving checklist |
| `/inventory` | Box inventory manager |
| `/documents` | Document vault |
| `/marketplace` | Services marketplace |
| `/assistant` | Full-page AI assistant |
| `/settings` | Account settings |
| `/admin` | Admin user management (admin role only) |

## Tech stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide icons
- PostgreSQL + Prisma (persistent user and move data)

## Project structure

```
src/
├── app/                    # App Router pages
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Sidebar, header, AI panel
│   └── dashboard/          # Shared dashboard components
└── lib/
    ├── mock-data.ts        # All mock data
    ├── types.ts            # TypeScript interfaces
    ├── constants.ts        # Navigation, categories
    └── utils.ts            # Utilities
```

## Notes

Persistent data lives in PostgreSQL. Configure `RESEND_API_KEY` / `TWILIO_*` for email/SMS reminders and `S3_BUCKET` for cloud file storage (optional).
