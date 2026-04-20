# Esquema de Base de Datos - Atleta Alpha IA

## Tabla: `Conocimiento_Tecnico`
Esta tabla reemplaza a NotebookLM y sirve como el motor RAG interno para el Cerebro Alpha.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | String (Auto) | Identificador único de la píldora de conocimiento. |
| `categoria` | String | Disciplina (Trail, MTB, Ruta, Nutrición, Recuperación). |
| `subcategoria` | String | Detalle (ej: Técnica de bastones, Glucógeno, etc). |
| `contenido_tecnico` | Text/String | El protocolo técnico que el Cerebro usará para responder. |
| `etiquetas` | Array<String> | Keywords para filtrado rápido (ej: ["fatiga", "HRV", "hidratacion"]). |
| `fuente` | String | Origen del manual (Manual Alpha v1.0, Guía Nutrición 2026). |
| `lastUpdated` | Timestamp | Fecha de carga del protocolo. |

---

## Flujo de Inteligencia 100% Independiente
1. **Ingesta:** El Lead Coach carga manuales en la tabla `Conocimiento_Tecnico`.
2. **Consulta RAG:** Cuando el Atleta abre el Dashboard, `BrainService` consulta en Firestore los protocolos relevantes.
3. **Inyección de Contexto:** Los textos se envían a la API REST de **DeepSeek** mediante el conector `/api/brain`.
4. **Razonamiento Alpha:** DeepSeek cruza la biometría de Garmin con los protocolos internos.
5. **Ajuste Automático:** Si el motor detecta RPE > 8 o BB < 40, reescribe la planificación sin intervención externa.
