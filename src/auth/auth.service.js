const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioService = require('../services/usuario.service');
const auditoria = require('../services/auditoria.service');

// Tokens cerrados con logout. Aunque el JWT siga vigente, ya no se acepta
const tokensRevocados = new Set();

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

function login(login, password, ip) {
  const u = usuarioService.buscarPorLogin(login);

  if (!u || !bcrypt.compareSync(password, u.password)) {
    auditoria.registrar({ usuario: login, recurso: 'auth', accion: 'LOGIN', resultado: 'DENEGADO', motivo: 'Credenciales invalidas', ip });
    throw error(401, 'Usuario o contrasena incorrectos');
  }

  if (u.estado !== 'ACTIVO') {
    auditoria.registrar({ usuario: u.usuario, recurso: 'auth', accion: 'LOGIN', resultado: 'DENEGADO', motivo: `Usuario ${u.estado}`, ip });
    throw error(403, `Usuario ${u.estado}, no puede acceder al sistema`);
  }

  const token = jwt.sign(
    { sub: String(u.id), usuario: u.usuario, rol: u.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '2h' }
  );

  auditoria.registrar({ usuario: u.usuario, recurso: 'auth', accion: 'LOGIN', resultado: 'PERMITIDO', motivo: 'Inicio de sesion correcto', ip });
  return { token, usuario: usuarioService.sinPassword(u) };
}

function verificarToken(token) {
  if (tokensRevocados.has(token)) throw error(401, 'La sesion fue cerrada');
  return jwt.verify(token, process.env.JWT_SECRET);
}

function logout(token) {
  tokensRevocados.add(token);
}

module.exports = { login, verificarToken, logout };