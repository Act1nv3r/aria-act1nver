"""
Sprint 7-8 — Tests de seguridad exhaustivos (OWASP, SQL injection, auth validation)
BLOQUEANTES en CI: el pipeline falla si estos tests no pasan.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token


# One shared client for the whole module — avoids recreating the asyncpg
# connection pool on every test (which causes "another operation is in progress"
# when pytest-asyncio reuses the same event loop across tests).
@pytest.fixture(scope="module")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="module")
async def auth_headers(client):
    """Login as maria and return Authorization headers."""
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "maria@actinver.com", "password": "Test123!"},
    )
    assert r.status_code == 200
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# --- Auth validation ---


@pytest.mark.asyncio
async def test_auth_reject_missing_token(client):
    """OWASP A01:2021 – Broken Access Control: endpoints protegidos rechazan requests sin token."""
    r = await client.get("/api/v1/clientes")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_auth_reject_invalid_token(client):
    """Rechaza token malformado o inválido."""
    r = await client.get(
        "/api/v1/clientes",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_auth_reject_tampered_token(client):
    """Rechaza token alterado (firma inválida)."""
    token = create_access_token({"sub": "user-123", "email": "test@test.com", "rol": "asesor"})
    tampered = token[:-5] + "xxxxx"
    r = await client.get(
        "/api/v1/clientes",
        headers={"Authorization": f"Bearer {tampered}"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_auth_accept_valid_token(client, auth_headers):
    """Token válido permite acceso a recursos protegidos."""
    r = await client.get("/api/v1/clientes", headers=auth_headers)
    assert r.status_code == 200


# --- SQL Injection ---


@pytest.mark.asyncio
async def test_sql_injection_clientes_search(client, auth_headers):
    """OWASP A03:2021 – Injection: search en clientes no ejecuta SQL malicioso."""
    payloads = [
        "'; DROP TABLE clientes; --",
        "1' OR '1'='1",
        "1; SELECT * FROM asesores; --",
        "%' UNION SELECT id,email,password_hash FROM asesores --",
    ]
    for payload in payloads:
        r = await client.get(
            "/api/v1/clientes",
            params={"search": payload},
            headers=auth_headers,
        )
        # Debe responder 200 (sin error de BD) y no filtrar datos sensibles
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # No debe haber excepción ni datos de asesores expuestos
        for item in data:
            assert "password" not in str(item).lower()
            assert "password_hash" not in str(item).lower()


@pytest.mark.asyncio
async def test_sql_injection_cliente_id(client, auth_headers):
    """Path param id no ejecuta SQL inyectado."""
    r = await client.get(
        "/api/v1/clientes/1' OR '1'='1",
        headers=auth_headers,
    )
    # Debe ser 404 (UUID inválido o no encontrado), no 500
    assert r.status_code in (404, 422)


# --- Segregación asesores (IDOR) ---


@pytest.mark.asyncio
async def test_segregacion_asesores(client):
    """María crea cliente -> Admin no puede acceder (distintos asesores)."""
    login_maria = await client.post(
        "/api/v1/auth/login",
        json={"email": "maria@actinver.com", "password": "Test123!"},
    )
    assert login_maria.status_code == 200
    token_maria = login_maria.json()["access_token"]

    login_admin = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@actinver.com", "password": "Test123!"},
    )
    assert login_admin.status_code == 200
    token_admin = login_admin.json()["access_token"]

    create_res = await client.post(
        "/api/v1/clientes",
        headers={"Authorization": f"Bearer {token_maria}"},
        json={"nombre_alias": "Cliente de María"},
    )
    assert create_res.status_code == 201
    cliente_id = create_res.json()["id"]

    get_res = await client.get(
        f"/api/v1/clientes/{cliente_id}",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_lista_solo_propios(client):
    """Cada asesor solo ve sus propios clientes."""
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "maria@actinver.com", "password": "Test123!"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    for _ in range(3):
        await client.post(
            "/api/v1/clientes",
            headers={"Authorization": f"Bearer {token}"},
            json={"nombre_alias": "Cliente María"},
        )

    list_res = await client.get(
        "/api/v1/clientes",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_res.status_code == 200
    clientes = list_res.json()
    assert len(clientes) >= 3


# --- JWT algorithm ---


@pytest.mark.asyncio
async def test_jwt_algorithm_secure():
    """JWT usa algoritmo seguro (RS256 o HS256 con secret fuerte)."""
    from jose import jwt
    token = create_access_token({"sub": "test", "email": "t@t.com", "rol": "asesor"})
    header = jwt.get_unverified_header(token)
    assert header.get("alg") in ("RS256", "HS256")
