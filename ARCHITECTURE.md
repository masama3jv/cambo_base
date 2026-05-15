# 📋 CampoBase - Arquitectura del Proyecto

## 📁 Estructura General

```
CampoBase/
├── frontend/                      # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Componentes reutilizables
│   │   │   ├── context/           # Context API (AuthContext)
│   │   │   ├── pages/             # Páginas de la aplicación
│   │   │   ├── services/          # Servicios (authService)
│   │   │   ├── App.tsx
│   │   │   └── routes.tsx
│   │   ├── main.tsx
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env                       # Variables de entorno (local)
│   └── .env.example               # Template de .env
│
├── backend/                        # Backend (Express + Node.js + TypeScript)
│   ├── src/
│   │   ├── server.ts              # Servidor principal
│   │   ├── routes/
│   │   │   └── auth.ts            # Rutas de autenticación
│   │   └── db/
│   │       ├── connection.ts       # Conexión a MySQL
│   │       └── schema.sql          # Estructura de base de datos
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        # Variables de entorno (local)
│   └── .env.example                # Template de .env
│
├── package.json                    # Workspace root
├── pnpm-workspace.yaml             # Configuración del monorepo
├── ARCHITECTURE.md                 # Este archivo
└── README.md
```

---

## 🔧 Frontend (React + TypeScript)

**Ubicación:** `src/`

### Dependencias principales:
- **Vite**: Bundler rápido
- **React**: Librería de UI
- **TypeScript**: Tipado estático
- **Radix UI**: Componentes accesibles
- **TailwindCSS**: Estilos CSS

### Páginas principales:
- `/` → LandingPage
- `/login` → LoginPage
- `/register` → RegisterPage (envía datos al backend)
- `/admin` → AdminDashboard
- `/arbitre` → ArbitreMatches
- `/capita` → CapitaDashboard
- `/jugador` → JugadorDashboard

---

## 🚀 Backend (Express + TypeScript)

**Ubicación:** `backend/`

### Stack tecnológico:
- **Express**: Framework web
- **MySQL2**: Conector MySQL
- **bcrypt**: Hash de contraseñas
- **JWT**: Autenticación con tokens
- **Express-validator**: Validación de datos
- **CORS**: Control de origen cruzado

### Endpoints disponibles:

#### Autenticación (`/api/auth`)
- **POST** `/api/auth/register`
  - Input: `{ name, email, password, confirmPassword }`
  - Output: `{ message, userId, token }`
  
- **POST** `/api/auth/login`
  - Input: `{ email, password }`
  - Output: `{ message, userId, role, token }`
  
- **POST** `/api/auth/verify`
  - Input: `Authorization: Bearer <token>`
  - Output: `{ valid, user }`

#### Invitaciones de Jugadores
- **GET** `/api/invitations/{token}`
  - Output: `{ invitation: { email, teamName, captainName } }`

- **POST** `/api/auth/register-invited-player`
  - Input: `{ name, password, confirmPassword, token }`
  - Output: `{ message, userId, token }`

#### Dashboard Capita
- **GET** `/api/dashboard`
  - Output: `{ stats, inscription }`

- **GET** `/api/team/players`
  - Output: `{ players: Array }`

- **GET** `/api/team/matches`
  - Output: `{ matches: Array }`

- **GET** `/api/team/statistics`
  - Output: `{ statistics }`

- **GET** `/api/team/documents`
  - Output: `{ documents: Array }`

- **GET** `/api/team/inscription-data`
  - Output: `{ team: { name, players, totalCost } }`

- **GET** `/api/notifications`
  - Output: `{ notifications: Array }`

#### Dashboard Jugador
- **GET** `/api/jugador/dashboard`
  - Output: `{ upcomingMatches, recentMatches, personalStats }`

#### Dashboard Admin
- **GET** `/api/admin/dashboard`
  - Output: `{ stats: { totalTeams, pendingValidations, scheduledMatches, activeCourts }, pendingTeams }`

- **GET** `/api/admin/inscriptions`
  - Output: `{ teams: Array }`

- **POST** `/api/admin/inscriptions/{teamId}/approve-document`
  - Input: `{ playerName, docType }`

- **POST** `/api/admin/inscriptions/{teamId}/reject-document`
  - Input: `{ playerName, docType, reason }`

- **POST** `/api/admin/generate-calendar`
  - Input: `{ numCourts, courts, format, teamsPerGroup, winPoints, drawPoints, lossPoints, matchDuration, breakBetween }`
  - Output: `{ matches: Array }`

#### Dashboard Arbitre
- **GET** `/api/arbitre/match`
  - Output: `{ match }`

