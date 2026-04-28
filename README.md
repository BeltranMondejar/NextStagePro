# NextStagePro.gg — Proyecto Completo

## Estructura
```
nextstagepro/
├── backend/                     ← Servidor Node.js + Express
│   ├── src/
│   │   ├── index.js             ← Entrada del servidor
│   │   ├── config/
│   │   │   ├── db.js            ← Neon PostgreSQL
│   │   │   └── cloudinary.js    ← Subida imágenes/vídeos
│   │   ├── middleware/
│   │   │   └── auth.js          ← Verificación JWT
│   │   └── routes/
│   │       ├── auth.js          ← Discord OAuth
│   │       ├── players.js       ← CRUD jugadores
│   │       ├── teams.js         ← CRUD equipos
│   │       ├── subscriptions.js ← Stripe pagos
│   │       └── contact.js       ← Formulario contacto
│   ├── .env                     ← ⚠️ Credenciales (NO subir a Git)
│   └── package.json
│
└── frontend/                    ← Aplicación Angular
    ├── src/
    │   ├── app/
    │   │   ├── components/header/   ← Cabecera con login Discord
    │   │   ├── guards/              ← Protege rutas privadas
    │   │   ├── interceptors/        ← Añade JWT automáticamente
    │   │   ├── models/              ← Interfaces TypeScript
    │   │   ├── services/            ← Llamadas a la API
    │   │   └── pages/
    │   │       ├── home/
    │   │       ├── about/
    │   │       ├── profile/         ← Perfil propio (privado)
    │   │       ├── player-public/   ← Perfil público
    │   │       ├── search-players/  ← Búsqueda con filtros
    │   │       ├── subscriptions/   ← Planes Stripe
    │   │       ├── contact/         ← Formulario contacto
    │   │       └── auth-callback/   ← Recibe token Discord
    │   │       └── team-profile/   ← Perfil privado (equipo)
    │   │       └── team-public/   ← Perfil publico (equipo)
    │   └── environments/
    │       ├── environment.ts           ← URL API desarrollo
    │       └── environment.production.ts ← URL API producción
    └── package.json
```

## Arrancar en local (2 terminales)

### Terminal 1 — Backend
```bash
cd backend
npm install
npm run dev
```
Prueba: http://localhost:3000/health → debe responder { "status": "ok" }

### Terminal 2 — Frontend
```bash
cd frontend
npm install
ng serve
```
Abre: http://localhost:4200

## Despliegue producción
- Backend → Railway (sube la carpeta backend/ a GitHub y conecta en railway.app)
- Frontend → Netlify (ng build --configuration production, sube carpeta dist/)
- Actualizar environment.production.ts con la URL de Railway
