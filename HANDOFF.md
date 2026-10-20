# HANDOFF — MovePilot AI — moveapp

> **Punto de control inicial.** Esto es preparación de continuidad, no una sesión de programación transferida ni certificación de producción.

## Contexto
- Repositorio: `raulrgleon/moveapp`, rama predeterminada consultada: `main`.
- MVP de planificación de mudanzas. Puede diferir del repositorio movepilot-ai; verificar persistencia, autenticación y rama correcta antes de programar.
- Contexto global disponible solo para asistentes autorizados; verificarlo contra el código actual.

## Estado de la preparación
- `AGENTS.md` y `HANDOFF.md` establecen el protocolo para Codex ↔ Antigravity.
- No se modificó funcionalidad del producto ni se ejecutaron compilaciones/pruebas durante esta configuración.
- La próxima tarea, estado local y commit de trabajo deben verificarse en la sesión de desarrollo.

## Handoff activo — rellenar al trabajar
- **Fecha/agente:** pendiente.
- **Objetivo autorizado:** pendiente.
- **Rama/commit de referencia:** comprobar.
- **Cambios y archivos:** no hay avances de programación registrados en este checkpoint.
- **Cambios sin commit:** inspeccionar `git status --short` antes de editar.
- **Pruebas / resultados:** ninguna ejecutada en la preparación.
- **Bloqueos y decisiones:** validar estado real; no asumir despliegues.
- **Próximo paso:** recibir la próxima tarea del usuario, leer contexto mínimo y confirmar estado de Git.

No publicar ni ejecutar comandos destructivos sin autorización; mantener las siguientes actualizaciones cortas y verificables.

## 2026-10-20 — DNET migration in progress (Codex)
User authorized GitHub restore after losing old hosting/domain access, DNET installation and GitHub updates.
Fresh clone main at 2568d3a; no pre-existing user edits. moveapp contains real Prisma/PostgreSQL auth and storage; older movepilot-ai is not the deployment source.
Next upgraded compatibly to 15.5.28, async params migrated, SMTP fallback and lazy server OpenAI initialization added. Exact-origin middleware protects browser writes; signed/Bearer hooks retain their own verification.
Five security/mail tests and three locale checks passed. Production dependency audit reports zero vulnerabilities. Final build and independent Docker build currently running.
Dockerfile and deploy/compose.yaml add independent private PostgreSQL and persistent uploads; initial schema is for an EMPTY dedicated database only.
Coolify MovePilot AI service created, UUID zvnnxo9gmqwknq77qzkhyqsa. Runtime credentials held encrypted in Coolify, existing DNET SMTP/OpenAI reused privately. No historical DB/uploads recovered. Domain movepilotai.com is registered at Namecheap; access unavailable. Public alias planned movepilot.dnet.llc.
Next: complete build, start isolated stack, test auth/ownership/files/mobile, publish alias, enable dashboard lifecycle controls, push reviewed source and memory. No assertion of completed deployment yet.

### Installation verification
Independent Coolify stack and fresh PostgreSQL volume now healthy; encrypted secret placeholders were populated before initialization. No existing DNET database touched. Origin Host health HTTP200, exact-origin rejection, owner sessions with Secure/HttpOnly/Lax cookies, persistent document upload/download/delete and cross-user/admin denials passed using disposable accounts/files, then scoped cleanup completed. SMTP TLS/auth verified without sending mail. Final Linux image build passed. Existing shopping-list useEffect lint warning remains.
Cloudflare alias added while preserving every prior ingress rule; public recursive DNS sees proxied Cloudflare IPs, local negative DNS cache still pending at first check. Dashboard registry now includes only MovePilot app process (database excluded); authenticated status shows20 running controls, policy rejection checks passed. Public browser/mobile and idempotent control confirmation in progress.
Owner admin password generated and held only in macOS Keychain service codex:movepilot.dnet.llc:admin, account admin. No owner password or provider secrets in source.

### Release completed
HTTPS health200 through Cloudflare, landing/admin login and390px mobile layout verified, zero browser page errors. Local router DNS retains a negative cache; public1.1.1.1/8.8.8.8 resolve the alias and HTTPS tested with those published addresses and valid TLS. Guest OpenAI response succeeded. Dashboard live UI has22rows, MovePilot controls enabled, stop confirmation/cancel and mobile fit passed; authenticated idempotent start confirmed20running controls. No unrelated application stopped.
Installed scoped systemd reminder timer every15minutes, existing Bearer-protected endpoint invoked successfully on the empty restore (no user reminders). SMTP auth/TLS verified; no test email sent. Owner credentials are in Keychain, not Git.
Source8ab06af and dashboardcebaba4 pushed. Final documentation/whitespace/timer follow-up follows. Historical DB/files and original domain remain unrecovered; Stripe/OAuth/Twilio credentials absent. This is a fresh GitHub restoration, not a data recovery.

## Primary-domain cutover in progress —2026-10-20
Raul explicitly requested movepilotai.com rather than a DNET subdomain, and authorized connection after restoring Namecheap login. Ask before choosing/changing domain/subdomain in future.
Read all six Namecheap host records and three Custom MX records; DNSSEC disabled. Prepared Cloudflare zone with nine records: apex/www proxied tunnel CNAMEs; all seven mail/verification TXT/MX records copied. TXT values checked against current authoritative DNS before copy. New nameservers byron.ns.cloudflare.com and stella.ns.cloudflare.com, not submitted at checkpoint.
Existing Coolify service configured with primary/www/legacy-alias host routing; canonical URL change and308legacy/www redirect being built with previous image preserved. Dashboard URL change building. Old database/uploads preserved.
Next: complete build, recreate only MovePilot app, verify Host health and canonical behavior, save prepared Namecheap nameservers, verify delegation/TLS/auth/mail DNS, deploy dashboard link, push source and memory.
### Cutover applied
Namecheap Custom DNS saved and reloaded: byron.ns.cloudflare.com, stella.ns.cloudflare.com. Parent .com delegation verified. Seven existing mail/verification TXT/MX records compared exactly against copied Cloudflare records; no mail data changed. Cloudflare zone still pending activation/certificate at checkpoint.
Primary-domain image built and existing app recreated; PostgreSQL/uploads preserved. Origin primary Host health200; www and legacy DNET alias return308 to canonical primary preserving path. Runtime login/origin/Secure cookies/upload/owner access and cross-user denials passed with synthetic cleanup. Five security/mail tests and typecheck passed. Dashboard built with primary URL and deployment underway. Do not claim public TLS verified until zone activation and certificate issuance complete.
