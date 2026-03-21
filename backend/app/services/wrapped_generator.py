"""
Sprint 25 - Wrapped server-side PNG generation with Pillow.
Generates 7 cards (1080x1920) matching the frontend design.
"""
import os
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
CARDS = ["intro", "nivel", "retiro", "reserva", "ahorro", "objetivos", "cta"]
BG_TOP = (10, 14, 18)  # #0A0E12
BG_BOTTOM = (26, 36, 51)  # #1A2433
TEXT_GRAY = (90, 106, 133)  # #5A6A85
TEXT_WHITE = (255, 255, 255)
ACCENT = (230, 199, 138)  # #E6C78A
GREEN = (49, 122, 112)  # #317A70


def _get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    base = Path(__file__).resolve().parent.parent.parent
    candidates = [
        base / "fonts" / ("Poppins-Bold.ttf" if bold else "Poppins-Regular.ttf"),
        base / "fonts" / "Poppins-Regular.ttf",
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") if bold else Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for p in candidates:
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except OSError:
                continue
    return ImageFont.load_default()


def _draw_gradient_bg(draw: ImageDraw.ImageDraw, img: Image.Image) -> None:
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))


def _draw_card_intro(img: Image.Image, draw: ImageDraw.ImageDraw, data: dict[str, Any]) -> None:
    _draw_gradient_bg(draw, img)
    font_sm = _get_font(36)
    font_lg = _get_font(64)
    font_xs = _get_font(28)
    nombre = data.get("nombre", "Cliente")
    fecha = data.get("fecha", "")
    draw.text((60, 80), "Tu diagnóstico financiero", fill=TEXT_GRAY, font=font_sm)
    draw.text((60, 140), nombre, fill=TEXT_WHITE, font=font_lg)
    draw.text((60, 220), fecha, fill=TEXT_GRAY, font=font_sm)
    draw.text((60, H - 80), "ArIA by Actinver", fill=ACCENT, font=font_xs)


