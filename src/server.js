require('dotenv').config();
const express = require('express');
const entorno = require('./authorization/abac/entorno.middleware');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(entorno);

app.get('/api/salud', (req, res) => {
  res.json({ mensaje: 'SecureDocs funcionando' });
});

// Modulo de autenticacion
app.use('/auth', require('./routes/auth.routes'));

// Modulo RBAC
app.use('/rbac', require('./routes/rbac.routes'));

// Modulo ABAC
app.use('/abac', require('./routes/abac.routes'));

// Modulo de documentos
app.use('/documentos', require('./routes/documentos.routes'));

// Modulo de usuarios
app.use('/usuarios', require('./routes/usuarios.routes'));

// Modulo de auditoria
app.use('/auditoria', require('./routes/auditoria.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});