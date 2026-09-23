// =====================================================================
// POLITICAS ABAC CENTRALIZADAS (punto 6 del laboratorio)
// Cada politica declara:
//   acciones  -> a que acciones se aplica ('*' = todas)
//   excepto   -> roles exceptuados de la politica
//   aplica    -> condicion para que la politica entre en juego
//   cumple    -> la regla en si (true = cumple)
//   detalle   -> texto para la auditoria
// Para cambiar una regla se edita SOLO este archivo.
// Para activar/desactivar una politica se usa la tabla "politicas".
// =====================================================================

const DOC = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE'];

const POLITICAS = [
  {
    codigo: 'P7_ESTADO',
    nombre: 'Estado del usuario',
    regla: 'usuario.estado == "ACTIVO"',
    acciones: '*',
    excepto: [],
    aplica: () => true,
    cumple: ({ usuario }) => usuario.estado === 'ACTIVO',
    detalle: ({ usuario }) => `Estado del usuario: ${usuario.estado}`,
  },
  {
    codigo: 'P1_DEPARTAMENTO',
    nombre: 'Departamento',
    regla: 'usuario.departamento == documento.departamento',
    acciones: DOC,
    excepto: ['ADMINISTRADOR', 'AUDITOR'],
    aplica: ({ documento }) => !!documento,
    cumple: ({ usuario, documento }) => usuario.departamento === documento.departamento,
    detalle: ({ usuario, documento }) =>
      `Departamento: ${usuario.departamento} ${usuario.departamento === documento.departamento ? '==' : '!='} ${documento.departamento}`,
  },
  {
    codigo: 'P2_NIVEL',
    nombre: 'Nivel de seguridad',
    regla: 'usuario.nivel_seguridad >= documento.nivel_confidencialidad',
    acciones: DOC,
    excepto: [],
    aplica: ({ documento }) => !!documento,
    cumple: ({ usuario, documento }) => usuario.nivel_seguridad >= documento.nivel_confidencialidad,
    detalle: ({ usuario, documento }) =>
      `Nivel: ${usuario.nivel_seguridad} ${usuario.nivel_seguridad >= documento.nivel_confidencialidad ? '>=' : '<'} ${documento.nivel_confidencialidad}`,
  },
  {
    codigo: 'P3_PROPIEDAD',
    nombre: 'Propiedad',
    regla: 'usuario.id == documento.propietario (excepto GERENTE y ADMINISTRADOR)',
    acciones: ['UPDATE'],
    excepto: ['GERENTE', 'ADMINISTRADOR'],
    aplica: ({ documento }) => !!documento,
    cumple: ({ usuario, documento }) => usuario.id === documento.propietario,
    detalle: ({ usuario, documento }) =>
      `Propiedad: usuario ${usuario.id} ${usuario.id === documento.propietario ? '==' : '!='} propietario ${documento.propietario}`,
  },
  {
    codigo: 'P4_HORARIO',
    nombre: 'Horario',
    regla: 'si nivel_confidencialidad >= 4, hora entre 08:00 y 18:00',
    acciones: DOC,
    excepto: [],
    aplica: ({ documento }) => !!documento && documento.nivel_confidencialidad >= 4,
    cumple: ({ entorno }) => entorno.hora >= '08:00' && entorno.hora <= '18:00',
    detalle: ({ entorno }) => `Horario: ${entorno.hora} (permitido 08:00 - 18:00)`,
  },
  {
    codigo: 'P5_PAIS',
    nombre: 'Pais',
    regla: 'usuario.pais == documento.pais y ubicacion == documento.pais',
    acciones: DOC,
    excepto: [],
    aplica: ({ documento }) => !!documento,
    cumple: ({ usuario, documento, entorno }) =>
      usuario.pais === documento.pais && entorno.ubicacion === documento.pais,
    detalle: ({ usuario, documento, entorno }) =>
      `Pais: usuario ${usuario.pais}, ubicacion ${entorno.ubicacion}, documento ${documento.pais}`,
  },
  {
    codigo: 'P6_DISPOSITIVO',
    nombre: 'Dispositivo',
    regla: 'si nivel_confidencialidad >= 4, dispositivo == "CORPORATIVO"',
    acciones: DOC,
    excepto: [],
    aplica: ({ documento }) => !!documento && documento.nivel_confidencialidad >= 4,
    cumple: ({ entorno }) => entorno.dispositivo === 'CORPORATIVO',
    detalle: ({ entorno }) => `Dispositivo: ${entorno.dispositivo}`,
  },
  {
    codigo: 'P8_INVITADO',
    nombre: 'Invitados',
    regla: 'tipo_contrato == "EXTERNO" AND nivel <= 1 AND documento.estado == "PUBLICADO"',
    acciones: DOC,
    excepto: [],
    aplica: ({ usuario, documento }) => !!documento && usuario.rol === 'INVITADO',
    cumple: ({ usuario, documento }) =>
      usuario.tipo_contrato === 'EXTERNO' &&
      documento.nivel_confidencialidad <= 1 &&
      documento.estado === 'PUBLICADO',
    detalle: ({ usuario, documento }) =>
      `Invitado: contrato ${usuario.tipo_contrato}, nivel doc ${documento.nivel_confidencialidad}, estado ${documento.estado}`,
  },
];

module.exports = POLITICAS;