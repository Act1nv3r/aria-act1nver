/**
 * html2canvas cannot parse CSS Color 4 functions (lab, oklch, etc.) that Tailwind v4
 * and modern browsers resolve in computed styles. Runs in onclone() to flatten
 * those values to rgb()/rgba() using the browser's Canvas color parser.
 */

const MODERN_COLOR_FN = /\b(lab|oklab|lch|oklch|color|hwb)\s*\(/i;

const COLOR_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "column-rule-color",
  "caret-color",
  "fill",
  "stroke",
] as const;

function colorToRgb(ctx: CanvasRenderingContext2D, cssColor: string): string | null {
  const v = cssColor.trim();
  if (!v || v === "transparent" || v === "rgba(0, 0, 0, 0)") return null;
  if (!MODERN_COLOR_FN.test(v) && !/^color\s*\(/i.test(v)) return null;
  try {
    ctx.fillStyle = "#000000";
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const a = d[3] / 255;
    if (a < 0.999) return `rgba(${d[0]},${d[1]},${d[2]},${a})`;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  } catch {
    return null;
  }
}

/** Pass `document` from html2canvas's onclone callback. */
export function sanitizeClonedDocumentForHtml2Canvas(clonedDoc: Document): void {
  const win = clonedDoc.defaultView;
  if (!win) return;

  const probe = clonedDoc.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const nodeSet = new Set<Element>();
  if (clonedDoc.documentElement) nodeSet.add(clonedDoc.documentElement);
  if (clonedDoc.body) nodeSet.add(clonedDoc.body);
  clonedDoc.querySelectorAll("*").forEach((n) => nodeSet.add(n));

  nodeSet.forEach((node) => {
    if (!("style" in node) || !(node instanceof win.Element)) return;
    const style = (node as HTMLElement | SVGSVGElement).style;
    if (!style) return;

    const cs = win.getComputedStyle(node);

    for (const prop of COLOR_PROPS) {
      let val: string;
      try {
        val = cs.getPropertyValue(prop);
      } catch {
        continue;
      }
      if (!val) continue;
      const rgb = colorToRgb(ctx, val);
      if (rgb) style.setProperty(prop, rgb);
    }

    try {
      const bs = cs.getPropertyValue("box-shadow");
      if (bs && bs !== "none" && MODERN_COLOR_FN.test(bs)) {
        style.setProperty("box-shadow", "none");
      }
    } catch {
      /* ignore */
    }
    try {
      const ts = cs.getPropertyValue("text-shadow");
      if (ts && ts !== "none" && MODERN_COLOR_FN.test(ts)) {
        style.setProperty("text-shadow", "none");
      }
    } catch {
      /* ignore */
    }
    try {
      const bi = cs.getPropertyValue("background-image");
      if (bi && bi !== "none" && MODERN_COLOR_FN.test(bi)) {
        style.setProperty("background-image", "none");
      }
    } catch {
      /* ignore */
    }
  });
}
