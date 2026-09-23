const express = require('express');
const { autenticar } = require('../auth/auth.middleware');
const { requierePermisoSobreDocumento, denegar } = require('../authorization/authorize.middleware');
const { autorizar } = require('../authorization/authorization.service');
const documentoService = require('../services/documento.service');
const auditoria = require('../services/auditoria.service');

const router = express.Router();
router.use(autenticar);

// GET /documentos -> solo los documentos que el usuario PUEDE consultar
router.get('/', (req, res) => {
  const visibles = documentoService.listar().filter(documento =>
    autorizar({ usuario: req.usuario, accion: 'READ', documento, entorno: req.entorno, auditar: false }).permitido
  );
  auditoria.registrar({
    usuario: req.usuario.usuario, recurso: 'documentos', accion: 'READ', resultado: 'PERMITIDO',
    motivo: `Listado filtrado por RBAC+ABAC: ${visibles.length} documento(s) visibles`, ip: req.ip,
  });
  res.json(visibles);
});

// GET /documentos/:id
router.get('/:id', requierePermisoSobreDocumento('READ'), (req, res) => {
  res.json(req.documento);
});

// POST /documentos  { titulo, descripcion, nivel_confidencialidad, departamento? }
router.post('/', (req, res) => {
  const { titulo, descripcion, nivel_confidencialidad, departamento } = req.body || {};
  const nivel = Number(nivel_confidencialidad);

  if (!titulo) return res.status(400).json({ error: 'El titulo es obligatorio' });
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 5) {
    return res.status(400).json({ error: 'nivel_confidencialidad debe ser un entero de 1 a 5' });
  }
  const depto = (departamento || req.usuario.departamento).toUpperCase();
  if (!documentoService.idDepartamento(depto)) {
    return res.status(400).json({ error: `Departamento ${depto} no existe` });
  }

  // Documento "candidato": ABAC evalua sus atributos ANTES de crearlo
  const candidato = {
    titulo, descripcion,
    propietario: req.usuario.id,
    departamento: depto,
    nivel_confidencialidad: nivel,
    estado: 'PENDIENTE',
    pais: req.usuario.pais,
  };
  const decision = autorizar({ usuario: req.usuario, accion: 'CREATE', documento: candidato, entorno: req.entorno, ip: req.ip });
  if (!decision.permitido) return denegar(res, decision);

  res.status(201).json(documentoService.crear(candidato));
});

// PUT /documentos/:id  { titulo?, descripcion? }
router.put('/:id', requierePermisoSobreDocumento('UPDATE'), (req, res) => {
  const { titulo, descripcion } = req.body || {};
  res.json(documentoService.actualizar(req.documento.id, { titulo, descripcion }));
});

// DELETE /documentos/:id
router.delete('/:id', requierePermisoSobreDocumento('DELETE'), (req, res) => {
  documentoService.eliminar(req.documento.id);
  res.json({ mensaje: `Documento ${req.documento.id} eliminado` });
});

// POST /documentos/:id/aprobar
router.post('/:id/aprobar', requierePermisoSobreDocumento('APPROVE'), (req, res) => {
  if (req.documento.estado !== 'PENDIENTE') {
    return res.status(409).json({ error: `Solo se aprueban documentos PENDIENTES (estado actual: ${req.documento.estado})` });
  }
  res.json(documentoService.aprobar(req.documento.id));
});

module.exports = router;