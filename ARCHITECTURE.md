# 📋 CampoBase - Arquitectura del Proyecto

**Estado:** ✅ Backend implementado completo | 🎯 Frontend conectado | 🔐 Autenticación funcional | 📊 BD activa

---

## 📁 Estructura General

```
CampoBase/
├── frontend/                      # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Componentes reutilizables (UI + Custom)
│   │   │   ├── context/           # AuthContext
│   │   │   ├── pages/             # Páginas por rol
│   │   │   │   ├── admin/         # AdminDashboard, AdminConfigurator, AdminInscriptions
│   │   │   │   ├── capita/        # CapitaDashboard, CapitaInscription, CapitaTeam, etc
│   │   │   │   ├── arbitre/       # ArbitreMatches
│   │   │   │   ├── jugador/       # JugadorDashboard
│   │   │   │   └── Landing, Login, Register, NotFound
│   │   │   ├── services/          # authService
│   │   │   ├── App.tsx
│   │   │   └── routes.tsx
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                       # Backend (Express + Node.js + TypeScript)
│   ├── src/
│   │   ├── server.ts              # Express (todas las rutas registradas)
│   │   ├── middleware/
│   │   │   └── auth.ts            # verifyToken, requireRole
│   │   ├── routes/
│   │   │   ├── auth.ts            # /api/auth (register, login)
│   │   │   ├── teams.ts           # /api/teams (CRUD equipos)
│   │   │   ├── inscriptions.ts    # /api/team (inscripción, documentos)
│   │   │   ├── capita.ts          # /api/dashboard, /api/team/*
│   │   │   ├── admin.ts           # /api/admin (validación, calendario)
│   │   │   ├── arbitre.ts         # /api/arbitre (actas)
│   │   │   └── public.ts          # /api/public (sin auth)
│   │   └── db/
│   │       ├── connection.ts       # Pool MySQL
│   │       └── schema.sql          # 10 tablas
│   └── package.json
│
├── ARCHITECTURE.md                # Este archivo
├── ESPECIFICACIO_FUNCIONAL.md    # Especificación del sistema (catalán)
├── package.json                   # Workspace root (pnpm)
└── pnpm-workspace.yaml            # Monorepo config
```

---

## 🔧 Frontend (React + TypeScript + Vite)

### Dependencias:
- react@18.x, react-router@6.x
- typescript@5.x
- tailwindcss@3.x, vite@4.x
- shadcn/ui (componentes accesibles)
- lucide-react (iconos)

### Páginas (por rol):

| Ruta | Componente | Rol | Función |
|------|-----------|-----|---------|
| `/` | LandingPage | Public | Información general |
| `/login` | LoginPage | Public | Login con JWT |
| `/register` | RegisterPage | Public | Registrar Capità |
| `/dashboard` | CapitaDashboard | Capità | Dashboard principal |
| `/team` | CapitaTeam | Capità | Gestionar equipo |
| `/inscription` | CapitaInscription | Capità | Inscribir + Pagar |
| `/documents` | CapitaDocuments | Capità | Gestionar docs |
| `/calendar` | CapitaCalendar | Capità | Ver partidos |
| `/statistics` | CapitaStatistics | Capità | Estadísticas |
| `/notifications` | CapitaNotifications | Capità | Notificaciones |
| `/admin` | AdminDashboard | Admin | Dashboard admin |
| `/admin/inscriptions` | AdminInscriptions | Admin | Validar docs |
| `/admin/configurator` | AdminConfigurator | Admin | Configurar torneo |
| `/arbitre/matches` | ArbitreMatches | Arbitre | Mis partidos |
| `/jugador` | JugadorDashboard | Jugador | Ver equipo |
| `*` | NotFoundPage | Public | 404 |

### CapitaInscription.tsx — Comportamiento actual:
✅ **NO muestra datos ficticicios**
✅ Valida que existe equipo en BD
✅ Valida documentación completa (DNI + Assegurança)
✅ Desactiva pagamento si faltan documentos
✅ Conecta con `/api/team/inscription-data`
✅ Procesa pago vía `/api/team/process-payment`
✅ Usa AuthContext para JWT

---

## 🚀 Backend (Express + Node.js + TypeScript + MySQL)

