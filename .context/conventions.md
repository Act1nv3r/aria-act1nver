# Conventions — ArIA by Actinver

## Naming Conventions

### Files and Directories
```
frontend/components/  → kebab-case:   stepper-nav.tsx, currency-input.tsx
frontend/hooks/       → kebab-case:   use-auto-save.ts, use-websocket.ts
frontend/stores/      → kebab-case:   auth-store.ts, diagnostico-store.ts
frontend/lib/         → kebab-case:   api-client.ts, format-currency.ts
frontend/app/         → kebab-case:   (Next.js convention)
backend/api/v1/       → snake_case:   clientes.py, diagnosticos.py
backend/models/       → snake_case:   cliente.py, diagnostico.py
backend/schemas/      → snake_case:   cliente_schema.py
backend/services/     → snake_case:   motor_a.py, motor_b.py, recomendaciones.py
```

### Code Identifiers
```
TypeScript:
  Components     → PascalCase:    StepperNav, CurrencyInput, Paso1Perfil
  Hooks          → camelCase:     useAutoSave, useWebSocket, useDiagnostico
  Functions      → camelCase:     formatCurrency, calculateMotorA
  Constants      → UPPER_SNAKE:   MAX_OBJECTIVES, API_BASE_URL
  Types/Interfaces → PascalCase:  DiagnosticoData, MotorAOutput
  Zustand stores → camelCase:     useAuthStore, useDiagnosticoStore
  Zod schemas    → camelCase:     perfilSchema, flujoMensualSchema

Python:
  Classes        → PascalCase:    DiagnosticoRouter, MotorA
  Functions      → snake_case:    calculate_motor_a, get_diagnostico
  Variables      → snake_case:    patrimonio_neto, grado_avance
  Constants      → UPPER_SNAKE:   TASA_DEFAULT, MAX_OBJETIVOS
  Pydantic models → PascalCase:   PerfilInput, FlujoMensualOutput
  SQLAlchemy     → PascalCase:    Cliente, Diagnostico
  Endpoints      → snake_case:    /flujo-mensual, /patrimonio
```

### Database
```
Tables         → snake_case plural:  clientes, diagnosticos, resultados_calculo
Columns        → snake_case:         nombre_alias, edad_retiro, gastos_basicos
PKs            → id (UUID)
FKs            → {tabla_singular}_id: cliente_id, asesor_id, diagnostico_id
Timestamps     → created_at, updated_at, completed_at, deleted_at
Booleans       → is_* o has_*: activo (exception), seguro_vida, dependientes
Enums          → lowercase: 'borrador', 'completo', 'archivado'
Indexes        → ix_{tabla}_{columna}: ix_diagnosticos_cliente_id
```

## Git Conventions

### Branch Naming
```
feature/HU-001-setup-proyecto
feature/HU-015-paso1-api-perfil
fix/HU-015-validation-edad
hotfix/security-rls-bypass
chore/update-dependencies
```

### Commit Messages (Conventional Commits)
```
feat(HU-001): setup Docker Compose with Next.js + FastAPI + PostgreSQL
feat(HU-015): implement Paso 1 API endpoint with Pydantic validation
fix(HU-015): fix age validation to accept range 18-90
test(HU-023): add Motor A test suite with 10 Excel scenarios
docs(HU-001): update README with setup instructions
refactor(motors): extract common calculation utils to shared module
chore(deps): update FastAPI to 0.115.2
security(HU-047): fix RLS policy for cross-asesor access
```

### PR Template
```markdown
## HU Reference
HU-XXX: [título]

## Changes
- [ ] Descripción de cambios

## Checklist
- [ ] Tests pasan localmente (`make test`)
- [ ] Linter sin errores (`make lint`)
- [ ] No hay `any` en TypeScript
- [ ] No hay datos sensibles en logs
- [ ] No hay secrets hardcodeados
- [ ] RLS verificado (si toca datos de cliente)
- [ ] Info boxes incluidos (si hay campos financieros nuevos)
- [ ] OWASP Top 10 checklist revisado
- [ ] Screenshots/video de UI (si aplica)

## Testing
- [ ] Unit tests agregados/actualizados
- [ ] Si es motor de cálculo: validado contra Excel (±0.01%)
- [ ] Si es endpoint: Swagger actualizado
```

## API Conventions

### Endpoints
```
Colección:     GET    /api/v1/clientes          → Lista paginada
Crear:         POST   /api/v1/clientes          → Crear recurso
Detalle:       GET    /api/v1/clientes/{id}     → Obtener por ID
Actualizar:    PUT    /api/v1/clientes/{id}     → Actualizar completo
Eliminar:      DELETE /api/v1/clientes/{id}     → Soft delete
Sub-recurso:   GET    /api/v1/diagnosticos/{id}/perfil
Acción:        POST   /api/v1/diagnosticos/{id}/compartir
```

