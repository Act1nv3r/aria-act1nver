# PROMPT 23 - Panel Admin Completo
# Sprint 9 | 2 dias

Ruta /admin protegida (rol=admin). Layout: sidebar 240px (nav: Dashboard, Asesores, Parametros, Glosario, Auditoria) + contenido principal.

Dashboard (/admin): GET /api/v1/admin/metricas -> 10 widgets Recharts:
1. KPI diagnosticos completados + BarChart por mes
2. Funnel completitud por paso
3. LineChart tiempo promedio
4. DonutChart adopcion voz vs manual
5. DonutChart individual vs pareja
6. BarChart uso simulador
7. Tabla top 5 asesores
8. KPI wraps generados
9. KPI PDFs generados
10. Alertas errores recientes
Filtro date range en header.

Asesores (/admin/asesores): tabla CRUD (nombre, email, rol, activo, diagnosticos, ultimo acceso).
Parametros (/admin/parametros): formulario 5 parametros globales. Cambios solo aplican a diagnosticos futuros.
Glosario (/admin/glosario): tabla CRUD terminos. Cache Redis invalidada al editar.
Auditoria (/admin/auditoria): tabla paginada cursor-based con filtros (fecha, asesor, accion) + export CSV.
Aviso privacidad: textarea editable con texto LFPDPPP.