### Stack:
- express@4.x, mysql2@3.x
- bcrypt@5.x (10 rounds), jwt@9.x (exp 7d)
- express-validator, cors, dotenv

### Arquitectura:
```
server.ts (entrada)
  ├── middleware/auth.ts
  │   ├── verifyToken (JWT validation)
  │   └── requireRole (RBAC)
  └── routes/
      ├── auth.ts         → /api/auth
      ├── teams.ts        → /api/teams
      ├── inscriptions.ts → /api/team
      ├── capita.ts       → /api/dashboard, /api/team/*
      ├── admin.ts        → /api/admin
      ├── arbitre.ts      → /api/arbitre
      └── public.ts       → /api/public
```

---

## 📡 Todos los Endpoints (40+)

### **Autenticación** (`/api/auth`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Registrar Capità |
| POST | `/api/auth/login` | ❌ | Login (JWT) |
| POST | `/api/auth/register-invited-player` | ❌ | Registrar Jugador |

**Register Request:**
```json
{
  "name": "Joan García",
  "email": "joan@example.com",
  "password": "secure123",
  "confirmPassword": "secure123"
}
```

**Register Response:**
```json
{
  "message": "User registered successfully",
  "userId": 1,
  "token": "eyJhbGc..."
}
```

### **Equipos** (`/api/teams`) — Solo Capità

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/teams` | Listar equipos del usuario |
| POST | `/api/teams` | Crear nuevo equipo |
| GET | `/api/teams/:id` | Detalles del equipo |
| GET | `/api/teams/:id/players` | Jugadores del equipo |
| POST | `/api/teams/:id/invite-player` | Invitar jugador |

**Create Team:**
```json
// Request POST /api/teams
{
  "name": "Els Invencibles",
  "sport": "futsal" // futsal, basquet3x3, padel
}
```

### **Inscripción** (`/api/team`) — Capità

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/team/inscription-data` | Datos inscripción |
| GET | `/api/team/documents` | Documentos del equipo |
| POST | `/api/team/upload-document` | Subir DNI/Assegurança |
| POST | `/api/team/process-payment` | Procesar pago |

**Inscription Data:**
```json
// Response GET /api/team/inscription-data
{
  "teamData": {
    "teamName": "Els Invencibles",
    "sport": "futsal",
    "players": ["Marc López", "Joan Garcia"],
    "amount": 150,
    "status": "pendent_docs",
    "documentsReady": false
  }
}
```

### **Dashboard Capità** (`/api/*`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard principal |
| GET | `/api/team/players` | Jugadores |
| GET | `/api/team/matches` | Partidos del equipo |
| GET | `/api/team/statistics` | Estadísticas |
| GET | `/api/notifications` | Notificaciones |

**Dashboard Response:**
```json
{
  "teamName": "Els Invencibles",
  "sport": "futsal",
  "status": "pendent_docs",
  "nextMatch": {
    "date": "2026-05-25T18:00:00Z",
    "court": "Pista 1",
    "opponent": "Team B"
  },
  "statistics": {
    "wins": 3,
    "draws": 1,
    "losses": 0,
    "matches_played": 4
  },
  "pendingDocuments": 2
}
```

### **Admin** (`/api/admin`) — Solo Admin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard admin |
| GET | `/api/admin/inscriptions` | Inscripciones pendientes |
| GET | `/api/admin/inscriptions/:teamId` | Docs equipo |
| POST | `/api/admin/inscriptions/:teamId/approve-document` | Aprobar |
| POST | `/api/admin/inscriptions/:teamId/reject-document` | Rechazar |
| POST | `/api/admin/generate-calendar` | Generar calendario |

### **Árbitro** (`/api/arbitre`) — Solo Arbitre

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/arbitre/matches` | Mis partidos |
| GET | `/api/arbitre/match/:matchId` | Detalles partido |
| POST | `/api/arbitre/match/:matchId/sheet` | Guardar acta |
| GET | `/api/arbitre/match/:matchId/sheet` | Obtener acta |

### **Public** (`/api/public`) — Sin autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/public/matches` | Próximos partidos |
| GET | `/api/invitations/:token` | Datos invitación |

### **Health Check**