#### Datos Públicos
- **GET** `/api/public/matches`
  - Output: `{ matches: Array, results: Array }`

#### Health Check
- **GET** `/api/health`
  - Output: `{ status, timestamp }`

---

## 🗄️ Base de Datos (MySQL)

**Nombre:** `campo_base`

### Tablas:

#### `users`
Almacena todos los usuarios del sistema.
```sql
- id (INT, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hasheada)
- role (ENUM: admin, capita, arbitre, jugador)
- email_verified (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### `teams`
Equipos gestionados por capitanes.
```sql
- id (INT, PK)
- name (VARCHAR)
- description (TEXT)
- capita_id (FK → users.id)
- created_at (TIMESTAMP)
```

#### `players`
Jugadores de un equipo.
```sql
- id (INT, PK)
- user_id (FK → users.id)
- team_id (FK → teams.id)
- dorsal (INT)
- position (VARCHAR)
- created_at (TIMESTAMP)
```

#### `matches`
Partidos programados.
```sql
- id (INT, PK)
- home_team_id (FK → teams.id)
- away_team_id (FK → teams.id)
- arbitre_id (FK → users.id)
- date (DATETIME)
- location (VARCHAR)
- status (ENUM: scheduled, in_progress, finished, cancelled)
- home_score, away_score (INT)
- created_at (TIMESTAMP)
```

#### `inscriptions`
Inscripciones de jugadores a partidos.
```sql
- id (INT, PK)
- player_id (FK → players.id)
- match_id (FK → matches.id)
- status (ENUM: pending, confirmed, rejected, cancelled)
- created_at (TIMESTAMP)
```

#### `documents`
Documentos cargados por usuarios o equipos.
```sql
- id (INT, PK)
- user_id (FK → users.id)
- team_id (FK → teams.id)
- name (VARCHAR)
- file_path (VARCHAR)
- document_type (VARCHAR)
- created_at (TIMESTAMP)
```

---

## 🔐 Flujo de Autenticación

### Registro (Register Flow)
```
1. Usuario llena formulario en RegisterPage
2. Frontend valida datos localmente
3. POST /api/auth/register con { name, email, password, confirmPassword }
4. Backend valida entrada
5. Backend verifica si email ya existe
6. Backend hashea contraseña con bcrypt (10 rounds)
7. Backend inserta user en BD con rol 'capita'
8. Backend genera JWT token
9. Frontend recibe token y lo guarda en localStorage
10. Frontend redirige a dashboard
```

### Login (Login Flow)
```
1. Usuario llena formulario en LoginPage
2. POST /api/auth/login con { email, password }
3. Backend busca user por email
4. Backend verifica contraseña con bcrypt.compare()
5. Backend genera JWT token
6. Frontend recibe token y lo guarda
7. Frontend redirige según rol del usuario
```

### Verificación de Token
```
1. Frontend añade "Authorization: Bearer <token>" en headers
2. Backend decodifica JWT y verifica firma
3. Si válido, responde con datos del usuario
4. Si inválido, responde con error 401
```

---

## 🛠️ Instalación y Configuración

### 1. Base de Datos (WAMP)
```bash
# Abre phpMyAdmin: http://localhost/phpmyadmin
# Importa el archivo: backend/src/db/schema.sql
# O copia y pega el contenido en SQL
```

### 2. Instalar dependencias (desde raíz)
```bash
# Instala dependencias de frontend y backend
pnpm install
```

### 3. Frontend - Crear .env
```bash
cd frontend
cp .env.example .env
# El archivo ya está configurado con VITE_API_URL=http://localhost:3001/api
```

### 4. Backend - Crear .env
```bash
cd backend
cp .env.example .env
# Edita si es necesario: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
```

### 5. Ejecutar en desarrollo

**Desde la raíz, ejecutar todo a la vez:**
```bash
pnpm dev
```

**O en terminales separadas:**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Server en: http://localhost:3001
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# App en: http://localhost:5173
```

---

## 📱 Flujo de la Aplicación

```
User
  ↓
LandingPage
  ├→ [Crear cuenta] → RegisterPage → /api/auth/register → Dashboard
  └→ [Iniciar sesión] → LoginPage → /api/auth/login → Dashboard

Dashboard (según rol):
  ├→ Admin → AdminDashboard
  ├→ Capita → CapitaDashboard (gestiona equipo)
  ├→ Arbitre → ArbitreMatches (gestiona partidos)
  └→ Jugador → JugadorDashboard (ve partidos/equipos)
```

---

## 📝 Variables de Entorno

