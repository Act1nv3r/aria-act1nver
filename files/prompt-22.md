# PROMPT 22 - Simulador Backend + Escenarios Persistidos
# Sprint 8-9 | 1 dia

POST /api/v1/diagnosticos/{id}/escenarios: {nombre max 30, variables: {edad_retiro?, ahorro?, mensualidad_deseada?, tasa_real?, aportacion_extra?}}
  Copia datos base del diagnostico -> aplica overrides -> ejecuta Motor C (y D si hay objetivos) -> persiste en tabla escenarios.
  Response 201: {id, nombre, variables, resultados: {mensualidad_posible, grado_avance, deficit, curva[]}, created_at}
  Limite: max 3 escenarios por diagnostico. Si ya hay 3 -> 400.

GET /api/v1/diagnosticos/{id}/escenarios: lista todos.
DELETE /api/v1/diagnosticos/{id}/escenarios/{sid}: eliminar.

Frontend: agregar boton Guardar escenario en simulador -> modal nombre -> POST.
Lista lateral de escenarios guardados (max 3 cards) con delete.
Boton Comparar escenarios: vista grid cols = Base + escenarios. Cada fila = metrica + diff badge (verde mejora, rojo empeora).
