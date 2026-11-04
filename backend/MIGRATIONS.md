# Database migrations — workflow

## Rules (non-negotiable)

1. **Migrations are generated and reviewed in development only. Never run `migration:generate` on a production server.** Generation diffs entities against whatever database it connects to; on production that is slow, surprising, and unreviewed.
2. `synchronize` is disabled when `NODE_ENV=production` (`src/config/data-source.ts`). The production schema changes **only** through reviewed, committed migration files.
3. Every schema change follows: change entity → generate locally → **read the generated SQL** → commit the migration file with the entity change → deploy code → run migrations → start the app.

## Development: generating a migration

```bash
cd backend
# Uses your local dev database (.env). It must already be running the current schema.
npm run migration:generate -- src/migrations/<timestamp>-<DescriptiveName>
```

Then open the generated file and review it before committing:

- `up()` must contain only the intended DDL (no unexpected `DROP`/`ALTER` on unrelated tables).
- `down()` must be the inverse (drops belong only here, for a baseline).
- Rename the class/file to `<timestamp>-<DescriptiveName>` if the generator produced an awkward name; the numeric prefix (execution order) must be preserved.

## Production deployment (existing runbook)

```bash
# 1. Back up the production database first.
# 2. Deploy the new code (it ships src/migrations/*).
# 3. Apply reviewed migrations — this is the ONLY schema step on prod:
cd backend
NODE_ENV=production npm run migration:run
# 4. Start/restart the app (NODE_ENV=production npm start or your process manager).
```

Do **not** run `migration:generate`, `synchronize`, or the seed on production.

## Baseline migration

`src/migrations/1793399306234-BaselineSchema.ts` creates the full current schema (33 tables) and was generated in development against an empty scratch database, reviewed line by line, and verified: `migration:run` against a second empty database produced all 34 tables (33 + `migrations`) with the baseline recorded.

- **New installations:** just run `migration:run` on the empty database.
- **Existing databases created by dev `synchronize`:** do NOT run the baseline (its `CREATE TABLE`s would fail on existing tables). Instead, on a staging clone of the production database, run `migration:generate` — it should report no changes, proving the live schema matches the baseline. Then mark the baseline as executed on production without running its SQL:

  ```sql
  CREATE TABLE IF NOT EXISTS migrations (id INT NOT NULL AUTO_INCREMENT, timestamp BIGINT NOT NULL, name VARCHAR(255) NOT NULL, PRIMARY KEY (id));
  INSERT INTO migrations (timestamp, name) VALUES (1793399306234, 'BaselineSchema1793399306234');
  ```

  From then on, all further schema changes go through the normal generate-in-dev → review → `migration:run` flow.

## Rollback

```bash
NODE_ENV=production npm run migration:revert   # reverts the last executed migration
```

Prefer forward-fix migrations over reverting in production whenever data has been written against the new schema.
