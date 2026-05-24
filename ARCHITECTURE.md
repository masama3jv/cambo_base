# CampoBase - Arquitectura del Projecte

**Estat:** ✅ Complet | 🌐 Railway + Vercel | 🔐 JWT auth | 💳 Stripe | 📄 Actes digitals

---

## 📁 Estructura General

```
CampoBase/
├── frontend/                        # React + TypeScript + Vite
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/          # Sidebar, Card, Button, Input, DocumentUploadZone
│   │   │   ├── context/             # AuthContext (login, register, logout, refreshUser)
│   │   │   ├── pages/
│   │   │   │   ├── admin/           # Dashboard, Configurator, Inscriptions, Calendar
│   │   │   │   ├── capita/          # Dashboard, Inscription, Documents, Team, Calendar, Statistics
│   │   │   │   ├── arbitre/         # Tournaments, Matches, MatchSheet
│   │   │   │   ├── jugador/         # Dashboard, Team
│   │   │   │   └── Landing, Login, Register, NotFound
│   │   │   ├── services/            # api.ts (API_BASE_URL), authService.ts
│   │   │   ├── App.tsx
│   │   │   └── routes.tsx           # ProtectedRoute per rol
│   │   └── styles/
│   ├── vercel.json                  # SPA rewrite rule
│   └── vite.config.ts
│
├── backend/                         # Express + Node.js + TypeScript + MySQL
│   ├── src/
│   │   ├── server.ts                # Entry point, CORS, routes
│   │   ├── middleware/
│   │   │   └── auth.ts              # verifyToken, requireRole
│   │   ├── routes/
│   │   │   ├── auth.ts              # /api/auth (register, login, register-invited)
│   │   │   ├── teams.ts             # /api/teams (CRUD, join-by-code, check-code)
│   │   │   ├── inscriptions.ts      # /api/team (documents, payment, players)
│   │   │   ├── capita.ts            # /api/dashboard, /api/team/* (calendar, stats)
│   │   │   ├── admin.ts             # /api/admin (inscriptions, calendar, referees, reset)
│   │   │   ├── arbitre.ts           # /api/arbitre (tournaments, matches, match sheet)
│   │   │   ├── jugador.ts           # /api/jugador (dashboard, team, matches)
│   │   │   └── public.ts            # /api/public (matches)
│   │   ├── services/
│   │   │   ├── calendarService.ts   # Schedule generation (round-robin, groups, elimination)
│   │   │   ├── matchSheetService.ts  # Goal/card/basket/padel recording, PDF generation
│   │   │   └── emailService.ts      # Resend HTTP API (fire-and-forget, fallback)
│   │   └── db/
│   │       └── connection.ts        # Pool MySQL + migrations
│   │
│   ├── .env
│   └── package.json
│
├── ARCHITECTURE.md
├── ESPECIFICACIO_FUNCIONAL.md
└── README.md
```

---

## 🔧 Frontend

### Dependències principals
- react@18, react-router@6, typescript@5
- tailwindcss@3, vite@6
- @stripe/react-stripe-js, @stripe/stripe-js
- lucide-react (icones)

### Pàgines per rol

| Ruta | Component | Rol | Funció |
|------|-----------|-----|--------|
| `/` | LandingPage | Public | Info general |
| `/login` | LoginPage | Public | Login JWT |
| `/register` | RegisterPage | Public | Registrar (capita/jugador) |
| `/capita/dashboard` | CapitaDashboard | Capità | Dashboard |
| `/capita/team` | CapitaTeam | Capità | Gestionar equip (read-only) |
| `/capita/inscription` | CapitaInscription | Capità | Inscripció + Stripe |
| `/capita/documents` | CapitaDocuments | Capità | Documents per jugador |
| `/capita/calendar` | CapitaCalendar | Capità | Partits |
| `/capita/statistics` | CapitaStatistics | Capità | Estadístiques |
| `/admin` | AdminDashboard | Admin | Dashboard |
| `/admin/inscriptions` | AdminInscriptions | Admin | Validar docs |
| `/admin/configurator` | AdminConfigurator | Admin | Crear torneig |
| `/admin/calendar` | AdminCalendar | Admin | Calendari torneigs |
| `/arbitre/partits` | ArbitreTournaments | Àrbitre | Llista torneigs |
| `/arbitre/partits/:tournamentId` | ArbitreMatches | Àrbitre | Partits d'un torneig |
| `/arbitre/match/:matchId` | ArbitreMatchSheet | Àrbitre | Acta digital |
| `/jugador/dashboard` | JugadorDashboard | Jugador | Dashboard |
| `/jugador/team` | JugadorTeam | Jugador | Veure equip |
| `*` | NotFoundPage | Public | 404 |

