# Next.js AI Coding Starter

Production-ready Next.js SaaS starter optimized for AI-assisted development with Bun, Supabase, and strict TypeScript.

## Stack

| Technology | Choice | AI Agent Benefit |
|------------|--------|------------------|
| Runtime | Bun | Faster iteration cycles |
| Framework | Next.js 16 | Predictable file conventions |
| Linting | Biome | 10-25x faster feedback loop |
| Type Safety | TS strict | Unambiguous errors, types as docs |
| Database | Drizzle ORM | Can't write invalid queries |
| Auth | Supabase Auth | Clear errors, 50K MAU free |
| Validation | Zod | Structured errors, self-documenting |
| Logging | Pino | Machine-readable debugging context |
| Testing | Bun test | 10x faster than Jest |
| UI | shadcn/ui | Agent can read/modify components |

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Push database schema
bun run db:push

# Start development server
bun run dev
```

## Commands

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run lint         # Check for lint/format errors
bun run lint:fix     # Auto-fix lint/format issues
bun test             # Run tests with coverage
bun run db:studio    # Open Drizzle Studio GUI
```

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected pages
│   └── api/               # API routes
├── core/                   # Shared infrastructure
│   ├── config/            # Environment validation
│   ├── database/          # Drizzle client & schema
│   ├── logging/           # Pino structured logging
│   └── supabase/          # Supabase clients
├── features/              # Vertical slices
│   ├── auth/              # Auth actions & hooks
│   └── projects/          # Example feature slice
├── shared/                # Cross-feature utilities
│   ├── schemas/           # Pagination, errors
│   └── utils/             # Date, format helpers
└── components/            # UI components
    └── ui/                # shadcn/ui components
```

## Vertical Slice Pattern

Each feature is self-contained:

```
src/features/{feature}/
├── models.ts      # Drizzle types
├── schemas.ts     # Zod validation
├── repository.ts  # Database queries
├── service.ts     # Business logic
├── errors.ts      # Custom errors
├── index.ts       # Public API
└── tests/         # Feature tests
```

## AI Feedback Loop

The stack is optimized for AI agents to self-correct:

```
Generate Code → Run Checks → Parse Errors → Fix Code → Repeat
```

Checks produce machine-readable feedback:
- TypeScript: Type errors with file:line
- Biome: Lint errors with suggestions
- Tests: Failed assertions with expected/actual
- Logs: Structured JSON with context

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (use transaction pooler for serverless)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## License

MIT
