Design a complete web application called "Campo Base" — a sports tournament management platform for Futsal, 3x3 Basketball, and Padel.

Brand & Visual Identity
Color palette:

Primary accent: #D85A30 — CTAs, highlights, active states
Primary dark: #993C1D — hover states
Light accent: #FAECE7 — badge backgrounds, soft surfaces
Neutral dark: #2C2C2A — headings, strong text
Neutral mid: #5F5E5A — body text
Neutral light: #F1EFE8 — page background
Border: #D3D1C7 at 0.5px
White: #FFFFFF — cards, panels

Semantic colors (badges only):

Approved: bg #EAF3DE / text #3B6D11
Pending: bg #FAEEDA / text #854F0B
Rejected: bg #FCEBEB / text #A32D2D
Info/active: bg #E6F1FB / text #185FA5

Typography — Inter:

H1: 32px / 500
H2: 24px / 500
H3: 18px / 500
Body: 15px / 400 / line-height 1.6
Caption: 13px / 400
Label: 12px / 500 / uppercase / letter-spacing 0.05em

Spacing: 4 / 8 / 16 / 24 / 32 / 48px
Border radius: 8px buttons+inputs / 12px cards+panels / 9999px pills
Style: Flat, clean, professional with sporty energy. No gradients, no shadows. Minimal 0.5px borders.

Components
Buttons:

Primary: #D85A30 bg / white text / 8px radius
Secondary: transparent / #D85A30 border 1.5px / #D85A30 text
Ghost: transparent / #D3D1C7 border / neutral text

Badges (pill): Approved / Pending / Rejected / Info using semantic colors
Cards: White bg / 0.5px border / 12px radius / 16px 20px padding. Metric cards: 13px muted label + 22px value + 12px subtitle
Form inputs: 36px height / 0.5px border / 8px radius. Focus: #D85A30 border
Navbar: White bg / 0.5px bottom border / Logo "CampoBase" in #D85A30 / nav links neutral / primary button right
Sidebar (logged-in areas): White / 0.5px right border / logo top / nav items with active state in #FAECE7 + #D85A30 text / user avatar bottom

User roles & authentication flow
The application has 4 user roles with completely separate interfaces:

Capità — creates and manages their team, handles inscriptions
Jugador — read-only access to calendar, matches and personal stats
Administrador — full back-office control, pre-created by admin
Àrbitre — mobile-only match sheet interface, pre-created by admin

Registration rules:

Public registration creates rol: capita by default
Jugadors register only via email invitation from a Capità
Administradors and Àrbitres are created internally by an existing admin (no public registration)

After login, redirect by role:

Capità / Jugador → /dashboard
Administrador → /admin
Àrbitre → /arbitre/partits

Route protection: users trying to access a role they don't have see a 403 error page

Pages to design
1. Landing page (public)

Navbar: Logo + links (Tornejos / Com funciona / Contacte) + "Accedir" button
Hero: badge "Gestió de tornejos esportius" → H1 with "professional" in #D85A30 → subtitle → "Inscriu el teu equip" (primary) + "Veure com funciona" (secondary)
Sports strip: Futbol Sala / Bàsquet 3x3 / Pàdel pills with icons
Public calendar/results section: upcoming matches and recent results visible without login
Features grid (4 cards): Inscripcions digitals / Validació documental / Calendaris automàtics / Actes en temps real
How it works: 4 numbered steps with orange circle numbers
Roles section: 4 role cards — Capità (orange) / Jugador (blue) / Admin (green) / Àrbitre (amber)
CTA band: dark #2C2C2A bg / "Inscriu l'equip ara" white button
Footer

2. Login page

Centered card layout
Logo top
Email + password fields
"Iniciar sessió" primary button
"Encara no tens compte? Registra't" link → registration page
"Has oblidat la contrasenya?" link
On submit: system reads rol from API response and redirects accordingly

3. Registration page (public — creates Capità by default)

Centered card layout
Fields: Nom complet / Email / Contrasenya / Confirmar contrasenya
"Crear compte" primary button
Note: "En crear compte, se t'assignarà el rol de Capità"
After registration: email verification screen

4. Jugador registration (via invitation link)

