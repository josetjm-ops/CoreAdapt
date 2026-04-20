import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export const seedKnowledgeBase = async () => {
  const kbRef = collection(db, "Knowledge_Base");
  const snapshot = await getDocs(kbRef);
  
  if (snapshot.empty) {
    console.log("Seeding Knowledge_Base...");
    await addDoc(kbRef, {
      categoria: 'Recuperación',
      subcategoria: 'Fisiología',
      contenido_tecnico: 'El HRV bajo post-esfuerzo indica fatiga del sistema nervioso autónomo. Se recomienda descanso total si la caída es >15% respecto al promedio de 7 días.',
      etiquetas: ['HRV', 'Recuperación', 'SNA']
    });
    
    await addDoc(kbRef, {
      categoria: 'Trail',
      subcategoria: 'Técnica',
      contenido_tecnico: 'En descensos técnicos, mantén el centro de gravedad bajo y busca apoyos en el metatarso para reducir el impacto articular.',
      etiquetas: ['Técnica', 'Descenso', 'Trail']
    });

    console.log("Seed completado.");
  } else {
    console.log("Knowledge_Base ya contiene datos.");
  }
};
