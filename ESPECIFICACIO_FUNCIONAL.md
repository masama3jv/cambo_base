# ESPECIFICACIÓ FUNCIONAL DEL SISTEMA

## 4.1. Especificació Funcional del Sistema

### 4.1.1. Especificació del sistema proposat

#### 4.1.1.1. Descripció dels actors

El sistema CampoBase està dissenyat per a quatre tipus d'actors principals, cadascun amb responsabilitats i permisos específics:

| Actor | Descripció | Responsabilitats Principals |
|-------|-----------|---------------------------|
| **Capità d'equip** | Responsable de crear i gestionar l'equip | Registre, creació d'equip, invitació de jugadors per email, pujada de documentació obligatòria (DNI i assegurança mèdica per jugador), pagament simulat, accés a dashboard personal, consulta de calendari de partits, estadístiques d'equip, notificacions de canvis |
| **Jugador** | Membre de l'equip convidant del Capità | Recepció d'invitació per email, registre per unir-se a l'equip, visualització de calendari de partits, consulta de reportatges de partits, estadístiques personals. No pot gestionar inscripció ni finances d'equip |
| **Administrador / Organitzador** | Gestor central de la plataforma | Accés complet al panell d'administració, revisió i aprovació/rebuig de documentació, gestió de disponibilitat de pistes, configuració de fases del torneig (grups, eliminatòries, lligues), definició de règles de puntuació per esport, auto-generació de calendaris |
| **Àrbitre** | Responsable de les actes dels partits | Accés principalment des de dispositius mòbils durant els partits, ompliment de l'acta digital en temps real, registro d'incidents segons l'esport, tancament de l'acta i generació automàtica de PDF |

---

#### 4.1.1.2. Model de casos d'ús — Descripció i fluxos d'esdeveniments

Aquesta secció presenta els sis casos d'ús més rellevants del sistema, amb una descripció estructurada dels fluxos principal i alternatius.

##### **CU-01 — Registrar-se a la plataforma**

| Camp | Descripció |
|------|-----------|
| **Actor principal** | Capità / Jugador |
| **Precondicions** | L'usuari no té compte creat a la plataforma |
| **Flux principal** | (1) L'usuari accedeix al formulari de registre. (2) Omple nom, email i contrasenya. (3) El sistema valida el format de l'email i la força de la contrasenya. (4) El sistema envia un email de verificació. (5) L'usuari confirma el compte. (6) El sistema crea el perfil i redirigeix al dashboard. |
| **Flux alternatiu A** | Si l'email ja existeix, es mostra un missatge d'error amb opcions per accedir amb el compte existent o recuperar la contrasenya. |
| **Flux alternatiu B** | Si l'usuari no confirma l'email en 24 hores, el compte es desactiva automàticament. |

##### **CU-02 — Crear i gestionar equip**

| Camp | Descripció |
|------|-----------|
| **Actor principal** | Capità |
| **Precondicions** | El capità té un compte verificat |
| **Flux principal** | (1) El capità accedeix a l'opció "Crear equip". (2) Selecciona l'esport (Futbol Sala, Bàsquet 3x3 o Pàdel). (3) Introdueix el nom de l'equip i dades associades. (4) El sistema valida que el nom de l'equip sigui únic al torneig. (5) El sistema crea l'equip i l'assigna al capità. (6) El capità accedeix a la gestió de plantilla. |
| **Flux alternatiu A** | Si el nom ja existeix, el sistema sol·licita un nom diferent. |

##### **CU-03 — Inscripció d'equip amb pagament**

| Camp | Descripció |
|------|-----------|
| **Actor principal** | Capità |
| **Precondicions** | L'equip té el mínim de jugadors requerits i la documentació obligatòria pujada |
| **Flux principal** | (1) El capità inicia el procés d'inscripció. (2) El sistema verifica que tota la documentació obligatòria estigui pujada. (3) Es mostra un resum amb l'import total. (4) El capità confirma i realitza el pagament simulat. (5) El sistema marca la inscripció com a "Pendent de validació". (6) Es notifica per email al capità i l'administrador. |
| **Flux alternatiu A** | Si falta documentació, el sistema indica quins jugadors tenen documents pendents. El procés no pot continuar fins que estigui completa. |
| **Flux alternatiu B** | Si el pagament falla, l'estat reverta a "Pendent de pagament" i es notifica al capità. |

