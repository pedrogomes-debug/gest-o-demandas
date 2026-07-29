"use client";

import { useActionState, useRef } from "react";
import { botao, botaoDiscreto, campo } from "@/components/estilos";
import type { Pessoa } from "@/lib/types";
import { criarPessoa, excluirPessoa, salvarPessoa, type EstadoForm } from "./actions";

const ESTADO_INICIAL: EstadoForm = {};

export function NovaPessoa() {
  const [estado, acao, pendente] = useActionState(criarPessoa, ESTADO_INICIAL);
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
      <input name="nome" placeholder="Nome" required className={`${campo} max-w-48`} />
      <input
        name="email"
        type="email"
        placeholder="e-mail"
        required
        className={`${campo} max-w-64`}
      />
      <input name="papel" placeholder="Papel (opcional)" className={`${campo} max-w-40`} />
      <button type="submit" disabled={pendente} className={botao}>
        Adicionar
      </button>
      {estado.erro && <span className="text-sm text-red-600">{estado.erro}</span>}
    </form>
  );
}

export function LinhaPessoa({ pessoa }: { pessoa: Pessoa }) {
  const [estadoSalvar, salvar, salvando] = useActionState(salvarPessoa, ESTADO_INICIAL);
  const [estadoExcluir, excluir, excluindo] = useActionState(excluirPessoa, ESTADO_INICIAL);
  const erro = estadoSalvar.erro ?? estadoExcluir.erro;
  const formId = `salvar-${pessoa.id}`;

  return (
    <tr className="border-t border-neutral-200">
      <td className="px-4 py-2">
        <form id={formId} action={salvar} className="contents">
          <input type="hidden" name="id" value={pessoa.id} />
          <input name="nome" defaultValue={pessoa.nome} className={campo} />
        </form>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </td>

      <td className="px-4 py-2">
        <input form={formId} name="email" type="email" defaultValue={pessoa.email} className={campo} />
      </td>

      <td className="px-4 py-2">
        <input form={formId} name="papel" defaultValue={pessoa.papel ?? ""} className={campo} />
      </td>

      <td className="px-4 py-2">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            form={formId}
            name="ativo"
            type="checkbox"
            defaultChecked={pessoa.ativo}
            className="size-4"
          />
          Ativo
        </label>
      </td>

      <td className="px-4 py-2 text-sm whitespace-nowrap text-neutral-500">
        {pessoa.user_id ? "Já entrou" : "Nunca entrou"}
      </td>

      <td className="px-4 py-2 text-right whitespace-nowrap">
        <button form={formId} type="submit" disabled={salvando} className={botaoDiscreto}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>

        <form action={excluir} className="inline">
          <input type="hidden" name="id" value={pessoa.id} />
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
