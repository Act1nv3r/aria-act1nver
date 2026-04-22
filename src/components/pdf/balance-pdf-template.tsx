"use client";

import { useMemo } from "react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import {
  calcularMotorA,
  calcularMotorB,
  calcularMotorC,
  calcularMotorE,
  calcularMotorF,
} from "@/lib/motors";
import { formatMXN } from "@/lib/format-currency";

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  navy: "#1C2B4A",
  navyDark: "#0F1E36",
  navyMid: "#243555",
  gold: "#C9A96E",
  goldLight: "#E8C87A",
  lightGray: "#D8D8D8",
  green: "#2E8B57",
  orange: "#E08020",
  red: "#C0302A",
  cream: "#F5F0E8",
  parchment: "#EDE8DF",
  border: "#C8C0B0",
  borderLight: "#E0D8C8",
  rowBorder: "#EAE4DA",
  textMuted: "#7A7060",
  textNavy: "#1C2B4A",
  blue2: "#8BAAC0",
  greenBg: "#E6F4EC",
  orangeBg: "#FEF3E2",
  redBg: "#FDEAEA",
};

const TOTAL_PAGES = 9;
const ALL_NIVELES = ["suficiente", "mejor", "bien", "genial", "on-fire"];
const NIVEL_LABELS: Record<string, string> = {
  suficiente: "Suficiente",
  mejor: "Mejor",
  bien: "Bien",
  genial: "Genial",
  "on-fire": "On Fire",
};

// ── Shared sub-components ─────────────────────────────────────────────────────

