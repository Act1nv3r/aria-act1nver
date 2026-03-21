# PROMPT 21 - Tests Seguridad + CI/CD Pipeline
# Sprint 8 | 1.5 dias

## Tests Seguridad (backend/tests/test_security.py) - BLOQUEANTES en CI

test_campos_financieros_cifrados: INSERT via app -> SELECT raw de BD -> assert ilegible sin decrypt.
test_segregacion_asesores: crear clientes como Asesor A -> GET como Asesor B -> assert 404.
test_lista_solo_propios: 3 clientes de A + 2 de B -> GET como A -> assert len=3.
test_jwt_rs256: crear token -> get_unverified_header -> assert alg=RS256.
test_auditoria_append_only: intento DELETE en auditoria_log -> assert Exception.
test_login_rate_limit: 6 intentos fallidos en 1 min -> assert status 429.

## GitHub Actions (.github/workflows/ci.yml)

jobs: lint (ruff+mypy+eslint+tsc) -> test-backend (pytest --cov con postgres+redis services) -> test-security (BLOQUEANTE: si falla, pipeline se detiene) -> test-frontend (vitest) -> build (docker) -> deploy-staging (si branch develop).

Si algun test de seguridad falla: el PR no se puede mergear.
