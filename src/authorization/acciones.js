// Catalogo central de acciones del sistema y el permiso RBAC que exige cada una
const ACCIONES = {
  CREATE:       'DOC_CREAR',
  READ:         'DOC_CONSULTAR',
  UPDATE:       'DOC_MODIFICAR',
  DELETE:       'DOC_ELIMINAR',
  APPROVE:      'DOC_APROBAR',
  VIEW_AUDIT:   'AUDITORIA_VER',
  MANAGE_USERS: 'USUARIOS_GESTIONAR',
  ASSIGN_ROLES: 'ROLES_ASIGNAR',
};

module.exports = ACCIONES;