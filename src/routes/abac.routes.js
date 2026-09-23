const express = require('express');
const db = require('../db/database');
const { autenticar } = require('../auth/auth.middleware');
const { requierePermiso } = require('../authorization/authorize.middleware');
const { autorizar } = require('../authorization/authorization.service');
const abac = require('../authorization/abac/abac.engine');
const documentoService = require('../services/documento.service');

const router = express.Router();

// GET /abac/politicas -> matriz de politicas ABAC (entregable 7)
router.get('/politicas', autenticar, (req, res) => {
  res.json(abac.matriz());
});

// PATCH /abac/politicas/:codigo  { "activa": false } -> activar/desactivar sin tocar codigo
router.patch('/politicas/:codigo', autenticar, requierePermiso('ASSIGN_ROLES', 'politicas'), (req, res) => {
  const activa = req.body && req.body.activa ? 1 : 0;
  const r = db.prepare('UPDATE politicas SET activa = ? WHERE codigo = ?').run(activa, req.params.codigo);
  if (r.changes === 0) return res.status(404).json({ error: 'Politica no encontrada' });
  res.json({ codigo: req.params.codigo, activa: activa === 1 ? 'SI' : 'NO' });
});

// POST /abac/simular  { "documentoId": 1, "accion": "READ" }
// Evalua RBAC + ABAC sin ejecutar la accion y muestra el detalle de cada politica
router.post('/simular', autenticar, (req, res) => {
  const { documentoId, accion } = req.body || {};
  const documento = documentoService.buscarPorId(documentoId);
  if (!documento) return res.status(404).json({ error: 'Documento no encontrado' });

  const decision = autorizar({ usuario: req.usuario, accion, documento, entorno: req.entorno, ip: req.ip });
  res.json({
    usuario: req.usuario.usuario,
    accion,
    documento: documento.titulo,
    entorno: req.entorno,
    resultado: decision.permitido ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO',
    etapa: decision.etapa,
    motivo: decision.motivo,
    politicas: decision.abac || [],
  });
});

module.exports = router;