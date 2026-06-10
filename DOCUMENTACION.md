# MovePilot AI (moveapp) — Documentación completa del proyecto

> **MovePilot AI** · Tagline: *Your AI co-pilot for moving anywhere.*  
> Repositorio: [github.com/raulrgleon/moveapp](https://github.com/raulrgleon/moveapp)

---

## 1. ¿Qué es este proyecto?

**MovePilot AI** es un prototipo MVP de una aplicación web tipo SaaS diseñada para ayudar a personas y familias a **planificar, organizar y ejecutar una mudanza** de principio a fin. La idea central es ofrecer un **panel de control unificado** donde el usuario puede:

- Ver el estado general de su mudanza (origen, destino, presupuesto, progreso).
- Obtener un **plan de mudanza generado por IA** con tareas semanales.
- Comparar **presupuesto estimado vs. real**.
- Planificar la **ruta de manejo** con mapa interactivo.
- Comparar opciones de **camiones, trailers y transporte de vehículos**.
- Descubrir **servicios de utilities** (electricidad, agua, internet, fibra) en su nueva dirección.
- Comparar **ciudades** (costo de vida, renta, escuelas, etc.).
- Gestionar **checklists**, **inventario de cajas**, **documentos** y **servicios** (mudanceros, hoteles, etc.).
- Hablar con un **asistente de IA** contextualizado con su mudanza.

Este proyecto es un **prototipo funcional de frontend** orientado a demostrar el producto a inversionistas, socios o usuarios beta. La mayoría de los datos son **mock data** (datos de ejemplo), pero la interfaz, flujos, integración con OpenAI y mapas con OpenStreetMap son **reales y funcionales**.

---

## 2. Estado actual del producto

| Aspecto | Estado |
|---------|--------|
| UI / UX del dashboard | ✅ Completo y responsive |
| Landing, login, onboarding | ✅ Implementado (login es placeholder) |
| Datos persistentes en base de datos | ❌ No implementado (mock + localStorage para dirección) |
| IA (OpenAI) | ✅ Funcional con streaming |
| Mapas (OpenStreetMap + OSRM) | ✅ Funcional |
| Autocompletado de direcciones (Nominatim) | ✅ Funcional |
| Autenticación de usuarios | ❌ Placeholder |
| Pagos / marketplace real | ❌ Solo UI con datos mock |
| i18n Español en UI | 🔶 Estructura lista; textos visibles en inglés |

---

## 3. Stack tecnológico

### Frontend y framework

| Tecnología | Versión / Uso |
|------------|----------------|
| **Next.js 14** | App Router, Server y Client Components |
| **TypeScript** | Tipado estricto en todo el proyecto |
| **React 18** | UI reactiva |
| **Tailwind CSS** | Estilos utility-first, diseño responsive |
| **shadcn/ui** | Componentes UI (Button, Card, Table, Tabs, Sheet, etc.) |
| **Radix UI** | Primitivos accesibles bajo shadcn |
| **Lucide React** | Iconografía |
| **class-variance-authority + clsx + tailwind-merge** | Variantes de componentes y clases |

### Integraciones externas

| Servicio | Uso | ¿Requiere API key? |
|----------|-----|-------------------|
| **OpenAI** (`gpt-4o-mini` por defecto) | Asistente de IA con respuestas en streaming y Markdown | Sí → `OPENAI_API_KEY` |
| **OpenStreetMap** | Tiles del mapa | No |
| **OSRM** (router.project-osrm.org) | Cálculo de ruta de manejo | No |
| **Nominatim** (OpenStreetMap) | Búsqueda y autocompletado de direcciones | No (User-Agent requerido) |

### Dependencias adicionales

- **leaflet** + tipos — Mapas interactivos en la página Route.
- **react-markdown** — Formato legible en respuestas del asistente IA.
- **openai** — Cliente oficial en el API route del servidor.

---

## 4. Usuario de demostración (mock)

El prototipo está precargado con un perfil de ejemplo para que la demo sea coherente en todas las pantallas:

| Campo | Valor |
|-------|--------|
| Nombre | Raul Garcia |
| Email | raul.garcia@email.com |
| Origen | Austin, TX |
| Destino | Huntington, WV |
| Dirección nueva (ejemplo) | 1842 Harper Road, Apt 4B, Huntington, WV 25701 |
| Fecha de mudanza | 15 de septiembre de 2026 |
| Hogar | 2 adultos, 1 niño, 1 perro |
| Vehículo | 2019 Volkswagen Atlas V6 4Motion |
| Presupuesto objetivo | $4,000 USD |
| Presupuesto estimado total | ~$4,250 USD |
| Progreso de tareas | 37% |
| Preferencia de mudanza | Trailer 6x12 + SUV propio |
| Fase actual | Planning & Preparation |

---

## 5. Arquitectura del proyecto

### 5.1 Estructura de carpetas

```
moveapp/
├── DOCUMENTACION.md          ← Este archivo
├── README.md                 ← Guía rápida de inicio
├── .env.example              ← Plantilla de variables de entorno
├── .env.local                ← Claves reales (NO se sube a git)
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
│
└── src/
    ├── app/                  # Rutas Next.js (App Router)
    │   ├── page.tsx          # Landing pública
    │   ├── login/            # Login placeholder
    │   ├── onboarding/       # Formulario multi-paso
    │   ├── api/              # API Routes (servidor)
    │   │   ├── chat/         # OpenAI streaming
    │   │   └── address/search/ # Nominatim proxy
    │   └── (dashboard)/      # Grupo de rutas con layout compartido
    │       ├── layout.tsx    # Sidebar + panel IA
    │       ├── dashboard/
    │       ├── moving-plan/
    │       ├── budget/
    │       ├── route/
    │       ├── trucks/
    │       ├── vehicles/
    │       ├── utilities/
    │       ├── city-comparison/
    │       ├── checklist/
    │       ├── inventory/
    │       ├── documents/
    │       ├── marketplace/
    │       ├── assistant/
    │       └── settings/
    │
    ├── components/
    │   ├── ui/               # Primitivos shadcn (Button, Card, Input…)
    │   ├── layout/           # Logo, Sidebar, Header, Mobile nav, AI panel
    │   ├── dashboard/        # StatCard, RouteMap, Utility cards…
    │   ├── address/          # AddressAutocomplete (Nominatim)
    │   └── ai/               # Chat UI, Markdown renderer
    │
    ├── contexts/
    │   └── move-context.tsx  # Estado global: dirección confirmada
    │
    ├── hooks/
    │   └── use-ai-chat.ts    # Lógica del chat con OpenAI
    │
    └── lib/
        ├── mock-data.ts      # Todos los datos de ejemplo
        ├── types.ts          # Interfaces TypeScript
        ├── constants.ts      # Navegación, categorías
        ├── utils.ts          # formatCurrency, daysUntil, cn()
        ├── i18n.ts           # Estructura i18n (EN/ES)
        ├── ai/
        │   └── move-context.ts # System prompt para OpenAI
        ├── geo/
        │   ├── coordinates.ts  # OSRM, puntos de ruta
        │   └── nominatim.ts    # Parseo de direcciones OSM
        └── db/
            └── schema.ts     # Esquema PostgreSQL futuro (referencia)
```

### 5.2 Flujo de la aplicación

```
[Landing /] 
    → [Onboarding] → confirma dirección → [Dashboard]
    → [Login] (placeholder) → [Dashboard]

[Dashboard layout]
    ├── Sidebar (desktop) / Mobile nav (inferior)
    ├── Contenido principal (página activa)
    └── Panel IA (desktop xl+) / Botón flotante (móvil)
```

### 5.3 Arquitectura de datos

Hoy el flujo de datos es:

1. **Mock estático** → `src/lib/mock-data.ts` alimenta casi todas las páginas.
2. **Contexto React** → `MoveProvider` guarda la dirección confirmada en `localStorage`.
3. **API Routes** → OpenAI y Nominatim en el servidor (claves no expuestas al cliente).
4. **Futuro** → Esquema en `src/lib/db/schema.ts` preparado para PostgreSQL.

---

## 6. Páginas y funcionalidades (detalle)

### 6.1 Landing (`/`)

Página pública de marketing con:

- Hero, características, “How it works”, CTA.
- Enlaces a onboarding, login y demo dashboard.
- Diseño profesional tipo startup (Linear / Stripe / Notion).

### 6.2 Login (`/login`)

Formulario visual de inicio de sesión. El botón redirige al dashboard **sin autenticación real** (placeholder para fase posterior).

### 6.3 Onboarding (`/onboarding`)

Formulario en **4 pasos**:

1. Origen, destino, **dirección con autocompletado**, fecha de mudanza.
2. Personas en el hogar, mascotas.
3. Vehículos, preferencia (truck / trailer / movers).
4. Presupuesto, ayuda con housing y transporte de vehículo.

Al seleccionar una dirección en el autocompletado, se guarda en el contexto global (`MoveProvider`).

### 6.4 Dashboard principal (`/dashboard`)

Vista resumen con:

- Ruta: Austin → Huntington.
- Countdown hasta la fecha de mudanza.
- Presupuesto estimado, % de progreso, fase actual.
- Barras de progreso por área (planning, packing, travel).
- **Quick actions** (utilities, checklist, trucks, budget).
- Card de **utilities** en la nueva dirección (si está confirmada).
- Alertas y recomendaciones (trailer, fibra, escuela, lease).

### 6.5 Plan de mudanza IA (`/moving-plan`)

- Timeline **semana por semana** (8 semanas).
- Tareas prioritarias con due date y prioridad.
- Notas de IA (trailer, ruta 2 días, costo de vida).
- Botones “Regenerate plan” y “Export plan” (UI, sin backend aún).

### 6.6 Presupuesto (`/budget`)

- Tabla: categoría, estimado, actual, diferencia, opción más barata.
- Categorías: truck, trailer, movers, gas, hotels, food, storage, deposits, emergency fund, etc.
- Cards resumen de gastos principales.
- Tabla con scroll horizontal en móvil.

### 6.7 Ruta (`/route`)

- **Mapa Leaflet** con tiles OpenStreetMap.
- Marcadores: origen (Austin), destino (Huntington), **nueva casa** (si dirección confirmada).
- Polyline de ruta vía **OSRM** con distancia y tiempo estimado.
- Lista de paradas sugeridas: gas, hotel pet-friendly, rest areas.
- Placeholder de alertas de clima.

### 6.8 Camiones y trailers (`/trucks`)

Comparación de proveedores:

- U-Haul, Penske, Budget, Enterprise.
- Trailers y trucks con precio, tamaño, política de millas, pros/cons.
- Recomendación IA: trailer 6x12 + SUV ahorra ~$480.
- Tabs: Trailers / Trucks / All.

### 6.9 Vehículos (`/vehicles`)

Opciones para el VW Atlas:

- Conducir + trailer (recomendado).
- Solo trailer, shipping, tow dolly.
- Estimados de combustible y wear-and-tear.

### 6.10 Utilities — Servicios en destino (`/utilities`)

**Funcionalidad clave:**

1. Campo de **autocompletado de dirección** (Nominatim).
2. Sin dirección confirmada → sección **bloqueada** con mensaje.
3. Con dirección → proveedores rankeados por categoría:

| Categoría | Mejor opción (demo Huntington) |
|-----------|-------------------------------|
| Electricidad | AEP Appalachian Power |
| Agua / alcantarillado | Huntington Water Quality Board |
| Gas | Mountaineer Gas Company |
| Fibra / Internet | Frontier Fiber 500 Mbps |
| Basura | City of Huntington Sanitation |
| Seguridad | Ring DIY (apartamento) |

Cada proveedor muestra: precio, velocidad, disponibilidad en la dirección, pros/cons, badge “Best pick”.

### 6.11 Comparación de ciudades (`/city-comparison`)

Tabla origen vs. destino: costo de vida, renta, precio de casas, crimen, internet, clima, impuestos, empleo, escuelas, hospitales, calidad de vida.

### 6.12 Checklist (`/checklist`)

~20 tareas en categorías: Housing, Utilities, Address change, Vehicle, School, Medical, Pets, Documents, Packing, Travel.

Cada tarea: estado, due date, prioridad. Filtros por categoría. Barra de progreso global.

### 6.13 Inventario (`/inventory`)

Cajas numeradas por habitación, contenido, placeholder de foto y QR. Búsqueda en tiempo real.

### 6.14 Documentos (`/documents`)

Vault visual por categoría: lease, IDs, insurance, vehicle, medical, school, USCIS placeholder. Estados: verified, pending, missing.

### 6.15 Marketplace (`/marketplace`)

Cards de servicios: movers, trucks, storage, internet, insurance, cleaning, handyman, pet boarding, hotels. Filtros por categoría.

### 6.16 Asistente IA (`/assistant` + panel lateral)

- Chat con **OpenAI** (`gpt-4o-mini` por defecto).
- **Streaming** de respuestas para baja latencia percibida.
- Respuestas en **Markdown** formateado (listas, negritas, encabezados).
- Contexto de mudanza inyectado en system prompt.
- Preguntas rápidas predefinidas.
- Panel lateral en pantallas XL; botón flotante en móvil.

### 6.17 Settings (`/settings`)

Perfil, detalles de mudanza, **autocompletado de dirección**, notificaciones, selector de idioma (i18n-ready).

---

## 7. APIs internas (Next.js API Routes)

### 7.1 `POST /api/chat`

**Propósito:** Enviar mensajes al asistente OpenAI.

**Body:**
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "moveContext": {
    "destinationAddress": "...",
    "destination": "Huntington, WV",
    "lat": 38.41,
    "lon": -82.42,
    "isAddressConfirmed": true
  }
}
```

**Respuesta:** Stream de texto plano (chunks de Markdown).

**Configuración:**
- Modelo: `OPENAI_MODEL` (default `gpt-4o-mini`).
- `max_tokens: 400`, `temperature: 0.4`.
- System prompt construido en `src/lib/ai/move-context.ts`.

### 7.2 `GET /api/address/search?q=...`

**Propósito:** Proxy a Nominatim para autocompletado de direcciones en USA.

**Parámetros:** `q` (mínimo 3 caracteres).

**Respuesta:** Array de sugerencias con `displayName`, `lat`, `lon`, ciudad, estado, etc.

**Nota:** Incluye `User-Agent` requerido por la política de Nominatim.

---

## 8. Estado global: dirección del usuario

`src/contexts/move-context.tsx` (`MoveProvider`):

| Campo | Descripción |
|-------|-------------|
| `destinationAddress` | Texto completo de la dirección |
| `destination` | Ciudad, estado (label corto) |
| `lat`, `lon` | Coordenadas geocodificadas |
| `isAddressConfirmed` | `true` tras seleccionar en autocompletado |
| `confirmAddress()` | Guarda en state + `localStorage` |
| `clearAddress()` | Limpia dirección |

**Key localStorage:** `movepilot_destination`

La dirección confirmada actualiza:

- Utilities (desbloquea datos).
- Mapa en Route (marcador de nueva casa).
- System prompt de OpenAI.
- Dashboard utilities card.

---

## 9. Diseño y UX

### Principios

- Estilo **SaaS profesional**: limpio, calmado, confiable.
- Paleta **teal/verde** (`primary` ~ #0D9488).
- Cards con bordes suaves, sombras ligeras, tipografía clara.
- **Responsive completo:**
  - Sidebar en `lg+`.
  - Barra de navegación inferior en móvil.
  - Tablas con scroll horizontal.
  - Panel IA: lateral en `xl+`, sheet en móvil.
  - Safe areas para notch/home indicator.

### Componentes reutilizables destacados

- `PageContainer` — padding y espacio inferior consistente.
- `StatCard` — métricas del dashboard.
- `AddressAutocomplete` — búsqueda de direcciones.
- `UtilityProviderCard` — card de proveedor de servicio.
- `RouteMap` / `RouteMapWrapper` — mapa OSM.
- `MarkdownMessage` — renderizado de respuestas IA.
- `ChatMessages`, `ChatInputBar`, `QuickQuestions` — UI del chat.

---

## 10. Variables de entorno

Crear `.env.local` (nunca subir a git):

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `OPENAI_API_KEY` | Sí (para IA) | Clave de OpenAI. Solo servidor. |
| `OPENAI_MODEL` | No | Modelo OpenAI. Default: `gpt-4o-mini` (rápido y económico). |

---

## 11. Cómo ejecutar el proyecto

### Requisitos

- Node.js 18+
- npm

### Instalación y desarrollo

```bash
cd moveapp
npm install
cp .env.example .env.local
# Editar .env.local y agregar OPENAI_API_KEY
npm run dev
```

Abrir: **http://localhost:3000**

### Producción

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 12. Base de datos (futuro)

`src/lib/db/schema.ts` define tablas previstas para PostgreSQL:

- `users`
- `moves` (incluye `destination_address`)
- `vehicles`
- `checklist_tasks`
- `budget_items`
- `inventory_boxes`
- `documents`

**No hay conexión activa.** Prisma, Drizzle o SQL directo se pueden integrar en una fase posterior.

---

## 13. Internacionalización (i18n)

`src/lib/i18n.ts` define estructura para **inglés y español**. Los textos visibles del MVP están en **inglés**; la arquitectura permite migrar a `next-intl` u otra librería sin reestructurar rutas.

---

## 14. Seguridad y buenas prácticas

- ✅ `OPENAI_API_KEY` solo en servidor (`/api/chat`).
- ✅ `.env.local` en `.gitignore`.
- ✅ `.env.example` sin secretos.
- ⚠️ Login sin auth real — no usar en producción sin implementar sesiones/JWT.
- ⚠️ Nominatim y OSRM son servicios públicos con límites de uso; en producción considerar rate limiting y caché.
- ⚠️ Rotar API keys si se expusieron en chats o commits.

---

## 15. Roadmap sugerido (fases futuras)

1. **Autenticación** — NextAuth, Clerk o similar.
2. **PostgreSQL** — Persistir usuarios, mudanzas, tareas, presupuesto.
3. **APIs de utilities reales** — BroadbandNow, proveedores por ZIP.
4. **Generación real del plan** — OpenAI con function calling + guardar plan.
5. **Notificaciones** — email/push para deadlines.
6. **Español completo** — next-intl en toda la UI.
7. **PWA / app móvil** — React Native o Capacitor.
8. **Integración marketplace** — APIs de U-Haul, Penske, etc.

---

## 16. Resumen ejecutivo (para inversionistas)

**MovePilot AI** resuelve el problema de que mudarse requiere coordinar decenas de tareas, proveedores y decisiones financieras en herramientas dispersas (hojas de cálculo, notas, llamadas, sitios web de rentals).

**Propuesta de valor:**

- Un solo dashboard con IA que conoce tu mudanza.
- Recomendaciones de utilities **por dirección exacta**.
- Comparación de costos (truck vs trailer vs movers).
- Mapa de ruta real y checklist operativo.
- Diseño listo para escalar a producto comercial.

**Este repositorio** es el MVP visual y funcional que demuestra esa visión con datos de ejemplo y integraciones reales en IA y mapas.

---

## 17. Contacto y repositorio

- **GitHub:** https://github.com/raulrgleon/moveapp
- **Nombre del paquete npm:** `moveapp`
- **Producto:** MovePilot AI

---

*Documento generado para el repositorio moveapp. Última actualización: junio 2026.*
