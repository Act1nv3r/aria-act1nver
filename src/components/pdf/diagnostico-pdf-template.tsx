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

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  navy: "#1C2B4A",
  navyDark: "#162338",
  black: "#0D0D0D",
  gold: "#C9A96E",
  lightGray: "#D8D8D8",
  green: "#3DAA5C",
  orange: "#F5A623",
  red: "#E03030",
  cream: "#F5F0E8",
  border: "#C8C0B0",
  borderLight: "#E0D8C8",
  rowBorder: "#EDE8DF",
  textMuted: "#888888",
  textNavy: "#1C2B4A",
  blue2: "#8BAAC0",
};

const TOTAL_PAGES = 8;

// ── Shared sub-components ─────────────────────────────────────────────────────

const PageHeader = ({ reportName, clientName }: { reportName: string; clientName: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 40px", borderBottom: `1px solid ${C.borderLight}` }}>
    <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "2px", textTransform: "uppercase" }}>{reportName}</span>
    <span style={{ fontSize: "10px", color: C.textMuted, letterSpacing: "2px", textTransform: "uppercase" }}>{clientName}</span>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: "32px 40px 0" }}>
    <h2 style={{ fontSize: "48px", fontWeight: 900, color: C.black, textTransform: "uppercase", lineHeight: 1.1, margin: "0 0 8px 0", letterSpacing: "-1px" }}>
      {children}
    </h2>
    <div style={{ height: "3px", background: C.black, marginBottom: "24px" }} />
  </div>
);

const PageFooter = ({ page, total }: { page: number; total: number }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 40px", borderTop: `1px solid ${C.borderLight}`, marginTop: "auto" }}>
    <div>
      <span style={{ fontSize: "14px", fontWeight: 700, color: C.navy }}>Actinver</span>
      <span style={{ color: C.gold, fontSize: "14px", marginLeft: "4px" }}>·</span>
      <span style={{ fontSize: "10px", color: C.gold, letterSpacing: "3px", marginLeft: "4px" }}>ArIA</span>
    </div>
    <span style={{ fontSize: "10px", color: C.textMuted }}>Página {page} de {total}</span>
  </div>
);

