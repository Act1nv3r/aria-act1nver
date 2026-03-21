# Testing Strategy — ArIA by Actinver

## Pirámide de Testing

```
              ┌─────────┐
              │   E2E   │  Playwright (5-10 flujos críticos)
              │  Tests  │  ~30 min en CI
            ┌─┴─────────┴─┐
            │ Integration  │  pytest + React Testing Library
            │    Tests     │  ~10 min en CI
          ┌─┴─────────────┴─┐
          │    Unit Tests    │  pytest (motors) + Vitest (hooks/utils)
          │   (Foundation)   │  ~3 min en CI
          └─────────────────┘
```

## Backend Testing

### Unit Tests (services/motor_*.py)
Cada motor tiene una suite de tests con datos del Excel original:

```python
# tests/test_motor_c.py
import pytest
from decimal import Decimal
from app.services.motor_c import MotorC

class TestMotorC:
    """Motor de Desacumulación — validación contra Excel"""

    @pytest.fixture
    def params(self):
        return {"tasa_real": Decimal("0.01")}

    def test_mensualidad_posible_escenario_excel(self, params):
        """Escenario: Juan Pérez, 50 años, retiro 60, patrimonio $2.3M"""
        result = MotorC().calculate(
            patrimonio=Decimal("2300000"),
            saldo_esquemas=Decimal("0"),
            edad=50, retiro=60, defuncion=90,
            aportaciones=Decimal("0"),
            params=params
        )
        # Excel: $8,175.39 — tolerancia ±$1
        assert abs(result.mensualidad_posible - Decimal("8175.39")) < 1

    def test_grado_avance(self, params):
        result = MotorC().calculate(...)
        # Excel: 77.1% — tolerancia ±0.1%
        assert abs(result.grado_avance - Decimal("0.771")) < Decimal("0.001")

    def test_division_por_cero_gastos(self, params):
        """Si gastos_basicos = 0, no debe crashear"""
        result = MotorC().calculate(gastos_basicos=Decimal("0"), ...)
        assert result.meses_cubiertos is None
        assert result.meses_cubiertos_error is not None

    @pytest.mark.parametrize("edad,retiro,expected_meses", [
        (50, 60, 360), (40, 65, 300), (55, 70, 240),
    ])
    def test_meses_jubilacion(self, edad, retiro, expected_meses, params):
        result = MotorC().calculate(edad=edad, retiro=retiro, defuncion=90, ...)
        assert result.meses_jubilacion == expected_meses
```

### Integration Tests (API endpoints)
```python
# tests/test_diagnosticos.py
class TestDiagnosticoFlow:
    """Test del flujo completo de diagnóstico via API"""

    async def test_flujo_completo(self, client, asesor_token):
        # 1. Crear cliente
        resp = await client.post("/api/v1/clientes", json={"nombre_alias": "Test"}, headers=auth(asesor_token))
        assert resp.status_code == 201
        cliente_id = resp.json()["id"]

        # 2. Crear diagnóstico
        resp = await client.post("/api/v1/diagnosticos", json={"cliente_id": cliente_id, "modo": "individual"}, headers=auth(asesor_token))
        assert resp.status_code == 201
        diag_id = resp.json()["id"]
        assert resp.json()["parametros_snapshot"]["tasa_real"] == 0.01

        # 3. Paso 1: Perfil
        resp = await client.put(f"/api/v1/diagnosticos/{diag_id}/perfil", json={
            "nombre": "Juan", "edad": 50, "genero": "H", "ocupacion": "asalariado", "dependientes": True
        }, headers=auth(asesor_token))
        assert resp.status_code == 200
        assert resp.json()["condicionales"]["ley73_visible"] == True  # edad > 46

        # ... pasos 2-6

    async def test_rls_cross_asesor(self, client, asesor_a_token, asesor_b_token):
        """Asesor B NO puede ver clientes de Asesor A"""
        # Crear cliente como Asesor A
        resp = await client.post("/api/v1/clientes", json={"nombre_alias": "ClienteA"}, headers=auth(asesor_a_token))
        cliente_id = resp.json()["id"]

        # Asesor B intenta acceder
        resp = await client.get(f"/api/v1/clientes/{cliente_id}", headers=auth(asesor_b_token))
        assert resp.status_code == 404  # No 403 (no revelar existencia)
```

