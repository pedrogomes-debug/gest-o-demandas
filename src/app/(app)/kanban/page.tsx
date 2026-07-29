import { createClient } from "@/lib/supabase/server";
import type { DemandaView } from "@/lib/types";
import { QuadroKanban } from "./quadro";

export const metadata = { title: "Kanban" };

export default async function PaginaKanban() {
  let demandas: DemandaView[] = [];
  let erro: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("v_demandas")
      .select("*")
      .order("status")
      .order("ordem", { ascending: true });

    if (error) throw new Error(error.message);
    demandas = (data ?? []) as DemandaView[];
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha ao carregar o kanban.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Kanban</h1>
        <p className="text-sm text-neutral-500">
          Arraste os cards entre colunas. Persiste status e ordem na mesma tabela de demandas.
        </p>
      </div>

      {erro ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      ) : demandas.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nenhuma demanda ainda. Crie em Demandas para aparecer aqui.
        </p>
      ) : (
        <QuadroKanban iniciais={demandas} />
      )}
    </div>
  );
}
