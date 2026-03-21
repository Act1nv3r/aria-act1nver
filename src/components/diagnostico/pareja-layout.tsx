"use client";

import { useState } from "react";

interface ParejaLayoutProps {
  titularSection: React.ReactNode;
  parejaSection: React.ReactNode;
  sharedSection?: React.ReactNode;
  titularNombre: string;
  parejaNombre: string;
}

export function ParejaLayout({
  titularSection,
  parejaSection,
  sharedSection,
  titularNombre,
  parejaNombre,
}: ParejaLayoutProps) {
  const [tab, setTab] = useState<"titular" | "pareja" | "compartidos">("titular");

  return (
    <>
      {/* Desktop: grid 2 cols */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:divide-x lg:divide-[#5A6A85]/20">
        <div className="min-w-0 lg:pr-8">
          <div className="border-l-4 border-[#314566] pl-4 mb-4">
            <h3 className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#314566]">
              Titular
            </h3>
            <p className="font-[family-name:var(--font-open-sans)] text-sm text-white">
              {titularNombre}
            </p>
          </div>
          {titularSection}
        </div>
        <div className="min-w-0 lg:pl-8">
          <div className="border-l-4 border-[#E6C78A] pl-4 mb-4">
            <h3 className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
              Pareja
            </h3>
            <p className="font-[family-name:var(--font-open-sans)] text-sm text-white">
              {parejaNombre}
            </p>
          </div>
          {parejaSection}
        </div>
      </div>
      {sharedSection && (
        <div className="hidden lg:block mt-6 w-full bg-[#1A2433]/30 rounded-lg p-6">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#317A70] mb-4">
            Compartidos
          </h3>
          {sharedSection}
        </div>
      )}

      {/* Tablet: tabs */}
      <div className="lg:hidden">
        <div className="flex gap-2 mb-4 border-b border-[#5A6A85]/20">
          <button
            type="button"
            onClick={() => setTab("titular")}
            className={`px-4 py-2 font-[family-name:var(--font-poppins)] text-sm font-medium transition-colors ${
              tab === "titular"
                ? "text-[#314566] border-b-2 border-[#314566]"
                : "text-[#5A6A85] hover:text-white"
            }`}
          >
            Titular
          </button>
          <button
            type="button"
            onClick={() => setTab("pareja")}
            className={`px-4 py-2 font-[family-name:var(--font-poppins)] text-sm font-medium transition-colors ${
              tab === "pareja"
                ? "text-[#E6C78A] border-b-2 border-[#E6C78A]"
                : "text-[#5A6A85] hover:text-white"
            }`}
          >
            Pareja
          </button>
          {sharedSection && (
            <button
              type="button"
              onClick={() => setTab("compartidos")}
              className={`px-4 py-2 font-[family-name:var(--font-poppins)] text-sm font-medium transition-colors ${
                tab === "compartidos"
                  ? "text-[#317A70] border-b-2 border-[#317A70]"
                  : "text-[#5A6A85] hover:text-white"
              }`}
            >
              Compartidos
            </button>
          )}
        </div>
        {tab === "titular" && (
          <div>
            <p className="text-[#5A6A85] text-xs mb-2">{titularNombre}</p>
            {titularSection}
          </div>
        )}
        {tab === "pareja" && (
          <div>
            <p className="text-[#5A6A85] text-xs mb-2">{parejaNombre}</p>
            {parejaSection}
          </div>
        )}
        {tab === "compartidos" && sharedSection && (
          <div>{sharedSection}</div>
        )}
      </div>
    </>
  );
}