| Método | Endpoint |
|--------|----------|
| GET | `/api/health` |

---

## 🗄️ Base de Datos (MySQL `campo_base`)

### 10 Tablas principales:

#### `users` — Usuarios del sistema
```sql
id (INT, PK, AI)
name (VARCHAR 255)
email (VARCHAR 100, UNIQUE)
password (VARCHAR 255, bcrypt)
role (ENUM: admin, capita, arbitre, jugador)
email_verified (BOOLEAN, default FALSE)
created_at, updated_at (TIMESTAMP)
Índices: email, role
```

#### `teams` — Equipos con estado
```sql
id (INT, PK, AI)
name (VARCHAR 255)
sport (ENUM: futsal, basquet3x3, padel)
status (ENUM: pendent_docs, pendent_pagament, pendent_validacio, inscrit, actiu)
capita_id (INT, FK → users.id)
created_at (TIMESTAMP)
Índices: capita_id, sport, status
```

#### `team_players` — Jugadores en equipos
```sql
team_id (INT, FK → teams.id)
user_id (INT, FK → users.id)
dorsal (INT)
position (VARCHAR 50)
created_at (TIMESTAMP)
PK: (team_id, user_id)
```

#### `documents` — DNI y Assegurança
```sql
id (INT, PK, AI)
user_id (INT, FK → users.id)
team_id (INT, FK → teams.id)
document_type (ENUM: dni, asseguranca)
file_path (VARCHAR 500)
status (ENUM: pendent, aprovat, rebutjat)
rejection_reason (TEXT)
created_at (TIMESTAMP)
Índices: user_id, team_id, status
```

#### `inscriptions` — Inscripción a torneo
```sql
id (INT, PK, AI)
team_id (INT, FK → teams.id)
tournament_id (INT, FK → tournaments.id)
status (ENUM: pendent_docs, pendent_pagament, pendent_validacio, inscrit)
amount (DECIMAL 8,2)
payment_date (TIMESTAMP)
created_at (TIMESTAMP)
PK: (team_id, tournament_id) UNIQUE
```

#### `tournaments` — Torneos/Campeonatos
```sql
id (INT, PK, AI)
name (VARCHAR 255)
format (ENUM: grups, lliga, eliminatoria, mixt)
points_win (INT, default 3)
points_draw (INT, default 1)
points_loss (INT, default 0)
tiebreaker (VARCHAR 200)
match_duration (INT, minutos)
break_between_matches (INT, minutos)
start_time (TIME)
created_at (TIMESTAMP)
```

#### `courts` — Pistas/Instalaciones
```sql
id (INT, PK, AI)
tournament_id (INT, FK → tournaments.id)
name (VARCHAR 100)
location (VARCHAR 200)
availability (JSON)
created_at (TIMESTAMP)
```

#### `matches` — Partidos del torneo
```sql
id (INT, PK, AI)
tournament_id (INT, FK → tournaments.id)
home_team_id (INT, FK → teams.id)
away_team_id (INT, FK → teams.id)
court_id (INT, FK → courts.id)
arbitre_id (INT, FK → users.id)
match_date (DATETIME)
status (ENUM: pendent, en_curs, finalitzat, cancel·lat)
created_at (TIMESTAMP)
Índices: tournament_id, home_team_id, away_team_id, status
```

#### `match_sheets` — Actas digitales
```sql
id (INT, PK, AI)
match_id (INT, UNIQUE, FK → matches.id)
incidents (JSON) — {goals, cards, fouls}
status (ENUM: en_curs, tancada, immutable)
pdf_url (VARCHAR 500)
closed_at (TIMESTAMP)
created_at (TIMESTAMP)
```

### Relaciones:
```
users (1) ──── (N) teams
  │ ├─── (N) documents
  │ └─── (N) matches (arbitre)
  
teams (1) ──── (N) team_players
           ──── (N) matches (home/away)
           ──── (N) inscriptions
           
tournaments (1) ──── (N) matches
            ──── (N) courts
            ──── (N) inscriptions

matches (1) ──── (1) match_sheets
```

---

## 🔐 Control de Acceso (RBAC)

### Permisos por rol:

