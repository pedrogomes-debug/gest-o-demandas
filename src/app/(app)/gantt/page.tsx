import Link from "next/link";
import { campo } from "@/components/estilos";
import { createClient } from "@/lib/supabase/server";
import type { Cliente, DemandaView } from "@/lib/types";
import { BarraGantt } from "./barra";

export const metadata = { title: "Gantt" };

function parseMes(valor: string | undefined) {
  if (valor && /^\d{4}-\d{2}$/.test(valor)) {
    const [ano, mes] = valor.split("-").map(Number);
    return { ano, mes };
  }
  const agora = new Date();
  return { ano: agora.getFullYear(), mes: agora.getMonth() + 1 };
}

function diasNoMes(ano: number, mes: number) {
  return new Date(ano, mes, 0).getDate();
}

function formatarMes(ano: number, mes: number) {
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function deslocarMes(ano: number, mes: number, delta: number) {
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function sobrepoeMes(
  demanda: DemandaView,
  ano: number,
  mes: number,
): { inicio: number; fim: number } | null {
  if (!demanda.data_inicio || !demanda.data_fim) return null;

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 0);
  const inicio = new Date(demanda.data_inicio + "T00:00:00");
  const fim = new Date(demanda.data_fim + "T00:00:00");

  if (fim < inicioMes || inicio > fimMes) return null;

  const diaInicio = Math.max(1, inicio < inicioMes ? 1 : inicio.getDate());
  const diaFim = Math.min(fimMes.getDate(), fim > fimMes ? fimMes.getDate() : fim.getDate());
  return { inicio: diaInicio, fim: diaFim };
}

export default async function PaginaGantt({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; mes?: string }>;
}) {
  const filtros = await searchParams;
  const { ano, mes } = parseMes(filtros.mes);
  const mesAtual = `${ano}-${String(mes).padStart(2, "0")}`;
  const totalDias = diasNoMes(ano, mes);
  const grade = {
    display: "grid",
    gridTemplateColumns: `200px repeat(${totalDias}, 32px)`,
  } as const;

  let erro: string | null = null;
  let demandas: DemandaView[] = [];
  let clientes: Pick<Cliente, "id" | "nome">[] = [];

  try {
    const supabase = await createClient();
    const [resClientes, resDemandas] = await Promise.all([
      supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("v_demandas").select("*").order("data_inicio", { ascending: true }),
    ]);

    if (resClientes.error) throw new Error(resClientes.error.message);
    if (resDemandas.error) throw new Error(resDemandas.error.message);

    clientes = resClientes.data ?? [];
    demandas = ((resDemandas.data ?? []) as DemandaView[]).filter(
      (d) => !filtros.cliente || d.cliente_id === filtros.cliente,
    );
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha ao carregar o gantt.";
  }

  const comDatas: { demanda: DemandaView; inicio: number; fim: number }[] = [];
  const semPrazo: DemandaView[] = [];

  for (const demanda of demandas) {
    const faixa = sobrepoeMes(demanda, ano, mes);
    if (faixa) comDatas.push({ demanda, ...faixa });
    else if (!demanda.data_inicio || !demanda.data_fim) semPrazo.push(demanda);
  }

  const qsCliente = filtros.cliente ? `&cliente=${filtros.cliente}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Gantt</h1>
        <p className="text-sm text-neutral-500">
          Barras a partir de data início e data fim. Edite as datas em Demandas.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <input type="hidden" name="mes" value={mesAtual} />
          <div className="space-y-1">
            <label htmlFor="filtro-cliente" className="block text-xs font-medium text-neutral-500">
              Cliente
            </label>
            <select
              id="filtro-cliente"
              name="cliente"
              defaultValue={filtros.cliente ?? ""}
              className={`${campo} min-w-40`}
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Filtrar
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/gantt?mes=${deslocarMes(ano, mes, -1)}${qsCliente}`}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            ←
          </Link>
          <span className="min-w-40 text-center text-sm font-medium capitalize text-neutral-800">
            {formatarMes(ano, mes)}
          </span>
          <Link
            href={`/gantt?mes=${deslocarMes(ano, mes, 1)}${qsCliente}`}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            →
          </Link>
        </div>
      </div>

      {erro && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

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

      {!erro && comDatas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nenhuma demanda com datas neste mês. Defina data início e fim em{" "}
          <Link href="/demandas" className="underline">
            Demandas
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <div style={grade} className="border-b border-neutral-200 bg-neutral-50">
            <div className="sticky left-0 z-10 border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-500">
              Demanda
            </div>
            {Array.from({ length: totalDias }, (_, i) => (
              <div key={i} className="py-2 text-center text-[10px] text-neutral-400">
                {i + 1}
              </div>
            ))}
          </div>

          {comDatas.map(({ demanda, inicio, fim }) => (
            <div key={demanda.id} style={grade} className="border-b border-neutral-100">
              <div className="sticky left-0 z-10 border-r border-neutral-100 bg-white px-3 py-2">
                <p className="truncate text-sm text-neutral-800">{demanda.titulo}</p>
                {demanda.cliente_nome && (
                  <p className="truncate text-xs text-neutral-400">{demanda.cliente_nome}</p>
                )}
              </div>
              <BarraGantt demanda={demanda} inicio={inicio} fim={fim} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
