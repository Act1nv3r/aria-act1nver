# PROMPT 18 - Endpoints Diagnostico + Motores Python
# Sprint 7 | 3 dias

POST /api/v1/diagnosticos: {cliente_id, modo} -> crea con estado=borrador, paso_actual=1.
  parametros_snapshot: copia de TODOS los parametros globales al crear.

GET/PUT para 6 pasos: /perfil, /flujo-mensual, /patrimonio, /retiro, /objetivos, /proteccion
Cada PUT:
1. Validar con Pydantic v2 (schemas identicos a Zod del frontend)
2. Guardar cifrado en BD (pgcrypto campos financieros)
3. Ejecutar motor correspondiente con datos + parametros_snapshot
4. Almacenar resultado en resultados_calculo
5. Actualizar paso_actual
6. Response: {data: input, outputs: motor_result, condicionales: {ley73_visible: edad>46}}

Motores en Python (services/motor_a.py ... motor_f.py):
MISMAS formulas que TypeScript (Prompt 5) pero con Decimal para precision.
Cada calculo individual en try/except. Si falla: campo=None, error=mensaje.

Al completar Paso 6: UPDATE diagnosticos SET estado=completo, completed_at=now(). Auditoria.

pytest tests para cada motor con datos de Juan Perez: mensualidad_posible aprox ,175 (tolerancia 00).