### Convencions
- `ProtectedRoute` comprova token i role de l'usuari
- `useAuth()` hook per accedir a user, login, register, logout
- `API_BASE_URL` de `services/api.ts` (`https://cambobase-production.up.railway.app`)
- Token guardat a `localStorage` amb clau `'token'`
- Totes les peticions porten `Authorization: Bearer <token>`
- Idiomes: català (UI), castellà (ocasional)

---

## 🚀 Backend

### Stack
- express@4, mysql2@3, node@18+
- bcrypt (10 rounds), jsonwebtoken (exp 7d)
- stripe (pagament), resend (email)
- cors, dotenv, express-validator

### Endpoints

#### Autenticació (`/api/auth`)
| Mètode | Endpoint | Auth | Descripció |
|--------|----------|------|------------|
| POST | `/api/auth/register` | ❌ | Registrar (capita/jugador) |
| POST | `/api/auth/login` | ❌ | Login JWT |
| POST | `/api/auth/register-invited-player` | ❌ | Registrar jugador convidat |

#### Equips (`/api/teams`) — Capità
| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/teams` | Equips de l'usuari |
| POST | `/api/teams` | Crear equip (genera codi CB-XXXX) |
| GET | `/api/teams/:id` | Detalls equip |
| GET | `/api/teams/:id/players` | Jugadors |
| POST | `/api/teams/:id/invite-player` | Convidar jugador |
| POST | `/api/teams/join-by-code` | Unir-se per codi |
| POST | `/api/teams/check-code` | Validar codi d'invitació |

#### Inscripció (`/api/team`) — Capità
| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/team/inscription-data` | Dades inscripció |
| GET | `/api/team/documents` | Documents de l'equip |
| POST | `/api/team/upload-document` | Pujar DNI/Assegurança/Drets imatge |
| POST | `/api/team/create-payment-intent` | Crear PaymentIntent Stripe |
| POST | `/api/team/process-payment` | Confirmar pagament |

#### Dashboard Capità (`/api/*`)
| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/dashboard` | Dashboard |
| GET | `/api/team/players` | Jugadors |
| GET | `/api/team/matches` | Partits |
| GET | `/api/team/statistics` | Estadístiques |
| GET | `/api/team/calendar` | Calendari |

#### Admin (`/api/admin`)
| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/admin/dashboard` | Dashboard admin |
| GET | `/api/admin/inscriptions` | Inscripcions pendents |
| GET | `/api/admin/inscriptions/:teamId` | Detall docs per equip |
| POST | `/api/admin/inscriptions/:teamId/approve-all` | Aprovar tots els docs |
| POST | `/api/admin/inscriptions/:teamId/approve-document` | Aprovar doc individual |
| POST | `/api/admin/inscriptions/:teamId/reject-document` | Rebutjar doc (amb motiu) |
| GET | `/api/admin/download-document/:documentId` | Descarregar document |
| GET | `/api/admin/tournaments` | Llistar torneigs |
| GET | `/api/admin/tournaments/:id/matches` | Partits d'un torneig |
| POST | `/api/admin/matches/:id/assign-referee` | Assignar àrbitre |
| POST | `/api/admin/generate-calendar` | Generar calendari |
| GET | `/api/admin/users?role=arbitre` | Llistar àrbitres |
| POST | `/api/admin/invite-referee` | Crear àrbitre |
| DELETE | `/api/admin/users/:id` | Eliminar usuari |
| POST | `/api/admin/reset-db` | Reiniciar BD (excepte admin) |

#### Àrbitre (`/api/arbitre`)
| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/arbitre/tournaments` | Torneigs assignats |
| GET | `/api/arbitre/matches?tournamentId=X` | Partits (filtrat per torneig) |
| GET | `/api/arbitre/match/:matchId` | Detalls partit |
| POST | `/api/arbitre/match/:matchId/sheet` | Guardar incidència a l'acta |
| GET | `/api/arbitre/match/:matchId/sheet` | Obtenir acta |
| POST | `/api/arbitre/match/:matchId/close` | Tancar acta + generar PDF |
| GET | `/api/arbitre/match/:matchId/pdf` | Descarregar PDF |

#### Jugador (`/api/jugador`)
| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/jugador/dashboard` | Dashboard |
| GET | `/api/jugador/team` | Equip actual |
| GET | `/api/jugador/matches` | Partits |

