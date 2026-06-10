# MovePilot AI

Your AI co-pilot for moving anywhere.

Professional MVP dashboard prototype built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

## Quick start

```bash
npm install
cp .env.example .env.local   # add your OPENAI_API_KEY
npm run dev
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (server-side only) |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini` for speed) |

Maps use **OpenStreetMap** tiles and **OSRM** routing — no API key required.

Open [http://localhost:3000](http://localhost:3000).

## Demo user

- **Name:** Raul Garcia
- **Route:** Austin, TX → Huntington, WV
- **Move date:** September 15, 2026
- **Household:** 2 adults, 1 child, 1 dog
- **Vehicle:** 2019 Volkswagen Atlas V6 4Motion
- **Budget:** $4,000

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

## Tech stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide icons
- Mock data (PostgreSQL-ready structure in `src/lib/types.ts`)

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

This is an MVP prototype. All data is mocked. Backend and database integration are planned for future phases.
