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
      {subtext && <p style={{ color: C.blue2, fontSize: "11px", marginTop: "4px", margin: "4px 0 0 0" }}>{subtext}</p>}
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

function Page1PatrimonioNeto({
  clientName,
  motorE,
  motorB,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
  motorB: ReturnType<typeof calcularMotorB>;
}) {
  const totalAssets = motorE.financiero + motorE.noFinanciero;
  const totalLiabilities = motorE.pasivos_total + motorE.patrimonio_neto;
  const maxLeft = Math.max(motorE.financiero, motorE.noFinanciero, 1);
  const maxRight = Math.max(motorE.pasivos_total, motorE.patrimonio_neto, 1);

  // Liquidity index: patrimonio neto / gastos mensual (approximated via gasto_anual)
  const indice_liquidez = motorB.gasto_anual > 0 ? motorE.patrimonio_neto / motorB.gasto_anual : 0;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Financiero" clientName={clientName} />
      <SectionTitle>Patrimonio Neto</SectionTitle>

      <SummaryRow color={C.navy} label="Patrimonio Financiero" value={formatMXN(motorE.financiero)} />
      <SummaryRow color={C.black} label="Activos No Financieros" value={formatMXN(motorE.noFinanciero)} />
      <SummaryRow color={C.gold} label="Obligaciones" value={formatMXN(motorE.pasivos_total)} />
      <SummaryRow color={C.lightGray} label="Patrimonio Neto" value={formatMXN(motorE.patrimonio_neto)} />

      {/* Stacked bar chart */}
      <div style={{ display: "flex", gap: "16px", margin: "24px 40px", height: "200px" }}>
        {/* Left: assets */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ flex: Math.max(motorE.financiero, 1), background: C.navy, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: "10px", fontWeight: 600, textAlign: "center" }}>Patrimonio Financiero</span>
            <span style={{ color: C.gold, fontSize: "11px", fontWeight: 700 }}>{formatMXN(motorE.financiero)}</span>
          </div>
          <div style={{ flex: Math.max(motorE.noFinanciero, 1), background: C.black, borderRadius: "0 0 6px 6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: "10px", fontWeight: 600, textAlign: "center" }}>Activos No Financieros</span>
            <span style={{ color: C.gold, fontSize: "11px", fontWeight: 700 }}>{formatMXN(motorE.noFinanciero)}</span>
          </div>
        </div>
        {/* Right: liabilities + net */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ flex: Math.max(motorE.pasivos_total, 1), background: C.gold, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: C.navy, fontSize: "10px", fontWeight: 600, textAlign: "center" }}>Total pasivos</span>
            <span style={{ color: C.navy, fontSize: "11px", fontWeight: 700 }}>{formatMXN(motorE.pasivos_total)}</span>
          </div>
          <div style={{ flex: Math.max(motorE.patrimonio_neto, 1), background: C.lightGray, border: `1px solid ${C.border}`, borderRadius: "0 0 6px 6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: C.navy, fontSize: "10px", fontWeight: 600, textAlign: "center" }}>Patrimonio neto</span>
            <span style={{ color: C.navy, fontSize: "11px", fontWeight: 700 }}>{formatMXN(motorE.patrimonio_neto)}</span>
          </div>
        </div>
      </div>

      {/* Level pills */}
      <div style={{ padding: "0 40px 8px" }}>
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          Nivel Patrimonio Neto de acuerdo a etapa de vida: <strong>{NIVEL_LABELS[motorB.nivel_riqueza] ?? motorB.nivel_riqueza}</strong>
        </span>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          {ALL_NIVELES.map((n) => (
            <span
              key={n}
              style={{
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 600,
                background: n === motorB.nivel_riqueza ? C.navy : "#E8E0D0",
                color: n === motorB.nivel_riqueza ? "white" : C.textMuted,
              }}
            >
              {NIVEL_LABELS[n]}
            </span>
          ))}
        </div>
      </div>

      {/* Liquidity navy banner */}
      <div style={{ background: C.navy, borderRadius: "12px", overflow: "hidden", display: "flex", margin: "16px 40px", height: "80px" }}>
        <div style={{ width: "40%", background: C.navyDark }} />
        <div style={{ flex: 1, padding: "0 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ color: "white", fontSize: "18px", fontWeight: 700, margin: 0 }}>
            Tu índice de liquidez: {indice_liquidez.toFixed(1)}
          </p>
          <p style={{ color: C.blue2, fontSize: "12px", margin: "2px 0 0 0" }}>Años de gastos cubiertos</p>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={1} total={TOTAL_PAGES} />
    </div>
  );
}

function Page2FuentesFlujo({
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
  const ahorro = flujoMensual.ahorro;
  const disponible = ingresos - gastos - ahorro;
  const safePct = (v: number) => (ingresos > 0 ? ((v / ingresos) * 100).toFixed(0) : "0");

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Financiero" clientName={clientName} />
      <SectionTitle>Fuentes de Flujo Disponible</SectionTitle>

      <SummaryRow color={C.navy} label="Ingresos Totales" value={formatMXN(ingresos)} />
      <SummaryRow color={C.black} label="Gastos Totales" value={formatMXN(gastos)} />
      <SummaryRow color={C.gold} label="Disponible Activo" value={formatMXN(Math.max(disponible, 0))} />
      <SummaryRow color={C.lightGray} label="Ahorro" value={formatMXN(ahorro)} />

      {/* Block chart */}
      <div style={{ display: "flex", gap: "16px", margin: "24px 40px", height: "180px" }}>
        {/* Left: single navy block */}
        <div style={{ flex: 1, background: C.navy, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ color: "white", fontSize: "11px", fontWeight: 600, textAlign: "center" }}>Ingresos Totales</span>
          <span style={{ color: C.gold, fontSize: "13px", fontWeight: 700 }}>{formatMXN(ingresos)}</span>
        </div>
        {/* Right: three stacked blocks */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ flex: Math.max(gastos, 1), background: C.black, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: "10px", fontWeight: 600 }}>Gastos</span>
            <span style={{ color: C.gold, fontSize: "11px", fontWeight: 700 }}>{formatMXN(gastos)}</span>
            <span style={{ color: C.textMuted, fontSize: "9px" }}>({safePct(gastos)}%)</span>
          </div>
          <div style={{ flex: Math.max(disponible, 1), background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: C.navy, fontSize: "10px", fontWeight: 600 }}>Disponible</span>
            <span style={{ color: C.navy, fontSize: "11px", fontWeight: 700 }}>{formatMXN(Math.max(disponible, 0))}</span>
            <span style={{ color: C.navy, fontSize: "9px" }}>({safePct(Math.max(disponible, 0))}%)</span>
          </div>
          <div style={{ flex: Math.max(ahorro, 1), background: C.lightGray, borderRadius: "0 0 6px 6px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ color: C.navy, fontSize: "10px", fontWeight: 600 }}>Ahorro</span>
            <span style={{ color: C.navy, fontSize: "11px", fontWeight: 700 }}>{formatMXN(ahorro)}</span>
            <span style={{ color: C.navy, fontSize: "9px" }}>({safePct(ahorro)}%)</span>
          </div>
        </div>
      </div>

      {/* Income sources */}
      {(flujoMensual.rentas > 0 || flujoMensual.otros > 0) && (
        <div style={{ padding: "0 40px" }}>
          <SubsectionHeader>Fuentes de Ingreso Adicionales</SubsectionHeader>
          {flujoMensual.rentas > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.rowBorder}`, fontSize: "13px" }}>
              <span style={{ color: C.textNavy }}>Ingresos por Rentas</span>
              <span style={{ fontWeight: 700, color: C.black }}>{formatMXN(flujoMensual.rentas)}</span>
            </div>
          )}
          {flujoMensual.otros > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.rowBorder}`, fontSize: "13px" }}>
              <span style={{ color: C.textNavy }}>Ingresos por Negocios / Otros</span>
              <span style={{ fontWeight: 700, color: C.black }}>{formatMXN(flujoMensual.otros)}</span>
            </div>
          )}
        </div>
      )}

      <NavyBanner text="Incorporar ingresos pasivos a tu estrategia te ayuda a crecer y mantener solidez financiera." />

      <div style={{ flex: 1 }} />
      <PageFooter page={2} total={TOTAL_PAGES} />
    </div>
  );
}

