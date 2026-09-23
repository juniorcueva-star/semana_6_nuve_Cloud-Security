// Construye los atributos del ENTORNO de cada peticion (punto 5.3)
// En un sistema real la ubicacion saldria de la IP y el dispositivo de un MDM.
// Aqui se reciben por cabeceras para poder simular los casos de prueba:
//   X-Ubicacion: PERU        X-Dispositivo: CORPORATIVO | PERSONAL
//   X-Hora: 20:30 (opcional, para simular una hora distinta a la real)
function entorno(req, res, next) {
  const ahora = new Date();
  const horaReal = ahora.toTimeString().slice(0, 5);
  const horaSimulada = req.get('X-Hora');

  req.entorno = {
    hora: /^\d{2}:\d{2}$/.test(horaSimulada || '') ? horaSimulada : horaReal,
    fecha: ahora.toLocaleDateString('sv-SE'),
    direccion_ip: req.ip,
    ubicacion: (req.get('X-Ubicacion') || 'DESCONOCIDA').toUpperCase(),
    dispositivo: (req.get('X-Dispositivo') || 'DESCONOCIDO').toUpperCase(),
  };
  next();
}

module.exports = entorno;