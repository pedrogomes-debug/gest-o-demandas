import Link from "next/link";
import { cartao, campo } from "@/components/estilos";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, type Cliente, type DemandaView, type Pessoa } from "@/lib/types";
import { LinhaDemanda, NovaDemanda } from "./formularios";

export const metadata = { title: "Demandas" };

type Filtros = {
  cliente?: string;
  responsavel?: string;
};

export default async function PaginaDemandas({
  searchParams,
}: {
  searchParams: Promise<Filtros>;
}) {
  const filtros = await searchParams;
  const supabase = await createClient();

  let erro: string | null = null;
  let demandas: DemandaView[] = [];
  let clientes: Pick<Cliente, "id" | "nome">[] = [];
  let pessoas: Pick<Pessoa, "id" | "nome">[] = [];

  try {
    const [resClientes, resPessoas] = await Promise.all([
      supabase.from("clientes").select("id, nome").eq("ativo", true).order("nome"),
      supabase.from("pessoas").select("id, nome").eq("ativo", true).order("nome"),
    ]);

    if (resClientes.error) throw new Error(resClientes.error.message);
    if (resPessoas.error) throw new Error(resPessoas.error.message);

    clientes = resClientes.data ?? [];
    pessoas = resPessoas.data ?? [];

    let consulta = supabase
      .from("v_demandas")
      .select("*")
      .order("status")
      .order("ordem", { ascending: true });

    if (filtros.cliente) consulta = consulta.eq("cliente_id", filtros.cliente);
    if (filtros.responsavel) consulta = consulta.eq("responsavel_id", filtros.responsavel);

    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    demandas = (data ?? []) as DemandaView[];
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha ao carregar demandas.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Demandas</h1>
        <p className="text-sm text-neutral-500">
          Mesma tabela que vai alimentar o kanban (status) e o gantt (datas).
        </p>
      </div>

      <NovaDemanda clientes={clientes} pessoas={pessoas} />

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

        <div className="space-y-1">
          <label
            htmlFor="filtro-responsavel"
            className="block text-xs font-medium text-neutral-500"
          >
            Responsável
          </label>
          <select
            id="filtro-responsavel"
            name="responsavel"
            defaultValue={filtros.responsavel ?? ""}
            className={`${campo} min-w-40`}
          >
            <option value="">Todos</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
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

        {(filtros.cliente || filtros.responsavel) && (
          <Link href="/demandas" className="text-sm text-neutral-500 hover:text-neutral-900">
            Limpar
          </Link>
        )}
      </form>

      {erro && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

      <div className={`${cartao} overflow-x-auto`}>
        <table className="w-full min-w-[900px]">
          <thead className="bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
            <tr>
              <th className="px-3 py-2">Título</th>
              <th className="w-40 px-3 py-2">Cliente</th>
              <th className="w-40 px-3 py-2">Responsável</th>
              <th className="w-32 px-3 py-2">Status</th>
              <th className="w-36 px-3 py-2">Datas</th>
              <th className="w-36 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {demandas.map((demanda) => (
              <LinhaDemanda
                key={demanda.id}
                demanda={demanda}
                clientes={clientes}
                pessoas={pessoas}
              />
            ))}
            {demandas.length === 0 && !erro && (
              <tr className="border-t border-neutral-200">
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Nenhuma demanda ainda
                  {filtros.cliente || filtros.responsavel
                    ? " com esses filtros"
                    : ""}. Use o formulário acima.
                  {clientes.length === 0 && (
                    <>
                      {" "}
                      Cadastre um{" "}
                      <Link href="/clientes" className="underline">
                        cliente
                      </Link>{" "}
                      antes, se quiser.
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {demandas.length > 0 && (
        <p className="text-xs text-neutral-400">
          {demandas.length} demanda(s)
          {filtros.cliente || filtros.responsavel ? " filtrada(s)" : ""}. Status possíveis:{" "}
          {Object.values(STATUS_LABEL).join(", ")}.
        </p>
      )}
    </div>
  );
}
