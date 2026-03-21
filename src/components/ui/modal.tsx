"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Wider layout for lists / admin panels */
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
            bg-[#1A2433] rounded-xl shadow-xl w-full mx-4 max-h-[min(90vh,720px)] overflow-y-auto
            focus:outline-none ${wide ? "max-w-2xl" : "max-w-md"}`}
        >
          <div className="relative p-6">
            <Dialog.Title className="font-bold font-[family-name:var(--font-poppins)] text-xl text-white pr-8">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="absolute right-4 top-6 text-white/60 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
            <div className="mt-4">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