### Backend (.env)
```
DB_HOST=localhost              # Host MySQL
DB_PORT=3306                   # Puerto MySQL
DB_USER=root                   # Usuario MySQL
DB_PASSWORD=                   # Contraseña MySQL (vacía por defecto en WAMP)
DB_NAME=campo_base             # Nombre de la BD

JWT_SECRET=abc123secret        # Clave para firmar JWT (cambiar en producción)
JWT_EXPIRE=7d                  # Duración del token

PORT=3001                      # Puerto del servidor
NODE_ENV=development           # Entorno (development/production)
```

---

## � Patrón de API Calls en Frontend

### Patrón estándar para páginas:
```typescript
// 1. Definir interfaces TypeScript para datos
interface DashboardData {
  stats: { totalTeams, pendingValidations, ... }
  pendingTeams: PendingTeam[]
}

// 2. Estado local
const [data, setData] = useState<DashboardData | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// 3. Fetch en useEffect
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        setData(await response.json())
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  fetchData()
}, [])

// 4. Renderizado condicional
if (isLoading) return <div>Carregant...</div>
if (error) return <Card>Error: {error}</Card>
if (!data) return <Card>No hi ha dades</Card>
return <div>{/* mostrar datos */}</div>
```

### Reglas:
- **Sin datos hardcoded**: Todos los datos vienen de API
- **Loading states**: Mostrar "Carregant..." durante peticiones
- **Error handling**: Mostrar error y botón para reintentar
- **Empty states**: Mensajes amables en Catalan cuando no hay datos
- **TypeScript**: Todas las respuestas de API deben tener interfaces

---

## �🔄 Comunicación Frontend-Backend

### Headers requeridos:
```javascript
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password })
})
```

### Con autenticación:
```javascript
fetch('http://localhost:3001/api/auth/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 🐛 Debugging

### Verificar servidor backend:
```bash
# En terminal, ve a backend/ y ejecuta:
npm run dev
# Deberías ver: ✓ Database connected ✓ Server running on http://localhost:3001
```

### Verificar conexión a BD:
```bash
curl http://localhost:3001/api/health
# Respuesta: { "status": "OK", "timestamp": "..." }
```

### Ver logs:
```
[Backend logs aparecen en la terminal donde ejecutas npm run dev]
```

---

## 📚 Estado del Proyecto

### ✅ Completado
- [x] Conectar RegisterPage al endpoint `/api/auth/register`
- [x] Conectar LoginPage al endpoint `/api/auth/login`
- [x] Guardar JWT en localStorage
- [x] Proteger rutas con verificación de token
- [x] Crear endpoints de autenticación (auth)
- [x] Eliminar todas las datas hardcoded del frontend
- [x] Implementar API calls en todas las páginas
- [x] Agregar loading states en todas las páginas
- [x] Agregar error handling en todas las páginas
- [x] Agregar empty states en Catalan
- [x] Implementar AuthContext para gestionar usuario
- [x] Integrar datos de usuario en Sidebar

### 🔄 En progreso / Próximos pasos
- [ ] Implementar refresh tokens
- [ ] Agregar email verification
- [ ] Configurar upload de documentos
- [ ] Crear endpoints de capitán (team management)
- [ ] Crear endpoints de admin (tournament management)
- [ ] Crear endpoints de arbitre (match management)
- [ ] Implementar notificaciones en tiempo real (WebSockets)
- [ ] Agregar validación de datos en backend
- [ ] Implementar rate limiting

---

## 💡 Tips útiles

- **JWT Token**: Contiene `{ id, email, role }` - decodifica en https://jwt.io para debuggear
- **CORS Error**: Si tienes problemas, revisa que frontend está en puerto 5173 y backend en 3001
- **MySQL Error**: Asegúrate de que WAMP está corriendo y MySQL está activo
- **Contraseñas**: Nunca stores en plain text - siempre usa bcrypt
- **API Debugging**: Usa el navegador (DevTools → Network) para ver qué endpoints se llaman
- **Empty States**: Son mensajes en Catalan que se muestran cuando no hay datos (ej: "No hi ha partits programats")
- **Loading States**: Todas las páginas muestran "Carregant..." mientras se cargan los datos
- **Error Handling**: Si falla una petición, se muestra un card rojo con el error y un botó "Reintentar"

## 📅 Cambios Recientes

### Session Anterior (Database Updates)
- Actualizadas tablas en schema.sql para soportar nuevos campos
- Agregadas tablas para invitations, notifications, etc.

### Session Actual (Frontend Cleanup + API Integration)
- Removidas todas las datas hardcoded del frontend
- Agregados 18+ nuevos endpoints de API
- Implementado patrón estándar de API calls en todas las páginas
- Agregados proper loading, error, y empty states
- Integrado AuthContext para manejo de usuario
- Actualizado Sidebar para mostrar datos reales del usuario
