"use client";

import { useActionState, useRef } from "react";
import { botao, botaoDiscreto, campo } from "@/components/estilos";
import type { Cliente } from "@/lib/types";
import { criarCliente, excluirCliente, salvarCliente, type EstadoForm } from "./actions";

const ESTADO_INICIAL: EstadoForm = {};

export function NovoCliente() {
  const [estado, acao, pendente] = useActionState(criarCliente, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formulario}
      action={async (formData) => {
        await acao(formData);
        formulario.current?.reset();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input name="nome" placeholder="Nome do cliente" required className={`${campo} max-w-xs`} />
      <input
        name="cor"
        type="color"
        defaultValue="#6B7280"
        aria-label="Cor do cliente"
        className="h-9 w-12 cursor-pointer rounded-md border border-neutral-300 bg-white p-1"
      />
      <button type="submit" disabled={pendente} className={botao}>
        Adicionar
      </button>
      {estado.erro && <span className="text-sm text-red-600">{estado.erro}</span>}
    </form>
  );
}

export function LinhaCliente({ cliente }: { cliente: Cliente }) {
  const [estadoSalvar, salvar, salvando] = useActionState(salvarCliente, ESTADO_INICIAL);
  const [estadoExcluir, excluir, excluindo] = useActionState(excluirCliente, ESTADO_INICIAL);
  const erro = estadoSalvar.erro ?? estadoExcluir.erro;

  return (
    <tr className="border-t border-neutral-200">
      <td className="px-4 py-2">
        <form id={`salvar-${cliente.id}`} action={salvar} className="contents">
          <input type="hidden" name="id" value={cliente.id} />
          <input name="nome" defaultValue={cliente.nome} className={campo} />
        </form>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </td>

      <td className="px-4 py-2">
        <input
          form={`salvar-${cliente.id}`}
          name="cor"
          type="color"
          defaultValue={cliente.cor}
          aria-label={`Cor de ${cliente.nome}`}
          className="h-8 w-12 cursor-pointer rounded-md border border-neutral-300 bg-white p-1"
        />
      </td>

      <td className="px-4 py-2">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            form={`salvar-${cliente.id}`}
            name="ativo"
            type="checkbox"
            defaultChecked={cliente.ativo}
            className="size-4"
          />
          Ativo
        </label>
      </td>

      <td className="px-4 py-2 text-right whitespace-nowrap">
        <button
          form={`salvar-${cliente.id}`}
          type="submit"
          disabled={salvando}
          className={botaoDiscreto}
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>

        <form action={excluir} className="inline">
          <input type="hidden" name="id" value={cliente.id} />
          <button
            type="submit"
            disabled={excluindo}
            className={`${botaoDiscreto} hover:text-red-600`}
          >
            Excluir
          </button>
        </form>
      </td>
    </tr>
  );
}