Same card layout but pre-filled email from invitation
Fields: Nom complet / Contrasenya / Confirmar contrasenya
Shows which team they are joining
"Unir-me a l'equip" primary button


5. Captain dashboard

Sidebar: Dashboard / El meu equip / Documents / Inscripció / Calendari / Estadístiques / Notificacions
Metric cards (4): Proper partit / Posició classificació / Documents pendents / Partits jugats
Inscription status banner: visual progress bar showing current state — Pendent docs → Pendent pagament → Pendent validació → Inscrit → Actiu. Highlighted step in #D85A30
Upcoming matches panel: next 3 matches with date, time, court, opponent, status badge
Team panel: player list with name + document status badge per player + "Convidar jugador" button

6. Document upload screen (Capità)

List of all players in the team
Per player: two upload zones — DNI and Assegurança mèdica
Each upload zone shows: file name if uploaded + status badge (pendent / aprovat / rebutjat)
If rejected: rejection reason shown in red below the upload zone + "Tornar a pujar" button
"Continuar a inscripció" button — only enabled when all documents are uploaded

7. Inscription & payment screen (Capità)

Summary: team name, sport, number of players, list of players
Document status summary: all green checks if complete
Payment section: amount to pay + simulated card form (card number / expiry / CVV)
"Confirmar i pagar" primary button
After payment: confirmation screen with status "Pendent de validació per l'administrador"

8. Player dashboard (Jugador — read only)

Sidebar: Dashboard / Calendari / Estadístiques / El meu perfil
Metric cards (3): Partits jugats / Proper partit / Estadístiques personals
Upcoming matches: same as captain view but no management actions
Personal stats panel: points/goals depending on sport, matches played, cards received
Recent match results with link to view the match sheet PDF


9. Admin panel — Dashboard

Sidebar: Dashboard / Inscripcions / Sedes / Configurador / Calendari / Àrbitres
Metric cards (4): Equips inscrits / Pendents validació / Partits programats / Pistes actives
Pending validations alert: highlighted panel showing teams awaiting document review

10. Admin — Inscription validator

Table: Equip / Esport / Capità / Nº jugadors / Documents / Estat / Actions
Row expansion: click a team to see each player's documents (DNI + assegurança) with Aprovar / Rebutjar buttons per document
Reject flow: modal asking for rejection reason text
Status badges: pendent validació / aprovat / rebutjat

11. Admin — Tournament configurator (step-by-step form)

Step indicator at top (4 steps)
Step 1 — Instal·lacions: number of courts, court names and locations, available days and time slots per court
Step 2 — Estructura: format selector (Grups / Lliga / Eliminatòria / Mixt), number of teams per group if applicable
Step 3 — Puntuació: points for win / draw / loss, tiebreaker criteria, overtime/penalties option if eliminatòria
Step 4 — Temps: match duration (minutes), break between matches, tournament start time per day
"Generar calendari" button at end → shows generated calendar preview before publishing

12. Admin — Calendar view

Full calendar grid showing all matches
Each match cell: teams, court, time, referee assigned
Filter by sport / court / date
"Publicar calendari" button — sends notifications to all teams


13. Referee match sheet (mobile, 390px width)

Header: match info — teams, sport icon, date/time, court
Live scoreboard: large score display, both team names
Sport-specific incident panel (tabs or auto-detected by sport):

Futsal: +1 goal button per team / yellow card / red card per player selector
Basketball 3x3: +1 / +2 points per team / personal foul counter per player
Padel: set score entry per set (e.g. 6-4 / 7-5)


Recent incidents log: scrollable list of last 5 incidents with minute, type, player
"Tancar acta" button (bottom, secondary) — shows confirmation modal before closing
After closing: "Acta tancada — PDF generat" confirmation screen


Additional notes

All UI text in Catalan
Desktop-first for landing, login, captain, player and admin areas
Mobile-first for referee match sheet
Consistent sidebar navigation across all logged-in areas (adapts items by role)
The inscription process is sequential and blocked: payment is only available after all documents are uploaded; admin validation happens after payment
Use consistent component reuse across all pages (same cards, badges, buttons, inputs)