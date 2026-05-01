import { adminDb } from './_firebase-admin.js';

/**
 * Vercel Serverless Function: /api/sync-knowledge
 * Versión 2.0: Firebase Admin SDK — sin API key expuesta, sin secret hardcodeado.
 * Sincroniza la colección Conocimiento_Tecnico desde una fuente externa.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  if (!process.env.SYNC_SECRET) {
    return res.status(500).json({ error: 'SYNC_SECRET no configurado en el servidor.' });
  }

  const clientSecret = req.headers['x-sync-secret'] || req.body?.secret;
  if (clientSecret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'No autorizado. Secreto de sincronización inválido.' });
  }

  const { protocols } = req.body;
  if (!protocols || !Array.isArray(protocols)) {
    return res.status(400).json({ error: 'Petición inválida. Se requiere array "protocols".' });
  }

  try {
    const collectionRef = adminDb.collection('Conocimiento_Tecnico');

    // 1. Obtener y borrar todos los documentos actuales
    const snapshot = await collectionRef.get();
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // 2. Crear los nuevos protocolos
    const createPromises = protocols.map(knowledge => {
      return collectionRef.add({
        deporte_origen: knowledge.deporte_origen,
        categoria: knowledge.categoria,
        subcategoria: knowledge.subcategoria,
        contenido_tecnico: knowledge.contenido_tecnico,
        etiquetas: knowledge.etiquetas || [],
        fuente: knowledge.fuente,
        ultima_actualizacion: knowledge.ultima_actualizacion || new Date().toISOString()
      });
    });
    await Promise.all(createPromises);

    return res.status(200).json({
      success: true,
      message: `Sincronización exitosa. Purgados ${snapshot.docs.length} protocolos e inyectados ${protocols.length} nuevos.`
    });

  } catch (error) {
    console.error("Error Alpha Sync:", error);
    return res.status(500).json({ error: "Error interno en la sincronización." });
  }
}
