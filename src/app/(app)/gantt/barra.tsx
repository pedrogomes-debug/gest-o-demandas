"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { STATUS_LABEL, type DemandaView } from "@/lib/types";

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function BarraGantt({
  demanda,
  inicio,
  fim,
}: {
  demanda: DemandaView;
  inicio: number;
  fim: number;
}) {
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function posicionar(el: HTMLElement) {
    const ret = el.getBoundingClientRect();
    setPos({
      top: ret.top - 8,
      left: ret.left + ret.width / 2,
    });
    setAberto(true);
  }

  return (
    <>
      <div
        role="img"
        aria-describedby={aberto ? id : undefined}
        className="my-2 flex cursor-default items-center overflow-hidden rounded-sm px-2 text-[11px] text-white"
        style={{
          gridColumn: `${inicio + 1} / ${fim + 2}`,
          background: demanda.cliente_cor ?? "#6B7280",
        }}
        onMouseEnter={(e) => posicionar(e.currentTarget)}
        onMouseLeave={() => setAberto(false)}
        onFocus={(e) => posicionar(e.currentTarget)}
        onBlur={() => setAberto(false)}
        tabIndex={0}
      >
        <span className="truncate">{demanda.titulo}</span>
      </div>

      {aberto &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="pointer-events-none fixed z-50 w-72 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex items-start gap-2">
              <span
                className="mt-1 size-2.5 shrink-0 rounded-full"
                style={{ background: demanda.cliente_cor ?? "#9CA3AF" }}
              />
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-semibold text-neutral-900">{demanda.titulo}</p>

                {demanda.descricao && (
                  <p className="text-xs leading-relaxed text-neutral-600">{demanda.descricao}</p>
                )}

                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-neutral-400">Status</dt>
                  <dd className="text-neutral-800">{STATUS_LABEL[demanda.status]}</dd>

                  <dt className="text-neutral-400">Cliente</dt>
                  <dd className="truncate text-neutral-800">{demanda.cliente_nome ?? "—"}</dd>

                  <dt className="text-neutral-400">Responsável</dt>
                  <dd className="truncate text-neutral-800">{demanda.responsavel_nome ?? "—"}</dd>

                  <dt className="text-neutral-400">Início</dt>
                  <dd className="text-neutral-800">{formatarData(demanda.data_inicio)}</dd>

                  <dt className="text-neutral-400">Fim</dt>
                  <dd className="text-neutral-800">{formatarData(demanda.data_fim)}</dd>
                </dl>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
