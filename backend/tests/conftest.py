"""
Shared test fixtures for the backend test suite.

Key design decisions:
- NullPool: SQLAlchemy's NullPool gives each DB operation a brand-new,
  independent connection instead of reusing slots from a shared pool.
  This is the canonical fix for asyncpg "another operation is in progress"
  errors that appear when pytest-asyncio reuses an event loop across tests
  while the pool holds connections in mid-operation state.
- scope="session": one AsyncClient + one JWT for the whole test run;
  eliminates per-test connection churn and pytest-asyncio loop-scope
  mismatches between module/function-scoped async fixtures.
- Dependency override at import time: ensures every request—including those
  from tests that create their own inline clients—hits the NullPool engine.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.database import get_db
from app.core.config import settings


# ---------------------------------------------------------------------------
# Test engine — NullPool means no connection is ever held open between
# await boundaries, so concurrent test coroutines can never collide.
# ---------------------------------------------------------------------------
_test_engine = create_async_engine(
    settings.database_url,
    poolclass=NullPool,
    echo=False,
)
_TestSession = async_sessionmaker(
    _test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def _override_get_db():
    async with _TestSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Override globally so every request—including inline clients in test_health—
# uses the NullPool engine.
app.dependency_overrides[get_db] = _override_get_db


# ---------------------------------------------------------------------------
# Shared client — session-scoped to avoid teardown/setup races between tests
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
async def client():
    """Single AsyncClient reused for the entire test session."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    # Clean up the NullPool engine at the very end of the session.
    await _test_engine.dispose()


@pytest.fixture(scope="session")
async def auth_headers(client: AsyncClient):
    """Login as maría once and return the Authorization header dict."""
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "maria@actinver.com", "password": "Test123!"},
    )
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
