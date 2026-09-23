# Evidencia de casos de prueba

Fecha de ejecucion: 23/9/2026, 12:55:40 p. m.

| # | Escenario | Esperado | Obtenido | OK | Motivo |
|---|---|---|---|---|---|
| 1 | Empleado consulta documento de su area | PERMITIDO | PERMITIDO | SI | Acceso autorizado |
| 2 | Empleado consulta documento de otra area | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P1_DEPARTAMENTO (Departamento: FINANZAS != RRHH) |
| 3 | Supervisor aprueba documento de su area | PERMITIDO | PERMITIDO | SI | Acceso autorizado |
| 4 | Empleado intenta aprobar documento | DENEGADO (RBAC) | DENEGADO (RBAC) | SI | Rol EMPLEADO no tiene el permiso DOC_APROBAR |
| 5 | Usuario nivel 2 consulta documento nivel 4 | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P2_NIVEL (Nivel: 2 < 4) |
| 6 | Gerente elimina documento | PERMITIDO | PERMITIDO | SI | Acceso autorizado |
| 7 | Auditor intenta modificar documento | DENEGADO (RBAC) | DENEGADO (RBAC) | SI | Rol AUDITOR no tiene el permiso DOC_MODIFICAR |
| 8 | Usuario inactivo intenta acceder | DENEGADO (AUTENTICACION) | DENEGADO (AUTENTICACION) | SI | Usuario INACTIVO, no puede acceder al sistema |
| 9 | Documento confidencial fuera de horario | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P4_HORARIO (Horario: 20:30 (permitido 08:00 - 18:00)) |
| 10 | Documento nivel 5 desde dispositivo personal | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P6_DISPOSITIVO (Dispositivo: PERSONAL) |
| 11 | Invitado accede a documento publico | PERMITIDO | PERMITIDO | SI | Acceso autorizado |
| 12 | Invitado accede a documento confidencial | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P2_NIVEL (Nivel: 1 < 4); P8_INVITADO (Invitado: contrato EXTERNO, nivel doc 4, estado APROBADO) |
| 13 | Empleado de CHILE consulta documento de PERU | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P5_PAIS (Pais: usuario CHILE, ubicacion PERU, documento PERU) |
| 14 | Supervisor modifica documento ajeno | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P3_PROPIEDAD (Propiedad: usuario 3 != propietario 4) |
| 15 | Empleado crea documento de nivel mayor al suyo | DENEGADO (ABAC) | DENEGADO (ABAC) | SI | P2_NIVEL (Nivel: 2 < 4) |
| 16 | Auditor consulta documento de otra area | PERMITIDO | PERMITIDO | SI | Acceso autorizado |
| 17 | Empleado intenta ver la auditoria | DENEGADO (RBAC) | DENEGADO (RBAC) | SI | Rol EMPLEADO no tiene el permiso AUDITORIA_VER |

Resultado: 17 de 17 casos correctos