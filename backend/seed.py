import asyncio
from sqlalchemy import select, text
from app.core.database import engine, AsyncSessionLocal, Base
from app.models import Asesor
from app.core.security import hash_password

ADMIN_ID = "00000000-0000-0000-0000-000000000001"
MARIA_ID = "00000000-0000-0000-0000-000000000002"
LTINAJERO_ID = "00000000-0000-0000-0000-000000000003"

ADMIN_EMAIL = "admin@actinver.com"
LEGACY_ADMIN_EMAIL = "admin@aria.actinver.com"
LTINAJERO_EMAIL = "ltinajero@actinver.com.mx"


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text("""
            ALTER TABLE diagnosticos ADD COLUMN IF NOT EXISTS objetivos_json JSONB;
        """)
        )


async def seed():
    await create_tables()
    async with AsyncSessionLocal() as db:
        # --- Primary admin (canonical id …001 or legacy / current email) ---
        r = await db.execute(select(Asesor).where(Asesor.id == ADMIN_ID))
        admin = r.scalar_one_or_none()
        if not admin:
            r = await db.execute(select(Asesor).where(Asesor.email == LEGACY_ADMIN_EMAIL))
            admin = r.scalar_one_or_none()
        if not admin:
            r = await db.execute(select(Asesor).where(Asesor.email == ADMIN_EMAIL))
            admin = r.scalar_one_or_none()

        if admin:
            admin.email = ADMIN_EMAIL
            admin.password_hash = hash_password("Test123!")
            admin.nombre = admin.nombre or "Admin Actinver"
            admin.rol = "admin"
        else:
            db.add(
                Asesor(
                    id=ADMIN_ID,
                    email=ADMIN_EMAIL,
                    password_hash=hash_password("Test123!"),
                    nombre="Admin Actinver",
                    rol="admin",
                )
            )

        # --- Second admin: ltinajero ---
        r_lt = await db.execute(select(Asesor).where(Asesor.email == LTINAJERO_EMAIL))
        lt = r_lt.scalar_one_or_none()
        if not lt:
            r_id = await db.execute(select(Asesor).where(Asesor.id == LTINAJERO_ID))
            lt = r_id.scalar_one_or_none()
        if lt:
            lt.email = LTINAJERO_EMAIL
            lt.password_hash = hash_password("Luis123!")
            lt.nombre = lt.nombre or "Luis Tinajero"
            lt.rol = "admin"
        else:
            db.add(
                Asesor(
                    id=LTINAJERO_ID,
                    email=LTINAJERO_EMAIL,
                    password_hash=hash_password("Luis123!"),
                    nombre="Luis Tinajero",
                    rol="admin",
                )
            )

        # --- Demo asesor ---
        r_maria = await db.execute(select(Asesor).where(Asesor.email == "maria@actinver.com"))
        if not r_maria.scalar_one_or_none():
            db.add(
                Asesor(
                    id=MARIA_ID,
                    email="maria@actinver.com",
                    password_hash=hash_password("Test123!"),
                    nombre="María González",
                    rol="asesor",
                )
            )

        await db.commit()
        print(f"Seed OK — {ADMIN_EMAIL} / Test123! | {LTINAJERO_EMAIL} / Luis123! | maria@actinver.com / Test123!")


if __name__ == "__main__":
    asyncio.run(seed())
