# Especificaciones Maestras de Proyecto: CoreAdapt
> **CONSTITUCIÓN DEL PROYECTO** — Toda línea de código debe alinearse con este documento.

**Ruta del Proyecto:** `C:\JOSE TOMAS JARAMILLO\Antigravity CoreAdapt`

---

## 1. Definición y Propósito

CoreAdapt es un ecosistema de alto rendimiento para atletas multidisciplinares:
- Running / Trail Running
- Ciclismo de Ruta / MTB
- Pesas
- Natación

**Objetivo:** Optimizar el rendimiento y mantener el ánimo del usuario mediante una **IA Central (Cerebro)** que orqueste datos biométricos, nutrición reactiva y conocimiento experto.

---

## 2. Perfiles de Usuario (Avatares)

| Avatar | Motivación Core |
|---|---|
| **Ejecutivo de Alto Desempeño** | Eficiencia, ahorro de tiempo, reducción de fatiga de decisión ("Hazlo por mí") |
| **Universitario / Joven Atleta** | Formación profesional, disciplina guiada, motivación visual |

---

## 3. Arquitectura del "Cerebro" (IA Orchestrator)

El núcleo de la app es un **LLM vía API** que actúa como director de orquesta:

- **Integración RAG (NotebookLM):** La IA consulta cuadernos específicos en Google NotebookLM (Nutrición, Ultra-Distancia, Ciclismo, etc.) para respuestas basadas en ciencia.
- **Sincronización de Datos:** Conexión obligatoria con **Garmin Connect** y **Strava** para absorber carga de entrenamiento, sueño y métricas de salud (HRV, Body Battery).
- **Internacionalización (i18n):** Soporte nativo para Español (default), Inglés, Portugués, Francés e Italiano desde `src/locales/`.

---

## 4. Mapa de Navegación (4 Secciones Core)

### 🟢 Dashboard "HOY" (Home)
- **Semáforo de Energía:** Indicador visual (Verde #00FF41, Ámbar #FFBF00, Rojo) basado en recuperación.
- **Botón de Cámara (Vision AI):** Acceso rápido para registrar comidas o leer etiquetas nutricionales.
- **Insights de la IA:** Mensaje diario adaptativo sobre el plan del día.

### 📅 Sección "MI PLAN" (Estrategia)
- Calendario de periodización dinámica (Running vs. Entrenamiento Cruzado).
- Seguimiento de hitos (Ej: Meta de 100km de Trail).

### 🍎 Sección "COMBUSTIBLE" (Nutrición)
- Cálculo automático de macros post-entreno.
- Reconocimiento de fotos de platos (Computer Vision) para estimar nutrientes.
- Acceso a menús rápidos (recetas de 15 min).

### ⚙️ Sección "GARAGE" (Configuración)
- Gestión de recursos disponibles (Bicicleta, Gimnasio, Piscina).
- Selector de idioma y conexiones API.

---

## 5. Reglas de Oro (Lógica de Negocio)

| # | Regla | Descripción |
|---|---|---|
| R1 | **Adaptabilidad Primaria** | Si recuperación = Roja → prohibir alta intensidad, sugerir descanso o movilidad. |
| R2 | **Prioridad al Hito** | Todo entrenamiento debe justificar su aporte a la meta final del Onboarding. |
| R3 | **Nutrición Reactiva** | Objetivos nutricionales se actualizan ≤5 min después de sincronizar una actividad. |
| R4 | **Validación Subjetiva** | Pre-entreno: preguntar sueño/ánimo. Post-entreno: solicitar RPE (1-10). |
| R5 | **Regla de Verificación RAG** | Cambios estructurales en el plan → validar contra cuadernos NotebookLM. |
| R6 | **Privacidad Total** | Datos de salud y ubicación son propiedad exclusiva del usuario. |

---

## 6. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React + Vite |
| Estilos | Vanilla CSS con tokens "Kinetic Precision" (Dark Mode) |
| Internacionalización | `i18next` / `react-i18next` |
| Integración MCP | Stitch MCP (diseño) + sistema de archivos local |
| APIs Externas | Garmin Connect API, Strava API |
| IA / Brain | LLM API + Google NotebookLM (RAG) |

---

## 7. Design System "Kinetic Precision"

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#00FF41` | Estado Óptimo / Semáforo Verde |
| `--secondary` | `#2E5BFF` | Recuperación / Datos de Sync |
| `--tertiary` | `#FFBF00` | Alerta IA / Semáforo Ámbar |
| `--bg-color` | `#131313` | Fondo base (Obsidian) |
| Font | Inter (Google Fonts) | Todo el sistema |
| Corners | ROUND_FULL | Tarjetas y botones |

---

## 8. Flujo de Onboarding (Pendiente de Implementar)

1. Selección de Avatar (Ejecutivo / Universitario)
2. Disciplinas activas del usuario
3. Recursos disponibles (Bici, Gym, Piscina)
4. Hito principal y fecha objetivo
5. Conexión con Garmin / Strava
6. Selección de idioma
