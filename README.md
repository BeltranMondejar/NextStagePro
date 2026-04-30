# NextStagePro

**CV Esports Network** — La plataforma definitiva para conectar jugadores y organizaciones de esports. NextStagePro permite a jugadores crear su perfil profesional y a equipos gestionar su presencia online, facilitando el scouting y la contratación de talento en la escena competitiva.

---

## Stack tecnológico

### Frontend
- **Angular 18** con standalone components y lazy loading
- **TypeScript** con Angular Signals para gestión reactiva del estado
- **SCSS** para estilos por componente
- **Font Awesome** para iconografía
- Desplegado en producción via Railway

### Backend
- **Node.js + Express**
- **PostgreSQL** (Neon serverless) como base de datos principal
- **JWT** para autenticación stateless (tokens con expiración configurable, por defecto 7 días)
- **Stripe** para pagos y gestión de suscripciones
- **Cloudinary** para almacenamiento y transformación de imágenes y vídeos
- **Discord OAuth2** como único proveedor de autenticación

---

## Arquitectura del proyecto

```
NextStagePro/
├── src/                          # Frontend Angular
│   ├── app/
│   │   ├── pages/
│   │   │   ├── home/             # Landing page con stats y carousel de orgs
│   │   │   ├── profile/          # Perfil editable del jugador (protegido)
│   │   │   ├── team-profile/     # Perfil editable del equipo (protegido)
│   │   │   ├── player-public/    # Perfil público de jugador
│   │   │   ├── team-public/      # Perfil público de equipo
│   │   │   ├── search-players/   # Buscador de jugadores y equipos
│   │   │   ├── subscriptions/    # Planes y gestión de suscripción
│   │   │   ├── about/            # Página de información
│   │   │   ├── contact/          # Formulario de contacto
│   │   │   └── auth-callback/    # Callback OAuth Discord
│   │   ├── components/
│   │   │   ├── header/           # Navegación principal
│   │   │   ├── footer/           # Pie de página
│   │   │   └── toast/            # Sistema de notificaciones
│   │   ├── services/
│   │   │   ├── auth.service.ts   # Autenticación y sesión
│   │   │   ├── player.service.ts # CRUD de perfil de jugador
│   │   │   ├── team.service.ts   # CRUD de perfil de equipo
│   │   │   ├── subscription.service.ts # Pagos Stripe
│   │   │   └── contact.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts     # Protección de rutas privadas
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts # Inyección de JWT + manejo de errores HTTP
│   │   └── models/
│   │       └── index.ts          # Interfaces TypeScript
│   └── environments/
│       ├── environment.ts        # Dev: http://localhost:3000/api
│       └── environment.production.ts  # Prod: Railway
│
└── backend/
    ├── index.js                  # Entry point: Express, CORS, rate limiting, webhook Stripe
    ├── routes/
    │   ├── auth.js               # Discord OAuth2, JWT, refresh
    │   ├── players.js            # Perfil, avatar, cover, experiencia, highlights
    │   ├── teams.js              # Perfil de equipo, logo, competiciones, highlights
    │   ├── subscriptions.js      # Checkout Stripe, portal de cliente
    │   └── contact.js            # Formulario de contacto
    ├── middleware/
    │   └── auth.js               # requireAuth, requirePro
    └── config/
        ├── db.js                 # Conexión Neon PostgreSQL
        └── cloudinary.js         # Configuración y presets de Cloudinary
```

---

## Rutas de la aplicación

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Landing page con contadores de jugadores y equipos |
| `/about` | Público | Información sobre la plataforma |
| `/players` | Público | Buscador con filtros por juego, rol y rango |
| `/players/:id` | Público | Perfil público de un jugador |
| `/teams/:id` | Público | Perfil público de un equipo |
| `/profile` | 🔒 Auth | Edición del perfil del jugador |
| `/team-profile` | 🔒 Auth | Edición del perfil del equipo |
| `/subscriptions` | Público | Tabla de planes y checkout |
| `/contact` | Público | Formulario de contacto |
| `/auth/callback` | Sistema | Callback post-autenticación Discord |

---

## API Backend

### Autenticación — `/api/auth`
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/discord` | Inicia el flujo OAuth2 con Discord |
| GET | `/discord/callback` | Callback de Discord, emite JWT |
| GET | `/me` | Devuelve el usuario autenticado |
| POST | `/refresh` | Renueva el JWT antes de que expire |

### Jugadores — `/api/players`
| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/` | — | Búsqueda con filtros (juego, rol, rango, plan) |
| GET | `/me` | ✅ | Perfil completo del jugador autenticado |
| PATCH | `/me` | ✅ | Actualizar datos del perfil |
| POST | `/me/avatar` | ✅ | Subir avatar (Cloudinary, 400×400) |
| POST | `/me/cover` | ✅ | Subir imagen de portada (Cloudinary, 1400×400) |
| POST | `/me/experience` | ✅ | Añadir entrada de experiencia |
| PATCH | `/me/experience/:id` | ✅ | Editar entrada de experiencia |
| DELETE | `/me/experience/:id` | ✅ | Eliminar entrada de experiencia |
| POST | `/me/highlights` | ✅ | Subir highlight (foto o vídeo) |
| DELETE | `/me/highlights/:id` | ✅ | Eliminar highlight y archivo en Cloudinary |
| GET | `/:id` | — | Perfil público de un jugador |

