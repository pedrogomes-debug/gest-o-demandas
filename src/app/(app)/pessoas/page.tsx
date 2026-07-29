import { cartao } from "@/components/estilos";
import { createClient } from "@/lib/supabase/server";
import type { Pessoa } from "@/lib/types";
import { LinhaPessoa, NovaPessoa } from "./formularios";

export const metadata = { title: "Pessoas" };

export default async function PaginaPessoas() {
  let pessoas: Pessoa[] = [];
  let erro: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pessoas")
      .select("*")
      .order("nome", { ascending: true });
    pessoas = (data ?? []) as Pessoa[];
    erro = error?.message ?? null;
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha ao conectar no Supabase.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Pessoas</h1>
        <p className="text-sm text-neutral-500">
          Cadastre a equipe aqui para atribuir demandas.
        </p>
      </div>

      <NovaPessoa />

      {erro && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
      )}

      <div className={`${cartao} overflow-hidden`}>
        <table className="w-full">
          <thead className="bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="w-40 px-4 py-2">Papel</th>
              <th className="w-28 px-4 py-2">Situação</th>
              <th className="w-32 px-4 py-2">Acesso</th>
              <th className="w-48 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {pessoas.map((pessoa) => (
              <LinhaPessoa key={pessoa.id} pessoa={pessoa} />
            ))}
            {pessoas.length === 0 && !erro && (
              <tr className="border-t border-neutral-200">
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Nenhuma pessoa ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
