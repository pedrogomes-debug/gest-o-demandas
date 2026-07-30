import { campo } from "@/components/estilos";
import { createClient } from "@/lib/supabase/server";
import type { Cliente, DemandaView } from "@/lib/types";
import { QuadroGantt } from "./quadro";

export const metadata = { title: "Gantt" };

export default async function PaginaGantt({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const filtros = await searchParams;

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
    demandas = (resDemandas.data ?? []) as DemandaView[];
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha ao carregar o gantt.";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Gantt</h1>
          <p className="text-sm text-neutral-500">
            Timeline contínua — role para o lado para avançar ou voltar nas datas.
          </p>
        </div>

        <form className="flex flex-wrap items-end gap-3" method="get">
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
      </div>

      {erro ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      ) : (
        <QuadroGantt demandas={demandas} clienteId={filtros.cliente} />
      )}
    </div>
  );
}
