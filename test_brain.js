const fetch = require('node-fetch');

async function test() {
  const payload = {
    userProfile: {
      avatar: "Atleta Amateur",
      milestone: "Reto Base 100k"
    },
    biometria: {
      hrv: 55,
      body_battery: 65
    },
    actividad_hoy: {
      rpe_usuario: 5
    },
    disponibilidad: "Sin restricciones especiales"
  };

  try {
    const res = await fetch('https://coreadapt.vercel.app/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        console.log("Error:", await res.text());
        return;
    }
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
