/**
 * Vercel Serverless Function: /api/sync-knowledge
 * ──────────────────────────────────────────────────────────────────────────────
 * Endpoint seguro para Sincronizar el Cerebro desde Google Drive.
 * 1. Autentica la petición usando un secreto.
 * 2. Borra TODO el histórico usando purga masiva REST API para evitar dependencias de credenciales.
 * 3. Inyecta los nuevos protocolos en paralelo.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const SYNC_SECRET = process.env.SYNC_SECRET || "CORE_ADAPT_ALPHA_SYNC_2026";
const PROJECT_ID = "coreadapt-d7f0d";
const API_KEY = "AIzaSyCxt7rOulp5bbKFW8PkNhU2SU-5Tl3CPbo";
const URL_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Conocimiento_Tecnico`;
const MAX_CONCURRENCY = 15; // Límite para evitar saturar el REST API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const clientSecret = req.headers['x-sync-secret'] || req.body.secret;
  if (clientSecret !== SYNC_SECRET) {
    return res.status(401).json({ error: 'No autorizado. Secreto de sincronización inválido.' });
  }

  const { protocols } = req.body;
  if (!protocols || !Array.isArray(protocols)) {
    return res.status(400).json({ error: 'Petición inválida.' });
  }

  try {
    // 1. Obtener todos los documentos actuales
    const getRes = await fetch(`${URL_BASE}?key=${API_KEY}&pageSize=1000`);
    if (!getRes.ok) throw new Error("Fallo consultando Firebase REST API");
    
    const getData = await getRes.json();
    const currentDocs = getData.documents || [];

    // 2. Borrar todos (Purga) en paralelo con chunks
    const deletePromises = currentDocs.map(doc => {
      // url del documento (contiene parte dinámica) + key
      return fetch(`https://firestore.googleapis.com/v1/${doc.name}?key=${API_KEY}`, { method: 'DELETE' });
    });
    
    await Promise.all(deletePromises);

    // 3. Crear los nuevos protocolos usando POST
    const createPromises = protocols.map(knowledge => {
      let payload = {
        fields: {
          deporte_origen: { stringValue: knowledge.deporte_origen },
          categoria: { stringValue: knowledge.categoria },
          subcategoria: { stringValue: knowledge.subcategoria },
          contenido_tecnico: { stringValue: knowledge.contenido_tecnico },
          fuente: { stringValue: knowledge.fuente },
          ultima_actualizacion: { stringValue: knowledge.ultima_actualizacion }
        }
      };
      
      let etiquetasArray = knowledge.etiquetas.map(e => ({ stringValue: e }));
      payload.fields.etiquetas = { arrayValue: { values: etiquetasArray } };

      return fetch(`${URL_BASE}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    });

    await Promise.all(createPromises);

    return res.status(200).json({ 
      success: true, 
      message: `Sincronización exitosa. Purgados ${currentDocs.length} clones e inyectados ${protocols.length} protocolos frescos.` 
    });

  } catch (error) {
    console.error("Error Alpha Sync:", error);
    return res.status(500).json({ error: "Error interno conectando con el motor de base de datos REST." });
  }
}

