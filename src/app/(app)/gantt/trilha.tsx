"use client";

import { useRef, type ReactNode, type WheelEvent } from "react";

export function TrilhaGantt({ children }: { children: ReactNode }) {
  const trilhaRef = useRef<HTMLDivElement>(null);

  function aoRolar(evento: WheelEvent<HTMLDivElement>) {
    const el = trilhaRef.current;
    if (!el) return;
    if (Math.abs(evento.deltaY) <= Math.abs(evento.deltaX)) return;

    evento.preventDefault();
    el.scrollLeft += evento.deltaY;
  }

  return (
    <div
      ref={trilhaRef}
      onWheel={aoRolar}
      className="-mx-6 overflow-x-auto overscroll-x-contain px-6 pb-3 [scrollbar-gutter:stable]"
    >
      <div className="w-max min-w-full overflow-hidden rounded-lg border border-neutral-200 bg-white pr-[30vw]">
        {children}
      </div>
    </div>
  );
}