##### **CU-04 — Validació documental (Administrador)**

| Camp | Descripció |
|------|-----------|
| **Actor principal** | Administrador |
| **Precondicions** | L'equip ha completat la inscripció i el pagament |
| **Flux principal** | (1) L'administrador accedeix al validador d'inscripcions. (2) Selecciona un equip pendent de validació. (3) Revisa cada document (DNI i assegurança mèdica per jugador). (4) Aprova o rebutja cada document individualment. (5) Si tots els documents són aprovats, l'estat de l'equip passa a "Inscrit". (6) Es notifica per email al capità. |
| **Flux alternatiu A** | Si un document es rebutja, s'indica el motiu. El capità rep la notificació i ha de tornar a pujar el document corregit. |

##### **CU-05 — Generació de calendari**

| Camp | Descripció |
|------|-----------|
| **Actor principal** | Administrador |
| **Precondicions** | El termini d'inscripcions ha tancat i tots els equips estan validats |
| **Flux principal** | (1) L'administrador accedeix al configurador de torneig. (2) Completa un formulari pas a pas (vegeu detall més avall). (3) El sistema valida que no hi hagi inconsistències. (4) El sistema auto-genera els partits, assignant pistes i horaris sense solapaments. (5) L'administrador revisa i pot fer ajustaments manuals. (6) L'administrador publica el calendari. (7) El sistema notifica tots els equips. |
| **Flux alternatiu A** | Si les pistes i slots disponibles són insuficients, el sistema adverteix i suggereix redistribuir horaris. |
| **Flux alternatiu B** | Si un canvi manual crea un solapament, el sistema alerta i bloca el canvi. |

**Detall del formulari de configuració del torneig:**

| Bloc | Camps | Descripció |
|------|-------|-----------|
| **Instal·lacions** | Nombre de pistes disponibles, nom i ubicació de cada pista, dies i franges horàries disponibles per pista | Defineix la infraestructura i la capacitat de joc |
| **Estructura competitiva** | Format (grups, lliga, eliminatòria directa, fase de grups + eliminatòries), nombre d'equips per grup (si aplica), criteris de classificació | Determina com es desenvoluparà el torneig |
| **Regles de puntuació** | Punts per victòria/empat/derrota, criteris de desempat (diferència de gols, confrontació directa, etc.) | Estableix el sistema de puntuació |
| **Temps de joc** | Durada dels partits, descans entre partits, hora d'inici del torneig o ronda | Configura els aspectes temporals |

*Nota: El formulari funciona com un assistent interactiu. Cada bloc de respostes condiciona les opcions del bloc següent. Per exemple, si es selecciona "eliminatòria directa", el camp "punts per empat" es desactiva i apareixen opcions de pròrroga/penals.*

##### **CU-06 — Gestió d'acta arbitral en temps real**

| Camp | Descripció |
|------|-----------|
| **Actor principal** | Àrbitre |
| **Precondicions** | El partit consta al calendari i l'àrbitre té accés assignat |
| **Flux principal** | (1) L'àrbitre accedeix al partit des de dispositiu mòbil. (2) El sistema detecta l'esport i mostra el formulari d'acta corresponent. (3) Durant el partit, l'àrbitre registra els incidents segons l'esport. (4) El sistema actualitza el marcador en temps real, visible als equips. (5) Al final del partit, l'àrbitre pot afegir un informe escrit opcional. (6) L'àrbitre tanca l'acta. (7) El sistema auto-genera el PDF i l'envia als equips. |
| **Flux alternatiu A** | Si l'àrbitre perd connexió, l'acta es guarda localment (mode offline) i se sincronitza quan es restaura la connexió. |
| **Flux alternatiu B** | Si cal corregir una entrada, l'àrbitre pot modificar els registres abans del tancament final. Un cop tancada, l'acta és immutable. |

**Camps específics per esport:**

| Esport | Camps de l'acta |
|--------|-----------------|
| **Futbol Sala** | Resultat final · Targetes (grogues/vermelles per jugador) · Informe (opcional) |
| **Bàsquet 3x3** | Resultat final · Faltes personals per jugador · Informe (opcional) |
| **Pàdel** | Resultat final (sets) · Informe (opcional) |

