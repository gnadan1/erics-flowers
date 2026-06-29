# Repo Notes

## Supabase

- The correct Supabase project for this repo is `qnlythgcmwrwbtwvvqbv`.
- Treat `.env` and `supabase/config.toml` as the source of truth for the project ref.
- Do not trust `supabase/.temp` if it disagrees with `.env` or `supabase/config.toml`; it is local CLI cache and may contain stale project links.
- The Supabase CLI may not be on `PATH`. Use the full path:
  - `/home/gnadan/.supabase/bin/supabase`
- Before any remote Supabase operation, verify the target project ref is `qnlythgcmwrwbtwvvqbv`.
- Never push migrations if `supabase db push --dry-run` lists older migrations unexpectedly. Stop and inspect instead.
- For a single already-reviewed migration, prefer applying only that specific SQL file to the confirmed project rather than bulk-pushing every migration.
- Do not print secrets in commands. If a DB password is needed in a shell command, read it from stdin with a silent prompt/read pattern instead of placing it directly in argv.

## Dev Server

- Use port `19088` for this repo.
- Bind to `0.0.0.0`, not `127.0.0.1` and not the default `8080`.
- Expected command:

```bash
npm run dev -- --host 0.0.0.0 --port 19088 --strictPort
```

## Current Slice Workflow

- Make local repo changes.
- Run focused lint for touched files.
- Run `npm run build`.
- Commit the slice cleanly.
- Apply Supabase schema changes only after confirming the target project and migration scope.
