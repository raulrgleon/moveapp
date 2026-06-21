import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getNotificationConfigStatus } from "@/lib/notifications/config";
import { isTwilioConfigured } from "@/lib/notifications/twilio-config";
import { prisma } from "@/lib/prisma";
import { getAppGuideFilePath } from "@/lib/admin/app-guide-path";

export interface AppGuideMeta {
  updatedAt: string;
  generatedBy: "system";
  gitCommit: string | null;
  appUrl: string | null;
  byteSize: number;
}

function tryGitCommit(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

async function loadLiveStats() {
  const [
    users,
    admins,
    moves,
    checklistTasks,
    documents,
    inventoryBoxes,
    partnerQuotes,
    chatMessages,
    suspended,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { not: "admin" } } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.move.count(),
    prisma.checklistTask.count(),
    prisma.document.count(),
    prisma.inventoryBox.count(),
    prisma.partnerQuote.count(),
    prisma.chatMessage.count(),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
  ]);

  return {
    users,
    admins,
    moves,
    checklistTasks,
    documents,
    inventoryBoxes,
    partnerQuotes,
    chatMessages,
    suspended,
  };
}

function integrationBlock(): string {
  const n = getNotificationConfigStatus();
  return `- **Email (Resend):** ${n.email.configured ? "configurado" : "falta RESEND_API_KEY / EMAIL_FROM"}
- **SMS (Twilio):** ${isTwilioConfigured() ? `configurado (${n.sms.phone ?? "número OK"})` : `pendiente: ${n.sms.missing.join(", ") || "TWILIO_*"}`}
- **Cron recordatorios:** ${n.cron ? "CRON_SECRET definido" : "falta CRON_SECRET"}
- **OpenAI:** ${process.env.OPENAI_API_KEY ? "configurado" : "falta OPENAI_API_KEY"}
- **Stripe:** ${process.env.STRIPE_SECRET_KEY ? "configurado" : "opcional / no configurado"}
- **PostgreSQL:** DATABASE_URL ${process.env.DATABASE_URL ? "definido" : "NO definido"}`;
}

