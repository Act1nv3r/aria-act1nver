"use client";

import { useParams } from "next/navigation";
import { Paso1Perfil } from "@/components/diagnostico/paso1-perfil";
import { Paso2Flujo } from "@/components/diagnostico/paso2-flujo";
import { Paso3Patrimonio } from "@/components/diagnostico/paso3-patrimonio";
import { Paso4Retiro } from "@/components/diagnostico/paso4-retiro";
import { Paso5Objetivos } from "@/components/diagnostico/paso5-objetivos";
import { Paso6Proteccion } from "@/components/diagnostico/paso6-proteccion";

const stepComponents = [
  Paso1Perfil,
  Paso2Flujo,
  Paso3Patrimonio,
  Paso4Retiro,
  Paso5Objetivos,
  Paso6Proteccion,
];

export default function PasoPage() {
  const params = useParams();
  const step = parseInt(params?.step as string, 10);
  const StepComponent = step >= 1 && step <= 6 ? stepComponents[step - 1] : null;

  if (!StepComponent) {
    return (
      <div className="text-[#8B3A3A]">Paso inválido</div>
    );
  }

  return <StepComponent />;
}
