"use client";

import { useState, useRef } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
} from "@floating-ui/react";
import { Info } from "lucide-react";

interface InfoBoxProps {
  content: string;
  children: React.ReactNode;
}

export function InfoBox({ content, children }: InfoBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "left",
    strategy: "fixed",
    middleware: [
      offset(12),
      flip({ fallbackPlacements: ["right", "top", "bottom"] }),
      shift({ padding: 12 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="w-full min-w-0">
      <div className="flex w-full min-w-0 items-start gap-2">
        <span className="block min-w-0 flex-1">
          {children}
        </span>
        <button
          type="button"
          ref={refs.setReference}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => setIsOpen((o) => !o)}
          className="shrink-0 mt-[28px] text-[#8B9BB4] transition-colors hover:text-[#C9A84C]"
          aria-label="Más información"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-[200] bg-[#112038] border border-white/[0.08] rounded-[12px] shadow-[0_8px_40px_rgba(0,0,0,0.6)] p-4 max-w-[260px] font-[family-name:var(--font-poppins)] text-sm text-[#F0F4FA]"
        >
          {content}
          <FloatingArrow ref={arrowRef} context={context} fill="#112038" />
        </div>
      )}
    </div>
  );
}