### Security Tests (BLOQUEANTES en CI)
```python
# tests/test_security.py
class TestSecurity:
    """Tests de seguridad — SI FALLAN, CI SE DETIENE"""

    def test_cifrado_campos_financieros(self, db_session):
        """Verificar que campos financieros están cifrados en BD"""
        # Insertar dato vía app
        # Leer directamente de BD sin decrypt
        raw = db_session.execute(text("SELECT liquidez FROM patrimonio_financiero WHERE id = :id"), {"id": id})
        assert "200000" not in str(raw)  # No debe ser legible

    def test_rls_policy_exists(self, db_session):
        """Verificar que RLS está activo en tablas de cliente"""
        result = db_session.execute(text(
            "SELECT polname FROM pg_policies WHERE tablename = 'clientes'"
        ))
        assert len(result.fetchall()) > 0

    def test_auditoria_no_delete(self, db_session):
        """Verificar que auditoria_log no permite DELETE"""
        with pytest.raises(Exception):
            db_session.execute(text("DELETE FROM auditoria_log WHERE id = 1"))

    def test_jwt_rs256(self):
        """Verificar que tokens usan RS256 (no HS256)"""
        token = create_access_token(user_id="test")
        header = jwt.get_unverified_header(token)
        assert header["alg"] == "RS256"
```

## Frontend Testing

### Unit Tests (Vitest)
```typescript
// hooks/__tests__/use-auto-save.test.ts
describe('useAutoSave', () => {
  it('should save after 30 seconds of inactivity', async () => {
    const mockPut = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useAutoSave(data, '/api/test', 30000));

    // Simular cambio de datos
    act(() => result.current.updateData({ edad: 50 }));

    // Avanzar 30 segundos
    vi.advanceTimersByTime(30000);

    expect(mockPut).toHaveBeenCalledOnce();
  });

  it('should fallback to IndexedDB on network error', async () => {
    const mockPut = vi.fn().mockRejectedValue(new Error('Network'));
    // ... verificar que guarda en IndexedDB
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/diagnostico-completo.spec.ts
test.describe('Flujo completo de diagnóstico', () => {
  test('Asesor completa diagnóstico en 6 pasos', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name=email]', 'test@actinver.com');
    await page.fill('[name=password]', 'Test123!');
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL('/dashboard');

    // Crear cliente
    await page.click('button:has-text("Nuevo Cliente")');
    await page.fill('[name=nombre]', 'E2E Test');
    await page.click('button:has-text("Crear")');

    // Paso 1
    await page.fill('[name=edad]', '50');
    await page.selectOption('[name=genero]', 'Hombre');
    // ...completar todos los pasos

    // Verificar pantalla de éxito
    await expect(page.locator('text=Diagnóstico completo')).toBeVisible();

    // Descargar PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Descargar PDFs")'),
    ]);
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
```

## Matriz de Cobertura por Sprint

| Sprint | Tests Requeridos | Coverage Target |
|--------|-----------------|-----------------|
| S1 | Infra setup + auth unit tests | 80% backend core |
| S2 | Auth E2E + RLS security tests | 80% auth + security |
| S3-S4 | Motor A+B unit tests + Paso 1-2 component tests | 80% motors + UI |
| S5-S6 | Motor C+D+E+F unit tests + integration flow | 80% all motors |
| S7 | PDF generation tests + E2E flujo completo | 80% + 1 E2E flow |
| S8-S9 | Voice + Simulator + Pareja tests | 80% new features |
| S10 | Admin + Wrapped + full E2E suite | 80% overall + 5 E2E |

## Comando para Ejecutar Tests

```bash
# Todo
make test

# Backend
cd backend && pytest -v --cov=app --cov-report=term-missing

# Solo motores (rápido)
cd backend && pytest tests/test_motor_*.py -v

# Solo seguridad (bloqueante)
cd backend && pytest tests/test_security.py -v --tb=short

# Frontend unit
cd frontend && pnpm test

# E2E
cd frontend && pnpm test:e2e

# Linters
make lint  # ruff + mypy + eslint + tsc
```
