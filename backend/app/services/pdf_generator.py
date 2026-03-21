import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

PDF_TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"


def _get_env():
    return Environment(loader=FileSystemLoader(str(PDF_TEMPLATES_DIR)))


def render_pdf_html(tipo: str, nombre: str, data: dict) -> str:
    """Render HTML for PDF from template."""
    env = _get_env()
    from datetime import datetime
    ctx = {
        "nombre": nombre,
        "fecha": datetime.now().strftime("%d/%m/%Y"),
        **data,
    }
    template_name = f"pdf_{tipo}.html"
    tpl = env.get_template(template_name)
    return tpl.render(**ctx)


def html_to_pdf(html: str) -> bytes:
    """Convert HTML to PDF using WeasyPrint."""
    try:
        from weasyprint import HTML
        from weasyprint.text.fonts import FontConfiguration
        font_config = FontConfiguration()
        doc = HTML(string=html)
        pdf_bytes = doc.write_pdf(font_config=font_config)
        return pdf_bytes
    except ImportError:
        raise RuntimeError("WeasyPrint no instalado. Ejecuta: pip install weasyprint")
    except Exception as e:
        raise RuntimeError(f"Error generando PDF: {e}")