#### Públiques (`/api/public`)
| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| GET | `/api/public/matches` | Pròxims partits |
| GET | `/api/invitations/:token` | Dades invitació |

#### Health
| Mètode | Endpoint |
|--------|----------|
| GET | `/api/health` |

---

## 🗄️ Base de Dades (MySQL)

### Migracions automàtiques (`connection.ts`)
- `courts.tournament_id` nullable
- `teams.invite_code` (VARCHAR 10, UNIQUE)
- `documents.document_type` ENUM inclou `image_rights`
- `tournaments` columnes: sport, status, start_date, end_date, match_duration_minutes
- `documents.file_data` LONGTEXT (base64)
- `tournaments.match_duration` nullable

### Taules principals

#### `users`
| Col | Tipus |
|-----|-------|
| id | INT PK AI |
| name | VARCHAR(255) |
| email | VARCHAR(100) UNIQUE |
| password | VARCHAR(255) bcrypt |
| role | ENUM(admin,capita,arbitre,jugador) |
| email_verified | BOOLEAN |
| created_at | TIMESTAMP |

#### `teams`
| Col | Tipus |
|-----|-------|
| id | INT PK AI |
| name | VARCHAR(255) |
| sport | ENUM(futsal,basquet3x3,padel) |
| invite_code | VARCHAR(10) UNIQUE |
| status | ENUM(pendent_docs,pendent_pagament,inscrit,actiu) |
| capita_id | INT FK→users |
| created_at | TIMESTAMP |

#### `team_players`
| Col | Tipus |
|-----|-------|
| team_id | INT FK→teams |
| user_id | INT FK→users |
| dorsal | INT |
| position | VARCHAR(50) |
| PK | (team_id, user_id) |

#### `documents`
| Col | Tipus |
|-----|-------|
| id | INT PK AI |
| user_id | INT FK→users |
| team_id | INT FK→teams |
| document_type | ENUM(dni,asseguranca,image_rights) |
| file_path | VARCHAR(500) |
| file_data | LONGTEXT (base64) |
| status | ENUM(pendent,aprovat,rebutjat) |
| rejection_reason | TEXT |
| created_at | TIMESTAMP |

#### `tournaments`
| Col | Tipus |
|-----|-------|
| id | INT PK AI |
| name | VARCHAR(255) |
| sport | VARCHAR(20) |
| format | ENUM(lliga,grups,eliminatoria,mixt) |
| status | VARCHAR(20) |
| points_win/draw/loss | INT |
| tiebreaker | VARCHAR(200) |
| match_duration | INT (minuts) |
| match_duration_minutes | INT |
| start_date, end_date | DATE |
| created_at | TIMESTAMP |

#### `courts`
| Col | Tipus |
|-----|-------|
| id | INT PK AI |
| tournament_id | INT FK→tournaments (nullable) |
| name | VARCHAR(100) |
| location | VARCHAR(200) |
| created_at | TIMESTAMP |

#### `matches`
| Col | Tipus |
|-----|-------|
| id | INT PK AI |
| tournament_id | INT FK→tournaments |
| home_team_id | INT FK→teams |
| away_team_id | INT FK→teams |
| court_id | INT FK→courts |
| arbitre_id | INT FK→users |
| match_date | DATETIME |
| status | ENUM(pendent,en_curs,finalitzat,cancel·lat) |
| created_at | TIMESTAMP |

#### `match_sheets`
| Col | Tipus |
|-----|-------|
| id | INT PK AI |
| match_id | INT FK→matches |
| incidents | JSON (auto-parsed per mysql2) |
| home_score, away_score | INT |
| status | ENUM(actiu,tancat,immutable) |
| pdf_url | VARCHAR(500) |
| closed_at | TIMESTAMP |
| created_at | TIMESTAMP |

**Nota**: `incidents` és columna JSON de MySQL. `mysql2` la parseja automàticament a objecte. El codi fa `typeof === 'object'` per evitar `JSON.parse(object)` erroni.

