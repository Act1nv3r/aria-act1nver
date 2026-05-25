"use client";

import { useMemo } from "react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import {
  calcularMotorA,
  calcularMotorB,
  calcularMotorC,
  calcularMotorD,
  calcularMotorE,
  calcularMotorF,
} from "@/lib/motors";
import { formatMXN } from "@/lib/format-currency";

// ── Design tokens — Swiss Private Banking ────────────────────────────────────
const C = {
  // Backgrounds
  white:     "#FFFFFF",
  ivory:     "#FAF8F5",
  ivoryMid:  "#F4F1EC",
  // Navy (deep, not bright)
  navy:      "#0C1B33",
  navyMid:   "#152542",
  navyLight: "#1E3558",
  // Gold (muted antique — not orange)
  gold:      "#B39040",
  goldWarm:  "#C9A96E",
  goldLight: "#E8D9A8",
  goldFaint: "#F5EDD8",
  // Hairlines & borders
  hair:      "#DDD5C3",
  hairLight: "#EDE9E1",
  // Typography
  text:      "#1B2B3C",
  textMid:   "#4A5E72",
  textMuted: "#8A7E70",
  // State
  green:     "#1F6642",
  greenBg:   "#EAF4EE",
  greenMid:  "#2D7A50",
  orange:    "#9A5010",
  orangeBg:  "#FEF3E2",
  red:       "#8C1A1A",
  redBg:     "#FEF0EF",
};

const TOTAL_PAGES = 10;
const ALL_NIVELES = ["suficiente", "mejor", "bien", "genial", "on-fire"] as const;
const NIVEL_LABELS: Record<string, string> = {
  suficiente: "Suficiente",
  mejor:      "Mejor",
  bien:       "Bien",
  genial:     "Genial",
  "on-fire":  "On Fire",
};

// ── Shared primitives ─────────────────────────────────────────────────────────

const Hairline = ({ margin = "0 48px" }: { margin?: string }) => (
  <div style={{ margin, height: "1px", background: C.hair }} />
);

