import { cartao } from "@/components/estilos";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/lib/types";
import { LinhaCliente, NovoCliente } from "./formularios";

export const metadata = { title: "Clientes" };

export default async function PaginaClientes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("ativo", { ascending: false })
    .order("nome");

  const clientes = (data ?? []) as Cliente[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Clientes</h1>
        <p className="text-sm text-neutral-500">
          A cor identifica o cliente nos cards do kanban e nas barras do gantt.
        </p>
      </div>

      <NovoCliente />

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</p>
      )}

      <div className={`${cartao} overflow-hidden`}>
        <table className="w-full">
          <thead className="bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="w-24 px-4 py-2">Cor</th>
              <th className="w-32 px-4 py-2">Situação</th>
              <th className="w-48 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <LinhaCliente key={cliente.id} cliente={cliente} />
            ))}
            {clientes.length === 0 && !error && (
              <tr className="border-t border-neutral-200">
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500">
                  Nenhum cliente ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