### Equipos — `/api/teams`
Estructura equivalente a players, con endpoints para logo, cover, competiciones (históricas y activas), highlights y gestión de jugadores del equipo.

### Suscripciones — `/api/subscriptions`
| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/me` | ✅ | Estado actual de la suscripción |
| POST | `/checkout` | ✅ | Crea sesión de pago en Stripe |
| POST | `/portal` | ✅ | Abre el portal de cliente de Stripe |
| POST | `/webhook` | Sistema | Webhook de Stripe (sin `express.json`) |

---

## Planes y suscripciones

| Feature | Player Basic (Free) | Player Pro | Team Pro |
|---|:---:|:---:|:---:|
| Creación de perfil jugador | ✅ | ✅ | — |
| Visibilidad en búsquedas | ✅ | ✅ | ✅ |
| Creación de perfil de equipo | ❌ | ❌ | ✅ |
| Acceso a scouts | ❌ | ✅ | ✅ |
| Destacado en resultados | ❌ | ✅ | ✅ |
| Contacto directo | ❌ | ✅ | ✅ |
| Soporte prioritario | ❌ | ✅ | ✅ |

Los precios se gestionan íntegramente desde Stripe mediante los Price IDs configurados en variables de entorno.

---

## Modelos de datos principales

### User
```typescript
{ id, email, discord_id, plan, account_type, is_verified, created_at, header_image_url? }
```

### PlayerProfile
```typescript
{ id, nickname, first_name?, last_name?, bio?, game?, main_role?, current_rank?,
  peak_rank?, location?, current_team?, avatar_url?, cover_url?, is_visible,
  profile_views, discord_tag?, twitter_url?, twitch_url?, liquipedia_url?, vlr_url?,
  experience: PlayerExperience[], highlights: PlayerHighlight[] }
```

### TeamProfile
```typescript
{ id, name, abbreviation?, bio?, game?, location?, founded_date?, logo_url?, cover_url?,
  is_visible, profile_views, competitions: TeamCompetition[],
  active_competitions: TeamActiveCompetition[], highlights: TeamHighlight[], players: TeamMember[] }
```

---

## Variables de entorno

### Backend (`.env`)
```env
# Base de datos
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://tudominio.com/api/auth/discord/callback

# URLs
FRONTEND_URL=https://tudominio.com

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PLAYER_PRO=price_...
STRIPE_PRICE_TEAM_PRO=price_...
STRIPE_SUCCESS_URL=https://tudominio.com/subscriptions?success=1
STRIPE_CANCEL_URL=https://tudominio.com/subscriptions

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Servidor
PORT=3000
NODE_ENV=production
```

---

## Instalación y desarrollo local

### Requisitos
- Node.js 18+
- Angular CLI 18
- Cuenta en Neon (PostgreSQL), Stripe, Cloudinary y Discord Developer Portal

### Frontend
```bash
npm install
ng serve
# Disponible en http://localhost:4200
```

### Backend
```bash
npm install
# Crear .env con las variables indicadas arriba
node index.js
# API disponible en http://localhost:3000/api
```

### Webhook Stripe en local
```bash
stripe listen --forward-to localhost:3000/api/subscriptions/webhook
```

---

## Seguridad

- **Rate limiting global**: 200 req / 15 min por IP
- **Rate limiting de auth**: 20 intentos / 15 min en producción (100 en desarrollo)
- **Helmet**: cabeceras HTTP de seguridad
- **JWT**: validación en cada petición privada con `requireAuth`; rutas Pro adicionales con `requirePro`
- **Interceptor Angular**: renueva automáticamente el token 24 horas antes de expirar y redirige a `/` en caso de 401
- **CORS**: restringido al dominio del frontend configurado en `FRONTEND_URL`
- **Cloudinary**: las imágenes se transforman y optimizan automáticamente en el servidor antes de almacenarse

---

## Despliegue

El proyecto está desplegado en **Railway**:
- Backend: `https://nextstagepro-production.up.railway.app/api`
- Frontend: configurado con `environment.production.ts` apuntando al backend de Railway
- Base de datos: Neon PostgreSQL (serverless, conexión via `@neondatabase/serverless`)
