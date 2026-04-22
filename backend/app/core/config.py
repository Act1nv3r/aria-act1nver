from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Variables en backend/.env.local (recomendado) y/o backend/.env (.env.local gana si ambos existen)
_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_default = _backend_dir / ".env"
_env_local = _backend_dir / ".env.local"


def _env_file_tuple() -> tuple[str, ...] | None:
    paths: list[str] = []
    if _env_default.exists():
        paths.append(str(_env_default))
    if _env_local.exists():
        paths.append(str(_env_local))
    return tuple(paths) if paths else None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_file_tuple(),
        env_file_encoding="utf-8",
    )

    database_url: str = "postgresql+asyncpg://aria:aria_secret@localhost:5433/aria"
    redis_url: str = "redis://localhost:6380/0"
    jwt_private_key_path: str = "keys/private.pem"
    jwt_public_key_path: str = "keys/public.pem"
    jwt_algorithm: str = "RS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    cors_origins: str = "http://localhost:3001,http://127.0.0.1:3001,http://localhost:3000,http://127.0.0.1:3000"
    api_base_url: str = "http://localhost:8000"
    pgcrypto_key: str = "aria_encryption_key_32bytes!!"
    deepgram_api_key: str = ""
    anthropic_api_key: str = ""


settings = Settings()
