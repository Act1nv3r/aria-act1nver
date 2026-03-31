"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

interface DataHighlightProps {
  campo: string;
  valor: string | number | boolean;
  confianza: number;
  textoFuente: string;
  aceptado: boolean;
  onAccept: () => void;
  onEdit: (nuevoValor: string | number | boolean) => void;
  onDismiss: () => void;
}

function formatDisplayValue(campo: string, valor: string | number | boolean): string {
  const v = Number(valor);
  const currencyFields = [
    "ahorro", "rentas", "gastos_basicos", "obligaciones", "otros", "creditos",
    "liquidez", "inversiones", "dotales", "afore", "ppr", "plan_privado",
    "seguros_retiro", "casa", "inmuebles_renta", "tierra", "negocio", "herencia",
  ];
  if (!isNaN(v) && v > 0 && currencyFields.includes(campo)) {
    return `$${v.toLocaleString("es-MX")}`;
  }
  return String(valor);
}

function fieldLabel(campo: string): string {
  const labels: Record<string, string> = {
    nombre: "Nombre", edad: "Edad", genero: "Género", ocupacion: "Ocupación",
    dependientes: "Dependientes", ahorro: "Ahorro mensual", rentas: "Rentas",
    gastos_basicos: "Gastos básicos", obligaciones: "Obligaciones", otros: "Otros ingresos",
    creditos: "Créditos", liquidez: "Liquidez", inversiones: "Inversiones",
    dotales: "Dotales", afore: "Afore", ppr: "PPR", plan_privado: "Plan privado",
    seguros_retiro: "Seguros retiro", ley_73: "Ley 73",
    casa: "Casa habitación", inmuebles_renta: "Inmuebles renta", tierra: "Tierra",
    negocio: "Negocio", herencia: "Herencia",
    seguro_vida: "Seguro de vida", propiedades_aseguradas: "Propiedades aseguradas", sgmm: "SGMM",
  };
  return labels[campo] || campo;
}

function confidenceColor(c: number): string {
  if (c >= 0.85) return "#10B981";
  if (c >= 0.7) return "#C9A84C";
  return "#8B9BB4";
}

export function DataHighlight({
  campo,
  valor,
  confianza,
  aceptado,
  onAccept,
  onEdit,
  onDismiss,
}: DataHighlightProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(valor));

  const handleSave = () => {
    const parsed = Number(editValue);
    onEdit(isNaN(parsed) ? editValue : parsed);
    setEditing(false);
  };

  if (aceptado) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="animate-slide-in-left inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-semibold hover:bg-[#10B981]/15 transition-colors cursor-pointer"
      >
        <Check className="w-3.5 h-3.5" />
        <span>{fieldLabel(campo)}:</span>
        <span className="font-bold">{formatDisplayValue(campo, valor)}</span>
      </button>
    );
  }

  if (editing) {
    return (
      <div className="animate-slide-in-left flex items-center gap-2 p-3 rounded-xl bg-[#0C1829] border border-[#C9A84C]/30">
        <span className="text-xs text-[#8B9BB4] font-semibold shrink-0">{fieldLabel(campo)}</span>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="flex-1 bg-[#1A3154] border border-[#C9A84C]/40 rounded-lg px-3 py-1.5 text-sm text-[#F0F4FA] focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 min-w-[100px]"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSave}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold hover:bg-[#10B981]/25 transition-colors"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="shrink-0 p-1.5 rounded-lg text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-[#1A3154]/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-in-left rounded-xl bg-[#0C1829] border-l-4 overflow-hidden" style={{ borderLeftColor: confidenceColor(confianza) }}>
      <div className="p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#8B9BB4] font-medium mb-0.5">{fieldLabel(campo)}</p>
          <p className="text-sm text-[#F0F4FA] font-bold truncate">{formatDisplayValue(campo, valor)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onAccept}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold hover:bg-[#10B981]/25 active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Aceptar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditValue(String(valor));
              setEditing(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-[#8B9BB4] text-xs font-semibold hover:text-[#F0F4FA] hover:border-white/20 active:scale-95 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-[#4A5A72] hover:text-[#EF4444] hover:bg-[#EF4444]/10 active:scale-95 transition-all"
            title="Descartar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Confidence bar */}
      <div className="h-[2px] w-full bg-[#1A3154]">
        <div
          className="h-full rounded-r-full transition-all duration-500"
          style={{
            width: `${Math.round(confianza * 100)}%`,
            backgroundColor: confidenceColor(confianza),
          }}
        />
      </div>
    </div>
  );
}