---

### 4.1.2. Disseny del sistema

#### 4.1.2.1. Diagrames de seqüència dels casos d'ús més rellevants

Els diagrames de seqüència que es presenten a continuació representen les quatre casos d'ús més rellevants del sistema: **CU-03**, **CU-04**, **CU-05** i **CU-06**. Cada diagrama mostra la interacció entre els actors, la interfície frontend, l'API backend i la base de dades, utilitzant la notació de diagrames de seqüència UML.

Els diagrames proporcionen una visió temporal i sequencial de les operacions del sistema, permetent entendre el flux de dades i les responsabilitats de cada component.

**Nota:** El codi font en PlantUML de cadascun dels diagrames de seqüència es inclou a l'annex d'aquest document.

---

#### 4.1.2.2. Diagrama de classes de disseny

El sistema CampoBase està estructurat al voltant de 11 classes principals organitzades en tres nivells:

**Nivell 1 — Rols d'usuari:**
- `Usuari` (classe abstracta pare)
  - `Capità` (capità d'equip)
  - `Jugador` (jugador de l'equip)
  - `Administrador` (gestor del sistema)
- `Àrbitre` (classe independent, no hereta de `Usuari`)

**Nivell 2 — Entitats de gestió:**
- `Equip` (grup de jugadors d'un esport)
- `Document` (documentació obligatòria: DNI, assegurança)
- `Inscripció` (estat i gestió de la inscripció de l'equip)

**Nivell 3 — Entitats de torneig:**
- `Torneig` (contenidor principal del campionat)
- `Pista` (instal·lació esportiva)
- `Partit` (enfrontament entre dos equips)
- `Acta` (registre digital del partit amb incidents i resultat)

**Relacions clau:**
- `Usuari` és la classe pare de `Capità`, `Jugador` i `Administrador`.
- Un `Capità` gestiona exactament un `Equip`.
- Els `Jugadors` pertanyen a exactament un `Equip`.
- Cada `Jugador` té associats múltiples `Documents` (DNI, assegurança).
- Cada `Equip` té una `Inscripció`.
- Un `Torneig` conté múltiples `Partits` i utilitza múltiples `Pistes`.
- Cada `Partit` té exactament una `Acta`.
- Un `Àrbitre` arbitratge múltiples `Partits`.

El diagrama de classes complet en format PlantUML es presenta a l'annex.

---

#### 4.1.2.3. Diagrames d'estat de les classes i/o casos d'ús que calguin

Es defineixen tres diagrames d'estat que representen els cicles de vida de les entitats més crítiques del sistema:

**1. Estat de la inscripció d'equip (5 estats):**

```
Pendent documentació
    ↓
Pendent pagament
    ↓
Pendent validació
    ↙            ↘
[Si rebuig]    [Si aprovació]
Doc rebutjada  ↓
    ↓         Inscrit
    ↑          ↓
    └──────→ Actiu (terminal)
```

Descripció dels estats:
- **Pendent documentació:** L'equip no ha pujat la documentació obligatòria.
- **Pendent pagament:** La documentació està completa però el pagament no s'ha realitzat.
- **Pendent validació:** El pagament s'ha processat i l'administrador revisa la documentació.
- **Doc rebutjada:** Un o més documents han estat rebutjats; cal reenviament.
- **Inscrit:** Tota la documentació és vàlida i el torneig no ha començat.
- **Actiu:** L'equip participa activament al torneig.

**2. Estat del document (4 estats amb llaç de resubmissió):**

```
Pendent pujada
    ↓
En revisió
    ↙         ↘
[Rebuig]   [Aprovació]
    ↓           ↓
Rebutjat    Aprovat (terminal)
    ↓
    └────→ En revisió (resubmissió)
```

Descripció dels estats:
- **Pendent pujada:** El jugador ha d'enviar el document.
- **En revisió:** L'administrador revisa el document.
- **Aprovat:** El document és vàlid (estat terminal).
- **Rebutjat:** El document no compleix els requisits; es permet reenviament.

**3. Estat de l'acta arbitral (5 estats):**

```
No iniciada
    ↓
En curs ←──────┐
    ↓          │
 (corrections) │
    ↓          │
Tancada        │
    ↓          │
PDF disponible │
    ↓          │
Immutable ← cap a modificació (terminal)
```

Descripció dels estats:
- **No iniciada:** L'acta encara no s'ha obert.
- **En curs:** L'àrbitre està omplint l'acta en temps real; es permeten correccions.
- **Tancada:** L'àrbitre ha tancat l'acta; ja no es permeten correccions.
- **PDF disponible:** S'ha generat el PDF de l'acta.
- **Immutable:** L'acta és permanent; no es pot editar (estat terminal).

Els diagrames d'estat complets en format PlantUML es presenten a l'annex.

---

### 4.1.3. Interfícies d'usuari: Mapa de formularis

El mapa de navegació que es presenta a continuació mostra la totalitat de pantalles del sistema i les seves connexions de navegació, organitzades per àrea funcional. Cada àrea representa un conjunt de funcionalitats coherent destinades a un tipus d'actor específic.

#### **Àrea pública (sense autenticació)**

```
Inici / Landing Page
    ↓
    ├─→ Login (si ja tenim compte)
    │    ↓
    │    └─→ [Segons rol]
    │
    └─→ Registre nou usuari
         ↓
         Verificació email (24h)
         ↓
         Redirecciona a Dashboard capità (per Capità)
         o a Llista partits assignats (per Àrbitre)
```

#### **Àrea de clients — Capità**

```
Dashboard capità
    ├─→ Crear equip / Gestió plantilla
    │    ├─→ Convidar jugadors per email
    │    ├─→ Pujar documents (DNI, assegurança)
    │    └─→ Gestió de jugadors
    │
    ├─→ Inscripció equip
    │    ├─→ Resum de dades
    │    └─→ Pagament inscripció
    │
    ├─→ Calendari de partits
    │    └─→ Detall de partit
    │
    ├─→ Estadístiques d'equip
    │    └─→ Rendiment per jugador
    │
    └─→ Notificacions
```

#### **Àrea de administració**

```
Dashboard administrador
    ├─→ Validador d'inscripcions
    │    ├─→ Revisió de documents per equip
    │    └─→ Aprovació/Rebuig individual
    │
    ├─→ Gestor de sedes i horaris
    │    ├─→ Definició de pistes
    │    └─→ Assignació de slots de temps
    │
    ├─→ Configurador de torneig (assistent pas a pas)
    │    ├─→ Bloc: Instal·lacions
    │    ├─→ Bloc: Estructura competitiva
    │    ├─→ Bloc: Regles de puntuació
    │    └─→ Bloc: Temps de joc
    │
    └─→ Calendari generat
         ├─→ Visualització de partits
         ├─→ Ajustaments manuals
         └─→ Publicació
```

#### **Àrea de jugador**

```
Dashboard jugador
    ├─→ Calendari de partits assignats
    │    └─→ Detall de partit
    │
    ├─→ Estadístiques personals
    │
    ├─→ Reportatges de partits
    │    └─→ Detall de l'acta
    │
    └─→ Notificacions
```

#### **Àrea de l'àrbitre — Aplicació mòbil**

```
Llista de partits assignats
    ↓
Seleccionar partit
    ↓
Acta digital en temps real
    ├─→ Registre d'incidents (segons esport)
    │    ├─→ Futbol Sala: resultat + targetes
    │    ├─→ Bàsquet 3x3: resultat + faltes
    │    └─→ Pàdel: resultat (sets)
    │
    ├─→ Informe escrit (opcional)
    │
    ├─→ Tancament i validació
    │
    └─→ Generació de PDF
```

#### **Connexions transversals**

- **Login:** Redirigeix a Dashboard capità (Capità), Dashboard administrador (Administrador), Llista partits assignats (Àrbitre) o Dashboard jugador (Jugador).
- **Notificacions:** Accessibles des de qualsevol dashboard del seu rol.
- **Logout:** Disponible a totes les àrees autenticades.

**Nota:** El diagrama de navegació complet en format PlantUML es presenta a l'annex d'aquest document.

---

## Annex: Codi PlantUML dels diagrames

*Els diagrames de seqüència, classe i estat es troben disponibles en fitxers separats de PlantUML per a fàcil reutilització i documentació tècnica.*

---

**Versió:** 1.0  
**Data:** Maig 2026  
**Estat:** Especificació completa  
