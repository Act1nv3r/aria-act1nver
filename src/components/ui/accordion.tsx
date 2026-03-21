"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  title: string;
  total?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionItem({
  title,
  total,
  defaultOpen = false,
  children,
}: AccordionItemProps) {
  return (
    <Accordion.Root type="single" collapsible defaultValue={defaultOpen ? "item" : undefined}>
      <Accordion.Item value="item" className="border-b border-white/10 last:border-0">
        <Accordion.Header>
          <Accordion.Trigger
            className={`
              w-full flex items-center justify-between py-4 px-4 -mx-4
              font-bold font-[family-name:var(--font-poppins)] text-sm text-white
              hover:bg-white/5 rounded transition-colors
              data-[state=open]:bg-[#E6C78A]/10 data-[state=open]:border-l-4 data-[state=open]:border-l-[#E6C78A]
            `}
          >
            <span>{title}</span>
            <span className="flex items-center gap-2">
              {total && (
                <span className="font-normal text-xs text-[#E6C78A]">{total}</span>
              )}
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </span>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="pb-4">{children}</div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