function Page3DisponibilidadTotal({
  clientName,
  motorE,
  motorB,
  motorC,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
}) {
  const categories = [
    { label: "Retiro (Proyección)", value: motorC.saldo_inicio_jubilacion, color: C.navy },
    { label: "Activos Productivos", value: motorE.financiero, color: C.black },
    { label: "Activos No Productivos", value: motorE.noFinanciero, color: C.gold },
    { label: "Acumulación", value: motorB.patrimonio_financiero_total, color: "#3A5A8C" },
    { label: "Liquidez (Reserva)", value: motorB.meses_cubiertos * (motorB.gasto_anual / 12), color: C.lightGray },
  ];
  const total = categories.reduce((s, c) => s + Math.max(c.value, 0), 0) || 1;
  const indice_liquidez = motorB.gasto_anual > 0 ? motorE.patrimonio_neto / motorB.gasto_anual : 0;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Financiero" clientName={clientName} />
      <SectionTitle>Disponibilidad Total Patrimonial</SectionTitle>

      {/* Horizontal percentage bars */}
      <div style={{ padding: "0 40px" }}>
        {categories.map((cat) => {
          const pct = total > 0 ? (Math.max(cat.value, 0) / total) * 100 : 0;
          return (
            <div key={cat.label} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: C.textNavy, fontWeight: 500 }}>{cat.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.black }}>{formatMXN(Math.max(cat.value, 0))}</span>
              </div>
              <div style={{ height: "12px", background: C.borderLight, borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: cat.color, borderRadius: "6px", transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: "10px", color: C.textMuted }}>{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      <NavyBanner
        text={`Con tu patrimonio actual, puedes cubrir ${indice_liquidez.toFixed(1)} años de gastos.`}
        subtext="Mantén y fortalece tu nivel de vida con una estrategia patrimonial sólida."
      />

      {/* Full-width navy block */}
      <div style={{ background: C.navy, margin: "16px 40px", height: "80px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "white", fontSize: "18px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
          LLEVAR TU PATRIMONIO AL SIGUIENTE NIVEL ES POSIBLE
        </span>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={3} total={TOTAL_PAGES} />
    </div>
  );
}

function Page4PotencialBalance({
  clientName,
  motorE,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
}) {
  // indice_solvencia is 0–1, convert to 0–100
  const solvenciaPct = Math.max(0, Math.min(100, motorE.indice_solvencia * 100));
  const excedente = motorE.potencial_apalancamiento - motorE.pasivos_total;

  const deudaRatio = motorE.activos_total > 0 ? (motorE.pasivos_total / motorE.activos_total) * 100 : 0;
  const deudaRatioPotencial =
    motorE.activos_total > 0
      ? ((motorE.pasivos_total + motorE.potencial_apalancamiento) / motorE.activos_total) * 100
      : 0;

  const DEUDA_NIVELES = ["Muy saludable", "Recomendable", "Aceptable", "Elevado"];
  const getDeudaNivel = (pct: number) => {
    if (pct < 20) return "Muy saludable";
    if (pct < 40) return "Recomendable";
    if (pct < 60) return "Aceptable";
    return "Elevado";
  };
  const actualNivel = getDeudaNivel(deudaRatio);
  const potencialNivel = getDeudaNivel(deudaRatioPotencial);

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Financiero" clientName={clientName} />
      <SectionTitle>Potencial del Balance</SectionTitle>

      <SubsectionHeader>Solvencia (Excluyendo Activos de Retiro)</SubsectionHeader>
      <div style={{ padding: "8px 40px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: C.textNavy }}>Índice de solvencia</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy }}>{solvenciaPct.toFixed(0)}%</span>
        </div>
        <div style={{ height: "16px", background: "#E0D8C8", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ width: `${solvenciaPct}%`, height: "100%", background: C.navy, borderRadius: "8px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          {["0%", "20%", "40%", "60%", "80%", "100%"].map((l) => (
            <span key={l} style={{ fontSize: "9px", color: C.textMuted }}>{l}</span>
          ))}
        </div>
      </div>

      <NavyBanner text="Tu nivel de solvencia actual te permite aprovechar tus activos para seguir fortaleciendo tu patrimonio." />

      <SubsectionHeader>Capacidad de Apalancamiento del Balance</SubsectionHeader>
      <SummaryRow color={C.navy} label="Apalancamiento Actual" value={formatMXN(motorE.pasivos_total)} />
      <SummaryRow color={C.black} label="Potencial de Apalancamiento" value={formatMXN(motorE.potencial_apalancamiento)} />
      <SummaryRow color={C.gold} label="Excedente" value={formatMXN(excedente)} />

      <div style={{ display: "flex", gap: "12px", padding: "12px 40px" }}>
        <div style={{ flex: 1, background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px 0" }}>Sobre tus activos financieros puedes recurrir a un crédito por:</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(motorE.financiero * 0.4)}</p>
        </div>
        <div style={{ flex: 1, background: "#EDEAE3", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px 16px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px 0" }}>Sobre tus activos inmobiliarios puedes recurrir a un crédito por:</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(motorE.noFinanciero * 0.4)}</p>
        </div>
      </div>

      <SubsectionHeader>Índice Deuda / Activos</SubsectionHeader>
      <div style={{ padding: "8px 40px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: C.textMuted, width: "80px" }}>Actual</span>
            <div style={{ display: "flex", gap: "6px", flex: 1 }}>
              {DEUDA_NIVELES.map((n) => (
                <span key={n} style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 600, background: n === actualNivel ? C.navy : "#E8E0D0", color: n === actualNivel ? "white" : C.textMuted }}>
                  {n}
                </span>
              ))}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: C.navy }}>{deudaRatio.toFixed(0)}%</span>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: C.textMuted, width: "80px" }}>Con préstamo</span>
            <div style={{ display: "flex", gap: "6px", flex: 1 }}>
              {DEUDA_NIVELES.map((n) => (
                <span key={n} style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 600, background: n === potencialNivel ? C.gold : "#E8E0D0", color: n === potencialNivel ? C.navy : C.textMuted }}>
                  {n}
                </span>
              ))}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: C.navy }}>{deudaRatioPotencial.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={4} total={TOTAL_PAGES} />
    </div>
  );
}

