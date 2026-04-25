# One-off Scripts

Operational helpers, seed scripts, and verification probes. Not part of the runtime build.

## Inventory

| Script | Purpose |
|---|---|
| `setup_super_admin.js` | Create the initial super-admin user (run once per env). |
| `set-super-admin.js` | Promote an existing user to super-admin. |
| `set-user-password.js` | Reset a user's password from the CLI. |
| `seed-plans.js` | Seed default subscription plans into MongoDB. |
| `seed_optimized_plans.js` | Seed the optimized pricing matrix. |
| `patch_script.js` | One-shot data-patch script — inspect before running. |
| `start-mongodb.sh` | Local MongoDB bootstrap helper. |
| `cloudflare-setup.sh` | Cloudflare DNS/WAF setup helper. |
| `verify-production.ts` | Smoke-check production endpoints. |
| `verify-usage-control.ts` | Validate usage-limit enforcement. |
| `verify-youtube-sync.ts` | Validate YouTube data sync. |

## Running

```bash
# JS scripts
node scripts/<name>.js

# TS scripts
npx ts-node --project tsconfig.server.json scripts/<name>.ts

# Shell scripts
bash scripts/<name>.sh
```

Always dry-run against a staging database first.
