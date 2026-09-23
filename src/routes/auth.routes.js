const express = require('express');
const authService = require('../auth/auth.service');
const { autenticar } = require('../auth/auth.middleware');
const auditoria = require('../services/auditoria.service');

const router = express.Router();

// POST /auth/login  { "usuario": "carlos.ruiz", "password": "123456" }
router.post('/login', (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Envie usuario y password' });
  }
  try {
    res.json(authService.login(usuario, password, req.ip));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// POST /auth/logout
router.post('/logout', autenticar, (req, res) => {
  authService.logout(req.token);
  auditoria.registrar({ usuario: req.usuario.usuario, recurso: 'auth', accion: 'LOGOUT', resultado: 'PERMITIDO', motivo: 'Cierre de sesion', ip: req.ip });
  res.json({ mensaje: 'Sesion cerrada correctamente' });
});

// GET /auth/me  -> quien soy
router.get('/me', autenticar, (req, res) => {
  res.json(req.usuario);
});

module.exports = router;