function Page5ProteccionPatrimonial({
  clientName,
  motorE,
  motorF,
  motorA,
}: {
  clientName: string;
  motorE: ReturnType<typeof calcularMotorE>;
  motorF: ReturnType<typeof calcularMotorF>;
  motorA: ReturnType<typeof calcularMotorA>;
}) {
  const sumaVida = motorF.suma_asegurada_vida ?? 0;
  const primaVida = motorF.costo_prima_vida ?? 0;
  const patrimonioResultante = motorE.patrimonio_neto - sumaVida;
  const solvenciaActual = motorE.indice_solvencia * 100;

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Financiero" clientName={clientName} />
      <SectionTitle>Protección Patrimonial</SectionTitle>

      <SubsectionHeader>Impacto en tu Balance</SubsectionHeader>
      <SummaryRow
        color={C.navy}
        label="Patrimonio Neto Actual"
        value={formatMXN(motorE.patrimonio_neto)}
        note={`Solvencia actual: ${solvenciaActual.toFixed(0)}%`}
      />
      <SummaryRow color={C.black} label="Afectación al Patrimonio" value={sumaVida > 0 ? `-${formatMXN(sumaVida)}` : formatMXN(0)} />
      <SummaryRow color={C.gold} label="Patrimonio Resultante" value={formatMXN(patrimonioResultante)} />

      <SubsectionHeader>Impacto en tu Flujo de Efectivo</SubsectionHeader>
      <div style={{ padding: "8px 40px" }}>
        <div style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: `1px solid ${C.rowBorder}`, fontSize: "12px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase" }}>
          <span style={{ flex: 2 }}>Concepto</span>
          <span style={{ flex: 1, textAlign: "right" }}>Actual</span>
          <span style={{ flex: 1, textAlign: "right" }}>Resultante</span>
          <span style={{ flex: 1, textAlign: "right" }}>Impacto</span>
        </div>
        <div style={{ display: "flex", gap: "8px", padding: "8px 0", fontSize: "13px" }}>
          <span style={{ flex: 2, color: C.textNavy }}>Ingresos disponibles</span>
          <span style={{ flex: 1, textAlign: "right", fontWeight: 700 }}>{formatMXN(motorA.ingresos_totales - motorA.gastos_totales)}</span>
          <span style={{ flex: 1, textAlign: "right", fontWeight: 700, color: C.textMuted }}>$0</span>
          <span style={{ flex: 1, textAlign: "right", fontWeight: 700, color: C.red }}>-100%</span>
        </div>
      </div>

      <SubsectionHeader>Seguro de Vida + Exceso</SubsectionHeader>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 40px 8px" }}>
        Protege a tus dependientes por una suma que cubra una protección de 3 años de tus gastos básicos.
      </p>
      <InsuranceBox
        label1={`Suma asegurada`}
        value1={formatMXN(sumaVida)}
        label2="Costo prima anual"
        value2={formatMXN(primaVida)}
      />

      <div style={{ background: C.navy, margin: "16px 40px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "white", fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          PROTECCIÓN PARA TI Y LOS QUE MÁS QUIERES
        </span>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={5} total={TOTAL_PAGES} />
    </div>
  );
}

