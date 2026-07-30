"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { STATUS_LABEL, type DemandaView } from "@/lib/types";

const LARGURA_DIA = 44;
const LARGURA_ROTULO = 220;
const DIAS_BUFFER = 90;
const LIMIAR_EXTENSAO = 500;

function formatarData(iso: string | null) {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function adicionarDias(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return inicioDoDia(d);
}

function diasEntre(a: Date, b: Date) {
  return Math.round((inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / 86_400_000);
}

function parseIso(iso: string) {
  return inicioDoDia(new Date(iso + "T00:00:00"));
}

function rotuloDia(d: Date) {
  return String(d.getDate()).padStart(2, "0");
}

function rotuloMes(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function Popup({
  demanda,
  top,
  left,
}: {
  demanda: DemandaView;
  top: number;
  left: number;
}) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 w-72 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
      style={{ top, left }}
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
    </div>
  );
}

function Barra({
  demanda,
  left,
  width,
}: {
  demanda: DemandaView;
  left: number;
  width: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  if (width <= 0) return null;

  return (
    <>
      <div
        className="absolute top-2 bottom-2 flex cursor-default items-center overflow-hidden rounded-sm px-2 text-[11px] text-white"
        style={{
          left,
          width: Math.max(width, 8),
          background: demanda.cliente_cor ?? "#6B7280",
        }}
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.top - 8, left: r.left + r.width / 2 });
          setAberto(true);
        }}
        onMouseLeave={() => setAberto(false)}
      >
        <span className="truncate">{demanda.titulo}</span>
      </div>
      {aberto &&
        createPortal(<Popup demanda={demanda} top={pos.top} left={pos.left} />, document.body)}
    </>
  );
}