def _draw_card_nivel(img: Image.Image, draw: ImageDraw.ImageDraw, data: dict[str, Any]) -> None:
    _draw_gradient_bg(draw, img)
    font_sm = _get_font(36)
    font_md = _get_font(48)
    nivel = data.get("nivel", "suficiente").replace("-", " ")
    draw.text((W // 2 - 150, H // 2 - 120), "Nivel de riqueza", fill=TEXT_GRAY, font=font_sm)
    draw.text((W // 2 - 100, H // 2 - 40), nivel, fill=ACCENT, font=font_md)
    draw.text((60, H - 80), "ArIA by Actinver", fill=ACCENT, font=_get_font(28))


def _draw_card_retiro(img: Image.Image, draw: ImageDraw.ImageDraw, data: dict[str, Any]) -> None:
    _draw_gradient_bg(draw, img)
    font_sm = _get_font(36)
    font_xl = _get_font(180)
    grado = data.get("grado_avance", 0)
    draw.text((W // 2 - 180, H // 2 - 200), "Grado de avance retiro", fill=TEXT_GRAY, font=font_sm)
    draw.text((W // 2 - 120, H // 2 - 100), f"{int(grado)}%", fill=ACCENT, font=font_xl)
    # progress bar
    bar_w, bar_h = 400, 20
    x, y = (W - bar_w) // 2, H // 2 + 60
    draw.rectangle([x, y, x + bar_w, y + bar_h], outline=TEXT_GRAY, width=2)
    draw.rectangle([x, y, x + int(bar_w * min(1, grado / 100)), y + bar_h], fill=ACCENT)
    draw.text((60, H - 80), "ArIA by Actinver", fill=ACCENT, font=_get_font(28))


def _draw_card_reserva(img: Image.Image, draw: ImageDraw.ImageDraw, data: dict[str, Any]) -> None:
    _draw_gradient_bg(draw, img)
    font_sm = _get_font(36)
    font_xl = _get_font(140)
    meses = data.get("meses_reserva", 0)
    draw.text((W // 2 - 200, H // 2 - 120), "Reserva de emergencia", fill=TEXT_GRAY, font=font_sm)
    draw.text((W // 2 - 150, H // 2 - 40), f"{meses:.0f} meses", fill=TEXT_WHITE, font=font_xl)
    draw.text((60, H - 80), "ArIA by Actinver", fill=ACCENT, font=_get_font(28))


def _draw_card_ahorro(img: Image.Image, draw: ImageDraw.ImageDraw, data: dict[str, Any]) -> None:
    _draw_gradient_bg(draw, img)
    font_sm = _get_font(36)
    font_xl = _get_font(140)
    ahorro_pct = data.get("ahorro_pct", "0")
    draw.text((W // 2 - 150, H // 2 - 140), "Ahorro vs ingresos", fill=TEXT_GRAY, font=font_sm)
    draw.text((W // 2 - 100, H // 2 - 60), f"{ahorro_pct}%", fill=ACCENT, font=font_xl)
    draw.text((W // 2 - 120, H // 2 + 60), "vs 10% recomendado", fill=TEXT_GRAY, font=font_sm)
    draw.text((60, H - 80), "ArIA by Actinver", fill=ACCENT, font=_get_font(28))


def _draw_card_objetivos(img: Image.Image, draw: ImageDraw.ImageDraw, data: dict[str, Any]) -> None:
    _draw_gradient_bg(draw, img)
    font_sm = _get_font(36)
    font_xl = _get_font(80)
    font_md = _get_font(44)
    objetivos = data.get("objetivos_count", 0)
    viables = data.get("viables_count", 0)
    draw.text((W // 2 - 80, H // 2 - 180), "Objetivos", fill=TEXT_GRAY, font=font_sm)
    draw.text((W // 2 - 80, H // 2 - 100), f"{objetivos} objetivos", fill=TEXT_WHITE, font=font_xl)
    draw.text((W // 2 - 60, H // 2 - 20), f"{viables} viables", fill=GREEN, font=font_md)
    draw.text((60, H - 80), "ArIA by Actinver", fill=ACCENT, font=_get_font(28))


def _draw_card_cta(img: Image.Image, draw: ImageDraw.ImageDraw, data: dict[str, Any]) -> None:
    _draw_gradient_bg(draw, img)
    font_xl = _get_font(64)
    draw.text((W // 2 - 200, H // 2 - 40), "Haz tu diagnóstico", fill=TEXT_WHITE, font=font_xl)
    draw.text((W // 2 - 100, H // 2 + 40), "ArIA by Actinver", fill=ACCENT, font=_get_font(28))


DRAWERS = {
    "intro": _draw_card_intro,
    "nivel": _draw_card_nivel,
    "retiro": _draw_card_retiro,
    "reserva": _draw_card_reserva,
    "ahorro": _draw_card_ahorro,
    "objetivos": _draw_card_objetivos,
    "cta": _draw_card_cta,
}


def generate_wrapped_images(
    data: dict[str, Any],
    base_url: str,
    diagnostico_id: str,
) -> list[dict[str, str]]:
    """
    Generate 7 PNG cards, save to /tmp, return [{tipo, imagen_url}].
    data: {nombre, nivel, grado_avance, meses_reserva, ahorro_pct, objetivos_count, viables_count, fecha}
    """
    from datetime import datetime
    data.setdefault("fecha", datetime.now().strftime("%d de %B de %Y"))
    if "fecha" in data and isinstance(data["fecha"], str) and "de" not in data["fecha"]:
        try:
            dt = datetime.fromisoformat(data["fecha"].replace("Z", "+00:00"))
            data["fecha"] = dt.strftime("%d de %B de %Y")
        except ValueError:
            pass
    tmpdir = Path(tempfile.gettempdir()) / "aria_wrapped"
    tmpdir.mkdir(exist_ok=True)
    prefix = f"{diagnostico_id[:8]}_"
    result = []
    for card in CARDS:
        img = Image.new("RGB", (W, H), BG_TOP)
        draw = ImageDraw.Draw(img)
        DRAWERS[card](img, draw, data)
        path = tmpdir / f"{prefix}{card}.png"
        img.save(path, "PNG", optimize=True)
        url = f"{base_url.rstrip('/')}/api/v1/diagnosticos/{diagnostico_id}/wrapped/{card}.png"
        result.append({"tipo": card, "imagen_url": url})
    return result
