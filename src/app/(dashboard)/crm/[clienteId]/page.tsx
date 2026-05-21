"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CRMClienteRedirect() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params?.clienteId as string;

  useEffect(() => {
    if (clienteId) {
      router.replace(`/customers/${clienteId}`);
    }
  }, [clienteId, router]);

  return null;
}