### Response Formats
```json
// Success (lista)
{
  "data": [...],
  "meta": { "cursor": "abc123", "total": 42 }
}

// Success (detalle)
{
  "id": "uuid",
  "nombre": "...",
  ...
}

// Success (con outputs de motor)
{
  "data": { /* input guardado */ },
  "outputs": { /* resultados del motor */ }
}

// Error (RFC 7807)
{
  "type": "https://api.planeador.actinver.com/errors/validation",
  "title": "Error de validación",
  "status": 422,
  "detail": "La edad debe ser entre 18 y 90 años",
  "instance": "/api/v1/diagnosticos/abc/perfil",
  "errors": [
    { "field": "edad", "message": "Debe ser entre 18 y 90" }
  ]
}
```

### HTTP Status Codes
```
200 OK            — GET exitoso, PUT exitoso
201 Created       — POST exitoso
204 No Content    — DELETE exitoso
400 Bad Request   — Error lógico (ej: diagnóstico ya completo)
401 Unauthorized  — Token inválido o ausente
403 Forbidden     — Sin permisos para este recurso
404 Not Found     — Recurso no existe (o no es tuyo por RLS)
409 Conflict      — Duplicado (ej: email ya registrado)
422 Unprocessable — Validación de campos falló
429 Too Many Req  — Rate limit excedido
500 Internal      — Error no manejado (NUNCA debería pasar)
```

## Frontend Component Patterns

### Componente con data fetching
```tsx
// components/diagnostico/paso2-flujo.tsx
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { flujoMensualSchema, type FlujoMensualInput } from '@/lib/validators';
import { apiClient } from '@/lib/api-client';
import { CurrencyInput } from '@/components/ui/currency-input';
import { InfoBox } from '@/components/ui/info-box';
// ... pattern continues
```

### Custom Hook pattern
```tsx
// hooks/use-auto-save.ts
export function useAutoSave<T>(
  data: T,
  endpoint: string,
  intervalMs: number = 30000
) {
  // ... debounce, IndexedDB fallback, sync
}
```

### Zustand Store pattern
```tsx
// stores/diagnostico-store.ts
interface DiagnosticoState {
  id: string | null;
  pasoActual: number;
  dataByStep: Record<number, unknown>;
  outputs: Record<string, unknown>;
  // actions
  setStep: (step: number) => void;
  updateStepData: (step: number, data: unknown) => void;
  updateOutputs: (outputs: Record<string, unknown>) => void;
}
```

## Backend Service Pattern

### Motor de cálculo
```python
# services/motor_a.py
from decimal import Decimal
from app.schemas.motor_a import MotorAInput, MotorAOutput
import structlog

logger = structlog.get_logger()

class MotorA:
    """Motor de Análisis Ingreso/Gasto"""

    def calculate(self, input: MotorAInput, params: dict) -> MotorAOutput:
        results = {}

        # Cada cálculo en su propio try/except
        try:
            results['ingresos_totales'] = input.ahorro + input.rentas + input.otros_ingresos
        except Exception as e:
            logger.warning("motor_a_error", campo="ingresos_totales", error=str(e))
            results['ingresos_totales'] = None
            results['ingresos_totales_error'] = "No se pudo calcular"

        try:
            results['benchmark_reserva'] = input.gastos_basicos * params['benchmark_reserva_meses']
        except Exception as e:
            logger.warning("motor_a_error", campo="benchmark_reserva", error=str(e))
            results['benchmark_reserva'] = None

        # ... más cálculos

        return MotorAOutput(**results)
```

## Error Handling Patterns

### Frontend
```tsx
// Error boundary para secciones
<ErrorBoundary fallback={<ErrorFallback message="No pudimos cargar esta sección" />}>
  <Paso2Flujo />
</ErrorBoundary>

// Inline validation
<FormField error={errors.edad?.message} />

// API error toast
onError: (error) => {
  toast.error(error.detail || 'Algo salió mal. Intenta de nuevo.');
}
```

### Backend
```python
# NUNCA esto:
@app.exception_handler(Exception)
async def handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})  # EXPONE STACK TRACE

# SIEMPRE esto:
@app.exception_handler(Exception)
async def handler(request, exc):
    logger.error("unhandled_exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "type": "https://api.planeador.actinver.com/errors/internal",
            "title": "Error interno",
            "status": 500,
            "detail": "Ocurrió un error. Nuestro equipo fue notificado.",
        }
    )
```

## UX Writing Conventions (Brandbook Actinver)

```
✅ DO:
- "Tienes una oportunidad de crecer tu patrimonio" (empoderar)
- "Tu retiro comienza hoy. Da el siguiente paso." (fórmula: Meta + acción)
- "Actinver te acompaña" (acompañamiento)
- "Analizamos tu información" (voz activa)
- Oraciones < 20 palabras

❌ DON'T:
- "Tu patrimonio es insuficiente" (alarmar)
- "Se produjo un error en el sistema" (voz pasiva)
- "Nunca tendrás suficiente" (absolutos)
- "TIR del portafolio subyacente" (jerga sin explicar)
```
