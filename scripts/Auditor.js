/**
 * Auditor de Base de Datos - CoreAdapt
 * Este script se conectará directamente a la Base de Datos en Producción (Firebase)
 * para realizar conteos y validaciones técnicas, asegurando que la IA está verificando
 * los datos reales y no solo asumiendo por capturas de pantalla.
 */

const PROJECT_ID = "coreadapt-d7f0d";
const API_KEY = "AIzaSyCxt7rOulp5bbKFW8PkNhU2SU-5Tl3CPbo";
const URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Conocimiento_Tecnico?key=${API_KEY}&pageSize=1000`;

async function ejecutarAuditoria() {
  console.log("\n==============================================");
  console.log("🕵️‍♂️ INICIANDO AUDITORÍA DE DATOS DE COREADAPT");
  console.log("==============================================\n");

  console.log("-> Conectando a Firebase Firestore Engine...");
  
  try {
    const response = await fetch(URL);
    
    if (!response.ok) {
      throw new Error(`Fallo de conexión a Firebase: HTTP ${response.status}`);
    }

    const data = await response.json();
    const documentos = data.documents || [];
    
    console.log(`✅ Conexión exitosa. Se encontraron ${documentos.length} reglas técnicas activas.`);
    
    if (documentos.length === 0) {
      console.log("⚠️ ALERTA: La base de datos está VACÍA.");
      return;
    }

    // Análisis estadístico rápido de carpetas de origen
    console.log("\n📊 Desglose de Reglas por Deporte/Carpeta de Drive:");
    const estadisticas = {};
    
    documentos.forEach(doc => {
      const campos = doc.fields;
      const deporte = campos.deporte_origen ? campos.deporte_origen.stringValue : 'Sin categorizar (Seed antiguo)';
      
      if (!estadisticas[deporte]) estadisticas[deporte] = 0;
      estadisticas[deporte]++;
    });

    for (const [deporte, count] of Object.entries(estadisticas)) {
      console.log(`   - ${deporte}: ${count} protocolos`);
    }

    console.log("\n✅ Auditoría Finalizada sin errores críticos.");
    console.log("==============================================\n");

  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN LA AUDITORÍA:", error.message);
  }
}

ejecutarAuditoria();