const PageHeader = ({ reportName, clientName }: { reportName: string; clientName: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 40px", borderBottom: `1px solid ${C.borderLight}` }}>
    <span style={{ fontSize: "10px", fontWeight: 700, color: C.navy, letterSpacing: "0.3px" }}>Actinver Banca Privada</span>
    <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>{reportName}</span>
    <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>{clientName}</span>
  </div>
);

const SectionTitle = ({ letter, children, subtitle }: { letter?: string; children: React.ReactNode; subtitle?: string }) => (
  <div style={{ padding: "24px 40px 0" }}>
    {letter && (
      <p style={{ fontSize: "9px", fontWeight: 600, color: C.gold, textTransform: "uppercase", letterSpacing: "4px", margin: "0 0 8px 0" }}>
        {letter}
      </p>
    )}
    <h2 style={{ fontSize: "26px", fontWeight: 700, color: C.navy, lineHeight: 1.2, margin: "0 0 4px 0", letterSpacing: "-0.3px" }}>
      {children}
    </h2>
    {subtitle && (
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 12px 0", fontWeight: 400 }}>{subtitle}</p>
    )}
    <div style={{ height: "1px", background: C.borderLight, marginBottom: "20px", marginTop: subtitle ? "0" : "12px" }} />
  </div>
);

const PageFooter = ({ page, total }: { page: number; total: number }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 40px", borderTop: `1px solid ${C.borderLight}`, marginTop: "auto" }}>
    <span style={{ fontSize: "10px", fontWeight: 700, color: C.navy }}>Actinver Banca Privada</span>
    <span style={{ fontSize: "9px", color: C.textMuted }}>Página {page} de {total}</span>
  </div>
);

const SummaryRow = ({ color, label, value, note }: { color: string; label: string; value: string; note?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 40px", borderBottom: `1px solid ${C.rowBorder}` }}>
    <div style={{ width: "5px", height: "32px", background: color, borderRadius: "3px", flexShrink: 0 }} />
    <span style={{ flex: 1, fontSize: "13px", color: C.textNavy, fontWeight: 500 }}>{label}</span>
    {note && <span style={{ fontSize: "10px", color: C.textMuted }}>{note}</span>}
    <span style={{ fontSize: "15px", fontWeight: 700, color: C.navy }}>{value}</span>
  </div>
);

const SubsectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div style={{ margin: "16px 40px 8px" }}>
    <p style={{ fontSize: "11px", fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 5px 0" }}>{children}</p>
    <div style={{ height: "1px", background: C.border }} />
  </div>
);

const RiskBadge = ({ nivel }: { nivel: "Alto" | "Medio" | "Bajo" | "Muy Alto" }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    "Muy Alto": { bg: C.redBg, color: C.red },
    Alto: { bg: C.redBg, color: C.red },
    Medio: { bg: C.orangeBg, color: C.orange },
    Bajo: { bg: C.greenBg, color: C.green },
  };
  const s = cfg[nivel] ?? cfg.Medio;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {nivel}
    </span>
  );
};

// ── Plan de Acción logic ──────────────────────────────────────────────────────

type RiesgoNivel = "Alto" | "Medio" | "Bajo" | "Muy Alto";
interface PlanRow {
  aspecto: string;
  situacion: string;
  riesgo: RiesgoNivel;
  recomendacion: string;
}

function buildPlanDeAccion({
  motorA,
  motorB,
  motorC,
  motorE,
  proteccion,
  perfil,
  patrimonio,
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

  // Liquidez
  const meses = motorA.meses_cubiertos ?? 0;
  if (meses >= 12) {
    rows.push({ aspecto: "Liquidez", situacion: "En exceso", riesgo: "Bajo", recomendacion: "Diversificar excedente hacia inversiones de mayor rendimiento" });
  } else if (meses >= 3) {
    rows.push({ aspecto: "Liquidez", situacion: "Reserva adecuada", riesgo: "Bajo", recomendacion: "Mantener reserva de emergencia y optimizar el excedente" });
  } else {
    rows.push({ aspecto: "Liquidez", situacion: "Reserva insuficiente", riesgo: "Alto", recomendacion: "Incrementar reserva de emergencia a mínimo 3 meses de gastos" });
  }

  // Riqueza Financiera
  const ratio = motorB.ratio;
  if (ratio >= 5) {
    rows.push({ aspecto: "Riqueza Financiera", situacion: "Sólida y en crecimiento", riesgo: "Bajo", recomendacion: "Optimizar rendimientos y diversificar portafolio" });
  } else if (ratio >= 2) {
    rows.push({ aspecto: "Riqueza Financiera", situacion: "En crecimiento", riesgo: "Bajo", recomendacion: "Incrementar Patrimonio Financiero Disponible" });
  } else {
    rows.push({ aspecto: "Riqueza Financiera", situacion: "Comprometida por obligaciones", riesgo: "Medio", recomendacion: "Incrementar Patrimonio Financiero Disponible y reducir pasivos" });
  }

  // Inversión (% del ingreso)
  const invPct = motorA.ingresos_totales > 0 ? Math.round((motorA.remanente / motorA.ingresos_totales) * 100) : 0;
  if (invPct >= 40) {
    rows.push({ aspecto: "Inversión", situacion: `${invPct}% Ingresos — Excelente`, riesgo: "Bajo", recomendacion: "Incrementar Patrimonio Financiero con excedente" });
  } else if (invPct >= 20) {
    rows.push({ aspecto: "Inversión", situacion: `${invPct}% Ingresos — Moderado`, riesgo: "Medio", recomendacion: "Aumentar tasa de ahorro / inversión hasta 40%" });
  } else {
    rows.push({ aspecto: "Inversión", situacion: `${invPct}% Ingresos — Bajo`, riesgo: "Alto", recomendacion: "Reestructurar gastos e incrementar aportación mensual" });
  }

  // Inmuebles
  const noFin = motorE.noFinanciero;
  if (noFin > motorE.financiero * 2) {
    rows.push({ aspecto: "Inmuebles", situacion: "Alta participación patrimonial", riesgo: "Bajo", recomendacion: "Posibilidad de crédito para inversión financiera" });
  } else if (noFin > 0) {
    rows.push({ aspecto: "Inmuebles", situacion: "Participación normal", riesgo: "Bajo", recomendacion: "Mantener y valorizar activos inmobiliarios" });
  } else {
    rows.push({ aspecto: "Inmuebles", situacion: "Sin activos inmobiliarios", riesgo: "Bajo", recomendacion: "Considerar adquisición de bien raíz a mediano plazo" });
  }

  // Seguros
  const tieneVida = proteccion?.seguro_vida ?? false;
  const tieneSGMM = proteccion?.sgmm ?? false;
  const tienePropAseg = proteccion?.propiedades_aseguradas ?? false;
  if (!tieneVida && !tieneSGMM) {
    rows.push({ aspecto: "Seguros", situacion: "Insuficientes", riesgo: "Alto", recomendacion: "Contratar póliza de vida y Seguro de Gastos Médicos Mayores" });
  } else if (!tieneVida) {
    rows.push({ aspecto: "Seguros", situacion: "Sin seguro de vida", riesgo: "Alto", recomendacion: "Contratar póliza de protección de vida" });
  } else if (!tieneSGMM) {
    rows.push({ aspecto: "Seguros", situacion: "Sin SGMM", riesgo: "Medio", recomendacion: "Contratar Seguro de Gastos Médicos Mayores" });
  } else {
    rows.push({ aspecto: "Seguros", situacion: "Coberturas vigentes", riesgo: "Bajo", recomendacion: "Revisar sumas aseguradas anualmente" });
  }

  // Dependientes
  const tieneDep = perfil?.dependientes ?? false;
  if (tieneDep && !tieneVida) {
    rows.push({ aspecto: "Dependientes", situacion: "Expuestos — sin seguro de vida", riesgo: "Alto", recomendacion: "Contratar seguro de vida con suma asegurada suficiente" });
  } else if (tieneDep && tieneVida) {
    rows.push({ aspecto: "Dependientes", situacion: "Cubiertos parcialmente", riesgo: "Bajo", recomendacion: "Verificar suma asegurada cubra 3 años de gastos" });
  } else {
    rows.push({ aspecto: "Dependientes", situacion: "Sin dependientes económicos", riesgo: "Bajo", recomendacion: "Planificar en caso de cambios de vida futuros" });
  }

  // Retiro
  const grado = motorC.grado_avance;
  if (grado >= 1) {
    rows.push({ aspecto: "Retiro", situacion: "Suficiente para calidad de vida deseada", riesgo: "Bajo", recomendacion: "Optimizar rendimiento de los esquemas de retiro" });
  } else if (grado >= 0.6) {
    rows.push({ aspecto: "Retiro", situacion: `Avance al ${Math.round(grado * 100)}% de meta`, riesgo: "Medio", recomendacion: "Incrementar aportación a plan de pensiones privado" });
  } else {
    rows.push({ aspecto: "Retiro", situacion: "Insuficiente para calidad de vida deseada", riesgo: "Medio", recomendacion: "Aportar plan de pensiones privado de manera urgente" });
  }

  // Sucesión
  const hayInmuebles = (patrimonio?.casa ?? 0) + (patrimonio?.tierra ?? 0) + (patrimonio?.inmuebles_renta ?? 0) > 0;
  const hayNegocio = (patrimonio?.negocio ?? 0) > 0;
  if (hayInmuebles || hayNegocio) {
    rows.push({ aspecto: "Sucesión", situacion: "Bienes inmuebles" + (hayNegocio ? " y empresa" : ""), riesgo: "Bajo", recomendacion: "Planificar vehículo de sucesión (fideicomiso / testamento)" });
  } else {
    rows.push({ aspecto: "Sucesión", situacion: "Sin activos físicos registrados", riesgo: "Bajo", recomendacion: "Contemplar testamento y planificación patrimonial preventiva" });
  }

  return rows;
}

// ── Page components ───────────────────────────────────────────────────────────

function Page1Cover({
  clientName,
  fecha,
  motorB,
  motorC,
  motorE,
  motorA,
}: {
  clientName: string;
  fecha: string;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  motorA: ReturnType<typeof calcularMotorA>;
}) {
  const invPct = motorA.ingresos_totales > 0 ? Math.round((motorA.remanente / motorA.ingresos_totales) * 100) : 0;

  return (
    <div data-pdf-page="1" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: "white" }}>
      {/* Top branding bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 48px 0" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy, letterSpacing: "0.3px" }}>Actinver Banca Privada</span>
        <span style={{ fontSize: "9px", color: C.textMuted, letterSpacing: "2px", textTransform: "uppercase" }}>Diagnóstico Patrimonial Privado</span>
      </div>

      {/* Thin gold rule under header */}
      <div style={{ margin: "14px 48px 0", height: "1px", background: C.borderLight }} />

      {/* Client hero section */}
      <div style={{ padding: "40px 48px 32px" }}>
        <p style={{ fontSize: "9px", color: C.gold, letterSpacing: "4px", textTransform: "uppercase", margin: "0 0 12px 0", fontWeight: 600 }}>
          Preparado exclusivamente para
        </p>
        <h1 style={{ fontSize: "42px", fontWeight: 800, color: C.navy, lineHeight: 1.05, margin: "0 0 8px 0", letterSpacing: "-1.5px" }}>
          {clientName}
        </h1>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 20px 0" }}>{fecha}</p>
        <div style={{ width: "40px", height: "2px", background: C.gold }} />
      </div>

      {/* 4 key metrics */}
      <div style={{ display: "flex", gap: "10px", padding: "0 48px 28px" }}>
        {[
          { label: "Tu Patrimonio Neto", value: formatMXN(motorE.patrimonio_neto), sub: "Activos menos obligaciones" },
          { label: "Tus recursos duran", value: `${motorB.longevidad_recursos.toFixed(0)} años`, sub: "Longevidad financiera" },
          { label: "En ingreso disponible", value: `${invPct}%`, sub: "Para invertir cada mes" },
          { label: "Alcanzarás el retiro", value: `${motorC.grado_avance >= 1 ? "✓" : (motorC.grado_avance * 100).toFixed(0) + "%"}`, sub: "Avance hacia tu meta" },
        ].map((m) => (
          <div key={m.label} style={{ flex: 1, border: `1px solid ${C.borderLight}`, borderRadius: "8px", padding: "14px 12px", background: "white" }}>
            <p style={{ fontSize: "14px", fontWeight: 800, color: C.navy, margin: "0 0 4px 0", lineHeight: 1 }}>{m.value}</p>
            <p style={{ fontSize: "9px", fontWeight: 600, color: C.navy, margin: "0 0 2px 0" }}>{m.label}</p>
            <p style={{ fontSize: "8px", color: C.textMuted, margin: 0 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Wealth level pill track */}
      <div style={{ padding: "0 48px 24px" }}>
        <p style={{ fontSize: "8px", color: C.textMuted, marginBottom: "8px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 600 }}>
          Tu nivel patrimonial en esta etapa de vida
        </p>
        <div style={{ display: "flex", gap: "5px" }}>
          {ALL_NIVELES.map((n) => (
            <span key={n} style={{
              flex: 1, textAlign: "center", padding: "4px 6px", borderRadius: "20px", fontSize: "9px", fontWeight: 600,
              background: n === motorB.nivel_riqueza ? C.navy : C.parchment,
              color: n === motorB.nivel_riqueza ? "white" : C.textMuted,
              border: `1px solid ${n === motorB.nivel_riqueza ? C.navy : C.borderLight}`,
            }}>
              {NIVEL_LABELS[n]}
            </span>
          ))}
        </div>
      </div>

      {/* Thin divider */}
      <div style={{ margin: "0 48px 20px", height: "1px", background: C.borderLight }} />

      {/* Table of contents */}
      <div style={{ padding: "0 48px", flex: 1 }}>
        <p style={{ fontSize: "8px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "3px", margin: "0 0 14px 0" }}>En este reporte</p>
        {[
          { title: "Tu hoja de ruta", desc: "Revisión, análisis y las acciones que recomendamos para ti" },
          { title: "Tu panorama de riqueza", desc: "Patrimonio, activos y el equilibrio de tu situación actual" },
          { title: "Tu flujo de vida", desc: "Ingresos, gastos y tu capacidad de inversión mensual" },
          { title: "La estructura de tu patrimonio", desc: "Distribución entre liquidez, inversiones, inmuebles y retiro" },
          { title: "Tu camino al retiro", desc: "Proyección patrimonial y avance hacia tu independencia financiera" },
        ].map((sec, i) => (
          <div key={sec.title} style={{ marginBottom: "10px", display: "flex", gap: "14px", alignItems: "flex-start", paddingBottom: "10px", borderBottom: i < 4 ? `1px solid ${C.rowBorder}` : "none" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: C.navy, margin: "0 0 2px 0" }}>{sec.title}</p>
              <p style={{ fontSize: "9px", color: C.textMuted, margin: 0 }}>{sec.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cover footer */}
      <div style={{ padding: "16px 48px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: C.navy }}>Actinver Banca Privada</span>
        <span style={{ fontSize: "8px", color: C.textMuted }}>Página 1 de {TOTAL_PAGES} · Confidencial</span>
      </div>
    </div>
  );
}

function Page2PlanDeAccion({
  clientName,
  rows,
}: {
  clientName: string;
  rows: PlanRow[];
}) {
  return (
    <div data-pdf-page="2" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Patrimonial" clientName={clientName} />
      <SectionTitle letter="Tu hoja de ruta" subtitle="Situación actual en cada área y los pasos concretos que recomendamos para ti">Tu plan personalizado</SectionTitle>

      {/* Table header */}
      <div style={{ display: "flex", gap: "0", padding: "8px 40px", background: C.navy, marginBottom: "2px" }}>
        {[
          { label: "Área", flex: 1.2 },
          { label: "Dónde estás hoy", flex: 2 },
          { label: "Urgencia", flex: 0.8 },
          { label: "Lo que recomendamos", flex: 2.2 },
        ].map((col) => (
          <div key={col.label} style={{ flex: col.flex }}>
            <span style={{ fontSize: "9px", fontWeight: 600, color: "white", letterSpacing: "0.5px" }}>{col.label}</span>
          </div>
        ))}
      </div>

      {/* Table rows */}
      {rows.map((row, i) => (
        <div
          key={row.aspecto}
          style={{
            display: "flex",
            gap: "0",
            padding: "10px 40px",
            background: i % 2 === 0 ? C.cream : C.parchment,
            borderBottom: `1px solid ${C.rowBorder}`,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1.2 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy }}>{row.aspecto}</span>
          </div>
          <div style={{ flex: 2 }}>
            <span style={{ fontSize: "11px", color: C.textNavy }}>{row.situacion}</span>
          </div>
          <div style={{ flex: 0.8 }}>
            <RiskBadge nivel={row.riesgo} />
          </div>
          <div style={{ flex: 2.2 }}>
            <span style={{ fontSize: "11px", color: C.textNavy }}>{row.recomendacion}</span>
          </div>
        </div>
      ))}

      {/* Summary banner */}
      <div style={{ margin: "16px 40px 0", background: C.navy, borderRadius: "12px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: C.blue2, fontSize: "9px", margin: "0 0 3px 0", textTransform: "uppercase", letterSpacing: "2px" }}>Áreas de enfoque inmediato</p>
          <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>
            {rows.filter((r) => r.riesgo === "Alto" || r.riesgo === "Muy Alto").length} áreas prioritarias
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: C.blue2, fontSize: "9px", margin: "0 0 3px 0", textTransform: "uppercase", letterSpacing: "2px" }}>Bases sólidas</p>
          <span style={{ color: C.gold, fontSize: "14px", fontWeight: 700 }}>
            {rows.filter((r) => r.riesgo === "Bajo").length} áreas en orden
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={2} total={TOTAL_PAGES} />
    </div>
  );
}

function Page3PatrimonioNeto({
  clientName,
  motorE,
  motorB,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
  motorB: ReturnType<typeof calcularMotorB>;
}) {
  const indice_liquidez = motorB.gasto_anual > 0 ? motorE.patrimonio_neto / motorB.gasto_anual : 0;

  const total = Math.max(motorE.financiero + motorE.noFinanciero, 1);
  const finPct = (motorE.financiero / total) * 100;
  const noFinPct = (motorE.noFinanciero / total) * 100;

  return (
    <div data-pdf-page="3" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Patrimonial" clientName={clientName} />
      <SectionTitle letter="Tu panorama de riqueza" subtitle="El total de lo que tienes, lo que debes y lo que es tuyo">Tu patrimonio neto</SectionTitle>

      <SubsectionHeader>Lo que tienes · Lo que debes · Lo que es tuyo</SubsectionHeader>

      {/* Balance sheet two-column */}
      <div style={{ display: "flex", gap: "12px", padding: "0 40px", marginBottom: "12px" }}>
        {/* ACTIVOS */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px 0" }}>Activos</p>
          {[
            { label: "Activos financieros", value: motorE.financiero, color: C.navy },
            { label: "Bienes e inmuebles", value: motorE.noFinanciero, color: C.navyMid },
            { label: "Total de lo que tienes", value: motorE.activos_total, color: C.navy, bold: true },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "4px", height: "20px", background: row.color, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", color: C.textNavy, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: row.bold ? C.navy : C.textNavy }}>{formatMXN(row.value)}</span>
            </div>
          ))}
        </div>
        {/* PASIVOS */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px 0" }}>Pasivos y Patrimonio Neto</p>
          {[
            { label: "Lo que debes (créditos)", value: motorE.pasivos_total, color: C.gold },
            { label: "Lo que es tuyo", value: motorE.patrimonio_neto, color: C.green, bold: true },
            { label: "Total", value: motorE.activos_total, color: C.lightGray, bold: true },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "4px", height: "20px", background: row.color, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", color: C.textNavy, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: row.bold ? C.navy : C.textNavy }}>{formatMXN(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked visual bars */}
      <div style={{ display: "flex", gap: "16px", margin: "8px 40px 16px", height: "160px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ flex: Math.max(motorE.financiero, 1), background: C.navy, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: "9px", fontWeight: 600, textAlign: "center" }}>Financiero</span>
            <span style={{ color: C.gold, fontSize: "10px", fontWeight: 700 }}>{formatMXN(motorE.financiero)}</span>
            <span style={{ color: C.blue2, fontSize: "9px" }}>{finPct.toFixed(0)}%</span>
          </div>
          <div style={{ flex: Math.max(motorE.noFinanciero, 1), background: C.navyMid, borderRadius: "0 0 6px 6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: "9px", fontWeight: 600, textAlign: "center" }}>No Financiero</span>
            <span style={{ color: C.gold, fontSize: "10px", fontWeight: 700 }}>{formatMXN(motorE.noFinanciero)}</span>
            <span style={{ color: C.blue2, fontSize: "9px" }}>{noFinPct.toFixed(0)}%</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ flex: Math.max(motorE.pasivos_total, 1), background: C.gold, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: C.navy, fontSize: "9px", fontWeight: 600 }}>Obligaciones</span>
            <span style={{ color: C.navy, fontSize: "10px", fontWeight: 700 }}>{formatMXN(motorE.pasivos_total)}</span>
          </div>
          <div style={{ flex: Math.max(motorE.patrimonio_neto, 1), background: "#E0ECE6", border: `1px solid ${C.border}`, borderRadius: "0 0 6px 6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: C.green, fontSize: "9px", fontWeight: 600 }}>Patrimonio Neto</span>
            <span style={{ color: C.green, fontSize: "10px", fontWeight: 700 }}>{formatMXN(motorE.patrimonio_neto)}</span>
          </div>
        </div>
      </div>

      {/* Longevidad / índice de liquidez banner */}
      <SubsectionHeader>¿Cuánto tiempo dura tu dinero sin tocar el retiro?</SubsectionHeader>
      <div style={{ margin: "8px 40px", background: C.navy, borderRadius: "10px", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: C.blue2, fontSize: "10px", margin: "0 0 4px 0", letterSpacing: "1px" }}>Tu dinero disponible cubre</p>
          <p style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0 }}>{indice_liquidez.toFixed(1)} años</p>
          <p style={{ color: C.blue2, fontSize: "10px", margin: "4px 0 0 0" }}>de tus gastos actuales</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: C.blue2, fontSize: "10px", margin: "0 0 4px 0", letterSpacing: "1px" }}>Si no aportas más, tus recursos duran hasta</p>
          <p style={{ color: C.gold, fontSize: "22px", fontWeight: 700, margin: 0 }}>los {motorB.longevidad_recursos.toFixed(0)} años</p>
          <p style={{ color: C.blue2, fontSize: "10px", margin: "4px 0 0 0" }}>de edad estimada</p>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={3} total={TOTAL_PAGES} />
    </div>
  );
}

function Page4FlujoeIngresos({
  clientName,
  motorA,
  flujoMensual,
}: {
  clientName: string;
  motorA: ReturnType<typeof calcularMotorA>;
  flujoMensual: { ahorro: number; rentas: number; otros: number; gastos_basicos: number; obligaciones: number; creditos: number };
}) {
  const ingresos = motorA.ingresos_totales;
  const gastos = motorA.gastos_totales;
  const disponible = Math.max(ingresos - gastos, 0);
  const pct = (v: number) => (ingresos > 0 ? Math.round((v / ingresos) * 100) : 0);
  const pctDisp = pct(disponible);
  const pctGastos = pct(gastos);

  const rentas = flujoMensual.rentas;
  const otros = flujoMensual.otros;
  const ingActPpal = flujoMensual.ahorro;

  return (
    <div data-pdf-page="4" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Patrimonial" clientName={clientName} />
      <SectionTitle letter="Tu flujo de vida" subtitle={`Ingresas ${formatMXN(ingresos)} al mes — así es como fluye tu dinero`}>Ingresos y capacidad de inversión</SectionTitle>

      {/* Main income rows matching PDF */}
      {[
        { label: "Ingresos Totales", value: formatMXN(ingresos), color: C.navy, bold: true },
        { label: `Gastos Totales (${pctGastos}%)`, value: formatMXN(gastos), color: C.navyMid },
        { label: `Ingreso disponible para inversión (${pctDisp}%)`, value: formatMXN(disponible), color: C.gold, bold: true },
      ].map((row) => (
        <SummaryRow key={row.label} color={row.color} label={row.label} value={row.value} />
      ))}

      {/* Secondary income breakdown */}
      {(ingActPpal > 0 || rentas > 0 || otros > 0) && (
        <>
          <SubsectionHeader>Desglose de Ingresos</SubsectionHeader>
          <div style={{ padding: "4px 40px" }}>
            {ingActPpal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
                <span style={{ fontSize: "12px", color: C.textNavy }}>
                  Disponible ingreso actividad principal ({pct(ingActPpal)}%)
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy }}>{formatMXN(ingActPpal)}</span>
              </div>
            )}
            {rentas > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
                <span style={{ fontSize: "12px", color: C.textNavy }}>
                  Disponible otros ingresos — rentas ({pct(rentas)}%)
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy }}>{formatMXN(rentas)}</span>
              </div>
            )}
            {otros > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
                <span style={{ fontSize: "12px", color: C.textNavy }}>
                  Disponible otros ingresos — actividad adicional ({pct(otros)}%)
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy }}>{formatMXN(otros)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Block chart */}
      <div style={{ display: "flex", gap: "16px", margin: "20px 40px", height: "190px" }}>
        <div style={{ flex: 1, background: C.navy, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ color: "white", fontSize: "10px", fontWeight: 600 }}>Ingresos Totales</span>
          <span style={{ color: C.gold, fontSize: "14px", fontWeight: 700 }}>{formatMXN(ingresos)}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ flex: Math.max(gastos, 1), background: C.navyMid, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: "10px", fontWeight: 600 }}>Gastos ({pctGastos}%)</span>
            <span style={{ color: C.gold, fontSize: "12px", fontWeight: 700 }}>{formatMXN(gastos)}</span>
          </div>
          <div style={{ flex: Math.max(disponible, 1), background: C.gold, borderRadius: "0 0 6px 6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: C.navy, fontSize: "10px", fontWeight: 600 }}>Disponible ({pctDisp}%)</span>
            <span style={{ color: C.navy, fontSize: "12px", fontWeight: 700 }}>{formatMXN(disponible)}</span>
          </div>
        </div>
      </div>

      {/* Insight banner */}
      <div style={{ margin: "0 40px", background: C.parchment, border: `1px solid ${C.borderLight}`, borderRadius: "12px", padding: "16px 22px" }}>
        <p style={{ fontSize: "9px", color: C.gold, fontWeight: 600, margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "2px" }}>
          Nuestra lectura
        </p>
        <p style={{ fontSize: "11px", color: C.textNavy, margin: 0, lineHeight: 1.6 }}>
          {pctDisp >= 40
            ? `Excelente. Cada mes pones a trabajar el ${pctDisp}% de tus ingresos. Eso es lo que construye riqueza generacional — sigamos creciendo y optimizando el portafolio.`
            : pctDisp >= 20
              ? `Tienes una base sólida: el ${pctDisp}% de tus ingresos queda libre para crecer. Incorporar ingresos pasivos (rentas, dividendos) acelerará tu independencia financiera.`
              : "Tu flujo mensual tiene espacio para crecer. Identificar y reducir gastos no estratégicos te permitirá destinar más a inversiones que trabajen por ti."}
        </p>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={4} total={TOTAL_PAGES} />
    </div>
  );
}

function Page5EstructuraPatrimonio({
  clientName,
  patrimonio,
}: {
  clientName: string;
  patrimonio: {
    liquidez: number; inversiones: number; dotales: number;
    afore: number; ppr: number; plan_privado: number; seguros_retiro: number;
    casa: number; tierra: number; herencia: number;
    inmuebles_renta: number; negocio: number;
  };
}) {
  const liquidezVal = patrimonio.liquidez;
  const inversionesVal = patrimonio.inversiones + patrimonio.dotales;
  const patrimonialesVal = patrimonio.casa + patrimonio.tierra + patrimonio.herencia;
  const productivosVal = patrimonio.inmuebles_renta + patrimonio.negocio;
  const retiroVal = patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;

  const total = liquidezVal + inversionesVal + patrimonialesVal + productivosVal + retiroVal || 1;

  const cats = [
    { label: "Dinero disponible", value: liquidezVal, color: C.navy, desc: "Cuentas bancarias y efectivo accesible" },
    { label: "Inversiones", value: inversionesVal, color: "#3A5A8C", desc: "Fondos, acciones, CETES, dotales" },
    { label: "Bienes propios", value: patrimonialesVal, color: C.navyMid, desc: "Casa, terreno, herencia esperada" },
    { label: "Activos que generan renta", value: productivosVal, color: C.gold, desc: "Propiedades rentadas y negocio" },
    { label: "Para el retiro", value: retiroVal, color: "#6B8EAA", desc: "AFORE, PPR, plan privado, seguros" },
  ];

  return (
    <div data-pdf-page="5" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Patrimonial" clientName={clientName} />
      <SectionTitle letter="La estructura de tu patrimonio" subtitle="Cómo se distribuye tu riqueza entre liquidez, inversiones, inmuebles y retiro">De dónde viene tu fortaleza financiera</SectionTitle>

      {/* Horizontal bar chart with percentages */}
      <div style={{ padding: "0 40px" }}>
        {cats.map((cat) => {
          const pct = (cat.value / total) * 100;
          return (
            <div key={cat.label} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: C.textNavy, fontWeight: 600 }}>{cat.label}</span>
                  <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "8px" }}>{cat.desc}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: cat.color }}>{pct.toFixed(0)}%</span>
                  <span style={{ fontSize: "11px", color: C.textMuted, marginLeft: "8px" }}>{formatMXN(cat.value)}</span>
                </div>
              </div>
              <div style={{ height: "14px", background: C.borderLight, borderRadius: "7px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: cat.color, borderRadius: "7px" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend boxes */}
      <div style={{ display: "flex", gap: "8px", padding: "12px 40px", flexWrap: "wrap" }}>
        {cats.map((cat) => (
          <div key={cat.label} style={{ display: "flex", alignItems: "center", gap: "6px", background: C.parchment, border: `1px solid ${C.borderLight}`, borderRadius: "20px", padding: "4px 12px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: C.textNavy, fontWeight: 500 }}>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Distribution insight */}
      <div style={{ margin: "8px 40px", background: C.navy, borderRadius: "12px", padding: "16px 24px" }}>
        <p style={{ color: C.gold, fontSize: "9px", fontWeight: 600, margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "2px" }}>Dónde está tu riqueza</p>
        <div style={{ display: "flex", gap: "20px" }}>
          {cats.filter((c) => c.value > 0).map((cat) => (
            <div key={cat.label} style={{ textAlign: "center" }}>
              <p style={{ color: C.gold, fontSize: "16px", fontWeight: 800, margin: "0 0 2px 0" }}>{((cat.value / total) * 100).toFixed(0)}%</p>
              <p style={{ color: C.blue2, fontSize: "9px", margin: 0 }}>{cat.label.split(" ")[0]}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={5} total={TOTAL_PAGES} />
    </div>
  );
}

function Page6ProteccionPatrimonial({
  clientName,
  motorE,
  motorF,
  motorA,
  proteccion,
  perfil,
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
  const solvenciaPct = motorE.indice_solvencia * 100;
  const tieneDep = perfil?.dependientes ?? false;

  return (
    <div data-pdf-page="6" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Patrimonial" clientName={clientName} />
      <SectionTitle letter="Blindaje patrimonial" subtitle="Lo que protege todo lo que has construido">Tus coberturas de protección</SectionTitle>

      {/* Coverage status */}
      <SubsectionHeader>Resumen de coberturas activas</SubsectionHeader>
      <div style={{ display: "flex", gap: "10px", padding: "8px 40px 12px" }}>
        {[
          { label: "Seguro de Vida", ok: proteccion?.seguro_vida ?? false },
          { label: "SGMM", ok: proteccion?.sgmm ?? false },
          { label: "Propiedades Aseguradas", ok: proteccion?.propiedades_aseguradas ?? false },
          { label: "Dependientes cubiertos", ok: tieneDep ? (proteccion?.seguro_vida ?? false) : true },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: item.ok ? C.greenBg : C.redBg,
              border: `1px solid ${item.ok ? "#A8D8B8" : "#F0AAAA"}`,
              borderRadius: "10px",
              padding: "12px 14px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "16px", margin: "0 0 4px 0" }}>{item.ok ? "✓" : "✗"}</p>
            <p style={{ fontSize: "10px", fontWeight: 600, color: item.ok ? C.green : C.red, margin: 0 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Impact on balance */}
      <SubsectionHeader>Impacto en tu Balance</SubsectionHeader>
      <SummaryRow color={C.navy} label="Patrimonio Neto Actual" value={formatMXN(motorE.patrimonio_neto)} note={`Solvencia: ${solvenciaPct.toFixed(0)}%`} />
      <SummaryRow color={C.red} label="Afectación sin cobertura de vida" value={sumaVida > 0 ? `-${formatMXN(sumaVida)}` : "—"} />
      <SummaryRow color={C.green} label="Patrimonio Resultante (con cobertura)" value={formatMXN(motorE.patrimonio_neto - sumaVida)} />

      {/* Impact on flow */}
      <SubsectionHeader>¿Qué pasaría si dejaras de percibir ingresos mañana?</SubsectionHeader>
      <div style={{ padding: "8px 40px" }}>
        <div style={{ display: "flex", gap: "0", padding: "5px 0", borderBottom: `1px solid ${C.rowBorder}`, fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>
          <span style={{ flex: 2 }}>Concepto</span>
          <span style={{ flex: 1, textAlign: "right" }}>Actual</span>
          <span style={{ flex: 1, textAlign: "right" }}>Sin ingresos</span>
          <span style={{ flex: 1, textAlign: "right" }}>Impacto</span>
        </div>
        <div style={{ display: "flex", gap: "0", padding: "8px 0", fontSize: "12px" }}>
          <span style={{ flex: 2, color: C.textNavy }}>Ingresos disponibles</span>
          <span style={{ flex: 1, textAlign: "right", fontWeight: 700, color: C.navy }}>{formatMXN(disponible)}</span>
          <span style={{ flex: 1, textAlign: "right", fontWeight: 700, color: C.textMuted }}>$0</span>
          <span style={{ flex: 1, textAlign: "right", fontWeight: 700, color: C.red }}>-100%</span>
        </div>
      </div>

      {/* Insurance recommendation box */}
      <SubsectionHeader>Protección para quienes dependen de ti</SubsectionHeader>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 40px 8px" }}>
        Una suma asegurada que garantice al menos 3 años de tu estilo de vida para quienes más importan.
      </p>
      <div style={{ display: "flex", background: C.parchment, borderRadius: "10px", overflow: "hidden", margin: "0 40px 8px" }}>
        <div style={{ flex: 1, padding: "14px 20px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 4px 0" }}>Suma asegurada recomendada</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: C.navy, margin: 0 }}>{sumaVida > 0 ? formatMXN(sumaVida) : "Por calcular"}</p>
        </div>
        <div style={{ width: "1px", background: C.border, margin: "10px 0" }} />
        <div style={{ flex: 1, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 4px 0" }}>Prima anual estimada</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: C.navy, margin: 0 }}>{primaVida > 0 ? formatMXN(primaVida) : "Por cotizar"}</p>
          </div>
          <span style={{ fontSize: "18px" }}>⚠️</span>
        </div>
        <div style={{ width: "8px", background: C.orange, borderRadius: "0 10px 10px 0" }} />
      </div>

      <div style={{ margin: "12px 40px", background: C.navy, borderRadius: "10px", padding: "14px 24px", textAlign: "center" }}>
        <span style={{ color: "white", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          PROTECCIÓN PARA TI Y LOS QUE MÁS QUIERES
        </span>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={6} total={TOTAL_PAGES} />
    </div>
  );
}

function Page7TrayectoriaPatrimonial({
  clientName,
  motorC,
  retiro,
}: {
  clientName: string;
  motorC: ReturnType<typeof calcularMotorC>;
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number };
}) {
  const curva = motorC.curva;
  const maxSaldo = Math.max(...curva.map((p) => p.saldo), 1);
  const anuales = curva.filter((_, i) => i % 12 === 0 || i === curva.length - 1);

  return (
    <div data-pdf-page="7" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Patrimonial" clientName={clientName} />
      <SectionTitle letter="Tu camino al retiro" subtitle="Cómo crece y evoluciona tu patrimonio año con año">Tu trayectoria patrimonial</SectionTitle>

      {/* Horizontal bar chart */}
      <div style={{ padding: "0 40px", maxHeight: "480px", overflowY: "auto" }}>
        {(anuales.length > 0 ? anuales : curva).map((point) => {
          const barPct = maxSaldo > 0 ? (Math.max(point.saldo, 0) / maxSaldo) * 100 : 0;
          const isPos = point.saldo >= 0;
          const isRetiro = point.edad >= retiro.edad_retiro;
          return (
            <div key={point.mes} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
              <span style={{ width: "36px", fontSize: "10px", color: C.textMuted, textAlign: "right", flexShrink: 0 }}>
                {Math.round(point.edad)} a
              </span>
              <div style={{ flex: 1, height: "16px", background: C.borderLight, borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${barPct}%`, height: "100%", background: isPos ? (isRetiro ? C.gold : C.navy) : C.red, borderRadius: "4px" }} />
                {isRetiro && point.edad === retiro.edad_retiro && (
                  <div style={{ position: "absolute", left: `${barPct}%`, top: 0, bottom: 0, width: "2px", background: C.red }} />
                )}
              </div>
              <span style={{ width: "90px", fontSize: "10px", fontWeight: 600, color: isPos ? C.navy : C.red, textAlign: "right", flexShrink: 0 }}>
                {formatMXN(point.saldo)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", padding: "10px 40px", flexWrap: "wrap" }}>
        {[
          { color: C.navy, label: "Acumulación (antes del retiro)" },
          { color: C.gold, label: "Decumulación (retiro)" },
          { color: C.red, label: "Déficit" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.color }} />
            <span style={{ fontSize: "10px", color: C.textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: "10px", padding: "0 40px 12px" }}>
        {[
          { label: "Patrimonio en Retiro", value: formatMXN(motorC.saldo_inicio_jubilacion), bg: C.parchment, color: C.navy },
          { label: "Mensualidad Total", value: formatMXN(motorC.pension_total_mensual), bg: C.navy, color: "white" as string, labelColor: C.blue2 as string },
          { label: "Mensualidad Deseada", value: formatMXN(retiro.mensualidad_deseada), bg: C.parchment, color: C.navy },
          { label: "Grado de Avance", value: `${(motorC.grado_avance * 100).toFixed(0)}%`, bg: motorC.grado_avance >= 1 ? C.greenBg : C.orangeBg, color: motorC.grado_avance >= 1 ? C.green : C.orange },
        ].map((m) => (
          <div key={m.label} style={{ flex: 1, background: m.bg, borderRadius: "10px", padding: "12px 14px" }}>
            <p style={{ fontSize: "9px", color: (m as { labelColor?: string }).labelColor ?? C.textMuted, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "1px" }}>{m.label}</p>
            <p style={{ fontSize: "15px", fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={7} total={TOTAL_PAGES} />
    </div>
  );
}

function Page8AnexoCriterios({
  clientName,
  motorC,
  retiro,
  perfil,
}: {
  clientName: string;
  motorC: ReturnType<typeof calcularMotorC>;
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number };
  perfil: { edad: number } | null;
}) {
  const aniosAcum = retiro.edad_retiro - (perfil?.edad ?? 35);
  const aniosRetiro = retiro.edad_defuncion - retiro.edad_retiro;

  return (
    <div data-pdf-page="8" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Patrimonial" clientName={clientName} />
      <SectionTitle letter="Transparencia total" subtitle="Los supuestos y metodología detrás de tus proyecciones">Cómo calculamos tu trayectoria</SectionTitle>

      <SubsectionHeader>Supuestos de proyección</SubsectionHeader>
      <div style={{ padding: "8px 40px" }}>
        {[
          { label: "Tasa de rendimiento anual (promedio)", value: "6.5% real" },
          { label: "Inflación estimada", value: "3.5% anual" },
          { label: "Tasa neta sobre inflación", value: "3.0% anual" },
          { label: "Horizonte de acumulación", value: `${Math.max(aniosAcum, 0)} años (hoy → retiro)` },
          { label: "Horizonte de decumulación (retiro)", value: `${aniosRetiro} años (retiro → edad final)` },
          { label: "Fuentes de ingreso en retiro", value: "AFORE · PPR · Plan privado · Patrimonio financiero · Rentas" },
          { label: "Ley 73 IMSS (si aplica)", value: "Incluida en proyección según saldo indicado" },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
            <span style={{ fontSize: "12px", color: C.textNavy }}>{row.label}</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: C.navy }}>{row.value}</span>
          </div>
        ))}
      </div>

      <SubsectionHeader>Fuentes de Ingreso en el Retiro</SubsectionHeader>
      <div style={{ padding: "8px 40px" }}>
        {[
          { label: "Patrimonio financiero acumulado", value: formatMXN(motorC.saldo_inicio_jubilacion), color: C.navy },
          { label: "Pensiones / esquemas formales", value: formatMXN((motorC.fuentes_ingreso as { pension?: number }).pension ?? 0), color: C.gold },
          { label: "Ingresos por rentas", value: formatMXN((motorC.fuentes_ingreso as { rentas?: number }).rentas ?? 0), color: C.navyMid },
          { label: "Mensualidad total posible", value: formatMXN(motorC.pension_total_mensual), color: C.green, bold: true },
          { label: "Mensualidad deseada", value: formatMXN(retiro.mensualidad_deseada), color: C.textNavy },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "4px", height: "18px", background: row.color, borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", color: C.textNavy, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      <SubsectionHeader>Glosario</SubsectionHeader>
      <div style={{ padding: "8px 40px" }}>
        {[
          { term: "Patrimonio Neto", def: "Activos totales menos pasivos. Representa la riqueza real del cliente." },
          { term: "Grado de Avance", def: "Porcentaje de la mensualidad deseada en retiro que podrá cubrirse con el patrimonio proyectado." },
          { term: "Índice de Liquidez", def: "Años de gastos corrientes que el patrimonio financiero puede cubrir sin generar nuevos ingresos." },
          { term: "Longevidad de Recursos", def: "Edad estimada a la que se agotarían los recursos financieros manteniendo el nivel de gasto actual." },
          { term: "SGMM", def: "Seguro de Gastos Médicos Mayores. Cubre hospitalización, cirugías y eventos de salud de alto costo." },
          { term: "PPR", def: "Plan Personal de Retiro. Instrumento de ahorro con beneficios fiscales para complementar la pensión." },
        ].map((item) => (
          <div key={item.term} style={{ padding: "6px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy }}>{item.term}: </span>
            <span style={{ fontSize: "11px", color: C.textMuted }}>{item.def}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={8} total={TOTAL_PAGES} />
    </div>
  );
}

function Page9BackCover({ clientName }: { clientName: string }) {
  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div data-pdf-page="9" style={{ width: "794px", height: "1123px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.navy }}>
      {/* Accent top bar */}
      <div style={{ height: "4px", background: `linear-gradient(90deg, ${C.gold} 0%, ${C.navy} 100%)` }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 80px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "1px", background: C.gold, margin: "0 auto 28px" }} />
          <p style={{ fontSize: "11px", color: C.gold, letterSpacing: "4px", textTransform: "uppercase", margin: "0 0 28px 0", fontWeight: 600 }}>
            Tu asesor financiero de confianza
          </p>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "white", letterSpacing: "-0.5px" }}>Actinver</span>
            <span style={{ color: C.gold, fontSize: "14px", fontWeight: 400, marginLeft: "10px", letterSpacing: "1px" }}>Banca Privada</span>
          </div>
          <p style={{ fontSize: "13px", color: C.blue2, margin: "0 0 40px 0", fontWeight: 300, letterSpacing: "0.3px" }}>
            Tu patrimonio, con claridad. Tu futuro, con estrategia.
          </p>
          <div style={{ width: "40px", height: "1px", background: "rgba(201,169,110,0.4)", margin: "0 auto 32px" }} />
          <p style={{ fontSize: "11px", color: "#4A6A8A", margin: "0 0 6px 0" }}>{clientName}</p>
          <p style={{ fontSize: "10px", color: "#3A5A7A", margin: 0 }}>Documento emitido el {fecha}</p>
        </div>
      </div>

      {/* Legal note */}
      <div style={{ padding: "20px 40px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <p style={{ fontSize: "9px", color: "#3A5A7A", lineHeight: 1.6, margin: 0, textAlign: "center" }}>
          Este documento es informativo y no constituye recomendación de inversión. Las proyecciones se basan en datos
          proporcionados por el cliente y no garantizan resultados futuros. Rendimientos pasados no garantizan rendimientos futuros.
          Actinver Casa de Bolsa, S.A. de C.V. — Supervisada por la CNBV.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 40px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "white" }}>Actinver Banca Privada</span>
        <span style={{ fontSize: "9px", color: "#5A7A9A" }}>Página {TOTAL_PAGES} de {TOTAL_PAGES}</span>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function BalancePDFTemplate() {
  const perfil = useDiagnosticoStore((s) => s.perfil);
  const flujoMensual = useDiagnosticoStore((s) => s.flujoMensual);
  const patrimonio = useDiagnosticoStore((s) => s.patrimonio);
  const retiro = useDiagnosticoStore((s) => s.retiro);
  const proteccion = useDiagnosticoStore((s) => s.proteccion);

  const clientName = perfil?.nombre ?? "Cliente";
  const edad = perfil?.edad ?? 35;
  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  const motorA = useMemo(() => {
    if (!flujoMensual) return null;
    return calcularMotorA({
      ahorro: flujoMensual.ahorro,
      rentas: flujoMensual.rentas,
      otros: flujoMensual.otros,
      gastos_basicos: flujoMensual.gastos_basicos,
      obligaciones: flujoMensual.obligaciones,
      creditos: flujoMensual.creditos,
      liquidez: patrimonio?.liquidez,
    });
  }, [flujoMensual, patrimonio]);

  const motorB = useMemo(() => {
    if (!patrimonio || !flujoMensual) return null;
    return calcularMotorB({
      liquidez: patrimonio.liquidez,
      inversiones: patrimonio.inversiones,
      dotales: patrimonio.dotales,
      afore: patrimonio.afore,
      ppr: patrimonio.ppr,
      plan_privado: patrimonio.plan_privado,
      seguros_retiro: patrimonio.seguros_retiro,
      edad,
      gastos_basicos: flujoMensual.gastos_basicos,
      obligaciones: flujoMensual.obligaciones,
      creditos: flujoMensual.creditos,
    });
  }, [patrimonio, flujoMensual, edad]);

  const motorC = useMemo(() => {
    if (!patrimonio || !flujoMensual || !retiro) return null;
    const pat_fin =
      patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales +
      patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;
    return calcularMotorC({
      patrimonio_financiero_total: pat_fin,
      saldo_esquemas: patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado,
      ley_73: patrimonio.ley_73,
      rentas: flujoMensual.rentas,
      edad,
      edad_retiro: retiro.edad_retiro,
      edad_defuncion: retiro.edad_defuncion,
      mensualidad_deseada: retiro.mensualidad_deseada,
    });
  }, [patrimonio, flujoMensual, retiro, edad]);

  const motorE = useMemo(() => {
    if (!patrimonio) return null;
    return calcularMotorE({
      liquidez: patrimonio.liquidez,
      inversiones: patrimonio.inversiones,
      dotales: patrimonio.dotales,
      afore: patrimonio.afore,
      ppr: patrimonio.ppr,
      plan_privado: patrimonio.plan_privado,
      seguros_retiro: patrimonio.seguros_retiro,
      casa: patrimonio.casa,
      inmuebles_renta: patrimonio.inmuebles_renta,
      tierra: patrimonio.tierra,
      negocio: patrimonio.negocio,
      herencia: patrimonio.herencia,
      hipoteca: patrimonio.hipoteca,
      saldo_planes: patrimonio.saldo_planes,
      compromisos: patrimonio.compromisos,
    });
  }, [patrimonio]);

  const motorF = useMemo(() => {
    if (!proteccion || !motorE) return null;
    const inmuebles_total = (patrimonio?.casa ?? 0) + (patrimonio?.inmuebles_renta ?? 0) + (patrimonio?.tierra ?? 0);
    return calcularMotorF({
      seguro_vida: proteccion.seguro_vida ?? false,
      propiedades_aseguradas: proteccion.propiedades_aseguradas,
      sgmm: proteccion.sgmm ?? false,
      dependientes: perfil?.dependientes ?? false,
      patrimonio_neto: motorE.patrimonio_neto,
      inmuebles_total,
      edad,
    });
  }, [proteccion, motorE, patrimonio, perfil, edad]);

  // ── Safe zero-defaults ──────────────────────────────────────────────────────
  const safeMotorA = motorA ?? {
    ingresos_totales: 0, gastos_totales: 0,
    distribucion: { obligaciones_pct: 0, gastos_pct: 0, ahorro_pct: 0 },
    benchmark_reserva: 0, meses_cubiertos: null, resultado_reserva: "Pendiente" as const, remanente: 0,
  };
  const safeMotorB = motorB ?? {
    patrimonio_financiero_total: 0, gasto_anual: 0, ratio: 0,
    nivel_riqueza: "suficiente" as const, benchmark_para_edad: 0,
    longevidad_recursos: edad, meses_cubiertos: 0,
  };
  const safeMotorC = motorC ?? {
    saldo_inicio_jubilacion: 0, meses_acumulacion: 0, meses_jubilacion: 0,
    mensualidad_posible: 0, pension_total_mensual: 0, grado_avance: 0,
    deficit_mensual: 0, aportacion_necesaria: null, curva: [],
    fuentes_ingreso: { rentas: 0, pension: 0, patrimonio: 0 },
  };
  const safeMotorE = motorE ?? {
    activos_total: 0, pasivos_total: 0, patrimonio_neto: 0,
    financiero: 0, noFinanciero: 0, indice_solvencia: 0,
    clasificacion_solvencia: "Muy saludable", potencial_apalancamiento: 0,
  };
  const safeMotorF = motorF ?? { recomendaciones: [], suma_asegurada_vida: 0, costo_prima_vida: 0 };
  const safeFlujoMensual = flujoMensual ?? { ahorro: 0, rentas: 0, otros: 0, gastos_basicos: 0, obligaciones: 0, creditos: 0 };
  const safeRetiro = retiro ?? { edad_retiro: 65, mensualidad_deseada: 0, edad_defuncion: 85 };
  const safePatrimonio = patrimonio ?? {
    liquidez: 0, inversiones: 0, dotales: 0, afore: 0, ppr: 0, plan_privado: 0, seguros_retiro: 0,
    casa: 0, tierra: 0, herencia: 0, inmuebles_renta: 0, negocio: 0,
    hipoteca: 0, saldo_planes: 0, compromisos: 0, ley_73: null,
  };

  const planRows = useMemo(
    () =>
      buildPlanDeAccion({
        motorA: safeMotorA,
        motorB: safeMotorB,
        motorC: safeMotorC,
        motorE: safeMotorE,
        proteccion: proteccion ? { ...proteccion, seguro_vida: proteccion.seguro_vida ?? false, sgmm: proteccion.sgmm ?? false } : null,
        perfil: perfil ? { dependientes: perfil.dependientes ?? false, edad: perfil.edad } : null,
        patrimonio: safePatrimonio,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeMotorA, safeMotorB, safeMotorC, safeMotorE, proteccion, perfil]
  );

  return (
    <div
      id="balance-pdf-template"
      style={{ width: "794px", background: C.cream, color: C.textNavy, fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <Page1Cover clientName={clientName} fecha={fecha} motorB={safeMotorB} motorC={safeMotorC} motorE={safeMotorE} motorA={safeMotorA} />
      <Page2PlanDeAccion clientName={clientName} rows={planRows} />
      <Page3PatrimonioNeto clientName={clientName} motorE={safeMotorE} motorB={safeMotorB} />
      <Page4FlujoeIngresos clientName={clientName} motorA={safeMotorA} flujoMensual={safeFlujoMensual} />
      <Page5EstructuraPatrimonio clientName={clientName} patrimonio={safePatrimonio} />
      <Page6ProteccionPatrimonial clientName={clientName} motorE={safeMotorE} motorF={safeMotorF} motorA={safeMotorA}
        proteccion={proteccion ? { ...proteccion, seguro_vida: proteccion.seguro_vida ?? false, sgmm: proteccion.sgmm ?? false } : null}
        perfil={perfil ? { dependientes: perfil.dependientes ?? false } : null} />
      <Page7TrayectoriaPatrimonial clientName={clientName} motorC={safeMotorC} retiro={safeRetiro} />
      <Page8AnexoCriterios clientName={clientName} motorC={safeMotorC} retiro={safeRetiro} perfil={perfil} />
      <Page9BackCover clientName={clientName} />
    </div>
  );
}
