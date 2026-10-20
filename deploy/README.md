# DNET restore

Compose is registered as an independent Coolify service. Secrets belong in encrypted service environment settings, never Git. The application and PostgreSQL have separate persistent volumes and no published host ports. Cloudflare Tunnel routes the alias through the existing Coolify proxy.

`00-schema.sql` initializes only a new empty PostgreSQL volume. It contains schema, no recovered user data. Never run destructive schema synchronization on existing production databases.

Build with Dockerfile on Linux, preserve the previous image, then recreate only the service app using Coolify's generated compose. Verify `/api/health`, session cookie settings and authorized data access. Roll back by restoring the prior image while preserving volumes; schema changes need a separately reviewed migration and backup.

The old PM2 deployment scripts are historical and do not apply to DNET. `movepilotai.com` needs Namecheap account recovery before DNS migration. Stripe, OAuth and Twilio credentials must be restored separately; missing keys do not imply working integrations.