const PageHeader = ({
  section,
  clientName,
  pageNum,
}: {
  section: string;
  clientName: string;
  pageNum: number;
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 48px 12px" }}>
    <span style={{ fontSize: "9px", fontWeight: 700, color: C.navy, letterSpacing: "2px", textTransform: "uppercase" }}>
      Actinver Banca Privada
    </span>
    <span style={{ fontSize: "9px", color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase" }}>
      {section}
    </span>
    <span style={{ fontSize: "9px", color: C.textMuted }}>
      {clientName} · {pageNum}
    </span>
  </div>
);

const PageFooter = ({ page, total, note }: { page: number; total: number; note?: string }) => (
  <div style={{ padding: "10px 48px", borderTop: `1px solid ${C.hairLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: "8px", color: C.textMuted, maxWidth: "480px", lineHeight: 1.4 }}>
      {note ?? "Documento confidencial. Las proyecciones se basan en datos del cliente y no garantizan resultados futuros."}
    </span>
    <span style={{ fontSize: "9px", color: C.textMuted, flexShrink: 0, marginLeft: "16px" }}>
      {page} / {total}
    </span>
  </div>
);

const SectionLabel = ({ letter, title, subtitle }: { letter: string; title: string; subtitle?: string }) => (
  <div style={{ padding: "28px 48px 0" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
      <div style={{
        width: "22px", height: "22px", background: C.navy,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: C.goldWarm, letterSpacing: "0.5px" }}>{letter}</span>
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.navy, margin: 0, letterSpacing: "-0.3px", lineHeight: 1.2 }}>
        {title}
      </h2>
    </div>
    {subtitle && (
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 14px 0", paddingLeft: "34px", lineHeight: 1.5 }}>{subtitle}</p>
    )}
    <Hairline margin="0 0 20px 34px" />
  </div>
);

const SubHead = ({ children }: { children: React.ReactNode }) => (
  <div style={{ margin: "18px 48px 8px" }}>
    <p style={{ fontSize: "9px", fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "3px", margin: "0 0 6px 0" }}>
      {children}
    </p>
    <Hairline margin="0" />
  </div>
);

const KpiBlock = ({
  label, value, sub, accent = false,
}: { label: string; value: string; sub?: string; accent?: boolean }) => (
  <div style={{ flex: 1, padding: "16px 20px", borderRight: `1px solid ${C.hairLight}` }}>
    <p style={{ fontSize: "8px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 6px 0" }}>{label}</p>
    <p style={{ fontSize: "20px", fontWeight: 700, color: accent ? C.gold : C.navy, margin: "0 0 3px 0", lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>{sub}</p>}
  </div>
);

const DataRow = ({
  label, value, valueColor, muted, bold, indent, border = true,
}: {
  label: string; value: string; valueColor?: string;
  muted?: boolean; bold?: boolean; indent?: boolean; border?: boolean;
}) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: `${bold ? "9px" : "7px"} ${indent ? "60px" : "48px"}`,
    borderBottom: border ? `1px solid ${C.hairLight}` : "none",
  }}>
    <span style={{ fontSize: "11px", color: muted ? C.textMuted : C.text, fontWeight: bold ? 600 : 400 }}>{label}</span>
    <span style={{ fontSize: bold ? "13px" : "12px", fontWeight: bold ? 700 : 500, color: valueColor ?? (bold ? C.navy : C.textMid) }}>
      {value}
    </span>
  </div>
);

type RiesgoNivel = "Muy Alto" | "Alto" | "Medio" | "Bajo";
const RiskPill = ({ nivel }: { nivel: RiesgoNivel }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    "Muy Alto": { bg: C.redBg,    color: C.red    },
    Alto:       { bg: C.redBg,    color: C.red    },
    Medio:      { bg: C.orangeBg, color: C.orange },
    Bajo:       { bg: C.greenBg,  color: C.green  },
  };
  const s = cfg[nivel] ?? cfg.Medio;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: "2px", fontSize: "9px", fontWeight: 700,
      background: s.bg, color: s.color, whiteSpace: "nowrap", letterSpacing: "0.5px",
    }}>
      {nivel}
    </span>
  );
};

const BarRow = ({
  label, desc, value, total, color,
}: { label: string; desc?: string; value: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div style={{ padding: "0 48px", marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <div>
          <span style={{ fontSize: "11px", color: C.text, fontWeight: 600 }}>{label}</span>
          {desc && <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "8px" }}>{desc}</span>}
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: color }}>{pct.toFixed(0)}%</span>
          <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "8px" }}>{formatMXN(value)}</span>
        </div>
      </div>
      <div style={{ height: "4px", background: C.hairLight, borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "2px" }} />
      </div>
    </div>
  );
};

// ── Plan de Acción data builder ────────────────────────────────────────────────
interface PlanRow {
  aspecto: string;
  situacion: string;
  riesgo: RiesgoNivel;
  recomendacion: string;
}

function buildPlanDeAccion({
  motorA, motorB, motorC, motorE, proteccion, perfil, patrimonio,
}: {
  motorA: ReturnType<typeof calcularMotorA>;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  proteccion: { seguro_vida: boolean; propiedades_aseguradas: boolean | null; sgmm: boolean } | null;
  perfil: { dependientes: boolean; edad: number } | null;
  patrimonio: { casa: number; tierra: number; herencia: number; inmuebles_renta: number; negocio: number } | null;
}): PlanRow[] {
  const rows: PlanRow[] = [];
  const meses = motorA.meses_cubiertos ?? 0;
  if (meses >= 12) rows.push({ aspecto: "Liquidez", situacion: "En exceso", riesgo: "Bajo", recomendacion: "Diversificar excedente hacia inversiones de mayor rendimiento" });
  else if (meses >= 3) rows.push({ aspecto: "Liquidez", situacion: "Reserva adecuada", riesgo: "Bajo", recomendacion: "Mantener reserva de emergencia y optimizar el excedente" });
  else rows.push({ aspecto: "Liquidez", situacion: "Reserva insuficiente", riesgo: "Alto", recomendacion: "Incrementar reserva de emergencia a mínimo 3 meses de gastos" });

  const ratio = motorB.ratio;
  if (ratio >= 5) rows.push({ aspecto: "Riqueza Financiera", situacion: "Sólida y en crecimiento", riesgo: "Bajo", recomendacion: "Optimizar rendimientos y diversificar portafolio" });
  else if (ratio >= 2) rows.push({ aspecto: "Riqueza Financiera", situacion: "En crecimiento", riesgo: "Bajo", recomendacion: "Incrementar Patrimonio Financiero Disponible" });
  else rows.push({ aspecto: "Riqueza Financiera", situacion: "Comprometida por obligaciones", riesgo: "Medio", recomendacion: "Incrementar Patrimonio Financiero y reducir pasivos" });

  const invPct = motorA.ingresos_totales > 0 ? Math.round((motorA.remanente / motorA.ingresos_totales) * 100) : 0;
  if (invPct >= 40) rows.push({ aspecto: "Inversión", situacion: `${invPct}% de ingresos — Excelente`, riesgo: "Bajo", recomendacion: "Incrementar Patrimonio Financiero con excedente" });
  else if (invPct >= 20) rows.push({ aspecto: "Inversión", situacion: `${invPct}% de ingresos — Moderado`, riesgo: "Medio", recomendacion: "Aumentar tasa de ahorro / inversión hasta 40%" });
  else rows.push({ aspecto: "Inversión", situacion: `${invPct}% de ingresos — Bajo`, riesgo: "Alto", recomendacion: "Reestructurar gastos e incrementar aportación mensual" });

  const noFin = motorE.no_financiero;
  if (noFin > motorE.financiero * 2) rows.push({ aspecto: "Inmuebles", situacion: "Alta participación patrimonial", riesgo: "Bajo", recomendacion: "Posibilidad de crédito para inversión financiera" });
  else if (noFin > 0) rows.push({ aspecto: "Inmuebles", situacion: "Participación equilibrada", riesgo: "Bajo", recomendacion: "Mantener y valorizar activos inmobiliarios" });
  else rows.push({ aspecto: "Inmuebles", situacion: "Sin activos inmobiliarios", riesgo: "Bajo", recomendacion: "Considerar adquisición de bien raíz a mediano plazo" });

  const tieneVida = proteccion?.seguro_vida ?? false;
  const tieneSGMM = proteccion?.sgmm ?? false;
  if (!tieneVida && !tieneSGMM) rows.push({ aspecto: "Seguros", situacion: "Insuficientes", riesgo: "Alto", recomendacion: "Contratar póliza de vida y Seguro de Gastos Médicos Mayores" });
  else if (!tieneVida) rows.push({ aspecto: "Seguros", situacion: "Sin seguro de vida", riesgo: "Alto", recomendacion: "Contratar póliza de protección de vida" });
  else if (!tieneSGMM) rows.push({ aspecto: "Seguros", situacion: "Sin SGMM", riesgo: "Medio", recomendacion: "Contratar Seguro de Gastos Médicos Mayores" });
  else rows.push({ aspecto: "Seguros", situacion: "Coberturas vigentes", riesgo: "Bajo", recomendacion: "Revisar sumas aseguradas anualmente" });

  const tieneDep = perfil?.dependientes ?? false;
  if (tieneDep && !tieneVida) rows.push({ aspecto: "Dependientes", situacion: "Expuestos — sin seguro de vida", riesgo: "Alto", recomendacion: "Contratar seguro de vida con suma asegurada suficiente" });
  else if (tieneDep) rows.push({ aspecto: "Dependientes", situacion: "Cubiertos parcialmente", riesgo: "Bajo", recomendacion: "Verificar suma asegurada cubra 3 años de gastos" });
  else rows.push({ aspecto: "Dependientes", situacion: "Sin dependientes económicos", riesgo: "Bajo", recomendacion: "Planificar en caso de cambios de vida futuros" });

  const grado = motorC.grado_avance;
  if (grado >= 1) rows.push({ aspecto: "Retiro", situacion: "Suficiente para calidad de vida deseada", riesgo: "Bajo", recomendacion: "Optimizar rendimiento de esquemas de retiro" });
  else if (grado >= 0.6) rows.push({ aspecto: "Retiro", situacion: `Avance al ${Math.round(grado * 100)}% de meta`, riesgo: "Medio", recomendacion: "Incrementar aportación a plan de pensiones privado" });
  else rows.push({ aspecto: "Retiro", situacion: "Insuficiente para calidad deseada", riesgo: "Medio", recomendacion: "Aportar plan de pensiones privado de forma urgente" });

  const hayInmuebles = (patrimonio?.casa ?? 0) + (patrimonio?.tierra ?? 0) + (patrimonio?.inmuebles_renta ?? 0) > 0;
  const hayNegocio = (patrimonio?.negocio ?? 0) > 0;
  if (hayInmuebles || hayNegocio) rows.push({ aspecto: "Sucesión", situacion: "Bienes inmuebles" + (hayNegocio ? " y empresa" : ""), riesgo: "Bajo", recomendacion: "Planificar vehículo de sucesión (fideicomiso / testamento)" });
  else rows.push({ aspecto: "Sucesión", situacion: "Sin activos físicos registrados", riesgo: "Bajo", recomendacion: "Contemplar testamento y planificación patrimonial preventiva" });

  return rows;
}

// ── PAGE 1 — Portada ──────────────────────────────────────────────────────────
function Page1Cover({
  clientName, fecha, motorB, motorC, motorE, motorA,
}: {
  clientName: string; fecha: string;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  motorA: ReturnType<typeof calcularMotorA>;
}) {
  const invPct = motorA.ingresos_totales > 0
    ? Math.round((motorA.remanente / motorA.ingresos_totales) * 100) : 0;

  return (
    <div data-pdf-page="1" style={{
      width: "794px", height: "1123px", overflow: "hidden",
      display: "flex", flexDirection: "column",
      background: C.navy,
    }}>
      {/* Gold accent top */}
      <div style={{ height: "3px", background: C.gold, flexShrink: 0 }} />

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 56px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.white, letterSpacing: "0.5px" }}>Actinver</span>
          <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: "10px", color: C.goldWarm, letterSpacing: "1.5px", textTransform: "uppercase" }}>Banca Privada</span>
        </div>
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase" }}>
          Diagnóstico Patrimonial Privado
        </span>
      </div>

      {/* Thin hairline */}
      <div style={{ margin: "18px 56px 0", height: "1px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

      {/* Hero content */}
      <div style={{ padding: "52px 56px 32px", flexShrink: 0 }}>
        <p style={{ fontSize: "9px", color: C.gold, letterSpacing: "4px", textTransform: "uppercase", margin: "0 0 20px 0", fontWeight: 600 }}>
          Preparado exclusivamente para
        </p>
        <h1 style={{ fontSize: "46px", fontWeight: 800, color: C.white, lineHeight: 1.0, margin: "0 0 12px 0", letterSpacing: "-1.5px" }}>
          {clientName}
        </h1>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "0 0 28px 0", letterSpacing: "0.5px" }}>{fecha}</p>
        {/* Gold rule */}
        <div style={{ width: "32px", height: "2px", background: C.gold }} />
      </div>

      {/* 4 KPIs in a clean row */}
      <div style={{
        display: "flex", margin: "0 56px 32px",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: "2px", overflow: "hidden", flexShrink: 0,
      }}>
        {[
          { label: "Patrimonio Neto", value: formatMXN(motorE.patrimonio_neto), sub: "Activos menos obligaciones" },
          { label: "Longevidad Financiera", value: `${motorB.longevidad_recursos.toFixed(0)} años`, sub: "Sin nuevos aportes" },
          { label: "Ingreso Disponible", value: `${invPct}%`, sub: "Del ingreso para invertir" },
          { label: "Avance al Retiro", value: motorC.grado_avance >= 1 ? "Meta alcanzada" : `${(motorC.grado_avance * 100).toFixed(0)}%`, sub: "De la meta proyectada" },
        ].map((m, i) => (
          <div key={m.label} style={{
            flex: 1, padding: "18px 20px",
            borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
            background: "rgba(255,255,255,0.03)",
          }}>
            <p style={{ fontSize: "8px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 8px 0" }}>{m.label}</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: C.goldWarm, margin: "0 0 4px 0", lineHeight: 1 }}>{m.value}</p>
            <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Nivel patrimonial track */}
      <div style={{ padding: "0 56px 28px", flexShrink: 0 }}>
        <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.3)", marginBottom: "10px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>
          Nivel patrimonial · etapa de vida
        </p>
        <div style={{ display: "flex", gap: "4px" }}>
          {ALL_NIVELES.map((n) => {
            const active = n === motorB.nivel_riqueza;
            return (
              <div key={n} style={{
                flex: 1, textAlign: "center", padding: "6px 4px",
                borderBottom: active ? `2px solid ${C.gold}` : "2px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontSize: "9px", fontWeight: active ? 700 : 400, color: active ? C.goldWarm : "rgba(255,255,255,0.25)", letterSpacing: "0.5px" }}>
                  {NIVEL_LABELS[n]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thin divider */}
      <div style={{ margin: "0 56px 28px", height: "1px", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

      {/* Table of contents */}
      <div style={{ padding: "0 56px", flex: 1 }}>
        <p style={{ fontSize: "8px", fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "3px", margin: "0 0 16px 0" }}>
          Contenido de este reporte
        </p>
        {[
          { letter: "A", title: "Resumen Ejecutivo", desc: "Los cinco indicadores que definen tu salud financiera hoy" },
          { letter: "B", title: "Plan de Acción", desc: "Situación y recomendaciones concretas en cada área patrimonial" },
          { letter: "C", title: "Diagnóstico Patrimonial", desc: "Balance completo de activos, pasivos y patrimonio neto" },
          { letter: "D", title: "Flujo de Vida", desc: "Ingresos, gastos y capacidad de inversión mensual" },
          { letter: "E", title: "Potencial del Balance", desc: "Solvencia, estructura y apalancamiento de tu patrimonio" },
        ].map((sec, i) => (
          <div key={sec.letter} style={{
            display: "flex", gap: "14px", alignItems: "flex-start",
            paddingBottom: "11px", marginBottom: "11px",
            borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{
              width: "18px", height: "18px", background: "rgba(179,144,64,0.15)",
              border: `1px solid rgba(179,144,64,0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px",
            }}>
              <span style={{ fontSize: "9px", fontWeight: 700, color: C.gold }}>{sec.letter}</span>
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: C.white, margin: "0 0 2px 0" }}>{sec.title}</p>
              <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{sec.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cover footer */}
      <div style={{ padding: "14px 56px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.5px" }}>
          Documento confidencial — para uso exclusivo del titular
        </span>
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)" }}>1 / {TOTAL_PAGES}</span>
      </div>
    </div>
  );
}

