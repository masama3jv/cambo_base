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

## 🔄 Comunicación Frontend-Backend

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

## 📚 Próximos pasos

- [ ] Conectar RegisterPage al endpoint `/api/auth/register`
- [ ] Conectar LoginPage al endpoint `/api/auth/login`
- [ ] Guardar JWT en localStorage
- [ ] Proteger rutas con verificación de token
- [ ] Crear endpoints adicionales (teams, matches, etc.)
- [ ] Implementar refresh tokens
- [ ] Agregar email verification
- [ ] Configurar upload de documentos

---

## 💡 Tips útiles

- **JWT Token**: Contiene `{ id, email, role }` - decodifica en https://jwt.io para debuggear
- **CORS Error**: Si tienes problemas, revisa que frontend está en puerto 5173 y backend en 3001
- **MySQL Error**: Asegúrate de que WAMP está corriendo y MySQL está activo
- **Contraseñas**: Nunca stores en plain text - siempre usa bcrypt
