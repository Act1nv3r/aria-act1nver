"use client";

import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";

// Source: Actinver Análisis — Inversiones AM "Enfoque en resultados", Feb 26, 2026
const HOUSE_VIEW = {
  fecha: "26 de febrero, 2026",
  fuente: "Actinver Análisis — Inversiones AM",
  titulo: "Portafolios diversificados para sortear eventos geopolíticos",
  resumen:
    "Febrero favoreció portafolios diversificados: tasas estables, dólar firme y buen desempeño en emergentes. Marzo inicia con volatilidad por tensiones geopolíticas. La selectividad en tecnología premia empresas con monetización validada de IA (NVDA) sobre software sin guía clara (CRM, TTD).",
  temas_clave: [
    { icono: "🤖", texto: "IA de infraestructura (cómputo, semiconductores) supera a software y publicidad digital" },
    { icono: "🌍", texto: "Tensiones geopolíticas EE.UU.–Europa y negociaciones nucleares con Irán elevan volatilidad" },
    { icono: "🥇", texto: "Oro como diversificador estratégico: +20% acumulado 2026, soportado por bancos centrales" },
    { icono: "🇲🇽", texto: "IED en México alcanza USD 40.9 mil millones en 2025 — máximo histórico para el país" },
  ],
  mercados: [
    {
      categoria: "Bolsas",
      unidad: "pts",
      items: [
        {
          nombre: "S&P 500",
          ticker: "SPX",
          actual: "6,946",
          acum2026: "+1.47%",
          cierre2026: "7,500",
          potencial: "+7.97%",
          sentimiento: "positivo",
        },
        {
          nombre: "IPC (MEXBOL)",
          ticker: "IPC",
          actual: "71,144",
          acum2026: "+10.63%",
          cierre2026: "73,500",
          potencial: "+3.31%",
          sentimiento: "positivo",
        },
      ],
    },
    {
      categoria: "Divisas",
      unidad: "tipo de cambio",
      items: [
        {
          nombre: "USD/MXN",
          ticker: "MXN",
          actual: "17.19",
          acum2026: "-4.41%",
          cierre2026: "18.00",
          potencial: "+4.74%",
          sentimiento: "neutro",
        },
        {
          nombre: "DXY (Índice Dólar)",
          ticker: "DXY",
          actual: "97.68",
          acum2026: "-0.61%",
          cierre2026: "96.70",
          potencial: "-1.00%",
          sentimiento: "negativo",
        },
        {
          nombre: "EUR/USD",
          ticker: "EUR",
          actual: "1.181",
          acum2026: "+0.55%",
          cierre2026: "1.180",
          potencial: "-0.10%",
          sentimiento: "neutro",
        },
      ],
    },
    {
      categoria: "Tasas (10 años)",
      unidad: "%",
      items: [
        {
          nombre: "Bono EE.UU.",
          ticker: "UST10Y",
          actual: "4.05%",
          acum2026: "-0.13 pp",
          cierre2026: "4.06%",
          potencial: "+0.01 pp",
          sentimiento: "neutro",
        },
        {
          nombre: "Bono México",
          ticker: "MBono10Y",
          actual: "8.68%",
          acum2026: "-0.42 pp",
          cierre2026: "8.30%",
          potencial: "-0.38 pp",
          sentimiento: "positivo",
        },
      ],
    },
    {
      categoria: "Materias Primas",
      unidad: "USD",
      items: [
        {
          nombre: "Oro",
          ticker: "XAU",
          actual: "$5,197",
          acum2026: "+20.15%",
          cierre2026: "$5,000",
          potencial: "-3.80%",
          sentimiento: "neutro",
        },
        {
          nombre: "Petróleo WTI",
          ticker: "WTI",
          actual: "$64.1",
          acum2026: "+11.60%",
          cierre2026: "$59.59",
          potencial: "-7.01%",
          sentimiento: "negativo",
        },
        {
          nombre: "Mezcla Mexicana",
          ticker: "MME",
          actual: "$62.0",
          acum2026: "+15.61%",
          cierre2026: "$53.72",
          potencial: "-13.34%",
          sentimiento: "negativo",
        },
      ],
    },
  ],
};

