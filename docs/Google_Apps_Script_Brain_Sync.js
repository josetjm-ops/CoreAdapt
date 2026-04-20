/**
 * =========================================================================
 * COREADAPT BRAIN SYNC - GOOGLE APPS SCRIPT
 * Sincroniza Hojas de Cálculo de Google Drive a Firebase Firestore
 * =========================================================================
 * 
 * INSTRUCCIONES:
 * 1. Ve a https://script.google.com/ y crea un Nuevo Proyecto.
 * 2. Pega este código completo allí.
 * 3. Rellena los "FOLDER_IDS" con el ID de tus 6 carpetas (el ID es lo que sale en la URL de Drive después de /folders/).
 * 4. Obtén tu FIREBASE_PROJECT_ID (usualmente "coreadapt-d7f0d" u otro similar) y ponlo abajo.
 * 5. Ejecuta la función principal: `syncDriveToFirebase()`
 */

const CONFIG = {
  // Pon aquí el ID de cada una de tus carpetas compartidas
  FOLDERS: [
    { nombre: "MTB", id: "TU_ID_DE_CARPETA_MTB_AQUI" },
    { nombre: "Natacion", id: "TU_ID_DE_CARPETA_NATACION_AQUI" },
    { nombre: "Running", id: "TU_ID_DE_CARPETA_RUNNING_AQUI" },
    { nombre: "Ruta", id: "TU_ID_DE_CARPETA_RUTA_AQUI" },
    { nombre: "Trail_Running", id: "TU_ID_DE_CARPETA_TRAIL_AQUI" },
    { nombre: "Nutricion", id: "TU_ID_DE_CARPETA_NUTRICION_AQUI" },
    { nombre: "Pesas", id: "TU_ID_DE_CARPETA_PESAS_AQUI" }
  ],
  FIREBASE_PROJECT_ID: "coreadapt-d7f0d", // Reemplaza con tu ID real de Firebase
  COLLECTION: "Conocimiento_Tecnico"
};

function syncDriveToFirebase() {
  Logger.log("Iniciando Sincronización del Cerebro CoreAdapt...");
  let knowledgeArray = [];

  // Paso 1: Leer todas las carpetas y extraer datos de las Hojas de Cálculo
  CONFIG.FOLDERS.forEach(folderObj => {
    try {
      let folderUrlId = folderObj.id;
      if(folderUrlId.includes('TU_ID')) return; // Saltar si no ha configurado el ID
      
      let folder = DriveApp.getFolderById(folderUrlId);
      // Buscamos SOLO archivos de Google Sheets
      let files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
      
      while (files.hasNext()) {
        let file = files.next();
        Logger.log("Leyendo archivo: " + file.getName() + " en " + folderObj.nombre);
        
        let spreadsheet = SpreadsheetApp.openById(file.getId());
        let sheet = spreadsheet.getSheets()[0]; // Leemos la primera pestaña
        let data = sheet.getDataRange().getValues();
        
        // Iteramos desde la fila 1 (saltando la fila 0 de los títulos)
        for (let i = 1; i < data.length; i++) {
          let row = data[i];
          if (row[0] && row[2]) { // Validar que existe Categoría y Contenido Técnico
            knowledgeArray.push({
              deporte_origen: folderObj.nombre,
              categoria: row[0].toString().trim(),
              subcategoria: row[1] ? row[1].toString().trim() : "",
              contenido_tecnico: row[2].toString().trim(),
              etiquetas: row[3] ? row[3].toString().split(",").map(e => e.trim()) : [],
              fuente: row[4] ? row[4].toString().trim() : "Drive Sync",
              ultima_actualizacion: new Date().toISOString()
            });
          }
        }
      }
    } catch(e) {
      Logger.log("Error leyendo carpeta " + folderObj.nombre + ": " + e.message);
    }
  });

  if(knowledgeArray.length === 0) {
    Logger.log("No se encontraron datos para subir. Asegúrate de configurar los IDs y tener los CSV convertidos a Google Sheets.");
    return;
  }

  Logger.log("Se extraerán " + knowledgeArray.length + " reglas técnicas. Enviando al túnel de Vercel/Firebase...");

  // Paso 2: Conectar con nuestro Túnel en Vercel
  // Cambia la URL si tienes un dominio temporal diferente
  let apiTunelUrl = 'https://coreadapt.vercel.app/api/sync-knowledge';
  
  let payload = {
    secret: "CORE_ADAPT_ALPHA_SYNC_2026",
    protocols: knowledgeArray
  };
    
  let options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
    
  let response = UrlFetchApp.fetch(apiTunelUrl, options);
  let responseData = response.getContentText();
  
  Logger.log("Respuesta del Túnel Vercel: " + responseData);
  Logger.log("¡Sincronización Completada! (Se purgaron los clones y se grabó la última versión limpiecita).");
}
