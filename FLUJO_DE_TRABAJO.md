# Antigravity CoreAdapt — Flujo de Trabajo Completo

> **Stack:** React 19 + Vite · Firebase Auth/Firestore · Vercel Serverless · DeepSeek Chat (LLM) · Strava OAuth

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Autenticación y registro](#2-autenticación-y-registro)
3. [Onboarding multi-paso](#3-onboarding-multi-paso)
4. [OAuth Strava (Callback)](#4-oauth-strava-callback)
5. [Layout principal y navegación](#5-layout-principal-y-navegación)
6. [Tab 1 — HOY (Dashboard Diario)](#6-tab-1--hoy-dashboard-diario)
7. [Tab 2 — MI PLAN (Orquestador)](#7-tab-2--mi-plan-orquestador)
8. [Tab 3 — COMBUSTIBLE (Nutrición)](#8-tab-3--combustible-nutrición)
9. [Tab 4 — COCKPIT (Control)](#9-tab-4--cockpit-control)
10. [APIs Serverless](#10-apis-serverless)
11. [Servicios y Hooks](#11-servicios-y-hooks)
12. [Estructura Firestore](#12-estructura-firestore)
13. [Flujo end-to-end de un día completo](#13-flujo-end-to-end-de-un-día-completo)

---

## 1. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (React)                      │
│                                                             │
│   Login / Signup / Onboarding                               │
│   ├── App.jsx (router + estado global de sesión)            │
│   ├── views/   → 4 tabs principales                         │
│   ├── components/ → modales + tabbar                        │
│   ├── hooks/   → useCheckins, useMiPlan, useNutricion…      │
│   └── services/ → ConnectionService, TokenVault, Strava…   │
│                                                             │
└───────────────────┬────────────────────────────────────────-┘
                    │ HTTP/Firestore SDK
        ┌───────────┴───────────────────────────────┐
        │         BACKEND / INFRAESTRUCTURA          │
        │                                           │
        │  Vercel Serverless Functions               │
        │  ├── /api/brain          (Orquestador IA)  │
        │  ├── /api/analyze-food   (Vision AI)       │
        │  ├── /api/motivate       (Coach Alpha)     │
        │  ├── /api/strava-token   (OAuth exchange)  │
        │  ├── /api/strava-refresh (Token refresh)   │
        │  ├── /api/strava-webhook (Actividades auto)│
        │  └── /api/sync-knowledge (RAG seed)        │
        │                                           │
        │  Firebase                                  │
        │  ├── Authentication (email/password)       │
        │  └── Firestore (datos + tokens seguros)    │
        │                                           │
        │  DeepSeek Chat (LLM)                       │
        └───────────────────────────────────────────┘
```

**Idiomas soportados:** ES · EN · PT · FR · IT (react-i18next)

---

## 2. Autenticación y registro

### Rutas públicas

| Ruta | Vista | Propósito |
|---|---|---|
| `/` | MarketingPage | Landing |
| `/login` | Login.jsx | Ingreso |
| `/register` | Signup.jsx | Registro |
| `/verify-email` | VerifyEmail | Verificación |

### Registro (`Signup.jsx`)

```
Usuario completa: nombre, email, contraseña, país

1. createUserWithEmailAndPassword() → Firebase Auth
2. sendEmailVerification()
3. updateProfile({ displayName })
4. Crea doc en users/{uid}:
   {
     uid, name, email, phone,
     subscriptionStatus: 'trial',
     onboardingComplete: false,
     trialStartedAt / trialEndsAt,
     createdAt: serverTimestamp()
   }
5. Sync con Google Sheets (webhook)
6. Redirige → /verify-email
```

### Login (`Login.jsx`)

```
1. signInWithEmailAndPassword()
2. Lee users/{uid} en Firestore
3. Decisión de redirección:
   ├── Email sin verificar         → /verify-email
   ├── onboardingComplete = false  → /onboarding
   └── Perfil completo             → /app (MainLayout)
```

---

## 3. Onboarding multi-paso

**Vista:** `Onboarding.jsx` · **Ruta:** `/onboarding`
**Persistencia:** localStorage `coreAdapt_onboarding_in_progress`

| Paso | Sección | Datos capturados |
|---|---|---|
| 0 | Físico | age, gender, height, weight |
| 1 | Experiencia | experience (beginner/intermediate/advanced) |
| 2 | Objetivo | milestone (texto), milestoneDate |
| 3 | Recursos | resources[] (bike_road, bike_mtb, gym, pool) |
| 4 | Disciplinas | disciplines[] (Running, Trail, Ruta, MTB, Pesas, Natacion) |
| 5 | Sincronización | preferredSync (strava/garmin/coros/apple_health/none) |
| 6 | Resumen | Avatar calculado (university/executive) |

### Paso 5 — Strava OAuth

```
Usuario selecciona Strava
  → connectionService.getStravaAuthUrl()
  → Redirige a strava.com/oauth/authorize
  → Retorna a /callback?code=XXX&state=strava
  → Callback.jsx procesa el código
```

### Finalización (Paso 6)

```
1. Calcula avatar:
   └── edad < 24  → 'university' (🎓)
   └── edad >= 24 → 'executive'  (💼)

2. updateDoc users/{uid} → onboardingComplete: true
3. Sync con Google Sheets (acción: 'onboardComplete')
4. Guarda en localStorage: coreAdaptProfile
5. Llama onComplete(profileData) → App.jsx actualiza estado global
6. Redirige → /app
```

---

## 4. OAuth Strava (Callback)

**Vista:** `Callback.jsx` · **Ruta:** `/callback`

```
URL recibida: /callback?code=AUTH_CODE&state=strava

1. Extrae code y state de query params
2. Obtiene Firebase ID token del usuario actual
3. POST /api/strava-token { code, idToken }
   └── Serverless verifica identidad (Firebase Admin)
   └── Intercambia code por access/refresh tokens (Strava API)
   └── Guarda tokens en users/{uid}/integrations/strava (Firestore)
   └── Retorna { connected: true, athlete: {...} } — SIN tokens
4. ConnectionService actualiza estado UI
5. Redirige → /app

Estados de UI: processing (spinner) → success (✓) | error (!)
```

---

## 5. Layout principal y navegación

**Ruta:** `/app/*` · **Componente:** MainLayout

```
┌───────────────────────────────────┐
│          Contenido de la tab       │
│                                   │
│                                   │
│                                   │
├───────────────────────────────────┤
│  HOY  │ MI PLAN │ [📷] │ COMB │ ⚙ │
└───────────────────────────────────┘
         BottomTabBar.jsx
```

| Tab | Índice | Vista |
|---|---|---|
| HOY | 0 | DashboardHoy.jsx |
| MI PLAN | 1 | MiPlan.jsx |
| COMBUSTIBLE | 2 | Combustible.jsx |
| COCKPIT | 3 | Cockpit.jsx |

> El ícono de cámara central es un FAB que abre directamente el registro visual de comida.

---

## 6. Tab 1 — HOY (Dashboard Diario)

**Vista:** `DashboardHoy.jsx`

### Datos consumidos

| Hook | Provee |
|---|---|
| `useMiPlan()` | `brainPlan`, `diaActual` (índice 0-6 del microciclo) |
| `useCheckins()` | `todayCheckin`, `avgHRV7d`, `avgBattery7d` |
| `useMotivation()` | Mensaje + tono del Coach Alpha |

### Flujo de renderizado

```
Carga la vista
├── ¿Check-in hoy?
│   ├── NO → Card CTA "Registrar HRV y Energía" → DailyCheckinModal
│   └── SÍ → Muestra Energía Vital:
│           Body Battery {valor}% · HRV {valor}ms
│           Estado: "Ready for Output" / "Zona de carga" / "Recuperación"
│
├── Core Strategy (sesión del día del microciclo)
│   ├── Existe → Disciplina · Descripción · Duración · Objetivo técnico
│   │            Botón "Registrar Sesión" → LogEntrenamientoModal
│   └── No existe → "Genera tu microciclo en MI PLAN"
│
└── Coach Alpha
    Mensaje motivacional (useMotivation → POST /api/motivate)
    Botón "Hablar" → CoachChatModal
```

### Modales que abre esta vista

**DailyCheckinModal**
```
Campos: sesión completada (toggle), RPE (1-10), HRV (ms),
        Body Battery (%), notas
Guarda: Checkins/{uid}_{fecha}
Efecto: useMotivation refetch
```

**LogEntrenamientoModal**
```
Campos: disciplina, duración, distancia, elevación, RPE, notas
Guarda: Actividades/{docId}
```

**CoachChatModal**
```
Chat interactivo · Historial de 5 mensajes
Consume: POST /api/motivate en cada turno
```

---

## 7. Tab 2 — MI PLAN (Orquestador)

**Vista:** `MiPlan.jsx`

### Flujo de consulta al Orquestador

```
Botón "Consultar Orquestador"
│
├── Prepara payload:
│   {
│     userProfile:  { firstName, disciplines, milestone, milestoneDate,
│                     experience, resources, age, weight },
│     biometria:    { hrv_manual, body_battery, avg_hrv_7d },
│     actividad_hoy:{ rpe_usuario, sesion_completada, notas }
│   }
│
├── POST /api/brain  ←── (Ver sección 10.1 para flujo interno)
│
├── Muestra loader animado (6 pasos):
│   "Iniciando conexión..." → "Analizando fatiga..." →
│   "El Jefe recalculando..." → "Delegando especialistas..." →
│   "Adaptando microciclo..." → "Ensamblando protocolo..."
│
├── Respuesta: { fase_macro, especialistas_activos, insight_del_jefe,
│               microciclo[7], alerta_sobreentreno }
│
└── Guarda en Firestore: MiPlan_Ajustes/{docId}
    { userId, email, timestamp_generacion, plan_generado }
```

### Visualización del microciclo

```
Card "Strategic Direction"
  └── Fase macro + veredicto del Jefe

7 cards de días (D1–D7):
  └── Ícono de disciplina
  └── Descripción de la sesión
  └── Duración estimada · Objetivo técnico
  └── nutricion.timing_clave  (ajuste nutricional del día)
```

### Historial "Esta semana"

```
Consume: useActividades() (últimas 7 actividades)
Muestra: tipo · fecha · duración · RPE · ✓/✗ completada
```

---

## 8. Tab 3 — COMBUSTIBLE (Nutrición)

**Vista:** `Combustible.jsx`

### Secciones de la vista

```
┌─── Calorías del día ──────────────────────────┐
│  {consumidas} / {objetivo} kcal  {%} de progreso │
└───────────────────────────────────────────────┘

┌─── Macros (anillos SVG) ──────────────────────┐
│  Proteína %  │  Carbos %  │  Grasas %          │
└───────────────────────────────────────────────┘

┌─── Hidratación ───────────────────────────────┐
│  {vasos} vasos · {ml} ml   [+ 250ml]          │
│  Alerta si < 50% del objetivo                 │
└───────────────────────────────────────────────┘

Tabs:  📋 Registro de Hoy  |  ⚡ Menús 15min
```

### Flujo de análisis visual de alimento

```
Usuario toca FAB cámara
│
├── Selecciona imagen (cámara o galería)
├── Preview del alimento
│
├── POST /api/analyze-food { imageBase64 }
│   ├── OK → { nombre, emoji, kcal, proteina_g, carbos_g,
│   │          grasas_g, tag, confianza }
│   └── 422 (visión no soportada) → Solicita descripción textual
│       └── POST /api/analyze-food { descripcion }
│
├── Muestra resultado con macros
└── Confirmar → addFoodEntry() → Firestore RegistrosComida/{docId}
```

### Cálculo de objetivos nutricionales (useNutricion)

```
peso = profile.weight || 70 kg
factor por intensidad:
  baja     → 1.30
  moderada → 1.55
  alta     → 1.75

kcal_objetivo  = peso × 22 × factor
proteina_g     = peso × 2.0
carbos_g       = (kcal × 50%) / 4
grasas_g       = (kcal × 25%) / 9

Fuente adicional: nutricion.objetivo_kcal_total del microciclo
(calculado por el Agente Nutricional en /api/brain)
```

---

## 9. Tab 4 — COCKPIT (Control)

**Vista:** `Cockpit.jsx`

### Secciones

| Sección | Contenido |
|---|---|
| Athlete Profile | Avatar, nombre, milestone, tags de disciplinas |
| Biometrics | HRV hoy/promedio 7d, Body Battery hoy/promedio 7d, RPE |
| API Connection Center | Cards de Garmin, Strava, Apple Health, COROS, Alpha |
| Equipment Arsenal | Bicicletas, gym, piscina configurados |
| Language Switcher | ES 🇪🇸 / EN 🇬🇧 / PT 🇧🇷 / FR 🇫🇷 / IT 🇮🇹 |
| Settings | Privacy, Automation, Notifications (toggles) |
| Developer Tools | Simular sync · Cargar protocolos RAG |
| Controls | Reiniciar onboarding · Logout · Limpiar caché |

### Flujo de conexión/desconexión de servicio

```
Botón "CONECTAR" en card de servicio
│
├── Strava:
│   └── getStravaAuthUrl() → Redirige a OAuth
│
├── Garmin / COROS / Apple Health:
│   └── connectionService.connect(serviceId) → Simulado
│
└── Desconectar:
    └── connectionService.disconnect(serviceId)
    └── Actualiza estado UI (localStorage coreadapt_connections)
    └── Tokens reales eliminados en Firestore por Admin SDK
```

---

## 10. APIs Serverless

### 10.1 `/api/brain` — Orquestador Inteligente (v5.0)

**Método:** POST

```
Payload: { userProfile, biometria, actividad_hoy }

PASO 1 — ORQUESTADOR (Jefe de Entrenamiento)
  Evalúa HRV, Body Battery, días hasta objetivo
  Decide: "entrenar" o "descansar"
  Asigna días por disciplina (distribucion_dias)
  Reglas no negociables:
    HRV < 85% del promedio 7d → solo Z1-Z2 o descanso
    Body Battery < 35%        → descanso total o ≤30min
    diasRestantes < 14        → tapering (-30% volumen)

PASO 2 — RAG POR DISCIPLINA (paralelo)
  Para cada especialista requerido:
  → Busca en Conocimiento_Tecnico (Firestore)
  → Extrae protocolos relevantes para ese deporte

PASO 3 — ESPECIALISTAS EN PARALELO
  Agentes disponibles (prompts independientes):
  ├── Running  → zonas FC, tiradas, intervalos
  ├── Trail    → D+, tapering, terreno
  ├── Ruta     → FTP sostenido, cadencia 85-100rpm, Sweet Spot/Umbral
  ├── MTB      → potencia explosiva 120-150%FTP, técnica de terreno
  ├── Pesas    → fuerza complementaria, series×reps×RPE
  └── Natacion → formato FINA, recovery activa

PASO 4 — ENSAMBLE
  Combina sesiones de todos los especialistas
  Rellena días sin asignar con Descanso activo
  Garantiza exactamente 7 días ordenados

PASO 5 — AGENTE NUTRICIONAL
  Calcula gasto calórico por sesión:
    Running/Trail → ~900-950 kcal/h
    Ruta          → ~700 kcal/h
    MTB           → ~800 kcal/h
    Pesas         → ~350 kcal/h
    Natacion      → ~600 kcal/h
  LLM genera objetivos nutricionales día a día:
    { gasto_ejercicio_kcal, objetivo_kcal_total,
      proteina_g, carbos_g, grasas_g, timing_clave }
  Embebe nutricion en cada sesión del microciclo

Respuesta final:
{
  fase_macro, insight_del_jefe, alerta_sobreentreno,
  especialistas_activos,
  microciclo: [
    {
      dia, disciplina, descripcion,
      objetivo_tecnico, duracion_estimada,
      nutricion: { gasto_ejercicio_kcal, objetivo_kcal_total,
                   proteina_g, carbos_g, grasas_g, timing_clave }
    },
    ...  // 7 días
  ]
}
```

### 10.2 `/api/analyze-food` — Vision AI

```
POST { imageBase64 }  →  DeepSeek analiza imagen
POST { descripcion }  →  DeepSeek analiza texto (fallback)

Respuesta:
{ nombre, emoji, kcal, proteina_g, carbos_g, grasas_g, tag, confianza }

Si falla visión → 422 { error: 'vision_not_supported' }
```

### 10.3 `/api/motivate` — Coach Alpha

```
POST { userProfile, checkinHoy, sesionHoy, historialSemana, streakDias }

Lógica de tono:
  HRV normal + Battery > 70%  → energizante  (verde)
  HRV baja + Battery < 40%   → calmo         (azul)
  HRV baja OR Battery 40-70% → moderado      (naranja)
  Racha >= 7 días             → celebrativo  (oro)
  Adherencia < 50%            → reconectado  (azul)
  Días a meta <= 7            → épico         (verde)
  Días a meta 8-14            → tapering      (naranja)

Respuesta: { mensaje, tono, accion_sugerida }
```

### 10.4 `/api/strava-token` — OAuth Exchange

```
POST { code, idToken }

1. Firebase Admin verifica idToken → obtiene uid
2. POST strava.com/oauth/token con code
3. Guarda accessToken, refreshToken, expiresAt
   en users/{uid}/integrations/strava (Admin SDK)
4. Retorna { connected: true, athlete: {...} }
   — NUNCA retorna tokens al cliente
```

### 10.5 `/api/strava-refresh` — Token Refresh

```
POST { idToken }

1. Verifica identidad
2. Lee refreshToken de Firestore (Admin SDK)
3. Solicita nuevo accessToken a Strava
4. Actualiza Firestore
5. Retorna { accessToken, expiresAt }
```

### 10.6 `/api/strava-webhook` — Importación automática

```
GET  → Handshake de verificación (hub.challenge)

POST { object_type, aspect_type, object_id, owner_id }
  1. Localiza usuario por athlete_id
  2. Refresca token si es necesario
  3. Obtiene detalles de la actividad (Strava API)
  4. Guarda en Actividades (Firestore)

Mapeo de tipos Strava → CoreAdapt:
  Run / TrailRun            → Running / Trail
  Ride / VirtualRide        → Ruta o MTB
  Swim                      → Natacion
  WeightTraining / Workout  → Pesas
```

### 10.7 `/api/sync-knowledge` — Seed RAG

```
POST (requiere header X-Sync-Secret)
{ protocols: [ { deporte_origen, categoria, contenido_tecnico, ... } ] }

1. Purga colección Conocimiento_Tecnico
2. Inyecta nuevos protocolos en batch
```

---

## 11. Servicios y Hooks

### Servicios (`src/services/`)

| Servicio | Responsabilidad |
|---|---|
| `ConnectionService.js` | Estado UI de integraciones (localStorage, NUNCA tokens) |
| `TokenVault.js` | Acceso seguro a tokens Strava · Refresh automático 1h antes de expiración |
| `StravaService.js` | Operaciones en Strava API · normalizeActivity() · getWeeklySummary() |
| `ProtocolSeeder.js` | Inyecta 11 protocolos maestros en Conocimiento_Tecnico (RAG base) |

### Hooks (`src/hooks/`)

| Hook | Query Firestore | Retorna |
|---|---|---|
| `useCheckins()` | `Checkins` where userId, orderBy fecha DESC, limit 7 · `onSnapshot` | todayCheckin, avgHRV7d, avgBattery7d |
| `useMiPlan()` | `MiPlan_Ajustes` where userId, más reciente | brainPlan, diaActual (calculado desde timestamp) |
| `useNutricion()` | `RegistrosComida` where userId + fecha=HOY · `onSnapshot` | foodLog, macrosConsumed, macrosTarget, addFoodEntry |
| `useActividades()` | `Actividades` where userId + fecha>=hoy-7d, limit N | actividades[] |
| `useMotivation()` | — (POST /api/motivate, cachea por fecha+hrv+battery) | motivation { mensaje, tono, accion_sugerida } |

---

## 12. Estructura Firestore

```
firestore/
├── users/{uid}
│   ├── Datos de perfil, onboardingComplete, subscriptionStatus
│   └── integrations/ (subcollección — solo Admin SDK)
│       └── strava/ → accessToken, refreshToken, expiresAt, athleteId
│
├── Checkins/{uid}_{fecha}
│   └── body_battery, hrv_manual, rpe_sesion, sesion_completada, notas
│
├── Actividades/{docId}
│   └── userId, tipo, fuente, duracion_min, distancia_km, elevacion_m,
│       fc_media, rpe, completada, strava_id
│
├── RegistrosComida/{docId}
│   └── userId, fecha, nombre, kcal, proteina_g, carbos_g, grasas_g,
│       tag, fuente (manual | vision_ai)
│
├── MiPlan_Ajustes/{docId}
│   └── userId, email, timestamp_generacion, plan_generado (full object)
│
├── Logs_CoreAdapt/{docId}
│   └── insight, sugerencia, alerta, nutricion, timestamp
│
└── Conocimiento_Tecnico/{docId}
    └── deporte_origen, categoria, contenido_tecnico, etiquetas[], fuente
        (Base de conocimiento RAG — 11 protocolos maestros + expansible)
```

---

## 13. Flujo end-to-end de un día completo

```
06:00  AMANECER
       └── App.jsx verifica onAuthStateChanged
           └── Lee users/{uid} → carga perfil en estado global

06:15  TAB HOY — Check-in matutino
       └── DailyCheckinModal
           ├── HRV: 62ms, Body Battery: 72%
           └── Guarda Checkins/{uid}_2026-04-30

06:16  Coach Alpha (automático)
       └── POST /api/motivate
           ├── HRV normal + Battery > 70% → tono "energizante"
           └── Mensaje: "Sistema en verde. Hoy puedes empujar."

07:00  TAB MI PLAN — Generar microciclo
       └── POST /api/brain
           ├── Orquestador: "entrenar" (HRV OK, Battery 72%)
           ├── Especialistas: Running (D1,D4) + Ruta (D2) + MTB (D5) + Pesas (D3,D6)
           ├── Agente Nutricional: gasto por sesión → macros diarios
           └── Guarda plan en MiPlan_Ajustes

07:01  TAB HOY — Sesión del día visible
       └── D1: Running — Tirada larga 90min Z2, cadencia 170spm
           └── nutricion.timing_clave: "Oats pre-sesión, batido proteico post"

10:00  Entrenamiento completado
       └── LogEntrenamientoModal
           ├── Running, 90min, 14km, RPE 6
           └── Guarda Actividades/{docId}

10:01  Strava webhook (automático)
       └── POST /api/strava-webhook
           ├── Detecta nueva actividad "Run" de Strava
           └── Duplica en Actividades (vinculada por strava_id)

13:30  TAB COMBUSTIBLE — Almuerzo
       └── FAB cámara → Foto de plato
           ├── POST /api/analyze-food { imageBase64 }
           ├── Respuesta: Arroz con pollo, 680 kcal
           └── Registra en RegistrosComida

19:00  TAB HOY — Revisión nocturna
       └── Macros del día: 1.820 / 2.400 kcal (76%)
       └── Coach Alpha: "Bien ejecutado. Mañana Ruta, carga carbos esta noche."

       CICLO COMPLETO → Repite desde 06:00 con D2 del microciclo
```

---

## Notas de seguridad

- **Tokens Strava:** nunca en localStorage ni en respuestas de API. Solo Firestore vía Admin SDK.
- **Firebase ID token:** verificado en cada serverless function antes de operar datos del usuario.
- **`/api/sync-knowledge`:** protegido por header `X-Sync-Secret` (variable de entorno).
- **Variables de entorno:** `VITE_` prefix para variables públicas del cliente; el resto solo en Vercel.