/** Genera la guía completa de la aplicación en Markdown (español). */
export async function generateAppDocumentationMarkdown(): Promise<string> {
  const stats = await loadLiveStats();
  const now = new Date();
  const gitCommit = tryGitCommit();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;

  return `# MovePilotAi — Guía completa de funcionamiento

> Documento generado automáticamente para operadores y administradores.  
> **Última actualización:** ${now.toISOString()} (UTC)  
> **Commit desplegado:** ${gitCommit ?? "no disponible"}  
> **URL producción:** ${appUrl ?? "no configurada"}

---

## 1. ¿Qué es MovePilotAi y por qué existe?

**MovePilotAi** (*Your AI co-pilot for moving anywhere*) es una aplicación web SaaS que ayuda a personas y familias a **planificar, organizar y ejecutar una mudanza** en Estados Unidos.

### Problema que resuelve

Una mudanza implica decenas de decisiones en paralelo: presupuesto, ruta, camión, utilities, documentos, mascotas, vehículos, plazos legales y coordinación familiar. Sin herramienta central, la información se pierde en notas, emails y hojas de cálculo.

### Por qué un solo panel

- **Menos estrés:** todo en un lugar con progreso visible.
- **Menor costo:** presupuesto y ruta sincronizados evitan sorpresas.
- **Menos errores:** checklist con fechas y recordatorios.
- **IA contextual (Pilot):** responde con *los datos reales* de esa mudanza, no consejos genéricos.

---

## 2. Usuarios y roles

| Rol | Quién es | Qué puede hacer | Por qué está separado |
|-----|----------|-----------------|------------------------|
| **user** | Cliente que se mudan | Dashboard completo, su mudanza, Pilot personal | Aislamiento de datos entre familias |
| **admin** | Operador de la plataforma | Panel Admin, Pilot global, impersonación | Soporte sin mezclar cuentas |
| **collaborator** | Familiar invitado | Ver/editar según rol editor/viewer | Mudanzas son eventos familiares |

### Impersonación (admin)

En **Admin → Usuarios → Ver como usuario**, el admin entra al dashboard *como* ese cliente para reproducir problemas. La sesión queda marcada con \`impersonatedBy\` y muestra banner para salir.

**Por qué:** soporte sin pedir contraseñas al cliente.

---

## 3. Flujo del cliente (de principio a fin)

### 3.1 Landing y registro

1. **/** — Marketing, Pilot invitado (sin datos personales).
2. **/onboarding** — Perfil inicial: origen, destino, fecha, hogar, mascotas, presupuesto.
3. **/login** — Email/contraseña, Google o Apple (si están configurados).

**Por qué onboarding primero:** Pilot y presupuesto necesitan origen/destino/fecha para ser útiles desde el minuto uno.

### 3.2 Dashboard principal

- **/dashboard** — Resumen: progreso checklist, presupuesto, próximos pasos.
- **/moving-plan** — Plan semanal generado según fecha de mudanza.
- **/budget** — Partidas estimadas vs reales; se recalcula con ruta y camión.
- **/route** — Mapa OSM + OSRM, paradas, clima, rutas alternativas.
- **/trucks** — Recomendación de camión/remolque según hogar y millas.
- **/vehicles** — Flota del usuario y opciones de transporte.
- **/utilities** — Proveedores en la dirección confirmada (electricidad, internet, etc.).
- **/city-comparison** — Comparación origen vs destino (RentCast cuando hay API key).
- **/checklist** — Tareas por categoría (incluye **Moving** para día D).
- **/inventory** — Cajas numeradas, habitación, frágil, essentials.
- **/documents** — Bóveda de documentos (lease, seguros, IDs…).
- **/collaboration** — Invitar familia por email.
- **/partner** — Compartir enlace con mudanceras; recibir cotizaciones.
- **/settings** — Perfil, notificaciones SMS/email, cambio contraseña, borrar cuenta.
- **/assistant** — Chat Pilot pantalla completa.
- **/upgrade** — MovePilot Pro (Stripe, pago único por mudanza).

### 3.3 Move Day

- **/move-day** — Vista simplificada para el día de la mudanza.

**Por qué:** reduce ruido cuando el usuario solo necesita ruta y tareas urgentes.

---

## 4. MovePilot Pro (monetización)

- **Trial:** 3 días de acceso completo al registrarse.
- **Pro:** ~$29 USD **pago único por mudanza** (Stripe Checkout).
- **Por qué pago por mudanza y no mensual:** una mudanza es un proyecto acotado; el usuario paga cuando el valor es máximo.

Funciones típicas Pro: Pilot ilimitado, sync ruta/presupuesto, compartir plan, recordatorios, etc. (ver \`/upgrade\`).

Admins **siempre** tienen acceso Pro (\`requireProSubscription\` los deja pasar).

---

## 5. Pilot — Asistente de IA

### 5.1 Tres modos

| Modo | Endpoint | Contexto |
|------|----------|----------|
| Invitado (web) | \`/api/chat/guest\` | Solo marketing; sin datos de clientes |
| Cliente (dashboard) | \`/api/chat\` | **Toda** la mudanza activa del usuario, cargada en servidor |
| Admin | \`/api/admin/chat\` | Resumen de hasta 50 clientes recientes |

### 5.2 Por qué el contexto se carga en el servidor

Antes el navegador enviaba trozos de contexto; eso es editable y filtrable. Ahora **\`loadMoveContextFromDb\`** lee PostgreSQL en cada mensaje:

- Perfil, checklist completo, presupuesto, inventario, documentos, vehículos, colaboradores, cotizaciones, actividad, ruta (millas), utilities guardadas, plan/trial del usuario.

### 5.3 Aislamiento de datos (crítico)

Pilot del cliente tiene instrucción **DATA ISOLATION**: nunca mencionar otros usuarios. Historial de chat guardado por \`userId\`.

Admin Pilot ve agregados de plataforma solo en sesión admin autenticada.

### 5.4 Personalidad

MovePilot AI actúa como **relocation consultant**: identifica riesgos, costos ocultos, plazos, ahorro; formato Resumen → Recomendación → Próximos pasos; máximo 2–3 preguntas si falta info.

### 5.5 Acciones automáticas

Pilot puede ejecutar acciones con bloques \`::pilot-action{...}::\` (completar tarea, añadir checklist, actualizar actual en presupuesto) vía \`/api/chat/actions\`.

---

## 6. Modelo de datos (PostgreSQL + Prisma)

| Tabla | Para qué | Por qué existe |
|-------|----------|----------------|
| **users** | Cuentas, plan, teléfono, recordatorios | Auth y preferencias |
| **moves** | Una mudanza por proyecto | Separar mudanzas futuras/pasadas |
| **checklist_tasks** | Tareas con fecha y categoría | Motor del progreso |
| **budget_items** | Estimado vs real por categoría | Control de gastos |
| **inventory_boxes** | Cajas numeradas | Día D y descarga |
| **documents** | Metadatos + archivos | Bóveda legal |
| **vehicles** | Autos con MPG | Ruta y combustible |
| **move_collaborators** | Invitaciones familia | Edición compartida |
| **partner_quotes** | Cotizaciones mudanceras | Marketplace B2B |
| **chat_messages** | Historial Pilot | Continuidad conversación |
| **sessions** | Cookies de login | Seguridad |
| **admin_audit_logs** | Acciones admin | Trazabilidad |

Relación central: **User 1—N Move**. La mudanza activa está en \`users.active_move_id\`.

---

## 7. API e integraciones externas

| Integración | Uso | Variable env | ¿Por qué esta elección? |
|-------------|-----|--------------|-------------------------|
| **OpenAI** | Pilot, inventario assist | OPENAI_API_KEY | Calidad/latencia balance con gpt-4o-mini |
| **Resend** | Emails transaccionales | RESEND_API_KEY | Entregabilidad simple |
| **Twilio** | SMS recordatorios | TWILIO_* | Estándar US |
| **Stripe** | Pagos Pro | STRIPE_* | PCI delegado |
| **OpenStreetMap + OSRM** | Mapas y rutas | (ninguna) | Sin costo API mapas |
| **Nominatim** | Geocoding direcciones | User-Agent | Gratis con límites |
| **WeatherAPI** | Clima en ruta | WEATHERAPI_KEY | Opcional |
| **RentCast** | Comparación ciudades | RENTCAST_API_KEY | Opcional |

### Cron diario

Script \`scripts/cron-reminders.sh\` llama \`POST /api/cron/reminders\` con \`Authorization: Bearer CRON_SECRET\`.

**Por qué secret:** evita que terceros disparen emails/SMS masivos.

---

## 8. Panel de administración

Ruta base: **/admin** (solo rol \`admin\`).

| Sección | Función |
|---------|---------|
| Dashboard | Métricas usuarios/mudanzas |
| Users | CRUD, suspender, impersonar |
| Moves | Ver/editar mudanzas |
| Partners | Directorio mudanceras |
| Partner quotes | Cotizaciones recibidas |
| Invites | Invitaciones pendientes |
| Documents | Vista global documentos |
| Activity | Audit log |
| Settings | Config sistema |
| **Maintenance** | Cron manual, email/SMS test, **esta guía** |

### Pilot Admin

Botón flotante en admin: chat con visión de plataforma (\`loadAdminPlatformContext\`).

---

## 9. Despliegue y operaciones

### Servidor típico

- **Ruta app:** \`/var/www/moveapp\`
- **PM2:** \`ecosystem.config.cjs\` carga \`.env\` + \`.env.local\`
- **Reinicio con env fresco:** \`scripts/restart-prod.sh\`
- **Build:** \`npm run build\` (Prisma generate + Next.js)

### Variables críticas

Ver \`.env.example\`. Nunca commitear \`.env.local\`.

### Caché / PWA

Headers \`Cache-Control: no-store\` en dashboard; \`DeployReloadPrompt\` avisa nueva versión (\`/api/app-version\`).

**Por qué:** evitar que móviles vean UI antigua tras deploy.

### Backups

Cron \`scripts/backup-db.sh\` (si está en crontab del servidor).

---

## 10. Seguridad — decisiones clave

1. **Contraseñas:** bcrypt; OAuth opcional.
2. **Sesiones:** JWT firmado (AUTH_SECRET).
3. **Borrar cuenta:** verifica contraseña o email (OAuth).
4. **Rate limit** en chat y APIs públicas.
5. **Admin** separado de \`requireMoveAccess\` (admin no usa chat cliente sin impersonar).
6. **Colaboradores:** token de invitación, roles viewer/editor.

---

## 11. Internacionalización (i18n)

- Idiomas: **inglés** y **español**.
- Archivos: \`src/lib/i18n/messages/en.ts\`, \`es.ts\`.
- Pilot responde en el idioma del último mensaje del usuario.

**Por qué:** mercado US + hispanohablantes.

---

## 12. Snapshot en vivo de la plataforma

Datos al momento de generar este documento:

| Métrica | Valor |
|---------|-------|
| Clientes (no admin) | ${stats.users} |
| Admins | ${stats.admins} |
| Cuentas suspendidas | ${stats.suspended} |
| Mudanzas totales | ${stats.moves} |
| Tareas checklist | ${stats.checklistTasks} |
| Documentos | ${stats.documents} |
| Cajas inventario | ${stats.inventoryBoxes} |
| Cotizaciones partners | ${stats.partnerQuotes} |
| Mensajes chat guardados | ${stats.chatMessages} |

### Estado integraciones (sin secretos)

${integrationBlock()}

---

## 13. Estructura de código (dónde buscar)

\`\`\`
src/
├── app/(dashboard)/     # Páginas cliente
├── app/(admin)/         # Panel admin
├── app/api/             # REST: chat, cron, stripe, user…
├── components/          # UI reutilizable
├── contexts/            # move-context, auth, ai-chat
├── lib/
│   ├── ai/              # Prompts Pilot, contexto DB
│   ├── admin/           # Stats, esta guía, audit
│   ├── db/              # move-service, access
│   ├── notifications/   # email, SMS, reminders
│   └── billing/         # Stripe, Pro gate
└── prisma/schema.prisma # Modelo datos
\`\`\`

---

## 14. Mantenimiento de ESTE documento

- Se genera con \`generateAppDocumentationMarkdown()\` en \`src/lib/admin/generate-app-documentation.ts\`.
- Se guarda en \`data/app-guide.generated.md\` en el servidor.
- Desde **Admin → Maintenance → Documentación de la app** puedes **Actualizar** (regenera con stats e integraciones al día) y **Descargar .md**.

**Cuándo actualizar:** después de deploys importantes, nuevas integraciones, o cambios de flujo que quieras documentar — edita el generador en el repo y vuelve a pulsar Actualizar en producción.

---

## 15. Contacto y repositorio

- **Producción:** ${appUrl ?? "configurar NEXT_PUBLIC_APP_URL"}
- **Repo:** github.com/raulrgleon/moveapp
- **Soporte email:** ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@movepilotai.com"}

---

*Fin de la guía generada.*
`;
}

export async function writeAppDocumentationToDisk(): Promise<AppGuideMeta> {
  const content = await generateAppDocumentationMarkdown();
  const filePath = getAppGuideFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");

  return {
    updatedAt: new Date().toISOString(),
    generatedBy: "system",
    gitCommit: tryGitCommit(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    byteSize: Buffer.byteLength(content, "utf8"),
  };
}

export function readAppDocumentationFromDisk(): {
  content: string;
  meta: AppGuideMeta | null;
} {
  const filePath = getAppGuideFilePath();
  if (!fs.existsSync(filePath)) {
    return { content: "", meta: null };
  }
  const content = fs.readFileSync(filePath, "utf8");
  const stat = fs.statSync(filePath);
  return {
    content,
    meta: {
      updatedAt: stat.mtime.toISOString(),
      generatedBy: "system",
      gitCommit: tryGitCommit(),
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      byteSize: stat.size,
    },
  };
}