---

## 🔐 Control d'accés (RBAC)

| Rol | Crea | Valida | Veu | Endpoints |
|-----|------|--------|-----|-----------|
| **Capità** | Equip, invitacions | — | Seu equip | /api/teams, /api/team, /api/dashboard |
| **Jugador** | — | — | Seu equip | /api/jugador/* |
| **Àrbitre** | Actes | — | Partits assignats | /api/arbitre/* |
| **Admin** | Torneigs | Documents | Tot | /api/admin/* |

---

## 📋 Fluxos principals

### Registre + Equip
```
1. POST /api/auth/register → user creat (capita/jugador)
2. POST /api/teams → equip creat, genera codi CB-XXXX
3. Jugadors s'uneixen via POST /api/teams/join-by-code (codi)
```

### Inscripció
```
1. Capità puja documents (dni, asseguranca, image_rights)
2. Admin aprova/rebutja per document (POST /api/admin/*/approve-document)
3. Quan tots 3 aprovats → equip passa a pendent_pagament
4. Capità paga via Stripe (create-payment-intent → confirm → process-payment)
5. Pagament OK → equip passa a inscrit
```

### Calendari
```
1. Admin configura: dates, horari, format, equips, punts
2. POST /api/admin/generate-calendar:
   - Crea torneig a BD
   - Genera enfrontaments segons format
   - Assigna horari (startTime-endTime), pistes
   - Respecta: partits/dia torneig, partits/dia equip
   - Desa partits a BD
   - Equips passen a actiu
```

### Acta digital
```
1. Àrbitre veu torneigs i partits
2. Obre acta: configura alineacions
3. Durant partit: registra gols/targetes/faltes/punts
   - POST /api/arbitre/match/:matchId/sheet
   - incidents columna JSON s'actualitza
4. Desfer últim incident
5. Tancar acta → PDF generat
```

---

## 🌐 Desplegament

| Servei | URL | Provider |
|--------|-----|----------|
| Frontend | `https://cambo-base.vercel.app` | Vercel (auto-deploy des de main) |
| Backend | `https://cambobase-production.up.railway.app` | Railway (auto-deploy des de main) |
| Base de dades | MySQL a Railway | Railway |
| Stripe | Pagaments | Stripe |
| Resend | Emails | Resend HTTP API |

### Variables d'entorn
**Railway (backend):**
- `MYSQL_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`
- `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`

**Vercel (frontend):**
- `VITE_API_URL=https://cambobase-production.up.railway.app`
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

## ⚙️ Generació de calendari

El `calendarService.ts` implementa 4 formats:
- `lliga` → round-robin (tots contra tots)
- `grups` → 2 grups amb round-robin intern
- `eliminatoria` → eliminació directa (byes automàtics)
- `mixt` → grups + eliminatòria

Paràmetres de schedule:
- startDate / endDate: finestra de dies
- startTime / endTime: franja horària diària
- matchDurationMinutes + breakMinutes: espaiat entre partits
- matchesPerDay: total partits/dia al torneig
- matchesPerTeamPerDay: màxim partits/dia per equip
- courts: nombre de pistes (paral·lelisme)

L'algorisme comença a `startDate` a `startTime`, intenta programar cada partit. Avança linealment (durada+pausa). Si un equip ja ha jugat el màxim per dia, o la pista està ocupada, passa al següent slot. Quan s'arriba a `endTime`, passa al dia següent a `startTime`.

---

## 🧪 Usuaris de test

| Email | Password | Rol |
|-------|----------|-----|
| testuser@test.com | test123 | admin |

---

## 📌 Decisions tècniques clau

- **Documents a BD**: `file_data` LONGTEXT (base64) → sobreviu a restarts de Railway
- **Notifications eliminades**: cap endpoint, taula o component de notificacions
- **Stripe real**: no simulació; 3DS redirect detectat via URL params
- **Format BD en català**: `lliga`, `grups`, `eliminatoria`, `mixt` → mapejat a anglès al servei
- **`matches` no té `sport`**: es fa JOIN amb `tournaments` per obtenir l'esport
- **JWT import**: `import jwt from 'jsonwebtoken'` (estàtic, no dinàmic)
- **JSON column**: mysql2 parseja automàticament `JSON` → codi fa `typeof === 'object'`
