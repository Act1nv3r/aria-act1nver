#!/usr/bin/env python3
"""
Prueba conexiones con Deepgram y Anthropic.
Ejecutar desde backend/: python scripts/test_api_keys.py
"""
import os
import sys

# Cargar .env desde backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings


def test_anthropic() -> bool:
    """Prueba conexión con Anthropic (Claude)."""
    if not settings.anthropic_api_key:
        print("❌ ANTHROPIC: No hay API key configurada")
        return False
    try:
        import httpx
        res = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 50,
                "messages": [{"role": "user", "content": "Di solo: OK"}],
            },
            timeout=15.0,
        )
        if res.status_code == 200:
            body = res.json()
            text = (body.get("content") or [{}])[0].get("text", "")
            print(f"✅ ANTHROPIC: Conexión OK. Respuesta: {text[:50]}")
            return True
        print(f"❌ ANTHROPIC: HTTP {res.status_code} - {res.text[:200]}")
        return False
    except Exception as e:
        print(f"❌ ANTHROPIC: Error - {e}")
        return False


def test_deepgram() -> bool:
    """Prueba conexión con Deepgram (listar proyectos)."""
    if not settings.deepgram_api_key:
        print("❌ DEEPGRAM: No hay API key configurada")
        return False
    try:
        import httpx
        res = httpx.get(
            "https://api.deepgram.com/v1/projects",
            headers={"Authorization": f"Token {settings.deepgram_api_key}"},
            timeout=10.0,
        )
        if res.status_code == 200:
            data = res.json()
            projects = data.get("projects", [])
            print(f"✅ DEEPGRAM: Conexión OK. Proyectos: {len(projects)}")
            return True
        print(f"❌ DEEPGRAM: HTTP {res.status_code} - {res.text[:200]}")
        return False
    except Exception as e:
        print(f"❌ DEEPGRAM: Error - {e}")
        return False


if __name__ == "__main__":
    print("Probando API keys...\n")
    a = test_anthropic()
    print()
    d = test_deepgram()
    print()
    if a and d:
        print("✅ Todas las conexiones OK")
        sys.exit(0)
    else:
        print("⚠️  Revisa las keys en backend/.env")
        sys.exit(1)
