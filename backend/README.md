# NextStagePro.gg — Backend API

## Stack
- **Node.js + Express** — servidor REST
- **Neon PostgreSQL** — base de datos (serverless)
- **Discord OAuth2** — autenticación
- **JWT** — sesiones stateless
- **Cloudinary** — almacenamiento de imágenes y vídeos
- **Stripe** — pagos y suscripciones

---

## Instalación

```bash
cd nextstagepro-backend
npm install
cp .env.example .env
# Rellena .env con tus credenciales reales
npm run dev
```

El servidor arranca en `http://localhost:3000`

---

## Variables de entorno (.env)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3000) |
| `FRONTEND_URL` | URL del frontend Angular para CORS |
| `DATABASE_URL` | Connection string de Neon |
| `JWT_SECRET` | Secret para firmar tokens JWT |
| `DISCORD_CLIENT_ID` | ID de la app en Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | Secret de la app Discord |
| `DISCORD_REDIRECT_URI` | `http://localhost:3000/api/auth/discord/callback` |
| `CLOUDINARY_CLOUD_NAME` | Tu cloud name de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `STRIPE_SECRET_KEY` | `sk_test_...` o `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del dashboard de Stripe |
| `STRIPE_PRICE_PLAYER_PRO` | `price_...` del plan Player Pro |
| `STRIPE_PRICE_TEAM_PRO` | `price_...` del plan Team Pro |
| `STRIPE_SUCCESS_URL` | URL de redirección tras pago exitoso |
| `STRIPE_CANCEL_URL` | URL de redirección si el usuario cancela |

---

## Autenticación

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <JWT>
```

### Flujo Discord OAuth

1. **Frontend** redirige al usuario a: `GET /api/auth/discord`
2. El usuario autoriza en Discord
3. Discord redirige a: `GET /api/auth/discord/callback?code=XXX`
4. El backend crea/actualiza el usuario y redirige al frontend:
   `FRONTEND_URL/auth/callback?token=JWT`
5. **Frontend** guarda el token en `localStorage` y lo usa en cada petición

---

## Endpoints

### 🔐 Auth
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/auth/discord` | No | Inicia login con Discord |
| GET | `/api/auth/discord/callback` | No | Callback OAuth |
| GET | `/api/auth/me` | Sí | Datos del usuario actual |
| POST | `/api/auth/refresh` | Sí | Renueva el token JWT |

### 👤 Jugadores
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/players` | No | Buscar jugadores |
| GET | `/api/players/me` | Sí | Perfil propio completo |
| PUT | `/api/players/me` | Sí | Actualizar perfil |
| POST | `/api/players/me/avatar` | Sí | Subir avatar (multipart: `avatar`) |
| POST | `/api/players/me/cover` | Sí | Subir cover (multipart: `cover`) |
| GET | `/api/players/:id` | No | Perfil público |
| GET | `/api/players/me/experience` | Sí | Listar experiencia |
| POST | `/api/players/me/experience` | Sí | Añadir experiencia |
| PUT | `/api/players/me/experience/:id` | Sí | Editar experiencia |
| DELETE | `/api/players/me/experience/:id` | Sí | Borrar experiencia |
| GET | `/api/players/me/highlights` | Sí | Listar highlights |
| POST | `/api/players/me/highlights` | Sí | Subir highlight (multipart: `media`) |
| DELETE | `/api/players/me/highlights/:id` | Sí | Borrar highlight |

#### Parámetros de búsqueda `/api/players`
```
?game=Valorant&role=IGL&rank=Radiant&location=Madrid&search=Nova&page=1&limit=20
```

### 🏟️ Equipos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/teams` | No | Buscar equipos |
| GET | `/api/teams/me` | Sí | Perfil de equipo propio |
| POST | `/api/teams/me` | Sí | Crear perfil de equipo |
| PUT | `/api/teams/me` | Sí | Actualizar perfil |
| POST | `/api/teams/me/logo` | Sí | Subir logo (multipart: `logo`) |
| POST | `/api/teams/me/cover` | Sí | Subir cover (multipart: `cover`) |
| GET | `/api/teams/:id` | No | Perfil público |
| POST/PUT/DELETE | `/api/teams/me/competitions/:id` | Sí | CRUD historial competitivo |
| POST/DELETE | `/api/teams/me/active-competitions/:id` | Sí | CRUD competiciones activas |
| POST/DELETE | `/api/teams/me/highlights/:id` | Sí | CRUD highlights |

### 💳 Suscripciones
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/subscriptions/me` | Sí | Estado suscripción actual |
| POST | `/api/subscriptions/checkout` | Sí | Crear sesión de pago Stripe |
| POST | `/api/subscriptions/portal` | Sí | Abrir portal de cliente Stripe |
| POST | `/api/subscriptions/webhook` | No* | Webhook de eventos Stripe |

*El webhook usa la firma de Stripe, no JWT.

**Body checkout:**
```json
{ "plan": "player_pro" }
```

### 📩 Contacto
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/contact` | No | Enviar mensaje de contacto |

**Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@email.com",
  "discord": "jane#1234",
  "message": "Hola, quiero información..."
}
```

---

## Despliegue

### Railway (recomendado)
1. Conecta tu repo en [railway.app](https://railway.app)
2. Railway detecta Node.js automáticamente
3. Añade las variables de entorno en el panel
4. El start command es `npm start`

### Render
1. New Web Service → conecta repo
2. Build command: `npm install`
3. Start command: `npm start`
4. Añade variables de entorno

### Variables en producción
- `FRONTEND_URL` → `https://nextstagepro.gg`
- `DISCORD_REDIRECT_URI` → `https://TU-API-URL/api/auth/discord/callback`
- `NODE_ENV` → `production`
- `STRIPE_SECRET_KEY` → clave live (`sk_live_...`)

### Webhook de Stripe en producción
1. Dashboard Stripe → Developers → Webhooks → Add endpoint
2. URL: `https://TU-API-URL/api/subscriptions/webhook`
3. Eventos a escuchar:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copia el Signing Secret → `STRIPE_WEBHOOK_SECRET`

---

## Integración con el frontend Angular

### Guardar el token tras login
```typescript
// En /auth/callback component
const token = new URLSearchParams(window.location.search).get('token');
if (token) localStorage.setItem('nsp_token', token);
```

### Servicio de autenticación
```typescript
// auth.service.ts
getHeaders() {
  const token = localStorage.getItem('nsp_token');
  return { Authorization: `Bearer ${token}` };
}

getMe() {
  return this.http.get('/api/auth/me', { headers: this.getHeaders() });
}
```

### Iniciar login Discord
```typescript
window.location.href = 'http://localhost:3000/api/auth/discord';
// En producción: https://TU-API-URL/api/auth/discord
```
