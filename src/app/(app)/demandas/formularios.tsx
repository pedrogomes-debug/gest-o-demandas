"use client";

import { useActionState, useRef } from "react";
import { botao, botaoDiscreto, campo } from "@/components/estilos";
import { STATUS, STATUS_LABEL, type Cliente, type DemandaView, type Pessoa } from "@/lib/types";
import { criarDemanda, excluirDemanda, salvarDemanda, type EstadoForm } from "./actions";

const ESTADO_INICIAL: EstadoForm = {};

type Opcoes = {
  clientes: Pick<Cliente, "id" | "nome">[];
  pessoas: Pick<Pessoa, "id" | "nome">[];
};

export function NovaDemanda({ clientes, pessoas }: Opcoes) {
  const [estado, acao, pendente] = useActionState(criarDemanda, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formulario}
      action={async (formData) => {
        await acao(formData);
        formulario.current?.reset();
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        name="titulo"
        placeholder="Título da demanda"
        required
        className={`${campo} sm:col-span-2`}
      />
      <select name="cliente_id" className={campo} defaultValue="">
        <option value="">Cliente (opcional)</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <select name="responsavel_id" className={campo} defaultValue="">
        <option value="">Responsável (opcional)</option>
        {pessoas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <select name="status" className={campo} defaultValue="backlog">
        {STATUS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <input name="data_inicio" type="date" className={campo} aria-label="Data início" />
      <input name="data_fim" type="date" className={campo} aria-label="Data fim" />
      <textarea
        name="descricao"
        placeholder="Descrição (opcional)"
        rows={2}
        className={`${campo} sm:col-span-2 lg:col-span-4`}
      />
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button type="submit" disabled={pendente} className={botao}>
          Adicionar demanda
        </button>
        {estado.erro && <span className="text-sm text-red-600">{estado.erro}</span>}
      </div>
    </form>
  );
}

export function LinhaDemanda({
  demanda,
  clientes,
  pessoas,
}: Opcoes & { demanda: DemandaView }) {
  const [estadoSalvar, salvar, salvando] = useActionState(salvarDemanda, ESTADO_INICIAL);
  const [estadoExcluir, excluir, excluindo] = useActionState(excluirDemanda, ESTADO_INICIAL);
  const erro = estadoSalvar.erro ?? estadoExcluir.erro;
  const formId = `salvar-${demanda.id}`;

  return (
    <tr className="border-t border-neutral-200 align-top">
      <td className="px-3 py-2">
        <form id={formId} action={salvar} className="space-y-2">
          <input type="hidden" name="id" value={demanda.id} />
          <input name="titulo" defaultValue={demanda.titulo} className={campo} />
          <textarea
            name="descricao"
            defaultValue={demanda.descricao ?? ""}
            rows={2}
            className={campo}
            placeholder="Descrição"
          />
        </form>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </td>

      <td className="px-3 py-2">
        <select
          form={formId}
          name="cliente_id"
          defaultValue={demanda.cliente_id ?? ""}
          className={campo}
        >
          <option value="">—</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <select
          form={formId}
          name="responsavel_id"
          defaultValue={demanda.responsavel_id ?? ""}
          className={campo}
        >
          <option value="">—</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <select form={formId} name="status" defaultValue={demanda.status} className={campo}>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <div className="space-y-2">
          <input
            form={formId}
            name="data_inicio"
            type="date"
            defaultValue={demanda.data_inicio ?? ""}
            className={campo}
          />
          <input
            form={formId}
            name="data_fim"
            type="date"
            defaultValue={demanda.data_fim ?? ""}
            className={campo}
          />
        </div>
      </td>

      <td className="px-3 py-2 text-right whitespace-nowrap">
        <button form={formId} type="submit" disabled={salvando} className={botaoDiscreto}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <form action={excluir} className="inline">
          <input type="hidden" name="id" value={demanda.id} />
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