function Page6TrayectoriaPatrimonial({
  clientName,
  motorC,
  motorE,
  retiro,
}: {
  clientName: string;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number };
}) {
  // Use the curva data from motorC
  const curva = motorC.curva;
  const maxSaldo = Math.max(...curva.map((p) => p.saldo), 1);

  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Financiero" clientName={clientName} />
      <SectionTitle>Trayectoría Patrimonial</SectionTitle>

      {/* Horizontal bar chart */}
      <div style={{ padding: "0 40px", overflowY: "auto", maxHeight: "520px" }}>
        {curva.map((point) => {
          const barPct = maxSaldo > 0 ? (point.saldo / maxSaldo) * 100 : 0;
          const isPositive = point.saldo > 0;
          return (
            <div key={point.mes} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "40px", fontSize: "11px", color: C.textMuted, textAlign: "right", flexShrink: 0 }}>
                {point.edad % 1 === 0 ? Math.round(point.edad) : point.edad.toFixed(0)} a
              </span>
              <div style={{ flex: 1, height: "18px", background: C.borderLight, borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${barPct}%`, height: "100%", background: isPositive ? C.navy : C.red, borderRadius: "4px" }} />
              </div>
              <span style={{ width: "100px", fontSize: "11px", fontWeight: 600, color: isPositive ? C.navy : C.red, textAlign: "right", flexShrink: 0 }}>
                {formatMXN(point.saldo)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", padding: "12px 40px", flexWrap: "wrap" }}>
        {[
          { color: C.gold, label: "Esquemas de Pensión" },
          { color: C.navy, label: "Patrimonio Financiero" },
          { color: C.lightGray, label: "Rentas" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.color }} />
            <span style={{ fontSize: "11px", color: C.textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: "12px", padding: "12px 40px" }}>
        <div style={{ flex: 1, background: "#EDEAE3", borderRadius: "10px", padding: "12px 16px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 4px 0" }}>Patrimonio Financiero en Retiro</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: C.navy, margin: 0 }}>{formatMXN(motorC.saldo_inicio_jubilacion)}</p>
        </div>
        <div style={{ flex: 1, background: C.navy, borderRadius: "10px", padding: "12px 16px" }}>
          <p style={{ fontSize: "10px", color: C.blue2, margin: "0 0 4px 0" }}>Mensualidad Total</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "white", margin: 0 }}>{formatMXN(motorC.pension_total_mensual)}</p>
        </div>
        <div style={{ flex: 1, background: "#EDEAE3", borderRadius: "10px", padding: "12px 16px" }}>
          <p style={{ fontSize: "10px", color: C.textMuted, margin: "0 0 4px 0" }}>Grado de Avance</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: motorC.grado_avance >= 1 ? C.green : C.orange, margin: 0 }}>
            {(motorC.grado_avance * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <PageFooter page={6} total={TOTAL_PAGES} />
    </div>
  );
}

function Page7AvisoLegal({ clientName }: { clientName: string }) {
  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", borderBottom: `4px solid ${C.navy}` }}>
      <PageHeader reportName="Tu Balance Financiero" clientName={clientName} />
      <SectionTitle>Aviso Legal</SectionTitle>

      <div style={{ padding: "32px 40px", flex: 1 }}>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.8, maxWidth: "640px" }}>
          Este documento es informativo y no constituye una recomendación, consejo o sugerencia para la toma de decisiones de inversión.
          Las proyecciones presentadas son estimaciones basadas en los datos proporcionados y no garantizan resultados futuros.
          Actinver no se responsabiliza por decisiones tomadas con base en este análisis.
          Consulta con tu asesor para estrategias personalizadas.
        </p>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.8, marginTop: "24px", maxWidth: "640px" }}>
          La información contenida en este reporte es de carácter confidencial y está destinada exclusivamente al cliente destinatario.
          Queda prohibida su reproducción total o parcial sin autorización expresa de Actinver.
        </p>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.8, marginTop: "24px", maxWidth: "640px" }}>
          Las tasas de rendimiento presentadas son estimadas con base en condiciones históricas de mercado y pueden variar.
          Rendimientos pasados no garantizan rendimientos futuros. Toda inversión conlleva riesgos implícitos.
        </p>
        <div style={{ marginTop: "48px", padding: "20px 24px", background: "#EDEAE3", borderRadius: "10px", border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>Actinver Casa de Bolsa, S.A. de C.V., Grupo Financiero Actinver</p>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "4px 0 0 0" }}>Regulada y supervisada por la Comisión Nacional Bancaria y de Valores (CNBV)</p>
        </div>
      </div>

      <PageFooter page={7} total={TOTAL_PAGES} />
    </div>
  );
}

function Page8BackCover({ clientName }: { clientName: string }) {
  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div style={{ minHeight: "1050px", display: "flex", flexDirection: "column", background: C.navy }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "36px", fontWeight: 700, color: "white" }}>Actinver</span>
            <span style={{ color: C.gold, fontSize: "36px", margin: "0 12px" }}>·</span>
            <span style={{ fontSize: "36px", fontWeight: 700, color: C.gold, letterSpacing: "6px" }}>ArIA</span>
          </div>
          <p style={{ fontSize: "18px", color: C.blue2, margin: "0 0 32px 0" }}>Construye tu grandeza. Actinver te acompaña.</p>
          <p style={{ fontSize: "12px", color: "#5A7A9A", margin: 0 }}>Fecha: {fecha}</p>
          <p style={{ fontSize: "12px", color: "#5A7A9A", marginTop: "8px" }}>Balance Financiero — {clientName}</p>
        </div>
      </div>
      {/* Footer on navy bg */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 40px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Actinver</span>
          <span style={{ color: C.gold, fontSize: "14px", marginLeft: "4px" }}>·</span>
          <span style={{ fontSize: "10px", color: C.gold, letterSpacing: "3px", marginLeft: "4px" }}>ArIA</span>
        </div>
        <span style={{ fontSize: "10px", color: "#5A7A9A" }}>Página {TOTAL_PAGES} de {TOTAL_PAGES}</span>
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
      seguro_vida: proteccion.seguro_vida,
      propiedades_aseguradas: proteccion.propiedades_aseguradas,
      sgmm: proteccion.sgmm,
      dependientes: perfil?.dependientes ?? false,
      patrimonio_neto: motorE.patrimonio_neto,
      inmuebles_total,
      edad,
    });
  }, [proteccion, motorE, patrimonio, perfil, edad]);

  // Build safe zero-defaults so pages never crash
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
  const safeMotorF = motorF ?? { recomendaciones: [] };
  const safeFlujoMensual = flujoMensual ?? {
    ahorro: 0, rentas: 0, otros: 0, gastos_basicos: 0, obligaciones: 0, creditos: 0,
  };
  const safeRetiro = retiro ?? { edad_retiro: 65, mensualidad_deseada: 0, edad_defuncion: 85 };

  return (
    <div
      id="balance-pdf-template"
      style={{ width: "794px", background: C.cream, color: C.textNavy, fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <Page1PatrimonioNeto clientName={clientName} motorE={safeMotorE} motorB={safeMotorB} />
      <Page2FuentesFlujo clientName={clientName} motorA={safeMotorA} flujoMensual={safeFlujoMensual} />
      <Page3DisponibilidadTotal clientName={clientName} motorE={safeMotorE} motorB={safeMotorB} motorC={safeMotorC} />
      <Page4PotencialBalance clientName={clientName} motorE={safeMotorE} />
      <Page5ProteccionPatrimonial clientName={clientName} motorE={safeMotorE} motorF={safeMotorF} motorA={safeMotorA} />
      <Page6TrayectoriaPatrimonial clientName={clientName} motorC={safeMotorC} motorE={safeMotorE} retiro={safeRetiro} />
      <Page7AvisoLegal clientName={clientName} />
      <Page8BackCover clientName={clientName} />
    </div>
  );
}
