// =====================================================================
// CASOS DE PRUEBA (punto 15 del laboratorio)
// Requisito: el servidor debe estar corriendo (npm run dev)
// Ejecutar con: npm run test:casos
// =====================================================================
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const ENTORNO_NORMAL = { dispositivo: 'CORPORATIVO', ubicacion: 'PERU', hora: '10:30' };

async function login(usuario) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password: '123456' }),
  });
  const body = await r.json();
  return r.ok ? { token: body.token } : { error: body.error };
}

async function llamar({ usuario, metodo, ruta, body, entorno = {} }) {
  const e = { ...ENTORNO_NORMAL, ...entorno };
  const sesion = await login(usuario);
  if (!sesion.token) {
    return { resultado: 'DENEGADO', etapa: 'AUTENTICACION', motivo: sesion.error };
  }
  const r = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sesion.token}`,
      'X-Dispositivo': e.dispositivo,
      'X-Ubicacion': e.ubicacion,
      'X-Hora': e.hora,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (r.ok) return { resultado: 'PERMITIDO', etapa: '-', motivo: 'Acceso autorizado', data };
  return { resultado: 'DENEGADO', etapa: data.etapa || `HTTP ${r.status}`, motivo: data.motivo || data.error };
}

// ----- Definicion de casos -----
// esperado: PERMITIDO o DENEGADO. etapa: RBAC, ABAC o AUTENTICACION (solo si es denegado)
const casos = [
  // 12 casos obligatorios
  { n: 1,  escenario: 'Empleado consulta documento de su area',        usuario: 'luis.perez',     metodo: 'GET',    ruta: '/documentos/2',          esperado: 'PERMITIDO' },
  { n: 2,  escenario: 'Empleado consulta documento de otra area',      usuario: 'luis.perez',     metodo: 'GET',    ruta: '/documentos/5',          esperado: 'DENEGADO', etapa: 'ABAC' },
  { n: 3,  escenario: 'Supervisor aprueba documento de su area',       usuario: 'carlos.ruiz',    metodo: 'POST',   ruta: '/documentos/1/aprobar',  esperado: 'PERMITIDO' },
  { n: 4,  escenario: 'Empleado intenta aprobar documento',            usuario: 'luis.perez',     metodo: 'POST',   ruta: '/documentos/2/aprobar',  esperado: 'DENEGADO', etapa: 'RBAC' },
  { n: 5,  escenario: 'Usuario nivel 2 consulta documento nivel 4',    usuario: 'luis.perez',     metodo: 'GET',    ruta: '/documentos/3',          esperado: 'DENEGADO', etapa: 'ABAC' },
  { n: 6,  escenario: 'Gerente elimina documento',                     usuario: 'rosa.diaz',      metodo: 'DELETE', ruta: '/documentos/:temporal',  esperado: 'PERMITIDO' },
  { n: 7,  escenario: 'Auditor intenta modificar documento',           usuario: 'jorge.vega',     metodo: 'PUT',    ruta: '/documentos/1',          esperado: 'DENEGADO', etapa: 'RBAC', body: { titulo: 'Cambio' } },
  { n: 8,  escenario: 'Usuario inactivo intenta acceder',              usuario: 'sofia.inactiva', metodo: 'GET',    ruta: '/documentos',            esperado: 'DENEGADO', etapa: 'AUTENTICACION' },
  { n: 9,  escenario: 'Documento confidencial fuera de horario',       usuario: 'rosa.diaz',      metodo: 'GET',    ruta: '/documentos/3',          esperado: 'DENEGADO', etapa: 'ABAC', entorno: { hora: '20:30' } },
  { n: 10, escenario: 'Documento nivel 5 desde dispositivo personal',  usuario: 'rosa.diaz',      metodo: 'GET',    ruta: '/documentos/4',          esperado: 'DENEGADO', etapa: 'ABAC', entorno: { dispositivo: 'PERSONAL' } },
  { n: 11, escenario: 'Invitado accede a documento publico',           usuario: 'invitado.ext',   metodo: 'GET',    ruta: '/documentos/6',          esperado: 'PERMITIDO' },
  { n: 12, escenario: 'Invitado accede a documento confidencial',      usuario: 'invitado.ext',   metodo: 'GET',    ruta: '/documentos/3',          esperado: 'DENEGADO', etapa: 'ABAC' },
  // 5 casos adicionales del grupo
  { n: 13, escenario: 'Empleado de CHILE consulta documento de PERU',  usuario: 'diego.chile',    metodo: 'GET',    ruta: '/documentos/2',          esperado: 'DENEGADO', etapa: 'ABAC' },
  { n: 14, escenario: 'Supervisor modifica documento ajeno',           usuario: 'carlos.ruiz',    metodo: 'PUT',    ruta: '/documentos/2',          esperado: 'DENEGADO', etapa: 'ABAC', body: { titulo: 'Cambio' } },
  { n: 15, escenario: 'Empleado crea documento de nivel mayor al suyo', usuario: 'luis.perez',    metodo: 'POST',   ruta: '/documentos',            esperado: 'DENEGADO', etapa: 'ABAC', body: { titulo: 'Secreto', nivel_confidencialidad: 4 } },
  { n: 16, escenario: 'Auditor consulta documento de otra area',       usuario: 'jorge.vega',     metodo: 'GET',    ruta: '/documentos/5',          esperado: 'PERMITIDO' },
  { n: 17, escenario: 'Empleado intenta ver la auditoria',             usuario: 'luis.perez',     metodo: 'GET',    ruta: '/auditoria',             esperado: 'DENEGADO', etapa: 'RBAC' },
];

async function main() {
  // Preparacion: el gerente crea un documento temporal para el caso 6
  const temp = await llamar({ usuario: 'rosa.diaz', metodo: 'POST', ruta: '/documentos', body: { titulo: 'Documento temporal', nivel_confidencialidad: 1 } });
  const idTemporal = temp.data && temp.data.id;

  const filas = [];
  for (const c of casos) {
    const ruta = c.ruta.replace(':temporal', idTemporal);
    const r = await llamar({ ...c, ruta });
    const correcto = r.resultado === c.esperado && (!c.etapa || r.etapa === c.etapa);
    filas.push({
      '#': c.n,
      Escenario: c.escenario,
      Esperado: c.etapa ? `${c.esperado} (${c.etapa})` : c.esperado,
      Obtenido: r.etapa !== '-' ? `${r.resultado} (${r.etapa})` : r.resultado,
      OK: correcto ? 'SI' : 'NO',
      Motivo: r.motivo,
    });
  }

  console.log('\nSECUREDOCS - CASOS DE PRUEBA RBAC + ABAC');
  console.log(`Fecha: ${new Date().toLocaleString('es-PE')}\n`);
  // La primera columna de la tabla es el numero de caso
  console.table(Object.fromEntries(filas.map(({ Motivo, '#': n, ...resto }) => [`Caso ${n}`, resto])));
  const ok = filas.filter(f => f.OK === 'SI').length;
  console.log(`\nResultado: ${ok} de ${filas.length} casos correctos\n`);

  // Evidencia en archivo (con el motivo completo)
  const md = [
    '# Evidencia de casos de prueba',
    '',
    `Fecha de ejecucion: ${new Date().toLocaleString('es-PE')}`,
    '',
    '| # | Escenario | Esperado | Obtenido | OK | Motivo |',
    '|---|---|---|---|---|---|',
    ...filas.map(f => `| ${f['#']} | ${f.Escenario} | ${f.Esperado} | ${f.Obtenido} | ${f.OK} | ${f.Motivo} |`),
    '',
    `Resultado: ${ok} de ${filas.length} casos correctos`,
  ].join('\n');
  const destino = path.join(__dirname, '..', 'docs', 'evidencias', 'resultados_pruebas.md');
  fs.writeFileSync(destino, md);
  console.log(`Detalle guardado en docs/evidencias/resultados_pruebas.md`);
}

main().catch(e => {
  console.error('Error: no se pudo conectar con el servidor. Esta corriendo npm run dev?', e.message);
  process.exit(1);
});