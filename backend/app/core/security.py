from datetime import datetime, timedelta
from pathlib import Path
import bcrypt
from jose import JWTError, jwt
from app.core.config import settings


def load_key(path: str, private: bool = False):
    p = Path(path)
    if not p.exists():
        return None
    with open(p) as f:
        return f.read()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    private_key = load_key(settings.jwt_private_key_path, private=True)
    if private_key:
        return jwt.encode(to_encode, private_key, algorithm=settings.jwt_algorithm)
    return jwt.encode(to_encode, "dev_secret_change_in_prod", algorithm="HS256")


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    private_key = load_key(settings.jwt_private_key_path, private=True)
    if private_key:
        return jwt.encode(to_encode, private_key, algorithm=settings.jwt_algorithm)
    return jwt.encode(to_encode, "dev_secret_change_in_prod", algorithm="HS256")


def verify_token(token: str) -> dict | None:
    try:
        public_key = load_key(settings.jwt_public_key_path)
        if public_key:
            payload = jwt.decode(token, public_key, algorithms=[settings.jwt_algorithm])
        else:
            payload = jwt.decode(token, "dev_secret_change_in_prod", algorithms=["HS256"])
        return payload
    except JWTError:
        return None


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