function SentimientoIcon({ s }: { s: string }) {
  if (s === "positivo") return <TrendingUp size={14} className="text-[#10B981]" />;
  if (s === "negativo") return <TrendingDown size={14} className="text-[#EF4444]" />;
  return <Minus size={14} className="text-[#5A6A85]" />;
}

function PotencialBadge({ valor }: { valor: string }) {
  const num = parseFloat(valor.replace("%", "").replace("pp", "").replace("+", ""));
  const isPos = valor.startsWith("+");
  const isNeg = valor.startsWith("-");
  const color = isPos ? "#10B981" : isNeg ? "#EF4444" : "#5A6A85";
  const bg = isPos ? "#10B98115" : isNeg ? "#EF444415" : "#5A6A8515";
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color, background: bg }}
    >
      {valor}
    </span>
  );
}

export function HouseViewPanel() {
  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="bg-gradient-to-r from-[#0C1829] to-[#0A1525] border border-[#C9A84C]/20 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-[#C9A84C]/70 uppercase tracking-widest mb-1">
              {HOUSE_VIEW.fuente}
            </p>
            <h3 className="text-lg font-bold text-white leading-snug">
              {HOUSE_VIEW.titulo}
            </h3>
            <p className="text-xs text-[#5A6A85] mt-1">{HOUSE_VIEW.fecha}</p>
          </div>
          <a
            href="https://www.actinveranalisis.com/house-view"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors shrink-0 mt-1"
          >
            <ExternalLink size={12} />
            Ver completo
          </a>
        </div>
        <p className="text-sm text-[#8B9BB4] leading-relaxed">{HOUSE_VIEW.resumen}</p>
      </div>

      {/* Temas clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOUSE_VIEW.temas_clave.map((tema, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-[#0C1829] border border-white/[0.05] rounded-xl p-4"
          >
            <span className="text-xl leading-none mt-0.5">{tema.icono}</span>
            <p className="text-sm text-[#8B9BB4] leading-snug">{tema.texto}</p>
          </div>
        ))}
      </div>

      {/* Mercados table */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-[#5A6A85] uppercase tracking-widest">
          Mercados Financieros — Objetivos Cierre 2026
        </h4>

        {HOUSE_VIEW.mercados.map((grupo) => (
          <div key={grupo.categoria} className="bg-[#0C1829] border border-white/[0.05] rounded-2xl overflow-hidden">
            {/* Category header */}
            <div className="px-4 py-2.5 bg-[#162236] border-b border-white/[0.05]">
              <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider">
                {grupo.categoria}
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2 border-b border-white/[0.03]">
              <span className="text-[10px] text-[#4A5A75] uppercase tracking-wide">Activo</span>
              <span className="text-[10px] text-[#4A5A75] uppercase tracking-wide text-right">Actual</span>
              <span className="text-[10px] text-[#4A5A75] uppercase tracking-wide text-right">Acum. 2026</span>
              <span className="text-[10px] text-[#4A5A75] uppercase tracking-wide text-right">Objetivo</span>
              <span className="text-[10px] text-[#4A5A75] uppercase tracking-wide text-right">Potencial</span>
            </div>

            {/* Rows */}
            {grupo.items.map((item, i) => (
              <div
                key={item.ticker}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-3 items-center ${
                  i < grupo.items.length - 1 ? "border-b border-white/[0.03]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <SentimientoIcon s={item.sentimiento} />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.nombre}</p>
                    <p className="text-[10px] text-[#4A5A75]">{item.ticker}</p>
                  </div>
                </div>
                <span className="text-sm font-mono text-white text-right">{item.actual}</span>
                <span
                  className="text-xs font-mono text-right"
                  style={{
                    color: item.acum2026.startsWith("+") ? "#10B981" : item.acum2026.startsWith("-") ? "#EF4444" : "#5A6A85",
                  }}
                >
                  {item.acum2026}
                </span>
                <span className="text-sm font-mono text-[#C9A84C] text-right">{item.cierre2026}</span>
                <div className="flex justify-end">
                  <PotencialBadge valor={item.potencial} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-[#3A4A5E] text-center leading-relaxed">
        Información con fines ilustrativos. Fuente: Actinver Análisis ({HOUSE_VIEW.fecha}).
        Los precios objetivo son estimaciones y no garantizan rendimientos futuros.
      </p>
    </div>
  );
}
