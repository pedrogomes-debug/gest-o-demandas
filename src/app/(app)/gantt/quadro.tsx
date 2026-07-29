"use client";

import { useMemo, useRef, useState, type WheelEvent } from "react";
import { createPortal } from "react-dom";
import { STATUS_LABEL, type DemandaView } from "@/lib/types";

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function CardGantt({ demanda }: { demanda: DemandaView }) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function posicionar(el: HTMLElement) {
    const ret = el.getBoundingClientRect();
    setPos({ top: ret.top - 8, left: ret.left + ret.width / 2 });
    setAberto(true);
  }

  return (
    <>
      <div
        className="cursor-default rounded-md border border-neutral-200 bg-white p-3 shadow-sm"
        onMouseEnter={(e) => posicionar(e.currentTarget)}
        onMouseLeave={() => setAberto(false)}
      >
        <div className="flex items-start gap-2">
          <span
            className="mt-1 size-2.5 shrink-0 rounded-full"
            style={{ background: demanda.cliente_cor ?? "#9CA3AF" }}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">{demanda.titulo}</p>
            {(demanda.cliente_nome || demanda.responsavel_nome) && (
              <p className="mt-1 truncate text-xs text-neutral-500">
                {[demanda.cliente_nome, demanda.responsavel_nome].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {aberto &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 w-72 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="space-y-2">
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
          </div>,
          document.body,
        )}
    </>
  );
}

function ColunaDia({
  dia,
  demandas,
  fimDeSemana,
}: {
  dia: number;
  demandas: DemandaView[];
  fimDeSemana: boolean;
}) {
  return (
    <div
      className={`flex h-[calc(100vh-14rem)] w-72 shrink-0 flex-col rounded-lg border bg-neutral-50 ${
        fimDeSemana ? "border-neutral-300" : "border-neutral-200"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-neutral-800">Dia {dia}</h2>
        <span className="text-xs text-neutral-400">{demandas.length}</span>
      </div>
      <div data-coluna-scroll className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {demandas.map((demanda) => (
          <CardGantt key={demanda.id} demanda={demanda} />
        ))}
        {demandas.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-neutral-400">Sem demandas</p>
        )}
      </div>
    </div>
  );
}

export function QuadroGantt({
  ano,
  mes,
  totalDias,
  itens,
}: {
  ano: number;
  mes: number;
  totalDias: number;
  itens: { demanda: DemandaView; inicio: number; fim: number }[];
}) {
  const trilhaRef = useRef<HTMLDivElement>(null);

  const porDia = useMemo(() => {
    const mapa: DemandaView[][] = Array.from({ length: totalDias }, () => []);
    for (const { demanda, inicio, fim } of itens) {
      for (let d = inicio; d <= fim; d++) {
        mapa[d - 1]?.push(demanda);
      }
    }
    return mapa;
  }, [itens, totalDias]);

  function aoRolar(evento: WheelEvent<HTMLDivElement>) {
    const el = trilhaRef.current;
    if (!el) return;
    if (Math.abs(evento.deltaY) <= Math.abs(evento.deltaX)) return;

    const alvo = evento.target as HTMLElement | null;
    const colunaScroll = alvo?.closest?.("[data-coluna-scroll]");
    if (colunaScroll && colunaScroll.scrollHeight > colunaScroll.clientHeight) {
      const noTopo = colunaScroll.scrollTop <= 0 && evento.deltaY < 0;
      const noFim =
        colunaScroll.scrollTop + colunaScroll.clientHeight >= colunaScroll.scrollHeight - 1 &&
        evento.deltaY > 0;
      if (!noTopo && !noFim) return;
    }

    evento.preventDefault();
    el.scrollLeft += evento.deltaY;
  }

  return (
    <div
      ref={trilhaRef}
      onWheel={aoRolar}
      className="-mx-6 overflow-x-auto overscroll-x-contain px-6 pb-3 [scrollbar-gutter:stable]"
    >
      <div className="flex w-max gap-3 pr-[40vw]">
        {porDia.map((demandas, indice) => {
          const dia = indice + 1;
          const semana = new Date(ano, mes - 1, dia).getDay();
          return (
            <ColunaDia
              key={dia}
              dia={dia}
              demandas={demandas}
              fimDeSemana={semana === 0 || semana === 6}
            />
          );
        })}
      </div>
    </div>
  );
}
