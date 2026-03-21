# Development Flow — ArIA by Actinver

## Flujo Completo: De HU a Producción

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  PLANEAR  │───→│DESARROLLAR│───→│  PROBAR  │───→│  REVISAR │───→│ DESPLEGAR│
│          │    │(Vibe Code)│    │          │    │          │    │          │
│ Spec eng │    │ Cursor AI │    │ Auto+Man │    │ Human QA │    │ CI/CD    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Paso 1: PLANEAR (Specification Engineering)
```
1. Tomar la HU del backlog (Excel de HUs)
2. Leer: Descripción + Criterios Gherkin + Spec Técnica + UX/UI Reqs
3. Crear branch: git checkout -b feature/HU-XXX-descripcion
4. Antes de codificar, verificar que los archivos de contexto están actualizados:
   - .cursor/rules/cursorrules.md (reglas de código)
   - .context/context.md (contexto de negocio)
   - .context/codebase-map.md (dónde va cada archivo)
```

### Paso 2: DESARROLLAR (Vibe Coding con Cursor)
```
REGLAS DE VIBE CODING PARA ESTE PROYECTO:

1. SIEMPRE empezar en Ask Mode (planificar):
   "Necesito implementar HU-XXX. Lee .context/context.md y la spec técnica.
    Dame un plan paso a paso de qué archivos crear/modificar."

2. DESPUÉS cambiar a Agent Mode (implementar):
   "Implementa el paso 1 del plan: [descripción específica]"

3. ITERAR EN PASOS PEQUEÑOS:
   - Un endpoint a la vez
   - Un componente a la vez
   - NUNCA pedir "implementa toda la HU de una vez"

4. REVISAR CADA OUTPUT antes de aceptar:
   - ¿Usa TypeScript strict (no any)?
   - ¿Los schemas Zod coinciden con Pydantic?
   - ¿No hay datos sensibles en logs?
   - ¿RLS está configurado?

5. ESCRIBIR TESTS durante la implementación (no después):
   "Ahora escribe tests para el motor que acabamos de crear.
    Usa los datos del Excel: patrimonio=$2.3M, edad=50, retiro=60."

6. CHECKPOINT frecuente:
   - git add + commit después de cada sub-feature funcional
   - Si algo se rompe, revert al último checkpoint
```

### Paso 3: PROBAR

#### Tests Automatizados (ejecutar ANTES del PR)
```bash
# 1. Linter (debe pasar al 100%)
make lint
# Ejecuta: ruff check (Python) + mypy (types) + eslint (JS) + tsc --noEmit (TS)

# 2. Tests unitarios
make test-unit
# Backend: pytest tests/ -v --cov=app -x (stop at first failure)
# Frontend: pnpm vitest run

# 3. Tests de seguridad (BLOQUEANTES)
make test-security
# pytest tests/test_security.py -v

# 4. Tests de motores (si aplica)
make test-motors
# pytest tests/test_motor_*.py -v

# 5. Tests E2E (si la HU es un flujo completo)
make test-e2e
# pnpm playwright test
```

#### Tests Manuales (para HUs de UI)
```
- [ ] Verificar en desktop (≥1024px) — Chrome + Safari
- [ ] Verificar en tablet (≥768px) — Chrome DevTools
- [ ] Verificar dark mode (default) y light mode
- [ ] Verificar info boxes en todos los campos financieros
- [ ] Verificar que montos se formatean como MXN ($#,##0)
- [ ] Verificar que el auto-guardado funciona (esperar 30s, verificar indicador)
- [ ] Verificar con datos extremos (edad 18, edad 90, montos 0, montos muy grandes)
```

### Paso 4: REVISAR (Code Review)
```
PR CHECKLIST (copiar en cada PR):

## Security Review (HUMANO — no delegable a AI)
- [ ] No hay datos financieros en logs (grep "logger\|console\." para verificar)
- [ ] No hay secrets hardcodeados (grep para API keys, passwords)
- [ ] RLS verificado: ¿todos los endpoints filtran por asesor_id?
- [ ] JWT RS256 usado correctamente
- [ ] Input validation: ¿Pydantic en back + Zod en front?
- [ ] ¿Se auditan las acciones relevantes?

## Quality Review (AI puede asistir)
- [ ] TypeScript strict: ¿0 errores de tipos?
- [ ] Schemas Zod = Schemas Pydantic (nombres y tipos coinciden)
- [ ] Componentes < 200 líneas
- [ ] Tests con coverage ≥80% para el código nuevo
- [ ] Motores: ±0.01% vs Excel
- [ ] UX writing: lenguaje del brandbook (empoderar, <20 palabras, voz activa)
- [ ] Responsive: desktop + tablet
```