const SummaryRow = ({ color, label, value, note }: { color: string; label: string; value: string; note?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 40px", borderBottom: `1px solid ${C.rowBorder}` }}>
    <div style={{ width: "6px", height: "36px", background: color, borderRadius: "3px", flexShrink: 0 }} />
    <span style={{ flex: 1, fontSize: "13px", color: C.textNavy, fontWeight: 500 }}>{label}</span>
    {note && <span style={{ fontSize: "11px", color: C.textMuted }}>{note}</span>}
    <span style={{ fontSize: "15px", fontWeight: 700, color: C.black }}>{value}</span>
  </div>
);

const SubsectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div style={{ margin: "20px 40px 8px" }}>
    <p style={{ fontSize: "12px", fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px 0" }}>{children}</p>
    <div style={{ height: "1px", background: C.border }} />
  </div>
);

const NavyBanner = ({ text, subtext }: { text: string; subtext?: string }) => (
  <div style={{ background: C.navy, borderRadius: "12px", overflow: "hidden", display: "flex", margin: "16px 40px" }}>
    <div style={{ width: "35%", background: C.navyDark, minHeight: "70px" }} />
    <div style={{ flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <p style={{ color: "white", fontSize: "13px", fontWeight: 700, margin: 0 }}>{text}</p>
      {subtext && <p style={{ color: C.blue2, fontSize: "11px", margin: "4px 0 0 0" }}>{subtext}</p>}
    </div>
  </div>
);

const InsuranceBox = ({ label1, value1, label2, value2 }: { label1: string; value1: string; label2: string; value2: string }) => (
  <div style={{ display: "flex", background: "#EDEAE3", borderRadius: "10px", overflow: "hidden", margin: "8px 40px" }}>
    <div style={{ flex: 1, padding: "14px 20px" }}>
      <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 4px 0" }}>{label1}</p>
      <p style={{ fontSize: "16px", fontWeight: 700, color: C.navy, margin: 0 }}>{value1}</p>
    </div>
    <div style={{ width: "1px", background: C.border, margin: "10px 0" }} />
    <div style={{ flex: 1, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 4px 0" }}>{label2}</p>
        <p style={{ fontSize: "16px", fontWeight: 700, color: C.navy, margin: 0 }}>{value2}</p>
      </div>
      <span style={{ fontSize: "16px" }}>⚠️</span>
    </div>
    <div style={{ width: "8px", background: C.orange, borderRadius: "0 10px 10px 0" }} />
  </div>
);

// ── Page components ───────────────────────────────────────────────────────────

function Page1ProyeccionInversion({
  clientName,
  motorE,
}: {
  clientName: string;
  motorE: { financiero: number };
}) {
  const monto = motorE.financiero;
  const rates = [
    { tasa: "8%", anos: "9 años", mult: Math.pow(1.08, 10), portfolio: "Portafolio deuda mexicana." },
    { tasa: "12%", anos: "6 años", mult: Math.pow(1.12, 10), portfolio: "Portafolio balanceado." },
    { tasa: "14%", anos: "5.1 años", mult: Math.pow(1.14, 10), portfolio: "Portafolio equity americana." },
  ];
  const legendColors = [C.lightGray, C.gold, C.black];

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Proyección de Inversión</SectionTitle>

      <div style={{ padding: "0 40px 8px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: C.textNavy, margin: "0 0 2px 0" }}>Regla 72 — tiempo en duplicar tu inversión</p>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 16px 0" }}>
          Es una fórmula simple y efectiva para visualizar en cuántos años puedes duplicar tu inversión.
        </p>
      </div>

      {/* Table */}
      <div style={{ padding: "0 40px" }}>
        <div style={{ display: "flex", gap: "8px", padding: "8px 12px", background: C.navy, borderRadius: "8px 8px 0 0", fontSize: "11px", fontWeight: 700, color: "white" }}>
          <span style={{ flex: 1 }}>Tasa</span>
          <span style={{ flex: 2 }}>Años para duplicar</span>
          <span style={{ flex: 2 }}>Monto inicial</span>
          <span style={{ flex: 2, textAlign: "right" }}>Monto a 10 años</span>
        </div>
        {rates.map((r, i) => (
          <div key={r.tasa} style={{ display: "flex", gap: "8px", padding: "10px 12px", background: i % 2 === 0 ? "#EDEAE3" : C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ flex: 1, fontWeight: 700, color: C.navy }}>{r.tasa}</span>
            <span style={{ flex: 2, color: C.textNavy }}>{r.anos}</span>
            <span style={{ flex: 2, color: C.textNavy }}>{formatMXN(monto)}</span>
            <span style={{ flex: 2, fontWeight: 700, color: C.gold, textAlign: "right" }}>{formatMXN(monto * r.mult)}</span>
          </div>
        ))}
      </div>

      {/* Legend boxes */}
      <div style={{ display: "flex", gap: "12px", padding: "20px 40px" }}>
        {rates.map((r, i) => (
          <div key={r.tasa} style={{ flex: 1, background: "#EDEAE3", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: legendColors[i], flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "11px", color: C.textNavy, margin: 0, lineHeight: 1.5 }}>
              <strong>{r.tasa}</strong> — Duplica cada {r.anos}. {r.portfolio}
            </p>
          </div>
        ))}
      </div>

      {/* Visual bar comparison */}
      <div style={{ padding: "8px 40px" }}>
        <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 10px 0" }}>Comparativa de crecimiento a 10 años</p>
        {rates.map((r, i) => {
          const max = monto * rates[2].mult;
          const pct = max > 0 ? ((monto * r.mult) / max) * 100 : 0;
          return (
            <div key={r.tasa} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "36px", fontSize: "11px", fontWeight: 700, color: C.navy }}>{r.tasa}</span>
              <div style={{ flex: 1, height: "14px", background: C.borderLight, borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: legendColors[i], borderRadius: "4px" }} />
              </div>
              <span style={{ width: "120px", fontSize: "11px", fontWeight: 700, color: C.navy, textAlign: "right" }}>{formatMXN(monto * r.mult)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={1} total={TOTAL_PAGES} />
    </div>
  );
}

function Page2FortalezaFinanciera({
  clientName,
  motorA,
  motorB,
  patrimonio,
}: {
  clientName: string;
  motorA: { gastos_totales: number };
  motorB: { meses_cubiertos: number; patrimonio_financiero_total: number; gasto_anual: number };
  patrimonio: { liquidez: number };
}) {
  const gastos_mensuales = motorA.gastos_totales;
  const reserva_sugerida = gastos_mensuales * 3;
  const reserva_actual = patrimonio.liquidez;
  const meses_reserva = gastos_mensuales > 0 ? reserva_actual / gastos_mensuales : 0;
  const reserva_ok = meses_reserva >= 3;

  const anos_acumulacion = motorB.gasto_anual > 0 ? motorB.patrimonio_financiero_total / motorB.gasto_anual : 0;
  const maxAnos = Math.max(5, Math.ceil(anos_acumulacion));
  const barPct = maxAnos > 0 ? Math.min((anos_acumulacion / maxAnos) * 100, 100) : 0;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Fortaleza Financiera</SectionTitle>

      <SubsectionHeader>Reserva corto plazo</SubsectionHeader>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 40px 12px" }}>
        Tu reserva de corto plazo debe cubrir al menos 3 meses de tus gastos básicos.
      </p>

      {/* Table */}
      <div style={{ padding: "0 40px" }}>
        {[
          { label: "Mis gastos básicos mensuales", value: formatMXN(gastos_mensuales) },
          { label: "Reserva sugerida (gastos × 3)", value: formatMXN(reserva_sugerida) },
          { label: "Mi reserva actual", value: formatMXN(reserva_actual) },
        ].map((row, i) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: i % 2 === 0 ? "#EDEAE3" : C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.textNavy }}>{row.label}</span>
            <span style={{ fontWeight: 700, color: C.black }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div style={{ padding: "12px 40px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "20px", background: reserva_ok ? "#DCFCE7" : "#FEF3C7", color: reserva_ok ? C.green : C.orange, fontSize: "13px", fontWeight: 700 }}>
          {reserva_ok ? "✓ Suficiente" : "⚠ Insuficiente"}
        </span>
      </div>

      <NavyBanner
        text={`Reserva ${reserva_ok ? "Suficiente" : "Insuficiente"}`}
        subtext={reserva_ok ? "Tu colchón de emergencia está bien constituido." : "Considera fortalecer tu reserva de emergencia."}
      />

      <SubsectionHeader>Riqueza acumulación</SubsectionHeader>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 40px 12px" }}>
        Con tu patrimonio financiero actual, puedes cubrir tus gastos durante {anos_acumulacion.toFixed(1)} años.
      </p>

      <div style={{ padding: "0 40px" }}>
        {[
          { label: "Patrimonio financiero", value: formatMXN(motorB.patrimonio_financiero_total) },
          { label: "Gastos totales al año", value: formatMXN(motorB.gasto_anual) },
        ].map((row, i) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: i % 2 === 0 ? "#EDEAE3" : C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.textNavy }}>{row.label}</span>
            <span style={{ fontWeight: 700, color: C.black }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ padding: "16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: C.textNavy }}>Mi nivel de acumulación</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy }}>{anos_acumulacion.toFixed(1)} años</span>
        </div>
        <div style={{ height: "16px", background: "#E0D8C8", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ width: `${barPct}%`, height: "100%", background: C.navy, borderRadius: "8px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <span key={l} style={{ fontSize: "9px", color: C.textMuted }}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={2} total={TOTAL_PAGES} />
    </div>
  );
}

function Page3Retiro({
  clientName,
  motorC,
  retiro,
}: {
  clientName: string;
  motorC: {
    pension_total_mensual: number;
    grado_avance: number;
    fuentes_ingreso: { rentas: number; pension: number; patrimonio: number };
    deficit_mensual: number;
  };
  retiro: { mensualidad_deseada: number };
}) {
  const calidad = retiro.mensualidad_deseada;
  const pension = motorC.pension_total_mensual;
  const grado_pct = Math.min(motorC.grado_avance * 100, 100);

  // Segments proportional
  const afore_part = motorC.fuentes_ingreso.pension;
  const ahorro_part = motorC.fuentes_ingreso.patrimonio;
  const rentas_part = motorC.fuentes_ingreso.rentas;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Retiro</SectionTitle>

      {/* Full-width navy block */}
      <div style={{ background: C.navy, margin: "0 40px 16px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          TU PATRIMONIO ES UN REFLEJO DE TU VISIÓN
        </span>
      </div>

      <SubsectionHeader>Retiro</SubsectionHeader>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 40px 12px" }}>
        Considerando tus saldos actuales para el retiro, esto es lo que podrías recibir cada mes en el futuro:
      </p>

      <div style={{ padding: "0 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#EDEAE3", fontSize: "13px", borderBottom: `1px solid ${C.border}`, borderRadius: "8px 8px 0 0" }}>
          <span style={{ color: C.textNavy }}>Total mensualidad en retiro</span>
          <span style={{ display: "inline-block", padding: "2px 14px", background: C.gold, color: C.navy, borderRadius: "12px", fontWeight: 700, fontSize: "14px" }}>
            {formatMXN(pension)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}`, borderRadius: "0 0 8px 8px" }}>
          <span style={{ color: C.textNavy }}>Calidad de vida deseada</span>
          <span style={{ fontWeight: 700, color: C.black }}>{formatMXN(calidad)}</span>
        </div>
      </div>

      {/* Multi-segment horizontal bar */}
      <div style={{ padding: "16px 40px" }}>
        <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 8px 0" }}>Distribución de fuentes de ingreso en el retiro</p>
        <div style={{ height: "24px", background: "#E0D8C8", borderRadius: "12px", overflow: "hidden", display: "flex" }}>
          {afore_part > 0 && (
            <div style={{ flex: afore_part, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", color: "white", fontWeight: 600 }}>Afore+Esq.</span>
            </div>
          )}
          {ahorro_part > 0 && (
            <div style={{ flex: ahorro_part, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", color: C.navy, fontWeight: 600 }}>Patrimonio</span>
            </div>
          )}
          {rentas_part > 0 && (
            <div style={{ flex: rentas_part, background: C.black, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", color: "white", fontWeight: 600 }}>Rentas</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontSize: "12px", color: C.textNavy, fontWeight: 600 }}>
            Mi avance: {formatMXN(pension)} ({grado_pct.toFixed(0)}%)
          </span>
          <span style={{ fontSize: "12px", color: C.textMuted }}>
            Calidad de vida: {formatMXN(calidad)}
          </span>
        </div>
        <div style={{ height: "10px", background: "#E0D8C8", borderRadius: "6px", overflow: "hidden", marginTop: "6px" }}>
          <div style={{ width: `${grado_pct}%`, height: "100%", background: motorC.deficit_mensual <= 0 ? C.green : C.orange, borderRadius: "6px" }} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", padding: "8px 40px" }}>
        {[
          { color: C.navy, label: "Afore + Esquemas" },
          { color: C.gold, label: "Patrimonio financiero" },
          { color: C.black, label: "Rentas" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.color }} />
            <span style={{ fontSize: "11px", color: C.textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={3} total={TOTAL_PAGES} />
    </div>
  );
}

function Page4IndicePatrimonial({
  clientName,
  motorC,
  motorE,
  seguros_retiro,
  flujoMensual,
}: {
  clientName: string;
  motorC: {
    pension_total_mensual: number;
    deficit_mensual: number;
    aportacion_necesaria: number | null;
    saldo_inicio_jubilacion: number;
    fuentes_ingreso: { rentas: number; pension: number; patrimonio: number };
  };
  motorE: { financiero: number };
  seguros_retiro: number;
  flujoMensual: { rentas: number };
}) {
  const rentas = flujoMensual.rentas;
  const totalIngresoMensual = motorC.pension_total_mensual;
  const deficit = motorC.deficit_mensual;
  const aportacion = motorC.aportacion_necesaria ?? 0;
  const sumaRetiro = seguros_retiro;

  // Total requerido aproximado (20 años * 12 meses * mensualidad_deseada)
  const mensualidad_deseada = totalIngresoMensual + deficit;
  const total_requerido = mensualidad_deseada * 12 * 20;

  const deficit20 = deficit * 12 * 20;
  const isDeficit = deficit > 0;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Índice Patrimonial</SectionTitle>

      <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 40px 16px" }}>
        Tu patrimonio actual a lo largo de tu ciclo de vida
      </p>

      {/* Summary table */}
      <div style={{ padding: "0 40px" }}>
        {[
          { label: "Calidad de vida objetivo", value: formatMXN(mensualidad_deseada), color: C.textNavy },
          { label: "Total esquemas de retiro", value: formatMXN(motorC.fuentes_ingreso.pension), color: C.textNavy },
          { label: "Total otros ingresos (rentas)", value: formatMXN(rentas), color: C.textNavy },
          { label: "Total ingreso mensual en el retiro", value: formatMXN(totalIngresoMensual), color: C.navy },
          { label: "Faltante mensual", value: formatMXN(Math.abs(deficit)), color: isDeficit ? C.red : C.green },
        ].map((row, i) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: i % 2 === 0 ? "#EDEAE3" : C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.textNavy }}>{row.label}</span>
            <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Aportacion box */}
      {aportacion > 0 && (
        <div style={{ background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", margin: "16px 40px", padding: "16px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px 0" }}>Aportación mensual necesaria para el retiro</p>
          <p style={{ fontSize: "28px", fontWeight: 900, color: C.gold, margin: 0 }}>{formatMXN(aportacion)}</p>
        </div>
      )}

      {/* Three boxes */}
      <div style={{ display: "flex", gap: "12px", padding: "12px 40px" }}>
        <div style={{ flex: 1, background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 6px 0" }}>Patrimonio en planes de seguro</p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(sumaRetiro)}</p>
        </div>
        <div style={{ flex: 1, background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 6px 0" }}>Patrimonio financiero actual</p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(motorE.financiero)}</p>
        </div>
        <div style={{ flex: 1, background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 6px 0" }}>Total requerido para retiro</p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(total_requerido)}</p>
        </div>
      </div>

      {/* Warning/success box */}
      <div style={{ display: "flex", background: "#EDEAE3", borderRadius: "10px", overflow: "hidden", margin: "8px 40px" }}>
        <div style={{ flex: 1, padding: "14px 20px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px 0" }}>
            Considerando tu calidad de vida esperada y el total acumulado, tienes un:
          </p>
          <p style={{ fontSize: "22px", fontWeight: 900, color: isDeficit ? C.red : C.green, margin: 0 }}>
            {isDeficit ? `Déficit -${formatMXN(Math.abs(deficit20))}` : `Superávit +${formatMXN(Math.abs(deficit20))}`}
          </p>
        </div>
        <div style={{ width: "8px", background: isDeficit ? C.orange : C.green, borderRadius: "0 10px 10px 0" }} />
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={4} total={TOTAL_PAGES} />
    </div>
  );
}

function Page5TrayectoriaPatrimonioFinanciero({
  clientName,
  motorC,
  motorE,
}: {
  clientName: string;
  motorC: {
    saldo_inicio_jubilacion: number;
    pension_total_mensual: number;
    curva: Array<{ mes: number; edad: number; saldo: number }>;
  };
  motorE: { financiero: number };
}) {
  const curva = motorC.curva;
  const maxSaldo = Math.max(...curva.map((p) => p.saldo), 1);
  const ahorroPotencial = Math.max(motorC.saldo_inicio_jubilacion - motorE.financiero, 0);

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Trayectoria del Patrimonio Financiero</SectionTitle>

      <SubsectionHeader>Gráfica al momento del retiro</SubsectionHeader>

      {/* Summary */}
      <div style={{ padding: "8px 40px" }}>
        {[
          { label: "Patrimonio financiero total al retiro", value: formatMXN(motorC.saldo_inicio_jubilacion), badge: false },
          { label: "Ahorro potencial (crecimiento)", value: formatMXN(ahorroPotencial), badge: false },
          { label: "Total acumulado", value: formatMXN(motorC.saldo_inicio_jubilacion), badge: "navy" },
          { label: "Monto mensual a recibir durante tu retiro", value: formatMXN(motorC.pension_total_mensual), badge: "gold" },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.rowBorder}` }}>
            <span style={{ fontSize: "13px", color: C.textNavy }}>{row.label}</span>
            {row.badge === "navy" ? (
              <span style={{ padding: "3px 14px", background: C.navy, color: "white", borderRadius: "12px", fontWeight: 700, fontSize: "13px" }}>{row.value}</span>
            ) : row.badge === "gold" ? (
              <span style={{ padding: "3px 14px", background: C.gold, color: C.navy, borderRadius: "12px", fontWeight: 700, fontSize: "13px" }}>{row.value}</span>
            ) : (
              <span style={{ fontSize: "13px", fontWeight: 700, color: C.black }}>{row.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ padding: "12px 40px", overflowY: "auto", maxHeight: "480px" }}>
        {curva.map((point) => {
          const barPct = maxSaldo > 0 ? (point.saldo / maxSaldo) * 100 : 0;
          const isPositive = point.saldo > 0;
          return (
            <div key={point.mes} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "40px", fontSize: "11px", color: C.textMuted, textAlign: "right", flexShrink: 0 }}>
                {Math.round(point.edad)} a
              </span>
              <div style={{ flex: 1, height: "18px", background: C.borderLight, borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${barPct}%`, height: "100%", background: isPositive ? C.navy : C.red, borderRadius: "4px" }} />
              </div>
              <span style={{ width: "110px", fontSize: "11px", fontWeight: 600, color: isPositive ? C.navy : C.red, textAlign: "right", flexShrink: 0 }}>
                {formatMXN(point.saldo)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={5} total={TOTAL_PAGES} />
    </div>
  );
}

function Page6Objetivos({
  clientName,
  motorD,
  edad,
}: {
  clientName: string;
  motorD: { resultados: Array<{ nombre: string; monto: number; plazo: number; viable: boolean }> };
  edad: number;
}) {
  const cortoplazo = motorD.resultados.filter((o) => o.plazo <= 2);
  const medlargo = motorD.resultados.filter((o) => o.plazo > 2);
  const total_objetivos = motorD.resultados.reduce((s, o) => s + o.monto, 0);
  const max_plazo = motorD.resultados.length > 0 ? Math.max(...motorD.resultados.map((o) => o.plazo)) : 0;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Objetivos</SectionTitle>

      <SubsectionHeader>Objetivo a corto plazo (hasta 2 años)</SubsectionHeader>
      {cortoplazo.length === 0 ? (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "8px 40px" }}>Sin objetivos a corto plazo registrados.</p>
      ) : (
        <div style={{ padding: "0 40px" }}>
          <div style={{ display: "flex", gap: "8px", padding: "8px 12px", background: C.navy, borderRadius: "8px 8px 0 0", fontSize: "11px", fontWeight: 700, color: "white" }}>
            <span style={{ flex: 3 }}>Objetivo</span>
            <span style={{ flex: 2, textAlign: "right" }}>Meta</span>
            <span style={{ flex: 2, textAlign: "right" }}>Plazo en meses</span>
          </div>
          {cortoplazo.map((o, i) => (
            <div key={o.nombre} style={{ display: "flex", gap: "8px", padding: "8px 12px", background: i % 2 === 0 ? "#EDEAE3" : C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ flex: 3, color: C.textNavy }}>{o.nombre}</span>
              <span style={{ flex: 2, textAlign: "right", fontWeight: 700, color: C.black }}>{formatMXN(o.monto)}</span>
              <span style={{ flex: 2, textAlign: "right", color: C.textMuted }}>{o.plazo * 12} meses</span>
            </div>
          ))}
        </div>
      )}

      <SubsectionHeader>Objetivos a mediano y largo plazo (acumulación)</SubsectionHeader>
      {medlargo.length === 0 ? (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "8px 40px" }}>Sin objetivos registrados.</p>
      ) : (
        <div style={{ padding: "0 40px" }}>
          <div style={{ display: "flex", gap: "8px", padding: "8px 12px", background: C.navy, borderRadius: "8px 8px 0 0", fontSize: "11px", fontWeight: 700, color: "white" }}>
            <span style={{ flex: 3 }}>Objetivo</span>
            <span style={{ flex: 2, textAlign: "right" }}>Meta</span>
            <span style={{ flex: 1, textAlign: "right" }}>Plazo (años)</span>
            <span style={{ flex: 1, textAlign: "right" }}>Viable</span>
          </div>
          {medlargo.map((o, i) => (
            <div key={o.nombre} style={{ display: "flex", gap: "8px", padding: "8px 12px", background: i % 2 === 0 ? "#EDEAE3" : C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ flex: 3, color: C.textNavy }}>{o.nombre}</span>
              <span style={{ flex: 2, textAlign: "right", fontWeight: 700, color: C.black }}>{formatMXN(o.monto)}</span>
              <span style={{ flex: 1, textAlign: "right", color: C.textMuted }}>{o.plazo}</span>
              <span style={{ flex: 1, textAlign: "right", fontWeight: 700, color: o.viable ? C.green : C.red }}>
                {o.viable ? "Sí" : "No"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary boxes */}
      <div style={{ display: "flex", gap: "12px", padding: "20px 40px" }}>
        <div style={{ flex: 1, background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 6px 0" }}>Meta total de tus objetivos</p>
          <p style={{ fontSize: "20px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(total_objetivos)}</p>
        </div>
        <div style={{ flex: 1, background: C.navy, borderRadius: "10px", padding: "14px 16px" }}>
          <p style={{ fontSize: "10px", color: C.blue2, margin: "0 0 6px 0" }}>Edad al cumplir tus objetivos</p>
          <p style={{ fontSize: "20px", fontWeight: 700, color: "white", margin: 0 }}>{edad + max_plazo} años</p>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={6} total={TOTAL_PAGES} />
    </div>
  );
}

function Page7ProteccionPatrimonial({
  clientName,
  motorF,
}: {
  clientName: string;
  motorF: {
    suma_asegurada_vida?: number;
    costo_prima_vida?: number;
    seguro_hogar_sugerido?: number;
    costo_hogar_anual?: number;
  };
}) {
  const sumaVida = motorF.suma_asegurada_vida ?? 0;
  const primaVida = motorF.costo_prima_vida ?? 0;
  const sumaHogar = motorF.seguro_hogar_sugerido ?? 0;
  const primaHogar = motorF.costo_hogar_anual ?? 0;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Protección Patrimonial</SectionTitle>

      <SubsectionHeader>Seguro de vida + exceso</SubsectionHeader>
      <InsuranceBox
        label1="Suma asegurada"
        value1={formatMXN(sumaVida)}
        label2="Costo prima anual"
        value2={formatMXN(primaVida)}
      />

      <SubsectionHeader>Seguro hogar</SubsectionHeader>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 40px 8px" }}>
        Protege tu vivienda y tu responsabilidad civil con un seguro de hogar.
      </p>
      <InsuranceBox
        label1="Suma asegurada hogar"
        value1={formatMXN(sumaHogar)}
        label2="Costo prima anual"
        value2={formatMXN(primaHogar)}
      />

      {/* Full-width navy block */}
      <div style={{ background: C.navy, margin: "16px 40px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          TU PATRIMONIO ES UN REFLEJO DE TU VISIÓN
        </span>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={7} total={TOTAL_PAGES} />
    </div>
  );
}

function Page8PropuestaInversion({
  clientName,
  motorB,
  motorE,
  motorA,
  perfil,
}: {
  clientName: string;
  motorB: { nivel_riqueza: string };
  motorE: { financiero: number };
  motorA: { remanente: number };
  perfil: { nombre: string; edad: number };
}) {
  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  const nivel = motorB.nivel_riqueza;
  const deposito = motorA.remanente;

  const estrategia =
    nivel === "suficiente" || nivel === "mejor"
      ? "Estrategia conservadora: preservar capital con crecimiento moderado."
      : nivel === "bien" || nivel === "genial"
        ? "Estrategia balanceada: crecimiento con protección parcial."
        : "Estrategia agresiva: máximo crecimiento a largo plazo.";

  type Portfolio = { instrumento: string; tipo: string; ponderacion: number };
  const portafolios: Record<string, Portfolio[]> = {
    conservative: [
      { instrumento: "ACTINVER DEUDA", tipo: "Deuda", ponderacion: 60 },
      { instrumento: "ACTINVER MIXTO", tipo: "Balanceado", ponderacion: 30 },
      { instrumento: "ACTINVER EQUITY", tipo: "Equity", ponderacion: 10 },
    ],
    balanced: [
      { instrumento: "ACTINVER DEUDA", tipo: "Deuda", ponderacion: 40 },
      { instrumento: "ACTINVER MIXTO", tipo: "Balanceado", ponderacion: 40 },
      { instrumento: "ACTINVER EQUITY", tipo: "Equity", ponderacion: 20 },
    ],
    aggressive: [
      { instrumento: "ACTINVER DEUDA", tipo: "Deuda", ponderacion: 20 },
      { instrumento: "ACTINVER MIXTO", tipo: "Balanceado", ponderacion: 30 },
      { instrumento: "ACTINVER EQUITY", tipo: "Equity", ponderacion: 50 },
    ],
  };
  const rendimientos: Record<string, number[]> = {
    conservative: [8, 10, 14],
    balanced: [8, 10, 14],
    aggressive: [8, 10, 14],
  };

  const portfolioKey =
    nivel === "suficiente" || nivel === "mejor"
      ? "conservative"
      : nivel === "bien" || nivel === "genial"
        ? "balanced"
        : "aggressive";

  const rows = portafolios[portfolioKey];
  const rends = rendimientos[portfolioKey];
  const financiero = motorE.financiero;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Diagnóstico Financiero" clientName={clientName} />
      <SectionTitle>Propuesta de Inversión</SectionTitle>

      <div style={{ padding: "4px 40px 16px" }}>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>Fecha: {fecha}</p>
      </div>

      {/* Client header row */}
      <div style={{ display: "flex", gap: "16px", background: "#EDEAE3", padding: "10px 40px", borderRadius: "8px", margin: "0 40px 16px" }}>
        <div>
          <span style={{ fontSize: "10px", color: C.textMuted }}>Titular: </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy }}>{perfil.nombre}</span>
        </div>
        <div style={{ width: "1px", background: C.border }} />
        <div>
          <span style={{ fontSize: "10px", color: C.textMuted }}>Perfil de Inversión: </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy }}>1</span>
        </div>
        <div style={{ width: "1px", background: C.border }} />
        <div>
          <span style={{ fontSize: "10px", color: C.textMuted }}>No. de contrato: </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.textMuted }}>—</span>
        </div>
      </div>

      {/* Four metric boxes */}
      <div style={{ display: "flex", gap: "10px", padding: "0 40px 16px" }}>
        {[
          { label: "Valuación total", value: formatMXN(financiero) },
          { label: "Depósito", value: formatMXN(deposito) },
          { label: "Retiro", value: "$0" },
          { label: "Objetivo", value: "Acumulación" },
        ].map((box) => (
          <div key={box.label} style={{ flex: 1, background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px" }}>
            <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 4px 0" }}>{box.label}</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: C.navy, margin: 0 }}>{box.value}</p>
          </div>
        ))}
      </div>

      {/* Strategy text */}
      <div style={{ padding: "0 40px 16px" }}>
        <p style={{ fontSize: "13px", color: C.textNavy, fontWeight: 600, margin: 0 }}>{estrategia}</p>
      </div>

      {/* Portfolio table */}
      <div style={{ padding: "0 40px" }}>
        <div style={{ display: "flex", gap: "8px", padding: "8px 12px", background: C.navy, borderRadius: "8px 8px 0 0", fontSize: "11px", fontWeight: 700, color: "white" }}>
          <span style={{ flex: 3 }}>Instrumento</span>
          <span style={{ flex: 2 }}>Tipo</span>
          <span style={{ flex: 1, textAlign: "right" }}>Pond.</span>
          <span style={{ flex: 2, textAlign: "right" }}>Monto</span>
          <span style={{ flex: 2, textAlign: "right" }}>Rend. Est.</span>
        </div>
        {rows.map((row, i) => (
          <div key={row.instrumento} style={{ display: "flex", gap: "8px", padding: "10px 12px", background: i % 2 === 0 ? "#EDEAE3" : C.cream, fontSize: "13px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ flex: 3, fontWeight: 600, color: C.navy }}>{row.instrumento}</span>
            <span style={{ flex: 2, color: C.textNavy }}>{row.tipo}</span>
            <span style={{ flex: 1, textAlign: "right", color: C.textNavy }}>{row.ponderacion}%</span>
            <span style={{ flex: 2, textAlign: "right", fontWeight: 700, color: C.black }}>{formatMXN(financiero * row.ponderacion / 100)}</span>
            <span style={{ flex: 2, textAlign: "right", fontWeight: 700, color: C.gold }}>{rends[i]}%</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={8} total={TOTAL_PAGES} />
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function DiagnosticoPDFTemplate() {
  const perfil = useDiagnosticoStore((s) => s.perfil);
  const flujoMensual = useDiagnosticoStore((s) => s.flujoMensual);
  const patrimonio = useDiagnosticoStore((s) => s.patrimonio);
  const retiro = useDiagnosticoStore((s) => s.retiro);
  const objetivos = useDiagnosticoStore((s) => s.objetivos);
  const proteccion = useDiagnosticoStore((s) => s.proteccion);

  const clientName = perfil?.nombre ?? "Cliente";
  const edad = perfil?.edad ?? 35;

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
      patrimonio.liquidez +
      patrimonio.inversiones +
      patrimonio.dotales +
      patrimonio.afore +
      patrimonio.ppr +
      patrimonio.plan_privado +
      patrimonio.seguros_retiro;
    const saldo_esquemas = patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado;
    return calcularMotorC({
      patrimonio_financiero_total: pat_fin,
      saldo_esquemas,
      ley_73: patrimonio.ley_73,
      rentas: flujoMensual.rentas,
      edad,
      edad_retiro: retiro.edad_retiro,
      edad_defuncion: retiro.edad_defuncion,
      mensualidad_deseada: retiro.mensualidad_deseada,
    });
  }, [patrimonio, flujoMensual, retiro, edad]);

  const motorD = useMemo(() => {
    if (!objetivos || !patrimonio || !retiro) return null;
    return calcularMotorD({
      aportacion_inicial: objetivos.aportacion_inicial,
      aportacion_mensual: objetivos.aportacion_mensual,
      lista: objetivos.lista,
      patrimonio_financiero: patrimonio.inversiones + patrimonio.liquidez,
      edad,
      edad_retiro: retiro.edad_retiro,
      edad_defuncion: retiro.edad_defuncion,
    });
  }, [objetivos, patrimonio, retiro, edad]);

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

  // Safe zero-defaults so pages never crash
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
  const safeMotorD = motorD ?? { resultados: [], saldo_retiro: 0, legado: 0 };
  const safeMotorE = motorE ?? {
    activos_total: 0, pasivos_total: 0, patrimonio_neto: 0,
    financiero: 0, noFinanciero: 0, indice_solvencia: 0,
    clasificacion_solvencia: "Muy saludable", potencial_apalancamiento: 0,
  };
  const safeMotorF = motorF ?? { recomendaciones: [] };
  const safeFlujoMensual = flujoMensual ?? {
    ahorro: 0, rentas: 0, otros: 0, gastos_basicos: 0, obligaciones: 0, creditos: 0,
  };
  const safeRetiro = retiro ?? { edad_retiro: 65, mensualidad_deseada: 0, edad_defuncion: 85 };
  const safePatrimonio = patrimonio ?? {
    liquidez: 0, inversiones: 0, dotales: 0, afore: 0, ppr: 0, plan_privado: 0,
    seguros_retiro: 0, ley_73: null, casa: 0, inmuebles_renta: 0, tierra: 0,
    negocio: 0, herencia: 0, hipoteca: 0, saldo_planes: 0, compromisos: 0,
  };
  const safePerfil = perfil ?? { nombre: "Cliente", edad: 35, genero: "H", ocupacion: "asalariado", dependientes: false };

  return (
    <div
      id="diagnostico-pdf-template"
      style={{ width: "794px", background: C.cream, color: C.textNavy, fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <Page1ProyeccionInversion clientName={clientName} motorE={safeMotorE} />
      <Page2FortalezaFinanciera clientName={clientName} motorA={safeMotorA} motorB={safeMotorB} patrimonio={safePatrimonio} />
      <Page3Retiro clientName={clientName} motorC={safeMotorC} retiro={safeRetiro} />
      <Page4IndicePatrimonial clientName={clientName} motorC={safeMotorC} motorE={safeMotorE} seguros_retiro={safePatrimonio.seguros_retiro} flujoMensual={safeFlujoMensual} />
      <Page5TrayectoriaPatrimonioFinanciero clientName={clientName} motorC={safeMotorC} motorE={safeMotorE} />
      <Page6Objetivos clientName={clientName} motorD={safeMotorD} edad={edad} />
      <Page7ProteccionPatrimonial clientName={clientName} motorF={safeMotorF} />
      <Page8PropuestaInversion clientName={clientName} motorB={safeMotorB} motorE={safeMotorE} motorA={safeMotorA} perfil={safePerfil} />
    </div>
  );
}
