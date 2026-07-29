"use client";

import { useMemo, useRef, useState, useTransition, type WheelEvent } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { STATUS, STATUS_LABEL, type DemandaView, type Status } from "@/lib/types";
import { moverDemanda } from "./actions";

function calcularOrdem(
  acima: DemandaView | undefined,
  abaixo: DemandaView | undefined,
): number {
  if (acima && abaixo) return (Number(acima.ordem) + Number(abaixo.ordem)) / 2;
  if (abaixo) return Number(abaixo.ordem) - 1000;
  if (acima) return Number(acima.ordem) + 1000;
  return 1000;
}

function Card({
  demanda,
  arrastando,
}: {
  demanda: DemandaView;
  arrastando?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-neutral-200 bg-white p-3 shadow-sm ${
        arrastando ? "opacity-90 ring-2 ring-neutral-400" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 size-2.5 shrink-0 rounded-full"
          style={{ background: demanda.cliente_cor ?? "#9CA3AF" }}
          title={demanda.cliente_nome ?? "Sem cliente"}
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
  );
}

function CardSortable({ demanda }: { demanda: DemandaView }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: demanda.id,
    data: { type: "card", demanda },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      <Card demanda={demanda} />
    </div>
  );
}

function Coluna({
  status,
  demandas,
}: {
  status: Status;
  demandas: DemandaView[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "coluna", status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-[calc(100vh-11rem)] w-72 shrink-0 flex-col rounded-lg border border-neutral-200 bg-neutral-50 ${
        isOver ? "ring-2 ring-neutral-400" : ""
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-neutral-800">{STATUS_LABEL[status]}</h2>
        <span className="text-xs text-neutral-400">{demandas.length}</span>
      </div>

      <SortableContext items={demandas.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div data-coluna-scroll className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          {demandas.map((demanda) => (
            <CardSortable key={demanda.id} demanda={demanda} />
          ))}
          {demandas.length === 0 && (
            <p className="px-1 py-6 text-center text-xs text-neutral-400">Solte aqui</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function QuadroKanban({ iniciais }: { iniciais: DemandaView[] }) {
  const [demandas, setDemandas] = useState(iniciais);
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const trilhaRef = useRef<HTMLDivElement>(null);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const porStatus = useMemo(() => {
    const mapa = Object.fromEntries(STATUS.map((s) => [s, [] as DemandaView[]])) as Record<
      Status,
      DemandaView[]
    >;
    for (const d of demandas) {
      mapa[d.status]?.push(d);
    }
    for (const s of STATUS) {
      mapa[s].sort((a, b) => Number(a.ordem) - Number(b.ordem));
    }
    return mapa;
  }, [demandas]);

  const ativo = demandas.find((d) => d.id === ativoId) ?? null;

  function aoIniciar(evento: DragStartEvent) {
    setAtivoId(String(evento.active.id));
    setErro(null);
  }

  function aoTerminar(evento: DragEndEvent) {
    setAtivoId(null);
    const { active, over } = evento;
    if (!over) return;

    const movida = demandas.find((d) => d.id === active.id);
    if (!movida) return;

    let statusDestino: Status = movida.status;
    let indice = porStatus[movida.status].findIndex((d) => d.id === movida.id);

    const overData = over.data.current;
    if (overData?.type === "coluna") {
      statusDestino = overData.status as Status;
      indice = porStatus[statusDestino].filter((d) => d.id !== movida.id).length;
    } else {
      const alvo = demandas.find((d) => d.id === over.id);
      if (!alvo) return;
      statusDestino = alvo.status;
      const lista = porStatus[statusDestino].filter((d) => d.id !== movida.id);
      indice = lista.findIndex((d) => d.id === alvo.id);
      if (indice < 0) indice = lista.length;
    }

    const listaDestino = porStatus[statusDestino].filter((d) => d.id !== movida.id);
    const acima = listaDestino[indice - 1];
    const abaixo = listaDestino[indice];
    const ordem = calcularOrdem(acima, abaixo);

    if (movida.status === statusDestino && Number(movida.ordem) === ordem) return;

    const atualizada: DemandaView = { ...movida, status: statusDestino, ordem };
    const proximo = [...demandas.filter((d) => d.id !== movida.id), atualizada];
    setDemandas(proximo);

    startTransition(async () => {
      const resultado = await moverDemanda({
        id: movida.id,
        status: statusDestino,
        ordem,
      });
      if (resultado.erro) {
        setDemandas(iniciais);
        setErro(resultado.erro);
      }
    });
  }

  // Rolinha do mouse vira scroll lateral contínuo no quadro.
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
    <div className="space-y-3">
      {erro && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        onDragStart={aoIniciar}
        onDragEnd={aoTerminar}
        autoScroll={{ threshold: { x: 0.15, y: 0.15 } }}
      >
        <div
          ref={trilhaRef}
          onWheel={aoRolar}
          className="-mx-6 overflow-x-auto overscroll-x-contain px-6 pb-3 [scrollbar-gutter:stable]"
        >
          <div className="flex w-max gap-3 pr-[40vw]">
            {STATUS.map((status) => (
              <Coluna key={status} status={status} demandas={porStatus[status]} />
            ))}
          </div>
        </div>

        <DragOverlay>{ativo ? <Card demanda={ativo} arrastando /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
