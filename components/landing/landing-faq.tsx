"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface LandingFaqProps {
  items: FaqItem[];
  focusRing: string;
}

export function LandingFaq({ items, focusRing }: LandingFaqProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-3 sm:space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const headerId = `${baseId}-header-${index}`;

        return (
          <div
            key={item.question}
            className="rounded-2xl border border-white/10 bg-zinc-900/90 sm:rounded-3xl"
          >
            <button
              type="button"
              id={headerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={`flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:gap-6 sm:px-7 sm:py-6 ${focusRing} rounded-2xl sm:rounded-3xl`}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="text-base font-medium leading-snug text-white sm:text-lg">
                {item.question}
              </span>
              <span className="shrink-0 text-zinc-400" aria-hidden>
                {isOpen ? (
                  <X className="h-6 w-6 sm:h-7 sm:w-7" />
                ) : (
                  <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
                )}
              </span>
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className="px-5 pb-5 pt-0 sm:px-7 sm:pb-7"
              >
                <p className="pt-4 text-base leading-relaxed text-zinc-400 sm:pt-5 sm:text-lg">
                  {item.answer}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