| Rol | Crear | Validar | Ver | APIs |
|-----|-------|---------|-----|------|
| **Capità** | Equipo, invitaciones | - | Su equipo | /api/teams, /api/team, /api/dashboard |
| **Jugador** | - | - | Su equipo | /api/team/matches, /api/notifications |
| **Arbitre** | - | - | Sus partidos | /api/arbitre/* |
| **Admin** | - | Documentos | Todo | /api/admin/* |

### Validación:
```typescript
// 1. verifyToken middleware
Authorization: Bearer <token>
  → JWT.verify() → userId, role

// 2. requireRole middleware
requireRole(['admin'])
  → if (!user.role in roles) → 403

// 3. Validación en endpoint
if (req.userId !== resource.owner) → 403
```

---

## 📋 Flujo de Inscripción Completo

```
1. CAPITÀ CREA EQUIPO
   POST /api/teams
   → teams.status = 'pendent_docs'

2. CAPITÀ AGREGA JUGADORES
   POST /api/teams/:id/invite-player
   → team_players creadas

3. CAPITÀ SUBE DOCUMENTACIÓN
   POST /api/team/upload-document (DNI + Assegurança)
   → documents.status = 'pendent'

4. CAPITÀ PAGA
   POST /api/team/process-payment
   → teams.status = 'pendent_validacio'
   → inscriptions.status = 'pendent_validacio'

5. ADMIN VALIDA
   GET /api/admin/inscriptions/:teamId
   POST /api/admin/inscriptions/:teamId/approve-document
   → documents.status = 'aprovat'
   → Si todos OK: teams.status = 'inscrit'

6. ADMIN GENERA CALENDARIO
   POST /api/admin/generate-calendar
   → tournaments creado
   → matches creados
   → teams.status = 'actiu'

7. EQUIPO LISTO
   ✓ Puede ver partidos
   ✓ Árbitres pueden hacer actas
```

### Flujo de Acta Arbitral:

```
1. ÁRBITRO VE PARTIDOS
   GET /api/arbitre/matches

2. ÁRBITRO ABRE PARTIDO
   GET /api/arbitre/match/:matchId
   → Detecta deporte (futsal/basquet/padel)

3. DURANTE MATCH
   POST /api/arbitre/match/:matchId/sheet
   → incidents JSON actualizado
   → match_sheets.status = 'en_curs'

4. CIERRA ACTA
   POST /api/arbitre/match/:matchId/sheet
   → match_sheets.status = 'tancada'
   → matches.status = 'finalitzat'
   → Auto-genera PDF

5. EQUIPO VE RESULTADO
   GET /api/team/matches/:matchId → resultado
```

---

## 🔐 Autenticación (JWT)

### Registro:
```
1. POST /api/auth/register { name, email, password }
2. Backend:
   - Valida entrada
   - Verifica email no existe
   - bcrypt.hash(password, 10)
   - INSERT users (role: 'capita')
   - jwt.sign({ id, email, role })
3. Frontend:
   - localStorage.setItem('token', token)
   - AuthContext.setUser()
   - Redirige a /dashboard
```

### Login:
```
1. POST /api/auth/login { email, password }
2. Backend:
   - SELECT user WHERE email
   - bcrypt.compare(password, hash)
   - jwt.sign({ id, email, role })
3. Frontend:
   - localStorage.setItem('token', token)
   - Redirige según role
```

### Protección de rutas:
```
Frontend:
→ AuthContext verifica token en localStorage
→ Si no token → /login
→ Si token inválido → /login, borra token

Backend:
→ verifyToken middleware en todas rutas
→ Si no Authorization header → 401
→ Si JWT inválido → 401
→ Si JWT expirado → 401
```

### Endpoints públicos:
```
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/register-invited-player
- GET /api/public/matches
- GET /api/invitations/:token
- GET /api/health
```

---

## 🛠️ Instalación y Configuración

### 1. Base de Datos (MySQL WAMP)

**Opción A: phpMyAdmin**
```
1. Abre http://localhost/phpmyadmin
2. Crea BD: campo_base
3. Importa: backend/src/db/schema.sql
```

**Opción B: Terminal**
```bash
mysql -u root < backend/src/db/schema.sql
```

### 2. Instalar dependencias

```bash
# Desde raíz
pnpm install
```

### 3. Variables de entorno

**backend/.env:**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=campo_base

JWT_SECRET=super_secret_key_change_in_production
JWT_EXPIRE=7d

PORT=3001
NODE_ENV=development
```

**frontend/.env:**
```
VITE_API_URL=http://localhost:3001/api
```

### 4. Ejecutar

```bash
# Terminal 1 - Backend
cd backend && npm run dev
# → ✓ Server running on http://localhost:3001

# Terminal 2 - Frontend
cd frontend && npm run dev
# → Local: http://localhost:5173

# O desde raíz
pnpm dev
```

---

## 📊 Estado del Proyecto

### ✅ Completado

**Backend (40+ endpoints):**
- [x] Autenticación JWT con roles
- [x] Rutas teams (CRUD + invitaciones)
- [x] Rutas inscripción (documentos, pagos)
- [x] Dashboard capita (datos reales)
- [x] Dashboard admin (validaciones, calendario)
- [x] Rutas árbitro (actas, partidos)
- [x] Rutas públicas (matches, invitaciones)
- [x] Middleware autenticación
- [x] Control de acceso por rol
- [x] Schema BD completo (10 tablas)
- [x] Integración MySQL2

**Frontend:**
- [x] LoginPage → API real
- [x] RegisterPage → API real
- [x] AuthContext (JWT + roles)
- [x] CapitaInscription (datos BD, SIN ficticios)
- [x] CapitaDashboard (datos reales)
- [x] Admin pages (validación real)
- [x] Páginas protegidas
- [x] Loading states (todas)
- [x] Error handling (completo)
- [x] Empty states (catalán)

**Documentación:**
- [x] ESPECIFICACIO_FUNCIONAL.md (catalán)
- [x] ARCHITECTURE.md (este archivo)

### 🔄 Próximos pasos (opcional):

- [ ] Upload real de documentos (multipart)
- [ ] Email verification
- [ ] Invitaciones por email
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Generación calendario inteligente
- [ ] Generación PDF actas
- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] Tests (unitarios + E2E)
- [ ] Deployment

---

## 🐛 Debugging

### Verificar servidor:
```bash
curl http://localhost:3001/api/health
# {"status":"OK","timestamp":"..."}
```

### Ver logs:
```bash
# Terminal backend mostrará logs en tiempo real
npm run dev
```

### JWT debugging:
```javascript
// DevTools console
localStorage.getItem('token')
// Decodifica en https://jwt.io
```

### Network requests:
```
F12 → Network → Filter XHR/Fetch
Ver Request/Response headers
Verificar Authorization header
```

---

## 📚 Stack tecnológico

**Frontend:**
- React@18, React Router@6, TypeScript@5
- TailwindCSS@3, Vite@4, shadcn/ui
- lucide-react (iconos)

**Backend:**
- Express@4, MySQL2@3, Node.js@18+
- bcrypt@5, jsonwebtoken@9
- express-validator, cors, dotenv

**BD:**
- MySQL 8.x (WAMP)
- 10 tablas + índices
- Foreign keys, constraints

---

## 📝 Notas importantes

### Para el Capità:
- **Sin equipo?** → POST /api/teams para crear
- **Sin docs?** → POST /api/team/upload-document
- **Pago OK?** → Status: "pendent_validacio" → espera admin

### Para el Admin:
- **Validar docs** → GET /api/admin/inscriptions/:teamId
- **Generar calendario** → POST /api/admin/generate-calendar
- **Ver estado** → GET /api/admin/dashboard

### Para el Arbitre:
- **Ver partidos** → GET /api/arbitre/matches
- **Cargar acta** → POST /api/arbitre/match/:matchId/sheet
- **Detalles** → Según deporte (futsal/basquet/padel)

### Seguridad:
- ✅ Contraseñas bcrypt (10 rounds)
- ✅ JWT (7 días exp)
- ✅ CORS limitado
- ✅ SQL injection prevenido
- ✅ RBAC en cada endpoint
- ⚠️ TODO: Change JWT_SECRET en producción
- ⚠️ TODO: Rate limiting

---

**Última actualización:** Mayo 2026 | **Versión:** 2.0 (Backend Completo) | **Estado:** ✅ Listo para testing