export function QuadroGantt({
  demandas,
  clienteId,
  responsavelId,
}: {
  demandas: DemandaView[];
  clienteId?: string;
  responsavelId?: string;
}) {
  const trilhaRef = useRef<HTMLDivElement>(null);
  const ancorado = useRef(false);
  const estendendo = useRef(false);

  const filtradas = useMemo(
    () =>
      demandas.filter(
        (d) =>
          d.data_inicio &&
          d.data_fim &&
          (!clienteId || d.cliente_id === clienteId) &&
          (!responsavelId || d.responsavel_id === responsavelId),
      ),
    [demandas, clienteId, responsavelId],
  );

  const semPrazo = useMemo(
    () =>
      demandas.filter(
        (d) =>
          (!d.data_inicio || !d.data_fim) &&
          (!clienteId || d.cliente_id === clienteId) &&
          (!responsavelId || d.responsavel_id === responsavelId),
      ),
    [demandas, clienteId, responsavelId],
  );

  const [inicioJanela, setInicioJanela] = useState(() =>
    adicionarDias(inicioDoDia(new Date()), -DIAS_BUFFER),
  );
  const [qtdDias, setQtdDias] = useState(DIAS_BUFFER * 2);

  const dias = useMemo(
    () => Array.from({ length: qtdDias }, (_, i) => adicionarDias(inicioJanela, i)),
    [inicioJanela, qtdDias],
  );

  const estender = useCallback(() => {
    const el = trilhaRef.current;
    if (!el || estendendo.current) return;

    if (el.scrollLeft < LIMIAR_EXTENSAO) {
      estendendo.current = true;
      setInicioJanela((atual) => adicionarDias(atual, -DIAS_BUFFER));
      setQtdDias((n) => n + DIAS_BUFFER);
      requestAnimationFrame(() => {
        if (trilhaRef.current) {
          trilhaRef.current.scrollLeft += DIAS_BUFFER * LARGURA_DIA;
        }
        estendendo.current = false;
      });
    } else if (el.scrollLeft + el.clientWidth > el.scrollWidth - LIMIAR_EXTENSAO) {
      estendendo.current = true;
      setQtdDias((n) => n + DIAS_BUFFER);
      requestAnimationFrame(() => {
        estendendo.current = false;
      });
    }
  }, []);

  useEffect(() => {
    const el = trilhaRef.current;
    if (!el || ancorado.current || filtradas.length === 0) return;
    const hoje = inicioDoDia(new Date());
    const offset = Math.max(0, diasEntre(inicioJanela, hoje) * LARGURA_DIA - el.clientWidth / 3);
    el.scrollLeft = offset;
    ancorado.current = true;
  }, [inicioJanela, filtradas.length]);

  useEffect(() => {
    const el = trilhaRef.current;
    if (!el) return;

    const onWheel = (evento: globalThis.WheelEvent) => {
      if (Math.abs(evento.deltaY) <= Math.abs(evento.deltaX)) return;
      evento.preventDefault();
      el.scrollLeft += evento.deltaY;
      estender();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [estender]);

  function aoScroll() {
    estender();
  }

  const gradeFundo = {
    backgroundImage: `repeating-linear-gradient(
      to right,
      transparent 0,
      transparent ${LARGURA_DIA - 1}px,
      rgb(245 245 245) ${LARGURA_DIA - 1}px,
      rgb(245 245 245) ${LARGURA_DIA}px
    )`,
  };

  return (
    <div className="space-y-3">
      {semPrazo.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">Sem prazo ({semPrazo.length})</p>
          <ul className="mt-1 space-y-0.5 text-sm text-amber-800">
            {semPrazo.map((d) => (
              <li key={d.id}>{d.titulo}</li>
            ))}
          </ul>
        </div>
      )}

      {filtradas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nenhuma demanda com datas. Defina início e fim em Demandas.
        </p>
      ) : (
        <div
          ref={trilhaRef}
          onScroll={aoScroll}
          className="-mx-6 h-[calc(100vh-11rem)] overflow-auto overscroll-contain bg-white [scrollbar-gutter:stable]"
        >
          <div style={{ width: LARGURA_ROTULO + qtdDias * LARGURA_DIA, minHeight: "100%" }}>
            <div className="sticky top-0 z-20 flex border-b border-neutral-200 bg-white">
              <div
                className="sticky left-0 z-30 flex shrink-0 items-end border-r border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-500"
                style={{ width: LARGURA_ROTULO }}
              >
                Demanda
              </div>
              <div>
                <div className="flex h-5">
                  {dias.map((d, i) => {
                    const mostraMes = i === 0 || d.getDate() === 1;
                    return (
                      <div
                        key={`m-${i}-${d.getTime()}`}
                        className="shrink-0 pl-1 text-[10px] capitalize text-neutral-500"
                        style={{ width: LARGURA_DIA }}
                      >
                        {mostraMes ? rotuloMes(d) : ""}
                      </div>
                    );
                  })}
                </div>
                <div className="flex h-6">
                  {dias.map((d, i) => {
                    const fimDeSemana = d.getDay() === 0 || d.getDay() === 6;
                    const hoje = diasEntre(d, inicioDoDia(new Date())) === 0;
                    return (
                      <div
                        key={`d-${i}-${d.getTime()}`}
                        className={`shrink-0 border-l border-neutral-100 text-center text-[10px] leading-6 ${
                          hoje
                            ? "bg-neutral-900 font-semibold text-white"
                            : fimDeSemana
                              ? "bg-neutral-50 text-neutral-400"
                              : "text-neutral-400"
                        }`}
                        style={{ width: LARGURA_DIA }}
                      >
                        {rotuloDia(d)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {filtradas.map((demanda) => {
              const inicio = parseIso(demanda.data_inicio!);
              const fim = parseIso(demanda.data_fim!);
              const offsetInicio = diasEntre(inicioJanela, inicio);
              const offsetFim = diasEntre(inicioJanela, fim) + 1;
              const inicioVisivel = Math.max(0, offsetInicio);
              const fimVisivel = Math.min(qtdDias, offsetFim);
              const left = inicioVisivel * LARGURA_DIA;
              const width = (fimVisivel - inicioVisivel) * LARGURA_DIA;

              return (
                <div
                  key={demanda.id}
                  className="flex border-b border-neutral-100"
                  style={{ height: 52 }}
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-neutral-100 bg-white px-3"
                    style={{ width: LARGURA_ROTULO }}
                  >
                    <p className="truncate text-sm text-neutral-800">{demanda.titulo}</p>
                    {demanda.cliente_nome && (
                      <p className="truncate text-xs text-neutral-400">{demanda.cliente_nome}</p>
                    )}
                  </div>
                  <div className="relative" style={{ width: qtdDias * LARGURA_DIA, ...gradeFundo }}>
                    <Barra demanda={demanda} left={left} width={width} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