### Paso 5: DESPLEGAR
```
CI/CD Pipeline (automático en GitHub Actions):

PR a develop:
  lint → test-unit → test-security → build → deploy-staging → smoke-test

PR a main (release):
  lint → test-unit → test-security → test-e2e → build → deploy-production
  → health-check → rollback-if-unhealthy

POST-DEPLOY:
  - Verificar Sentry: ¿errores nuevos?
  - Verificar Grafana: ¿latencia normal?
  - Verificar UptimeRobot: ¿health check OK?
  - Si todo bien: marcar release en GitHub
```

## Orden de Implementación por Sprint

### Sprint 1: Cimientos (Semana 1-2)
```
HU-001: Docker Compose + proyecto base
HU-002: Modelo de datos + migraciones
HU-003: API registro asesor
HU-004: API login (JWT RS256)
HU-058: Especificación OpenAPI
→ ENTREGABLE: API documentada con auth funcional
```

### Sprint 2: Auth + Dashboard (Semana 3-4)
```
HU-005: UI login
HU-006: Refresh tokens
HU-007: Interceptor frontend
HU-008: Auditoría
HU-009: API CRUD clientes
HU-010: UI Dashboard asesor
HU-035: Design system tokens (Tailwind config)
→ ENTREGABLE: Login + dashboard con lista de clientes
```

### Sprint 3-4: Flujo Pasos 1-2 + InfoBoxes (Semana 5-8)
```
HU-012: API crear diagnóstico
HU-013: Stepper nav
HU-014: Layout diagnóstico
HU-015: API Paso 1 (Perfil)
HU-016: UI Paso 1
HU-017: API Paso 2 + Motor A
HU-018: UI Paso 2 + outputs parciales
HU-031: Componente InfoBox
HU-032: API glosario
HU-027: Auto-guardado
HU-052: Validación inline
→ ENTREGABLE: Flujo funcional Pasos 1-2 con outputs y auto-guardado
```

### Sprint 5-6: Flujo Pasos 3-6 + Motores (Semana 9-12)
```
HU-019: API Paso 3 + Motores B,E
HU-020: UI Paso 3 (4 acordeones)
HU-021: API Paso 4 + Motor C
HU-022: UI Paso 4 + curva desacumulación
HU-023: API Paso 5 + Motor D
HU-024: UI Paso 5 (objetivos)
HU-025: API Paso 6 + Motor F
HU-026: UI Paso 6 + pantalla éxito
HU-054: Fallo seguro en motores
→ ENTREGABLE: Flujo completo de 6 pasos con todos los motores
```

### Sprint 7: Outputs + PDFs (Semana 13-14)
```
HU-028: API generación PDFs
HU-029: Recomendaciones automáticas
HU-030: UI vista resultados completos
HU-034: UI info boxes en outputs
HU-037: Responsive desktop+tablet
→ ENTREGABLE: Diagnóstico end-to-end con PDFs descargables
```

### Sprint 8-9: Módulos Avanzados (Semana 15-18)
```
HU-033: API simulador escenarios
HU-034: UI simulador + comparación
HU-035: API pareja + consolidación
HU-036: UI modo pareja
HU-037: Backend voz (STT + NLU)
HU-038: UI captura por voz
HU-053: Degradación elegante voz
→ ENTREGABLE: Simulador + Pareja + Voz funcionando
```

### Sprint 10: Admin + Wrapped + Polish (Semana 19-20)
```
HU-039: API link cliente readonly
HU-040: UI vista cliente
HU-041: UI dashboard admin
HU-042: API métricas admin
HU-043: API Financial Wrapped
HU-044: UI Financial Wrapped
HU-047: Tests seguridad completos
HU-055: Aviso privacidad
HU-057: Derecho al olvido
→ ENTREGABLE: MVP COMPLETO
```

## Makefile (Shortcuts)

```makefile
.PHONY: dev test lint migrate

dev:
	docker-compose up --build

test:
	cd backend && pytest -v --cov=app
	cd frontend && pnpm test

test-security:
	cd backend && pytest tests/test_security.py -v --tb=short

test-motors:
	cd backend && pytest tests/test_motor_*.py -v

test-e2e:
	cd frontend && pnpm playwright test

lint:
	cd backend && ruff check . && mypy app/
	cd frontend && pnpm lint && pnpm tsc --noEmit

migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python -m app.seed

format:
	cd backend && ruff format .
	cd frontend && pnpm prettier --write .
```
