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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[10px] font-semibold ml-1">
        <Check className="w-2.5 h-2.5" />
        {campo}: {String(valor)}
      </span>
    );
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 ml-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="bg-[#1A3154] border border-[#C9A84C]/40 rounded px-2 py-0.5 text-[10px] text-[#F0F4FA] w-24 focus:outline-none focus:border-[#C9A84C]"
          autoFocus
        />
        <button type="button" onClick={handleSave} className="text-[#10B981] hover:text-[#10B981]/80">
          <Check className="w-3 h-3" />
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-[#8B9BB4] hover:text-[#F0F4FA]">
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ml-1 cursor-pointer transition-colors"
      style={{
        backgroundColor: confianza >= 0.85 ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.08)",
        color: "#C9A84C",
        borderBottom: "2px solid rgba(201,168,76,0.4)",
      }}
    >
      {campo}: {String(valor)}
      <button type="button" onClick={onAccept} className="hover:scale-110 transition-transform" title="Aceptar">
        <Check className="w-2.5 h-2.5" />
      </button>
      <button type="button" onClick={() => setEditing(true)} className="hover:scale-110 transition-transform" title="Editar">
        <Pencil className="w-2.5 h-2.5" />
      </button>
      <button type="button" onClick={onDismiss} className="text-[#8B9BB4] hover:text-[#EF4444]" title="Descartar">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