// ── PAGE 2 — A · Resumen Ejecutivo ───────────────────────────────────────────
function Page2ResumenEjecutivo({
  clientName, motorA, motorB, motorC, motorE, motorD, perfil, objetivos,
}: {
  clientName: string;
  motorA: ReturnType<typeof calcularMotorA>;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  motorD: ReturnType<typeof calcularMotorD> | null;
  perfil: { edad: number } | null;
  objetivos: { lista: { nombre: string; monto: number; plazo: number }[] } | null;
}) {
  const solvPct = motorE.indice_solvencia * 100;
  const grado = motorC.grado_avance;
  const longevidad = motorB.longevidad_recursos;
  const invPct = motorA.ingresos_totales > 0 ? Math.round((motorA.remanente / motorA.ingresos_totales) * 100) : 0;
  const legado = motorD?.legado ?? 0;
  const edad = perfil?.edad ?? 35;

  const indicadores = [
    {
      label: "A1 · Patrimonio Neto",
      valor: formatMXN(motorE.patrimonio_neto),
      detalle: `Nivel: ${NIVEL_LABELS[motorB.nivel_riqueza] ?? motorB.nivel_riqueza}`,
      status: motorE.patrimonio_neto > 0 ? "ok" : "warn",
      nota: "Activos totales menos pasivos. Base de tu riqueza.",
    },
    {
      label: "A2 · Longevidad Financiera",
      valor: `${longevidad.toFixed(0)} años`,
      detalle: `Hasta los ${Math.round(edad + longevidad)} años estimados`,
      status: longevidad >= 30 ? "ok" : longevidad >= 15 ? "warn" : "alert",
      nota: "Tiempo que duran tus recursos sin nuevas aportaciones.",
    },
    {
      label: "A3 · Solvencia Patrimonial",
      valor: `${solvPct.toFixed(0)}%`,
      detalle: motorE.clasificacion_solvencia,
      status: solvPct >= 70 ? "ok" : solvPct >= 40 ? "warn" : "alert",
      nota: `Apalancamiento potencial: ${formatMXN(motorE.potencial_apalancamiento)}`,
    },
    {
      label: "A4 · Avance al Retiro",
      valor: `${(grado * 100).toFixed(0)}%`,
      detalle: `Mensualidad posible: ${formatMXN(motorC.pension_fija_total)}/mes`,
      status: grado >= 1 ? "ok" : grado >= 0.6 ? "warn" : "alert",
      nota: motorC.aportacion_necesaria ? `Aportación adicional sugerida: ${formatMXN(motorC.aportacion_necesaria)}/mes` : "Meta de retiro en camino.",
    },
    {
      label: "A5 · Legado Estimado",
      valor: legado > 0 ? formatMXN(legado) : "No proyectado",
      detalle: objetivos && objetivos.lista.length > 0 ? `${objetivos.lista.length} objetivos financieros registrados` : "Sin objetivos adicionales",
      status: legado > 0 ? "ok" : "neutral",
      nota: "Patrimonio proyectado al cierre de la etapa de vida.",
    },
  ];

  const statusColor = (s: string) =>
    s === "ok" ? C.green : s === "warn" ? C.orange : s === "alert" ? C.red : C.textMuted;
  const statusBg = (s: string) =>
    s === "ok" ? C.greenBg : s === "warn" ? C.orangeBg : s === "alert" ? C.redBg : C.ivory;

  return (
    <div data-pdf-page="2" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Resumen Ejecutivo" clientName={clientName} pageNum={2} />
      <Hairline />
      <SectionLabel letter="A" title="Resumen Ejecutivo" subtitle="Los cinco indicadores que definen tu situación financiera hoy" />

      {/* 5 indicator cards */}
      <div style={{ flex: 1, padding: "0 48px", display: "flex", flexDirection: "column", gap: "0" }}>
        {indicadores.map((ind, i) => (
          <div key={ind.label} style={{
            display: "flex", gap: "0", alignItems: "stretch",
            background: i % 2 === 0 ? C.white : C.ivory,
            borderBottom: `1px solid ${C.hairLight}`,
          }}>
            {/* Status bar */}
            <div style={{ width: "3px", background: statusColor(ind.status), flexShrink: 0 }} />
            {/* Label col */}
            <div style={{ width: "180px", padding: "16px 16px 16px 14px", borderRight: `1px solid ${C.hairLight}`, flexShrink: 0 }}>
              <p style={{ fontSize: "9px", fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 4px 0" }}>
                {ind.label}
              </p>
              <p style={{ fontSize: "8px", color: C.textMuted, margin: 0, lineHeight: 1.4 }}>{ind.nota}</p>
            </div>
            {/* Value col */}
            <div style={{ width: "160px", padding: "16px 20px", borderRight: `1px solid ${C.hairLight}`, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: statusColor(ind.status), margin: "0 0 3px 0", lineHeight: 1 }}>{ind.valor}</p>
              <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>{ind.detalle}</p>
            </div>
            {/* Detail col */}
            <div style={{ flex: 1, padding: "16px 20px", display: "flex", alignItems: "center" }}>
              {ind.label.startsWith("A4") ? (
                <div style={{ width: "100%" }}>
                  <div style={{ height: "4px", background: C.hairLight, borderRadius: "2px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ width: `${Math.min(grado * 100, 100)}%`, height: "100%", background: statusColor(ind.status), borderRadius: "2px" }} />
                  </div>
                  <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>
                    {grado >= 1 ? "Objetivo de retiro alcanzado" : `Faltan ${((1 - grado) * 100).toFixed(0)} puntos para la meta`}
                  </p>
                </div>
              ) : ind.label.startsWith("A1") ? (
                <div style={{ display: "flex", gap: "16px" }}>
                  <div>
                    <p style={{ fontSize: "9px", color: C.textMuted, margin: "0 0 2px 0" }}>Activos</p>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: C.navy, margin: 0 }}>{formatMXN(motorE.activos_total)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", color: C.textMuted, margin: "0 0 2px 0" }}>Pasivos</p>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: C.orange, margin: 0 }}>{formatMXN(motorE.pasivos_total)}</p>
                  </div>
                </div>
              ) : ind.label.startsWith("A3") ? (
                <div style={{ width: "100%" }}>
                  <div style={{ height: "4px", background: C.hairLight, borderRadius: "2px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ width: `${Math.min(solvPct, 100)}%`, height: "100%", background: statusColor(ind.status), borderRadius: "2px" }} />
                  </div>
                  <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>
                    Deuda: {motorE.pasivos_total > 0 ? ((motorE.pasivos_total / motorE.activos_total) * 100).toFixed(0) : 0}% de activos
                  </p>
                </div>
              ) : (
                <div style={{ padding: "8px 12px", background: statusBg(ind.status), borderRadius: "2px" }}>
                  <p style={{ fontSize: "9px", color: statusColor(ind.status), fontWeight: 600, margin: 0 }}>
                    {ind.status === "ok" ? "En orden" : ind.status === "warn" ? "Oportunidad de mejora" : ind.status === "alert" ? "Atención requerida" : "—"}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{ padding: "16px 48px", background: C.ivory, borderTop: `1px solid ${C.hairLight}`, flexShrink: 0 }}>
        <p style={{ fontSize: "10px", color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
          Este resumen consolida los resultados de los seis motores de análisis patrimonial. Cada indicador se actualiza en tiempo real conforme evoluciona tu situación.
        </p>
      </div>

      <PageFooter page={2} total={TOTAL_PAGES} />
    </div>
  );
}

// ── PAGE 3 — B · Plan de Acción ───────────────────────────────────────────────
function Page3PlanDeAccion({ clientName, rows }: { clientName: string; rows: PlanRow[] }) {
  const altas = rows.filter((r) => r.riesgo === "Alto" || r.riesgo === "Muy Alto").length;
  const bajas = rows.filter((r) => r.riesgo === "Bajo").length;

  return (
    <div data-pdf-page="3" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Plan de Acción" clientName={clientName} pageNum={3} />
      <Hairline />
      <SectionLabel letter="B" title="Plan de Acción" subtitle="Diagnóstico por área patrimonial y pasos concretos recomendados" />

      {/* Table header */}
      <div style={{ display: "flex", padding: "8px 48px", background: C.navy, margin: "0 0 0 0" }}>
        {[
          { label: "Área", flex: 1.2 },
          { label: "Situación actual", flex: 2 },
          { label: "Prioridad", flex: 0.8 },
          { label: "Acción recomendada", flex: 2.5 },
        ].map((col) => (
          <div key={col.label} style={{ flex: col.flex }}>
            <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
              {col.label}
            </span>
          </div>
        ))}
      </div>

      {/* Table rows */}
      {rows.map((row, i) => (
        <div key={row.aspecto} style={{
          display: "flex", padding: "10px 48px",
          background: i % 2 === 0 ? C.white : C.ivory,
          borderBottom: `1px solid ${C.hairLight}`,
          alignItems: "flex-start",
        }}>
          <div style={{ flex: 1.2 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy }}>{row.aspecto}</span>
          </div>
          <div style={{ flex: 2 }}>
            <span style={{ fontSize: "11px", color: C.text }}>{row.situacion}</span>
          </div>
          <div style={{ flex: 0.8 }}>
            <RiskPill nivel={row.riesgo} />
          </div>
          <div style={{ flex: 2.5 }}>
            <span style={{ fontSize: "11px", color: C.textMid }}>{row.recomendacion}</span>
          </div>
        </div>
      ))}

      {/* Summary strip */}
      <div style={{ margin: "20px 48px 0", display: "flex", gap: "12px" }}>
        <div style={{ flex: 1, padding: "14px 20px", background: altas > 0 ? C.redBg : C.greenBg, borderRadius: "2px", border: `1px solid ${altas > 0 ? "#E8AAAA" : "#A8D8B8"}` }}>
          <p style={{ fontSize: "9px", color: altas > 0 ? C.red : C.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 4px 0" }}>
            Atención prioritaria
          </p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: altas > 0 ? C.red : C.green, margin: 0 }}>{altas} área{altas !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ flex: 1, padding: "14px 20px", background: C.greenBg, borderRadius: "2px", border: `1px solid #A8D8B8` }}>
          <p style={{ fontSize: "9px", color: C.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 4px 0" }}>
            Bases sólidas
          </p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.green, margin: 0 }}>{bajas} área{bajas !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ flex: 2, padding: "14px 20px", background: C.ivory, borderRadius: "2px", border: `1px solid ${C.hair}` }}>
          <p style={{ fontSize: "9px", color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0" }}>
            Próximo paso sugerido
          </p>
          <p style={{ fontSize: "10px", color: C.text, margin: 0, lineHeight: 1.5 }}>
            {altas > 0
              ? "Agenda con tu asesor para priorizar las áreas de atención urgente antes de 30 días."
              : "Tu portafolio está bien estructurado. Enfócate en optimizar rendimientos y diversificación."}
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={3} total={TOTAL_PAGES} />
    </div>
  );
}

// ── PAGE 4 — C · Diagnóstico Patrimonial ─────────────────────────────────────
function Page4DiagnosticoPatrimonial({
  clientName, motorE, motorB, patrimonio,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
  motorB: ReturnType<typeof calcularMotorB>;
  patrimonio: {
    liquidez: number; inversiones: number; dotales: number;
    afore: number; ppr: number; plan_privado: number; seguros_retiro: number;
    casa: number; tierra: number; herencia: number;
    inmuebles_renta: number; negocio: number;
    hipoteca: number; saldo_planes: number; compromisos: number;
  };
}) {
  const indLiquidez = motorB.gasto_anual > 0 ? motorE.patrimonio_neto / motorB.gasto_anual : 0;
  const retiroVal = patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;
  const finActivo = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales;

  return (
    <div data-pdf-page="4" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Diagnóstico Patrimonial" clientName={clientName} pageNum={4} />
      <Hairline />
      <SectionLabel letter="C" title="Diagnóstico Patrimonial" subtitle="Balance completo de todo lo que tienes, lo que debes y tu riqueza neta" />

      {/* Balance sheet — two columns */}
      <div style={{ display: "flex", gap: "1px", margin: "0 48px 16px", background: C.hair }}>
        {/* ACTIVOS */}
        <div style={{ flex: 1, background: C.white, padding: "16px 20px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "3px", margin: "0 0 12px 0" }}>Activos</p>
          {[
            { label: "Liquidez y efectivo", value: patrimonio.liquidez, indent: true },
            { label: "Inversiones y fondos", value: patrimonio.inversiones + patrimonio.dotales, indent: true },
            { label: "Activos financieros", value: finActivo, bold: true },
            { label: "Inmuebles propios", value: patrimonio.casa + patrimonio.tierra + patrimonio.herencia, indent: true },
            { label: "Activos productivos", value: patrimonio.inmuebles_renta + patrimonio.negocio, indent: true },
            { label: "Esquemas de retiro", value: retiroVal, indent: true },
            { label: "Total activos", value: motorE.activos_total, bold: true },
          ].map((row) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between",
              padding: `${row.bold ? "8px 0" : "5px 0"} `,
              borderBottom: `1px solid ${C.hairLight}`,
              paddingLeft: row.indent ? "12px" : "0",
            }}>
              <span style={{ fontSize: "11px", color: row.bold ? C.navy : C.text, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
              <span style={{ fontSize: row.bold ? "13px" : "12px", fontWeight: row.bold ? 700 : 500, color: row.bold ? C.navy : C.textMid }}>{formatMXN(row.value)}</span>
            </div>
          ))}
        </div>
        {/* PASIVOS */}
        <div style={{ flex: 1, background: C.white, padding: "16px 20px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "3px", margin: "0 0 12px 0" }}>Pasivos y Patrimonio Neto</p>
          {[
            { label: "Crédito hipotecario", value: patrimonio.hipoteca, indent: true },
            { label: "Saldo de planes / créditos", value: patrimonio.saldo_planes, indent: true },
            { label: "Compromisos financieros", value: patrimonio.compromisos, indent: true },
            { label: "Total pasivos", value: motorE.pasivos_total, bold: true },
            { label: "Patrimonio Neto", value: motorE.patrimonio_neto, bold: true, accent: true },
          ].map((row) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between",
              padding: `${row.bold ? "8px 0" : "5px 0"}`,
              borderBottom: `1px solid ${C.hairLight}`,
              paddingLeft: row.indent ? "12px" : "0",
            }}>
              <span style={{ fontSize: "11px", color: (row as { accent?: boolean }).accent ? C.green : row.bold ? C.navy : C.text, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
              <span style={{ fontSize: row.bold ? "13px" : "12px", fontWeight: row.bold ? 700 : 500, color: (row as { accent?: boolean }).accent ? C.green : row.bold ? C.navy : C.textMid }}>{formatMXN(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liquidez banner */}
      <div style={{ margin: "0 48px 16px", display: "flex", gap: "12px" }}>
        <div style={{ flex: 1, border: `1px solid ${C.hair}`, padding: "14px 20px", borderRadius: "2px" }}>
          <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Índice de liquidez</p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.navy, margin: "0 0 3px 0" }}>{indLiquidez.toFixed(1)} años</p>
          <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>de gastos corrientes cubiertos por patrimonio</p>
        </div>
        <div style={{ flex: 1, border: `1px solid ${C.hair}`, padding: "14px 20px", borderRadius: "2px" }}>
          <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Longevidad financiera</p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.gold, margin: "0 0 3px 0" }}>{motorB.longevidad_recursos.toFixed(0)} años</p>
          <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>sin nuevas aportaciones</p>
        </div>
        <div style={{ flex: 1, border: `1px solid ${C.hair}`, padding: "14px 20px", borderRadius: "2px" }}>
          <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Proporción Fin / No Fin</p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.navy, margin: "0 0 3px 0" }}>
            {motorE.activos_total > 0 ? ((motorE.financiero / motorE.activos_total) * 100).toFixed(0) : 0}%
          </p>
          <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>de activos son financieros</p>
        </div>
      </div>

      {/* Asset structure bars */}
      <SubHead>Estructura del activo</SubHead>
      <div style={{ padding: "12px 0 0 0" }}>
        {[
          { label: "Financiero líquido", value: finActivo, color: C.navy },
          { label: "Esquemas de retiro", value: retiroVal, color: C.navyLight },
          { label: "Patrimonio inmobiliario", value: motorE.no_financiero, color: C.gold },
        ].map((cat) => (
          <BarRow key={cat.label} label={cat.label} value={cat.value} total={motorE.activos_total} color={cat.color} />
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={4} total={TOTAL_PAGES} />
    </div>
  );
}

// ── PAGE 5 — D · Flujo de Vida ───────────────────────────────────────────────
function Page5FlujodeVida({
  clientName, motorA, flujoMensual, patrimonio,
}: {
  clientName: string;
  motorA: ReturnType<typeof calcularMotorA>;
  flujoMensual: { ahorro: number; rentas: number; otros: number; gastos_basicos: number; obligaciones: number; creditos: number };
  patrimonio: { inmuebles_renta: number };
}) {
  const ingresos = motorA.ingresos_totales;
  const gastos = motorA.gastos_totales;
  const disponible = Math.max(ingresos - gastos, 0);
  const pct = (v: number) => (ingresos > 0 ? ((v / ingresos) * 100).toFixed(0) : "0");
  const pctNum = (v: number) => (ingresos > 0 ? (v / ingresos) * 100 : 0);
  const rentalYield = flujoMensual.rentas > 0 && patrimonio.inmuebles_renta > 0
    ? ((flujoMensual.rentas * 12) / patrimonio.inmuebles_renta * 100).toFixed(1)
    : null;
  const dispActPpal = Math.max(disponible - flujoMensual.rentas - flujoMensual.otros, 0);

  return (
    <div data-pdf-page="5" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Flujo de Vida" clientName={clientName} pageNum={5} />
      <Hairline />
      <SectionLabel letter="D" title="Flujo de Vida" subtitle={`Ingresas ${formatMXN(ingresos)}/mes — así fluye tu dinero`} />

      {/* Main flow */}
      <DataRow label="Ingresos Totales" value={formatMXN(ingresos)} bold />
      <DataRow label={`Gastos Totales (${pct(gastos)}% de ingresos)`} value={`− ${formatMXN(gastos)}`} valueColor={C.orange} />
      <DataRow label={`Ingreso Disponible (${pct(disponible)}%)`} value={formatMXN(disponible)} bold valueColor={C.green} />

      {/* Breakdown */}
      <SubHead>Desglose de ingresos disponibles</SubHead>
      {[
        { label: "Actividad principal", value: dispActPpal, show: dispActPpal > 0 },
        { label: `Rentas inmobiliarias${rentalYield ? ` (${rentalYield}% yield anual)` : ""}`, value: flujoMensual.rentas, show: flujoMensual.rentas > 0 },
        { label: "Actividad adicional / otros", value: flujoMensual.otros, show: flujoMensual.otros > 0 },
      ].filter((r) => r.show).map((row) => (
        <div key={row.label} style={{
          display: "flex", justifyContent: "space-between", padding: "7px 48px",
          borderBottom: `1px solid ${C.hairLight}`, alignItems: "center",
        }}>
          <span style={{ fontSize: "11px", color: C.text }}>{row.label}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: C.navy }}>{formatMXN(row.value)}</span>
        </div>
      ))}

      {/* Expense breakdown */}
      <SubHead>Estructura de gastos</SubHead>
      {[
        { label: "Gastos básicos (vivienda, alimentación, servicios)", value: flujoMensual.gastos_basicos, show: flujoMensual.gastos_basicos > 0 },
        { label: "Obligaciones financieras fijas", value: flujoMensual.obligaciones, show: flujoMensual.obligaciones > 0 },
        { label: "Créditos en pago", value: flujoMensual.creditos, show: flujoMensual.creditos > 0 },
      ].filter((r) => r.show).map((row) => (
        <div key={row.label} style={{
          display: "flex", justifyContent: "space-between", padding: "7px 48px",
          borderBottom: `1px solid ${C.hairLight}`, alignItems: "center",
        }}>
          <span style={{ fontSize: "11px", color: C.text }}>{row.label}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: C.orange }}>{formatMXN(row.value)}</span>
        </div>
      ))}

      {/* KPI cards */}
      <div style={{ display: "flex", gap: "12px", margin: "20px 48px 0" }}>
        <div style={{ flex: 1, padding: "14px 18px", border: `1px solid ${C.hair}`, borderRadius: "2px" }}>
          <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Actividad principal</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(dispActPpal)}</p>
          <p style={{ fontSize: "9px", color: C.textMuted, margin: "3px 0 0 0" }}>ingreso mensual neto</p>
        </div>
        {flujoMensual.rentas > 0 && (
          <div style={{ flex: 1, padding: "14px 18px", border: `1px solid ${C.hair}`, borderRadius: "2px" }}>
            <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Rentas inmobiliarias</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: C.gold, margin: 0 }}>{formatMXN(flujoMensual.rentas)}</p>
            {rentalYield && <p style={{ fontSize: "9px", color: C.textMuted, margin: "3px 0 0 0" }}>{rentalYield}% yield anual</p>}
          </div>
        )}
        {flujoMensual.otros > 0 && (
          <div style={{ flex: 1, padding: "14px 18px", border: `1px solid ${C.hair}`, borderRadius: "2px" }}>
            <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Otros ingresos</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: C.navyLight, margin: 0 }}>{formatMXN(flujoMensual.otros)}</p>
            <p style={{ fontSize: "9px", color: C.textMuted, margin: "3px 0 0 0" }}>ingresos adicionales</p>
          </div>
        )}
      </div>

      {/* Reading */}
      <div style={{ margin: "20px 48px 0", padding: "14px 20px", background: C.ivory, borderLeft: `3px solid ${C.gold}` }}>
        <p style={{ fontSize: "9px", fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 6px 0" }}>Análisis</p>
        <p style={{ fontSize: "11px", color: C.text, margin: 0, lineHeight: 1.6 }}>
          {pctNum(disponible) >= 40
            ? `Excelente disciplina financiera. El ${pct(disponible)}% de tus ingresos queda disponible — eso es lo que construye riqueza generacional.`
            : pctNum(disponible) >= 20
              ? `Sólida base mensual: el ${pct(disponible)}% libre para crecer. Incorporar ingresos pasivos acelerará tu independencia financiera.`
              : "Tu flujo mensual tiene espacio para crecer. Reducir gastos no estratégicos te permitirá destinar más a inversiones."}
        </p>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={5} total={TOTAL_PAGES} />
    </div>
  );
}

// ── PAGE 6 — E · Potencial del Balance ───────────────────────────────────────
function Page6PotencialBalance({
  clientName, motorE, patrimonio,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
  patrimonio: {
    liquidez: number; inversiones: number; dotales: number;
    afore: number; ppr: number; plan_privado: number; seguros_retiro: number;
    casa: number; tierra: number; herencia: number;
    inmuebles_renta: number; negocio: number;
  };
}) {
  const solvPct = motorE.indice_solvencia * 100;
  const retiroVal = patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;
  const liquidez = patrimonio.liquidez;
  const inversiones = patrimonio.inversiones + patrimonio.dotales;
  const patrimoniales = patrimonio.casa + patrimonio.tierra + patrimonio.herencia;
  const productivos = patrimonio.inmuebles_renta + patrimonio.negocio;
  const total = motorE.activos_total || 1;

  const solvColor = solvPct >= 70 ? C.green : solvPct >= 40 ? C.orange : C.red;
  const solvBg = solvPct >= 70 ? C.greenBg : solvPct >= 40 ? C.orangeBg : C.redBg;

  return (
    <div data-pdf-page="6" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Potencial del Balance" clientName={clientName} pageNum={6} />
      <Hairline />
      <SectionLabel letter="E" title="Potencial del Balance" subtitle="Solvencia, estructura de activos y capacidad de apalancamiento" />

      {/* Solvencia hero */}
      <div style={{ display: "flex", gap: "12px", padding: "0 48px 20px" }}>
        <div style={{ flex: 2, padding: "20px 24px", background: solvBg, border: `1px solid ${solvColor}` }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: solvColor, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 14px 0" }}>
            Índice de Solvencia
          </p>
          {/* Bar + percentage SIDE BY SIDE — never overlapping */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <div style={{ flex: 1, height: "10px", background: `rgba(0,0,0,0.08)`, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(solvPct, 100)}%`, height: "100%", background: solvColor, borderRadius: "3px" }} />
            </div>
            <span style={{ fontSize: "32px", fontWeight: 800, color: solvColor, lineHeight: 1, flexShrink: 0, minWidth: "80px", textAlign: "right" }}>
              {solvPct.toFixed(0)}%
            </span>
          </div>
          <p style={{ fontSize: "12px", color: solvColor, fontWeight: 700, margin: "0 0 4px 0" }}>{motorE.clasificacion_solvencia}</p>
          <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>Porcentaje del patrimonio libre de obligaciones financieras</p>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ flex: 1, padding: "14px 18px", border: `1px solid ${C.hair}` }}>
            <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Patrimonio Neto</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(motorE.patrimonio_neto)}</p>
          </div>
          <div style={{ flex: 1, padding: "14px 18px", border: `1px solid ${C.hair}` }}>
            <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>Apalancamiento potencial</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: C.gold, margin: 0 }}>{formatMXN(motorE.potencial_apalancamiento)}</p>
          </div>
        </div>
      </div>

      {/* Structure breakdown */}
      <SubHead>Distribución del activo total</SubHead>
      <div style={{ padding: "12px 0 0 0" }}>
        {[
          { label: "Liquidez",         desc: "Efectivo y cuentas disponibles", value: liquidez,     color: C.navy    },
          { label: "Inversiones",      desc: "Fondos, acciones, dotales",      value: inversiones,  color: C.navyLight },
          { label: "Retiro",           desc: "AFORE, PPR, planes privados",     value: retiroVal,    color: C.gold    },
          { label: "Bienes propios",   desc: "Casa, terreno, herencia",         value: patrimoniales, color: "#6B7A8D" },
          { label: "Activos productivos", desc: "Rentas y negocio",             value: productivos,  color: C.orange  },
        ].map((cat) => (
          <BarRow key={cat.label} label={cat.label} desc={cat.desc} value={cat.value} total={total} color={cat.color} />
        ))}
      </div>

      {/* Key ratios */}
      <SubHead>Ratios clave</SubHead>
      <div style={{ display: "flex", gap: "1px", margin: "8px 48px 0", background: C.hair }}>
        {[
          { label: "Ratio Financiero / Total", value: `${total > 0 ? ((motorE.financiero / total) * 100).toFixed(0) : 0}%`, desc: "Activos líquidos e invertidos" },
          { label: "Deuda / Activos", value: `${total > 0 ? ((motorE.pasivos_total / total) * 100).toFixed(0) : 0}%`, desc: "Nivel de apalancamiento" },
          { label: "Productivos / Total", value: `${total > 0 ? (((productivos + inversiones) / total) * 100).toFixed(0) : 0}%`, desc: "Activos que generan flujo" },
        ].map((r) => (
          <div key={r.label} style={{ flex: 1, background: C.white, padding: "14px 18px" }}>
            <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px 0", fontWeight: 600 }}>{r.label}</p>
            <p style={{ fontSize: "20px", fontWeight: 700, color: C.navy, margin: "0 0 3px 0" }}>{r.value}</p>
            <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={6} total={TOTAL_PAGES} />
    </div>
  );
}

// ── PAGE 7 — F · Protección Patrimonial ──────────────────────────────────────
function Page7Proteccion({
  clientName, motorE, motorF, motorA, proteccion, perfil,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
  motorF: ReturnType<typeof calcularMotorF>;
  motorA: ReturnType<typeof calcularMotorA>;
  proteccion: { seguro_vida: boolean; sgmm: boolean; propiedades_aseguradas: boolean | null } | null;
  perfil: { dependientes: boolean } | null;
}) {
  const sumaVida = motorF.suma_asegurada_vida ?? 0;
  const primaVida = motorF.costo_prima_vida ?? 0;
  const disponible = motorA.ingresos_totales - motorA.gastos_totales;
  const solvPct = motorE.indice_solvencia * 100;
  const tieneDep = perfil?.dependientes ?? false;

  const coberturas = [
    { label: "Seguro de Vida", ok: proteccion?.seguro_vida ?? false, desc: "Protección en caso de fallecimiento" },
    { label: "SGMM", ok: proteccion?.sgmm ?? false, desc: "Gastos Médicos Mayores" },
    { label: "Propiedades aseguradas", ok: proteccion?.propiedades_aseguradas ?? false, desc: "Inmuebles con cobertura" },
    { label: "Dependientes cubiertos", ok: tieneDep ? (proteccion?.seguro_vida ?? false) : true, desc: tieneDep ? "Familia protegida" : "Sin dependientes" },
  ];

  return (
    <div data-pdf-page="7" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Protección Patrimonial" clientName={clientName} pageNum={7} />
      <Hairline />
      <SectionLabel letter="F" title="Protección Patrimonial" subtitle="Todo lo que protege lo que has construido" />

      {/* Coverage tiles */}
      <div style={{ display: "flex", gap: "8px", padding: "0 48px 20px" }}>
        {coberturas.map((c) => (
          <div key={c.label} style={{
            flex: 1, padding: "14px 12px", textAlign: "center",
            background: c.ok ? C.greenBg : C.redBg,
            border: `1px solid ${c.ok ? "#A8D8B8" : "#E8AAAA"}`,
            borderRadius: "2px",
          }}>
            <p style={{ fontSize: "18px", margin: "0 0 6px 0", color: c.ok ? C.green : C.red }}>
              {c.ok ? "✓" : "✗"}
            </p>
            <p style={{ fontSize: "10px", fontWeight: 700, color: c.ok ? C.green : C.red, margin: "0 0 3px 0" }}>{c.label}</p>
            <p style={{ fontSize: "8px", color: C.textMuted, margin: 0 }}>{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Impact analysis */}
      <SubHead>Impacto en el patrimonio</SubHead>
      <DataRow label="Patrimonio Neto Actual" value={formatMXN(motorE.patrimonio_neto)} bold valueColor={C.navy} />
      <DataRow label={`Solvencia actual`} value={`${solvPct.toFixed(0)}%`} valueColor={solvPct >= 70 ? C.green : C.orange} />
      {sumaVida > 0 && (
        <>
          <DataRow label="Afectación sin cobertura de vida" value={`− ${formatMXN(sumaVida)}`} valueColor={C.red} />
          <DataRow label="Patrimonio resultante (con cobertura)" value={formatMXN(motorE.patrimonio_neto - sumaVida)} bold valueColor={C.green} />
        </>
      )}

      {/* Scenario table */}
      <SubHead>Escenario: cese de ingresos</SubHead>
      <div style={{ margin: "8px 48px 0" }}>
        <div style={{ display: "flex", padding: "6px 0", borderBottom: `1px solid ${C.hair}` }}>
          <span style={{ flex: 2, fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>Concepto</span>
          <span style={{ flex: 1, textAlign: "right", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>Hoy</span>
          <span style={{ flex: 1, textAlign: "right", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>Sin ingresos</span>
          <span style={{ flex: 1, textAlign: "right", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>Variación</span>
        </div>
        <div style={{ display: "flex", padding: "10px 0", borderBottom: `1px solid ${C.hairLight}` }}>
          <span style={{ flex: 2, fontSize: "11px", color: C.text }}>Ingresos disponibles</span>
          <span style={{ flex: 1, textAlign: "right", fontSize: "12px", fontWeight: 600, color: C.navy }}>{formatMXN(disponible)}</span>
          <span style={{ flex: 1, textAlign: "right", fontSize: "12px", fontWeight: 600, color: C.textMuted }}>$0</span>
          <span style={{ flex: 1, textAlign: "right", fontSize: "12px", fontWeight: 700, color: C.red }}>−100%</span>
        </div>
      </div>

      {/* Recommendation box */}
      <SubHead>Cobertura recomendada</SubHead>
      <div style={{ margin: "10px 48px 0", display: "flex", gap: "1px", background: C.hair }}>
        <div style={{ flex: 1, background: C.white, padding: "16px 20px" }}>
          <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 8px 0", fontWeight: 600 }}>
            Suma asegurada recomendada
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, color: C.navy, margin: 0 }}>
            {sumaVida > 0 ? formatMXN(sumaVida) : "Por calcular"}
          </p>
        </div>
        <div style={{ flex: 1, background: C.white, padding: "16px 20px" }}>
          <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 8px 0", fontWeight: 600 }}>
            Prima anual estimada
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, color: C.gold, margin: 0 }}>
            {primaVida > 0 ? formatMXN(primaVida) : "Por cotizar"}
          </p>
        </div>
        <div style={{ flex: 1, background: C.ivory, padding: "16px 20px" }}>
          <p style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 8px 0", fontWeight: 600 }}>
            Equivale a
          </p>
          <p style={{ fontSize: "14px", fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.4 }}>
            {disponible > 0 ? `${((primaVida / disponible) * 100).toFixed(1)}% del ingreso disponible mensual` : "Cotización disponible con tu asesor"}
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={7} total={TOTAL_PAGES} />
    </div>
  );
}

// ── Trayectoria source colors (matching TrayectoriaFuentes component exactly) ──
const TRAY_COLORS = {
  pension:     "#C9A96E",  // AFORE / Ley 73
  voluntarios: "#E8C87A",  // PPR / Voluntarios
  rentas:      "#314566",  // Rentas
  negocio:     "#5A6A85",  // Negocio
  patrimonio:  "#1C2B4A",  // Patrimonio Financiero
};

// ── PAGE 8 — G · Trayectoria Patrimonial ─────────────────────────────────────
function Page8Trayectoria({
  clientName, motorC, motorD, motorE, retiro,
}: {
  clientName: string;
  motorC: ReturnType<typeof calcularMotorC>;
  motorD: ReturnType<typeof calcularMotorD> | null;
  motorE: ReturnType<typeof calcularMotorE>;
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number };
}) {
  const curva = motorC.curva;
  const grado = motorC.grado_avance;
  const legado = motorD?.legado ?? 0;

  // maxTotal across all points for proportional bar widths
  const maxTotal = Math.max(
    1,
    ...curva.map((p) =>
      p.pension_mensual + p.voluntarios_mensual + p.rentas_mensual + p.negocio_mensual + p.patrimonio_retiro
    )
  );

  const LEGEND = [
    { key: "pension",     label: "AFORE / Ley 73",         color: TRAY_COLORS.pension     },
    { key: "voluntarios", label: "PPR / Voluntarios",       color: TRAY_COLORS.voluntarios },
    { key: "rentas",      label: "Rentas",                  color: TRAY_COLORS.rentas      },
    { key: "negocio",     label: "Negocio",                 color: TRAY_COLORS.negocio     },
    { key: "patrimonio",  label: "Patrimonio Financiero",   color: TRAY_COLORS.patrimonio  },
  ];

  return (
    <div data-pdf-page="8" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Trayectoria Patrimonial" clientName={clientName} pageNum={8} />
      <Hairline />
      <SectionLabel letter="G" title="Trayectoria Patrimonial" subtitle="Ingresos mensuales en retiro por fuente — año a año" />

      {/* Summary KPIs */}
      <div style={{ display: "flex", margin: "0 48px 12px", border: `1px solid ${C.hair}` }}>
        {[
          { label: "Patrimonio en Retiro", value: formatMXN(motorC.saldo_inicio_jubilacion), sub: `A los ${retiro.edad_retiro} años` },
          { label: "Pensión Total Posible", value: `${formatMXN(motorC.pension_fija_total)}/mes`, sub: "Todas las fuentes" },
          { label: "Mensualidad Deseada", value: `${formatMXN(retiro.mensualidad_deseada)}/mes`, sub: "Tu objetivo de retiro" },
          { label: "Grado de Avance", value: `${(grado * 100).toFixed(0)}%`, sub: grado >= 1 ? "Meta alcanzada" : "De la meta", accent: grado >= 1 },
        ].map((m, i) => (
          <div key={m.label} style={{
            flex: 1, padding: "12px 14px",
            borderRight: i < 3 ? `1px solid ${C.hairLight}` : "none",
          }}>
            <p style={{ fontSize: "8px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, margin: "0 0 5px 0" }}>{m.label}</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: (m as { accent?: boolean }).accent ? C.green : C.navy, margin: "0 0 2px 0" }}>{m.value}</p>
            <p style={{ fontSize: "8px", color: C.textMuted, margin: 0 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", padding: "0 48px 10px" }}>
        {LEGEND.map((l) => (
          <div key={l.key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", background: l.color, borderRadius: "1px", flexShrink: 0 }} />
            <span style={{ fontSize: "9px", color: C.textMid }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Stacked horizontal bars per year — exactly like TrayectoriaFuentes */}
      <div style={{ padding: "0 48px", flex: 1, overflow: "hidden" }}>
        {curva.map((punto) => {
          const totalPunto =
            punto.pension_mensual +
            punto.voluntarios_mensual +
            punto.rentas_mensual +
            punto.negocio_mensual +
            punto.patrimonio_retiro;
          const totalWidth = (totalPunto / maxTotal) * 100;

          const segments = [
            { key: "pension",     value: punto.pension_mensual,     color: TRAY_COLORS.pension     },
            { key: "voluntarios", value: punto.voluntarios_mensual, color: TRAY_COLORS.voluntarios },
            { key: "rentas",      value: punto.rentas_mensual,      color: TRAY_COLORS.rentas      },
            { key: "negocio",     value: punto.negocio_mensual,     color: TRAY_COLORS.negocio     },
            { key: "patrimonio",  value: punto.patrimonio_retiro,   color: TRAY_COLORS.patrimonio  },
          ].filter((s) => s.value > 0);

          return (
            <div key={punto.mes} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
              <span style={{ width: "28px", fontSize: "9px", color: C.textMuted, textAlign: "right", flexShrink: 0 }}>
                {punto.edad % 1 === 0 ? `${punto.edad}a` : ""}
              </span>
              <div style={{ flex: 1, height: "16px", background: C.hairLight, borderRadius: "1px", overflow: "hidden", display: "flex" }}>
                {segments.map((seg) => (
                  <div
                    key={seg.key}
                    style={{
                      width: `${totalWidth > 0 ? (seg.value / totalPunto) * totalWidth : 0}%`,
                      height: "100%",
                      background: seg.color,
                    }}
                  />
                ))}
              </div>
              <span style={{ width: "110px", fontSize: "9px", fontWeight: 600, color: C.textMid, textAlign: "right", flexShrink: 0 }}>
                {formatMXN(totalPunto)}/mes
              </span>
            </div>
          );
        })}
      </div>

      {/* Legado banner */}
      {legado > 0 && (
        <div style={{
          margin: "8px 48px 0", padding: "12px 20px",
          background: C.goldFaint, border: `1px solid ${C.gold}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 2px 0" }}>Legado Patrimonial</p>
            <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>Patrimonio transmisible proyectado al cierre de vida</p>
          </div>
          <p style={{ fontSize: "20px", fontWeight: 700, color: C.gold, margin: 0 }}>{formatMXN(legado)}</p>
        </div>
      )}

      {/* Footer summary */}
      <div style={{ display: "flex", gap: "1px", margin: "8px 48px 0", background: C.hair }}>
        {[
          { label: "Patrimonio Fin. al Retiro", value: formatMXN(motorC.saldo_inicio_jubilacion), color: C.navy },
          { label: "Obligaciones actuales", value: formatMXN(motorE.pasivos_total), color: C.red },
          { label: "Patrimonio Neto Proyectado", value: formatMXN(motorC.saldo_inicio_jubilacion - motorE.pasivos_total), color: motorC.saldo_inicio_jubilacion >= motorE.pasivos_total ? C.green : C.red },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1, background: C.white, padding: "10px 16px" }}>
            <p style={{ fontSize: "8px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 5px 0", fontWeight: 600 }}>{item.label}</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <PageFooter page={8} total={TOTAL_PAGES} />
    </div>
  );
}

// ── PAGE 9 — H · Criterios y Metodología ─────────────────────────────────────
function Page9Criterios({
  clientName, motorC, retiro, perfil, criterios,
}: {
  clientName: string;
  motorC: ReturnType<typeof calcularMotorC>;
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number };
  perfil: { edad: number } | null;
  criterios: {
    casa: { vende: boolean };
    tierra: { vende: boolean };
    inmuebles_renta: { vende: boolean };
    negocio: { vende: boolean };
  };
}) {
  const edad = perfil?.edad ?? 35;
  const aniosAcum = Math.max(retiro.edad_retiro - edad, 0);
  const aniosRetiro = retiro.edad_defuncion - retiro.edad_retiro;

  return (
    <div data-pdf-page="9" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.white }}>
      <PageHeader section="Criterios y Metodología" clientName={clientName} pageNum={9} />
      <Hairline />
      <SectionLabel letter="H" title="Criterios y Metodología" subtitle="Transparencia total: supuestos, fuentes y definiciones clave" />

      {/* Assumptions table */}
      <SubHead>Supuestos de proyección</SubHead>
      <div style={{ padding: "0 48px" }}>
        {[
          { label: "Tasa de rendimiento bruta anual",      value: "6.5%" },
          { label: "Inflación estimada",                    value: "3.5% anual" },
          { label: "Tasa real neta sobre inflación",        value: "3.0% anual" },
          { label: "Horizonte de acumulación",              value: `${aniosAcum} años (hoy → retiro a los ${retiro.edad_retiro})` },
          { label: "Horizonte de decumulación",             value: `${aniosRetiro} años (${retiro.edad_retiro} → ${retiro.edad_defuncion} años)` },
          { label: "Aportación mensual adicional",          value: motorC.aportacion_necesaria ? formatMXN(motorC.aportacion_necesaria) : "No requerida" },
          { label: "Casa / terreno en proyección",          value: criterios.casa.vende || criterios.tierra.vende ? "Con venta proyectada" : "Sin venta proyectada" },
          { label: "Inmuebles en renta en proyección",      value: criterios.inmuebles_renta.vende ? "Con venta proyectada" : "Flujo de rentas" },
          { label: "Negocio / empresa en proyección",       value: criterios.negocio.vende ? "Con venta proyectada" : "Sin venta proyectada" },
          { label: "Ley 73 IMSS",                           value: "Incluida según saldo informado" },
        ].map((row, i) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", padding: "7px 0",
            borderBottom: `1px solid ${C.hairLight}`,
            background: i % 2 === 0 ? "transparent" : C.ivory,
          }}>
            <span style={{ fontSize: "11px", color: C.text }}>{row.label}</span>
            <span style={{ fontSize: "11px", fontWeight: 600, color: C.navy }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Glossary */}
      <SubHead>Glosario</SubHead>
      <div style={{ padding: "0 48px" }}>
        {[
          { term: "Patrimonio Neto",       def: "Activos totales menos pasivos. Representa la riqueza real." },
          { term: "Índice de Solvencia",   def: "Porcentaje del patrimonio libre de obligaciones financieras." },
          { term: "Grado de Avance",       def: "Porcentaje de la mensualidad deseada en retiro que podrá cubrirse." },
          { term: "Longevidad Financiera", def: "Años que duran los recursos sin nuevas aportaciones al ritmo de gasto actual." },
          { term: "Apalancamiento",        def: "Capacidad de crédito respaldada por el patrimonio solvente." },
          { term: "PPR",                   def: "Plan Personal de Retiro con beneficios fiscales deducibles de ISR." },
          { term: "SGMM",                  def: "Seguro de Gastos Médicos Mayores. Cubre hospitalización y eventos de alto costo." },
        ].map((item) => (
          <div key={item.term} style={{ padding: "6px 0", borderBottom: `1px solid ${C.hairLight}` }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy }}>{item.term} — </span>
            <span style={{ fontSize: "11px", color: C.textMuted }}>{item.def}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={9} total={TOTAL_PAGES}
        note="Actinver Casa de Bolsa, S.A. de C.V. Grupo Financiero Actinver. Supervisada por la CNBV. Este documento no constituye recomendación de inversión. Rendimientos pasados no garantizan resultados futuros."
      />
    </div>
  );
}

// ── PAGE 10 — Contraportada ────────────────────────────────────────────────────
function Page10Contraportada({ clientName }: { clientName: string }) {
  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div data-pdf-page="10" style={{
      width: "794px", height: "1123px", overflow: "hidden",
      display: "flex", flexDirection: "column", background: C.navy,
    }}>
      {/* Gold top accent */}
      <div style={{ height: "3px", background: C.gold, flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px" }}>
        {/* Thin gold rule */}
        <div style={{ width: "28px", height: "1px", background: C.gold, marginBottom: "40px" }} />

        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: C.white, letterSpacing: "-0.5px" }}>Actinver</span>
          </div>
          <span style={{ fontSize: "11px", color: C.gold, letterSpacing: "4px", textTransform: "uppercase", fontWeight: 600 }}>
            Banca Privada
          </span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textAlign: "center", margin: "0 0 56px 0", letterSpacing: "0.5px", lineHeight: 1.6, maxWidth: "340px" }}>
          Tu patrimonio, con claridad.<br />Tu futuro, con estrategia.
        </p>

        {/* Rule */}
        <div style={{ width: "28px", height: "1px", background: "rgba(179,144,64,0.3)", marginBottom: "40px" }} />

        {/* Client & date */}
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", margin: "0 0 6px 0", letterSpacing: "0.5px" }}>{clientName}</p>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", margin: 0 }}>{fecha}</p>
      </div>

      {/* Legal */}
      <div style={{ padding: "24px 56px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.15)", lineHeight: 1.7, margin: "0 0 14px 0", textAlign: "center" }}>
          Este documento es estrictamente confidencial y preparado exclusivamente para el titular indicado.
          Las proyecciones se basan en la información proporcionada y no garantizan resultados futuros.
          Actinver Casa de Bolsa, S.A. de C.V. Grupo Financiero Actinver — Supervisada por la CNBV.
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>Actinver Banca Privada</span>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.15)" }}>{TOTAL_PAGES} / {TOTAL_PAGES}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export function BalancePDFTemplate() {
  const perfil           = useDiagnosticoStore((s) => s.perfil);
  const flujoMensual     = useDiagnosticoStore((s) => s.flujoMensual);
  const patrimonio       = useDiagnosticoStore((s) => s.patrimonio);
  const retiro           = useDiagnosticoStore((s) => s.retiro);
  const proteccion       = useDiagnosticoStore((s) => s.proteccion);
  const objetivos        = useDiagnosticoStore((s) => s.objetivos);
  const criterios        = useDiagnosticoStore((s) => s.criterios_trayectoria);

  const clientName = perfil?.nombre || "Cliente";
  const edad       = perfil?.edad ?? 35;
  const fecha      = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  const motorA = useMemo(() => {
    if (!flujoMensual) return null;
    return calcularMotorA({
      ahorro:        flujoMensual.ahorro,
      rentas:        flujoMensual.rentas,
      otros:         flujoMensual.otros,
      gastos_basicos: flujoMensual.gastos_basicos,
      obligaciones:  flujoMensual.obligaciones,
      creditos:      flujoMensual.creditos,
      liquidez:      patrimonio?.liquidez,
    });
  }, [flujoMensual, patrimonio]);

  const motorB = useMemo(() => {
    if (!patrimonio || !flujoMensual) return null;
    return calcularMotorB({
      liquidez:       patrimonio.liquidez,
      inversiones:    patrimonio.inversiones,
      dotales:        patrimonio.dotales,
      afore:          patrimonio.afore,
      ppr:            patrimonio.ppr,
      plan_privado:   patrimonio.plan_privado,
      seguros_retiro: patrimonio.seguros_retiro,
      edad,
      gastos_basicos: flujoMensual.gastos_basicos,
      obligaciones:   flujoMensual.obligaciones,
      creditos:       flujoMensual.creditos,
    });
  }, [patrimonio, flujoMensual, edad]);

  const motorC = useMemo(() => {
    if (!patrimonio || !flujoMensual || !retiro) return null;
    return calcularMotorC({
      liquidez:        patrimonio.liquidez,
      inversiones:     patrimonio.inversiones,
      dotales:         patrimonio.dotales,
      afore:           patrimonio.afore,
      ppr:             patrimonio.ppr,
      plan_privado:    patrimonio.plan_privado,
      seguros_retiro:  patrimonio.seguros_retiro,
      ley_73:          patrimonio.ley_73,
      rentas:          flujoMensual.rentas,
      edad,
      edad_retiro:     retiro.edad_retiro,
      edad_defuncion:  retiro.edad_defuncion,
      mensualidad_deseada: retiro.mensualidad_deseada,
    });
  }, [patrimonio, flujoMensual, retiro, edad]);

  const motorD = useMemo(() => {
    if (!objetivos || !patrimonio || !retiro) return null;
    const pat_fin =
      patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales +
      patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;
    return calcularMotorD({
      aportacion_inicial: objetivos.aportacion_inicial,
      aportacion_mensual: objetivos.aportacion_mensual,
      lista:              objetivos.lista,
      patrimonio_financiero: pat_fin,
      edad,
      edad_retiro:        retiro.edad_retiro,
      edad_defuncion:     retiro.edad_defuncion,
    });
  }, [objetivos, patrimonio, retiro, edad]);

  const motorE = useMemo(() => {
    if (!patrimonio) return null;
    return calcularMotorE({
      liquidez:       patrimonio.liquidez,
      inversiones:    patrimonio.inversiones,
      dotales:        patrimonio.dotales,
      afore:          patrimonio.afore,
      ppr:            patrimonio.ppr,
      plan_privado:   patrimonio.plan_privado,
      seguros_retiro: patrimonio.seguros_retiro,
      casa:           patrimonio.casa,
      inmuebles_renta: patrimonio.inmuebles_renta,
      tierra:         patrimonio.tierra,
      negocio:        patrimonio.negocio,
      herencia:       patrimonio.herencia,
      hipoteca:       patrimonio.hipoteca,
      saldo_planes:   patrimonio.saldo_planes,
      compromisos:    patrimonio.compromisos,
    });
  }, [patrimonio]);

  const motorF = useMemo(() => {
    if (!proteccion || !motorE) return null;
    const inmuebles_total = (patrimonio?.casa ?? 0) + (patrimonio?.inmuebles_renta ?? 0) + (patrimonio?.tierra ?? 0);
    return calcularMotorF({
      seguro_vida:           proteccion.seguro_vida ?? false,
      propiedades_aseguradas: proteccion.propiedades_aseguradas,
      sgmm:                  proteccion.sgmm ?? false,
      dependientes:          perfil?.dependientes ? 1 : 0,
      inversiones:           patrimonio?.inversiones ?? 0,
      dotales:               patrimonio?.dotales ?? 0,
      gastos_mensuales:      (flujoMensual?.gastos_basicos ?? 0) + (flujoMensual?.obligaciones ?? 0) + (flujoMensual?.creditos ?? 0),
      edad,
      inmuebles_total,
      rentas_mensuales:      flujoMensual?.rentas ?? 0,
    });
  }, [proteccion, motorE, patrimonio, perfil, edad, flujoMensual]);

  // Safe defaults
  const safeMotorA = motorA ?? {
    ingresos_totales: 0, gastos_totales: 0,
    distribucion: { gastos_pct: 0, obligaciones_pct: 0, creditos_pct: 0, ahorro_pct: 0 },
    benchmark_reserva: 0, meses_cubiertos: null, resultado_reserva: "Pendiente" as const,
    pendiente_reserva: 0, meses_para_cubrir: 0, remanente: 0,
    ingreso_disponible_pasivo: 0, ingreso_disponible_activo: 0,
  };
  const safeMotorB = motorB ?? {
    patrimonio_financiero_total: 0, patrimonio_acumulacion_libre: 0, patrimonio_esquemas: 0,
    gasto_anual: 0, ratio: 0, nivel_riqueza: "suficiente" as const, etiqueta_nivel: "—",
    benchmark_para_edad: 0, longevidad_recursos: edad, meses_cubiertos: 0,
  };
  const safeMotorC = motorC ?? {
    saldo_inicio_jubilacion: 0, patrimonio_acum_libre: 0,
    meses_acumulacion: 0, meses_jubilacion: 0,
    mensualidad_posible: 0, mensualidad_afore: 0, mensualidad_voluntarios: 0, mensualidad_esquemas: 0,
    pension_fija_total: 0, ingresos_fijos_retiro: 0, total_mensual: 0,
    grado_avance: 0, pendiente_mensual: 0, deficit_mensual: 0,
    pasivo_vf: 0, pasivo_vp: 0, aportacion_necesaria: null, curva: [],
    fuentes_ingreso: { rentas: 0, afore: 0, voluntarios: 0, ley_73: 0, pension: 0, patrimonio: 0 },
  };
  const safeMotorE = motorE ?? {
    activos_total: 0, pasivos_total: 0, patrimonio_neto: 0,
    financiero: 0, no_financiero: 0, activos_base: 0, esquemas_retiro: 0,
    indice_solvencia: 0, clasificacion_solvencia: "Muy saludable", potencial_apalancamiento: 0,
    apalancamiento_actual: 0, apalancamiento_potencial_bruto: 0, excedente_apalancamiento: 0,
    potencial_fin: 0, potencial_nofin: 0, pct_fin: 0, pct_nofin: 0,
  };
  const safeMotorF = motorF ?? {
    recomendaciones: [], suma_asegurada_vida: 0, costo_prima_vida: 0,
    seguro_hogar_sugerido: 0, costo_hogar_anual: 0, sgmm_estimado: 0,
  };
  const safeFlujoMensual = flujoMensual ?? { ahorro: 0, rentas: 0, otros: 0, gastos_basicos: 0, obligaciones: 0, creditos: 0 };
  const safeRetiro = retiro ?? { edad_retiro: 65, mensualidad_deseada: 0, edad_defuncion: 85 };
  const safePatrimonio = patrimonio ?? {
    liquidez: 0, inversiones: 0, dotales: 0, afore: 0, ppr: 0,
    plan_privado: 0, seguros_retiro: 0, casa: 0, tierra: 0, herencia: 0,
    inmuebles_renta: 0, negocio: 0, hipoteca: 0, saldo_planes: 0, compromisos: 0, ley_73: null,
  };
  const safeCriterios = criterios ?? {
    casa:           { vende: false },
    tierra:         { vende: false },
    inmuebles_renta: { vende: false },
    negocio:        { vende: false },
    herencia:       {},
  };

  const planRows = useMemo(
    () => buildPlanDeAccion({
      motorA: safeMotorA, motorB: safeMotorB, motorC: safeMotorC, motorE: safeMotorE,
      proteccion: proteccion ? { ...proteccion, seguro_vida: proteccion.seguro_vida ?? false, sgmm: proteccion.sgmm ?? false } : null,
      perfil: perfil ? { dependientes: perfil.dependientes ?? false, edad: perfil.edad } : null,
      patrimonio: safePatrimonio,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeMotorA, safeMotorB, safeMotorC, safeMotorE, proteccion, perfil],
  );

  return (
    <div
      id="balance-pdf-template"
      style={{ width: "794px", background: C.white, color: C.text, fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <Page1Cover
        clientName={clientName} fecha={fecha}
        motorA={safeMotorA} motorB={safeMotorB} motorC={safeMotorC} motorE={safeMotorE}
      />
      <Page2ResumenEjecutivo
        clientName={clientName}
        motorA={safeMotorA} motorB={safeMotorB} motorC={safeMotorC} motorE={safeMotorE}
        motorD={motorD} perfil={perfil} objetivos={objetivos}
      />
      <Page3PlanDeAccion clientName={clientName} rows={planRows} />
      <Page4DiagnosticoPatrimonial
        clientName={clientName} motorE={safeMotorE} motorB={safeMotorB} patrimonio={safePatrimonio}
      />
      <Page5FlujodeVida
        clientName={clientName} motorA={safeMotorA} flujoMensual={safeFlujoMensual}
        patrimonio={{ inmuebles_renta: safePatrimonio.inmuebles_renta }}
      />
      <Page6PotencialBalance
        clientName={clientName} motorE={safeMotorE} patrimonio={safePatrimonio}
      />
      <Page7Proteccion
        clientName={clientName} motorE={safeMotorE} motorF={safeMotorF} motorA={safeMotorA}
        proteccion={proteccion ? { ...proteccion, seguro_vida: proteccion.seguro_vida ?? false, sgmm: proteccion.sgmm ?? false } : null}
        perfil={perfil ? { dependientes: perfil.dependientes ?? false } : null}
      />
      <Page8Trayectoria
        clientName={clientName}
        motorC={safeMotorC}
        motorD={motorD}
        motorE={safeMotorE}
        retiro={safeRetiro}
      />
      <Page9Criterios
        clientName={clientName} motorC={safeMotorC} retiro={safeRetiro} perfil={perfil}
        criterios={safeCriterios}
      />
      <Page10Contraportada clientName={clientName} />
    </div>
  );
}
