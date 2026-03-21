from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


async def _check_db() -> bool:
    try:
        from app.core.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def _check_redis() -> bool:
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        return True
    except Exception:
        return False


@router.get("/health")
async def health():
    db_ok = await _check_db()
    redis_ok = _check_redis()
    status = "healthy" if db_ok and redis_ok else "degraded"
    return {
        "status": status,
        "db": db_ok,
        "redis": redis_ok,
    }
